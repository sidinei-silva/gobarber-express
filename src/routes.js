import { Router } from 'express';

// Controllers
import UserContoller from './app/controllers/UserContoller';
import SessionController from './app/controllers/SessionController';

const routes = new Router();

routes.post('/users', UserContoller.store);
routes.post('/sessions', SessionController.store);

export default routes;
