import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, TextField, Button, FormControlLabel, Switch } from '@mui/material';

const ModalStyle = {
    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
    width: 400, bgcolor: 'var(--sidebar-bg)', border: '2px solid var(--orange)',
    borderRadius: '8px', boxShadow: 24, p: 4, color: 'var(--text-color)',
};

export default function EditPlaylistModal({ open, onClose, onSave, initialData }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [img, setImg] = useState('');
    const [isPublic, setIsPublic] = useState(false);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name || '');
            setDescription(initialData.description || '');
            setImg(initialData.img || '');
            setIsPublic(initialData.isPublic || false);
        }
    }, [initialData, open]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ title: name, description, cover: img, isPublic });
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={ModalStyle} component="form" onSubmit={handleSubmit}>
                <Typography variant="h6" sx={{ mb: 2, color: 'var(--orange)' }}>Editar Playlist</Typography>
                <TextField label="Nome" value={name} onChange={e => setName(e.target.value)} fullWidth margin="normal" sx={{ input: { color: 'white' } }} />
                <TextField label="Descrição" value={description} onChange={e => setDescription(e.target.value)} fullWidth multiline rows={2} margin="normal" sx={{ textarea: { color: 'white' } }} />
                <TextField label="Capa URL" value={img} onChange={e => setImg(e.target.value)} fullWidth margin="normal" sx={{ input: { color: 'white' } }} />
                <FormControlLabel control={<Switch checked={isPublic} onChange={e => setIsPublic(e.target.checked)} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: 'var(--orange)' } }} />} label={<Typography sx={{color:'white'}}>Pública</Typography>} />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                    <Button type="submit" variant="contained" sx={{ bgcolor: 'var(--orange)' }}>Salvar</Button>
                </Box>
            </Box>
        </Modal>
    );
}