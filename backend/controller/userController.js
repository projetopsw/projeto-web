import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET || 'defaultsecret',
        { expiresIn: '1d' }
    );
};

export const registerUser = async (req, res) => {
    try {
        const { name, email, password, img, role } = req.body; 

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Este email já está em uso.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username: name,
            email,
            password: hashedPassword,
            img,
            role,
        });

        const savedUser = await newUser.save();
        res.status(201).json({
            message: 'Usuário criado com sucesso!',
            user: { id: savedUser._id, username: savedUser.username, email: savedUser.email }, 
        });
    } catch (error) {
        res.status(500).json({ message: 'Erro interno do servidor ao registrar usuário.', error: error.message });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password'); 
        if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json({ message: 'Senha incorreta' });

        const token = generateToken(user);

        res.json({
            message: 'Login realizado com sucesso',
            token,
            user: { id: user._id, username: user.username, email: user.email, img: user.img, role: user.role }, 
        });
    } catch (error) {
        res.status(500).json({ message: 'Erro interno do servidor ao fazer login.', error: error.message });
    }
};

export const getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password -refresh_token_spotify -access_token_spotify');
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar dados do usuário logado.', error: error.message });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const { id } = req.query;
        let query = {};
        
        if (id) {
            query._id = { $in: Array.isArray(id) ? id : [id] }; 
        }

        const users = await User.find(query, 'username email img role createdAt updatedAt'); 
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar todos os usuários.', error: error.message });
    }
};

export const getUserById = async (req, res) => {
    try {
        const userId = req.params.id;
        
        if (!userId || userId === 'undefined') {
            return res.status(400).json({ message: 'ID de usuário inválido ou ausente.' });
        }
        
        const user = await User.findById(userId).select('-password -refresh_token_spotify -access_token_spotify');
        
        if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
        
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar usuário por ID.', error: error.message });
    }
};

export const deleteUserController = async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) return res.status(404).json({ message: 'Usuário não encontrado' });
        res.json({ message: 'Conta de usuário removida com sucesso' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao deletar usuário.', error: error.message });
    }
};

export const updateUserController = async (req, res) => {
    try {
        const userId = req.params.id;
        const { currentPassword, newPassword, ...otherUpdateData } = req.body;

        delete otherUpdateData.role; 
        delete otherUpdateData.spotifyId;
        delete otherUpdateData.refresh_token_spotify;
        delete otherUpdateData.access_token_spotify;
        
        const updateData = { ...otherUpdateData };

        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ message: 'A senha atual é obrigatória para alterar a senha.' });
            }

            const user = await User.findById(userId).select('+password');
            if (!user) {
                return res.status(404).json({ message: 'Usuário não encontrado' });
            }

            const validCurrentPassword = await bcrypt.compare(currentPassword, user.password);
            if (!validCurrentPassword) {
                return res.status(401).json({ message: 'Senha atual incorreta.' });
            }
            
            updateData.password = await bcrypt.hash(newPassword, 10);
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId, 
            { $set: updateData }, 
            { new: true, runValidators: true }
        ).select('-password -refresh_token_spotify -access_token_spotify');

        if (!updatedUser) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }
        
        res.json({
            message: 'Perfil atualizado com sucesso.',
            user: updatedUser
        });
        
    } catch (error) {
        res.status(400).json({ message: "Falha na atualização. Detalhe: " + error.message });
    }
};