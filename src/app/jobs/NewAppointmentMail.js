import Mail from '../../lib/Mail';

class NewAppointmentMail {
  get key() {
    return 'NewAppointmentMail';
  }

  async handle({ data }) {
    const { isProvider, user_name, formattedDate } = data;

    await Mail.sendMail({
      to: `${isProvider.name} <${isProvider.email}>`,
      subject: 'Novo Agendamento',
      template: 'newAppointment',
      context: {
        provider: isProvider.name,
        user: user_name,
        date: formattedDate,
      },
    });
  }
}

export default new NewAppointmentMail();
