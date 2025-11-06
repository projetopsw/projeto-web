import express from 'express';
import User from '../models/user.model.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const newUser = new User(req.body);
    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (error) {
    if (error.code === 11000 && error.keyPattern.email) {
      return res.status(400).json({ message: 'Este email já está em uso.' });
    }
    res.status(400).json({ message: error.message });
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
    const user = await User.findById(req.params.id)
      .populate({
        path: 'likedSongs',
        select: 'title cover artist',
        populate: { path: 'artist', select: 'name' } 
      })
      .populate('userPlaylists', 'name img songCount')
      .populate('friends', 'name img')
      .populate('following', 'name img');

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    if (req.body.role) delete req.body.role; 

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    res.json({ message: 'Conta de usuário removida com sucesso' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;