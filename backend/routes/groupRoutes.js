import express from 'express';
import Group from '../models/group.model.js'; 
import mongoose from 'mongoose';

const router = express.Router();

const checkObjectId = (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(404).json({ message: 'ID de grupo inválido.' });
    }
    next();
};

const groupPopulateOptions = [
    { path: 'creator', select: 'name email' }, 
    { path: 'members', select: 'name' },        
    { path: 'currentListeners', select: 'name' }, 
    { path: 'currentSong', select: 'title artist' } 
];

router.post('/', async (req, res) => {
    try {
        const newGroup = new Group(req.body);
        const savedGroup = await newGroup.save();
        
        await savedGroup.populate(groupPopulateOptions);
        
        res.status(201).json(savedGroup);
    } catch (error) {
        if (error.name === 'ValidationError') {
             res.status(400).json({ message: error.message });
        } else {
             res.status(500).json({ message: 'Erro ao criar o grupo', error: error.message });
        }
    }
});

router.get('/', async (req, res) => {
    try {
        const groups = await Group.find({})
            .populate(groupPopulateOptions)
            .lean(); 

        res.status(200).json(groups);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar os grupos', error: error.message });
    }
});

router.get('/:id', checkObjectId, async (req, res) => {
    try {
        const group = await Group.findById(req.params.id)
            .populate(groupPopulateOptions)
            .lean();

        if (!group) {
            return res.status(404).json({ message: 'Grupo não encontrado.' });
        }
        res.status(200).json(group);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar o grupo', error: error.message });
    }
});

router.put('/:id', checkObjectId, async (req, res) => {
    try {
        const updatedGroup = await Group.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        )
        .populate(groupPopulateOptions);

        if (!updatedGroup) {
            return res.status(404).json({ message: 'Grupo não encontrado para atualização.' });
        }
        res.status(200).json(updatedGroup);
    } catch (error) {
        if (error.name === 'ValidationError') {
             res.status(400).json({ message: error.message });
        } else {
             res.status(500).json({ message: 'Erro ao atualizar o grupo', error: error.message });
        }
    }
});

router.delete('/:id', checkObjectId, async (req, res) => {
    try {
        const deletedGroup = await Group.findByIdAndDelete(req.params.id);

        if (!deletedGroup) {
            return res.status(404).json({ message: 'Grupo não encontrado para exclusão.' });
        }
        res.status(200).json({ message: 'Grupo excluído com sucesso!' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao excluir o grupo', error: error.message });
    }
});

export default router;