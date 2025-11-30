import express from 'express';
import ComentarioController from '../controller/comentarioController.js'; 

const router = express.Router();

router.get('/:musicaId', ComentarioController.getComments);

router.post('/', ComentarioController.addComment);

export default router;