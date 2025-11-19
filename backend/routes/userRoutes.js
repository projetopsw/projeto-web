import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import Artist from '../models/artist.model.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const { name, email, password, img, role } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Este email já está em uso.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            img,
            role,
        });

        const savedUser = await newUser.save();
        res.status(201).json({
            message: 'Usuário criado com sucesso!',
            user: { id: savedUser._id, name: savedUser.name, email: savedUser.email },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json({ message: 'Senha incorreta' });

        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET || 'defaultsecret',
            { expiresIn: '1d' }
        );

        res.json({
            message: 'Login realizado com sucesso',
            token,
            user: { id: user._id, name: user.name, email: user.email, img: user.img },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/me', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password -refresh_token_spotify');
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar dados do usuário.', error: error.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const users = await User.find({}, 'name email img role');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/:id', verifyToken, async (req, res) => {
    try {
        const userId = req.params.id;
        const updateData = { ...req.body };
        if (updateData.role) delete updateData.role;
        const updatedUser = await User.findByIdAndUpdate(
            userId, 
            { $set: updateData }, 
            { new: true, runValidators: true }
        );

        if (!updatedUser) return res.status(404).json({ message: 'Usuário não encontrado' });
        res.json(updatedUser);
    } catch (error) {
        res.status(400).json({ message: "Dados inválidos ou ID mal formatado. Detalhe: " + error.message });
    }
});

router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) return res.status(404).json({ message: 'Usuário não encontrado' });
        res.json({ message: 'Conta de usuário removida com sucesso' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;