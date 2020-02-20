import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore, format, subHours } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

// Models
import Appointment from '../models/Appointment';
import User from '../models/User';
import File from '../models/File';

// Schemas
import Notification from '../schemas/Notification';

// Jobs
import CancellationMail from '../jobs/CancellationMail';
import NewAppointmentMail from '../jobs/NewAppointmentMail';

// Libs
import Queue from '../../lib/Queue';

class AppointmentController {
  async index(req, res) {
    const { page = 1 } = req.query;

    const appointments = await Appointment.findAll({
      where: {
        user_id: req.userId,
        canceled_at: null,
      },
      attributes: ['id', 'date', 'past', 'cancelable'],
      order: ['date'],
      limit: 20,
      offset: (page - 1) * 20,
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['id', 'name'],
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'url', 'path'],
            },
          ],
        },
      ],
    });
    return res.json(appointments);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { provider_id, date } = req.body;

    /*
     * Check if provider_id is a provider
     */
    const isProvider = await User.findOne({
      where: {
        id: provider_id,
        provider: true,
      },
    });

    if (!isProvider) {
      return res
        .status(401)
        .json({ error: 'You can only create appointments with providers' });
    }

    /*
     * Check for past date
     */
    const hourStart = startOfHour(parseISO(date));

    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: 'Past dates are not permitted' });
    }

    /*
     * Check for availability
     */

    const checkAvailability = await Appointment.findOne({
      where: {
        provider_id,
        canceled_at: null,
        date: hourStart,
      },
    });

    if (checkAvailability) {
      return res
        .status(400)
        .json({ error: 'Appointment date is not available' });
    }

    const appointment = await Appointment.create({
      user_id: req.userId,
      provider_id,
      date: hourStart,
    });

    /*
     * Notify appointment provider
     */

    const { name: user_name } = await User.findByPk(req.userId);
    const formattedDate = format(hourStart, "dd 'de' MMMM', às ' H:mm'h'", {
      locale: ptBR,
    });

    await Notification.create({
      content: `Novo agendamento de ${user_name} para o dia ${formattedDate}`,
      user: provider_id,
    });

    await Queue.add(NewAppointmentMail.key, {
      isProvider,
      user_name,
      formattedDate,
    });

    return res.json(appointment);
  }

  async delete(req, res) {
    const appointment = await Appointment.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['name', 'email'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['name'],
        },
      ],
    });

    if (appointment.user_id !== req.userId) {
      return res.status(401).json({
        error: "You don't have permission to cancel this appointment",
      });
    }

    const dateWithSub = subHours(appointment.date, 2);

    if (isBefore(dateWithSub, new Date())) {
      return res.status(401).json({
        error: 'You can only cancel appointment 2 hours advance',
      });
    }

    appointment.canceled_at = new Date();

    await appointment.save();

    /*
     * Notify appointment provider
     */

    const hourStart = startOfHour(appointment.date);
    const { name } = await User.findByPk(req.userId);
    const formattedDate = format(hourStart, "dd 'de' MMMM', às ' H:mm'h'", {
      locale: ptBR,
    });

    await Notification.create({
      content: `Houve um cancelamento de ${name} do dia ${formattedDate}`,
      user: appointment.provider_id,
    });

    await Queue.add(CancellationMail.key, {
      appointment,
      formattedDate,
    });

    return res.json(appointment);
  }
}

export default new AppointmentController();
