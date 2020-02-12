import { Router } from 'express';

// Controllers
import UserContoller from './app/controllers/UserContoller';
import SessionController from './app/controllers/SessionController';

import authMiddleware from './app/middlewares/auth';

const routes = new Router();

routes.post('/users', UserContoller.store);
routes.post('/sessions', SessionController.store);

routes.use(authMiddleware);

routes.put('/users', UserContoller.update);

export default routes;
