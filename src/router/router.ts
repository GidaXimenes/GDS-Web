import { Router } from 'express';
import mainController from '../controllers/main';

const router = Router();

router.get('/', mainController.index);

router.get('/hb1', mainController.hb1);
router.get('/hb2', mainController.hb2);

export default router;
