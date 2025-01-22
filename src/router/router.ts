import { Router } from 'express';
import mainController from '../controllers/main';

const router = Router();

router.get('/', mainController.index);

router.get('/main/story', mainController.story_gen);

router.get('/forms/completeForm1', mainController.form1);
router.post('/forms/completeForm1', mainController.form1);

router.get('/forms/completeForm2', mainController.form2);
router.post('/forms/completeForm2', mainController.form2);

router.get('/forms/quickForm', mainController.quickForm);
router.post('/forms/quickForm', mainController.quickForm);

export default router;
