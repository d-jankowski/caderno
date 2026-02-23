import {Router} from 'express';
import {imagesController} from '../controllers/index.js';
import {authenticate} from '../middleware/auth.js';
import {uploadMiddleware} from '../services/imageService.js';

const router = Router({mergeParams: true});

router.use(authenticate);

router.post('/', uploadMiddleware, imagesController.upload);
router.get('/:imageId', imagesController.getById);
router.delete('/:imageId', imagesController.remove);

export default router;
