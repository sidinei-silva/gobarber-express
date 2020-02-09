import { Router } from 'express';

// Controllers
import UserContoller from './app/controllers/UserContoller';

const routes = new Router();

routes.post('/users', UserContoller.store);

export default routes;
