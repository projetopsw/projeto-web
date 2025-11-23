import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import Artist from '../models/artist.model.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import {
    registerUser,
    loginUser,
    getMyProfile,
    getAllUsers,
    getUserById,
    updateUserController,
    deleteUserController
} from '../controller/userController.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

router.get('/me', verifyToken, getMyProfile);

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.put('/:id', verifyToken, updateUserController);
router.delete('/:id', verifyToken, deleteUserController);

export default router;