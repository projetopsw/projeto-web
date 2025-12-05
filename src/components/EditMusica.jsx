import React, { useState, useEffect } from 'react';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, 
    Button, TextField, Checkbox, FormControlLabel, FormGroup, 
    Grid, Typography, IconButton, Box
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import api from '../services/api';
import mongoApi from '../services/mongoApi';

const GENRE_OPTIONS = ["Pop", "Rock", "Hip Hop", "Eletrônica", "Jazz", "Blues", "Clássica", "Metal", "R&B", "Sertanejo", "Funk", "Reggae", "Gospel", "Indie", "Folk", "Country", "MPB", "Axé", "Forró"];
const COR_LARANJA = 'var(--orange)';

export default function EditMusicaModal({ show, onClose, song, onUpdateSuccess }) {
    
    const [title, setTitle] = useState(song?.title || '');
    const [description, setDescription] = useState(song?.description || '');
    const [lyrics, setLyrics] = useState(song?.lyrics || '');
    const [selectedGenres, setSelectedGenres] = useState(song?.genres || []);
    const [otherGenre, setOtherGenre] = useState('');
    
    const [showOtherGenreField, setShowOtherGenreField] = useState(false);
    
    const [coverFile, setCoverFile] = useState(null);
    const [coverFileName, setCoverFileName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (song) {
            setTitle(song.title || '');
            setDescription(song.description || '');
            setLyrics(song.lyrics || '');
            
            const standardGenres = song.genres?.filter(g => GENRE_OPTIONS.includes(g)) || [];
            const otherGenres = song.genres?.filter(g => !GENRE_OPTIONS.includes(g)) || [];
            
            setSelectedGenres(standardGenres);
            
            if (otherGenres.length > 0) {
                 setOtherGenre(otherGenres.join(', '));
                 setShowOtherGenreField(true); 
            } else {
                 setOtherGenre('');
                 setShowOtherGenreField(false);
            }

            setCoverFile(null); 
            setCoverFileName('');
            setError(null);
            setIsLoading(false);
        }
    }, [song, show]);

    if (!song || !show) {
        return null;
    }
    
    const handleGenreChange = (genre) => {
        setSelectedGenres(prev => 
            prev.includes(genre)
                ? prev.filter(g => g !== genre)
                : [...prev, genre]
        );
    };

    const handleOtherGenreToggle = (e) => {
        const checked = e.target.checked;
        setShowOtherGenreField(checked);
        if (!checked) {
            setOtherGenre('');
        }
    }

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setCoverFile(file);
        setCoverFileName(file ? file.name : '');
    };

    const handleSave = async () => {
        setIsLoading(true);
        setError(null);

        const songId = song._id || song.id;

        const formData = new FormData();
        const updateDataObj = {}; 
        let hasChanges = false;
        
        let genresToSave = [...selectedGenres];

        if (showOtherGenreField && otherGenre.trim()) {
            const newGenres = otherGenre.split(',').map(g => g.trim()).filter(g => g);
            genresToSave.push(...newGenres);
        }

        if (title !== song.title) {
            updateDataObj.title = title;
            hasChanges = true;
        }
        if (description !== song.description) {
            updateDataObj.description = description;
            hasChanges = true;
        }
        if (lyrics !== song.lyrics) {
            updateDataObj.lyrics = lyrics;
            hasChanges = true;
        }
        
        const currentGenresSorted = (song.genres || []).map(g => g.trim()).sort();
        const genresToSaveSorted = genresToSave.map(g => g.trim()).sort();

        if (JSON.stringify(genresToSaveSorted) !== JSON.stringify(currentGenresSorted)) {
            updateDataObj.genres = genresToSave;
            hasChanges = true;
        }

        if (Object.keys(updateDataObj).length > 0) {
            formData.append('updateData', JSON.stringify(updateDataObj));
        }
        
        if (coverFile) {
            formData.append('coverImage', coverFile);
            hasChanges = true;
        }
        
        if (!hasChanges) {
            alert('Nenhuma alteração detectada.');
            setIsLoading(false);
            onClose();
            return;
        }

        try {
            const response = await mongoApi.patch(`/songs/${songId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            onUpdateSuccess(response.data); 
            alert(`Música "${title}" atualizada com sucesso!`);
            onClose();

        } catch (err) {
            console.error('Erro de Atualização:', err);
            const message = err.response?.data?.message || 'Falha ao atualizar a música.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog 
            open={show} 
            onClose={onClose} 
            maxWidth="md" 
            fullWidth
            PaperProps={{
                sx: {
                    backgroundColor: 'var(--card-bg)',
                    color: 'var(--text-color)',
                }
            }}
        >
            <DialogTitle sx={{ color: 'var(--text-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Editar Música: {song.title}
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        color: 'var(--secondary-text-color)',
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Título"
                            fullWidth
                            margin="normal"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            sx={{ 
                                mb: 2, 
                                '& .MuiOutlinedInput-root': { color: 'var(--input-text-color)', backgroundColor: 'var(--input-bg)' },
                                '& .MuiInputLabel-root': { color: 'var(--secondary-text-color)' },
                                '& .MuiInputLabel-root.Mui-focused': { color: COR_LARANJA },
                                '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: COR_LARANJA },
                            }}
                        />
                        <TextField
                            label="Descrição"
                            fullWidth
                            margin="normal"
                            multiline
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            sx={{ 
                                mb: 2, 
                                '& .MuiOutlinedInput-root': { color: 'var(--input-text-color)', backgroundColor: 'var(--input-bg)' },
                                '& .MuiInputLabel-root': { color: 'var(--secondary-text-color)' },
                                '& .MuiInputLabel-root.Mui-focused': { color: COR_LARANJA },
                                '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: COR_LARANJA },
                            }}
                        />
                        <TextField
                            label="Letra"
                            fullWidth
                            margin="normal"
                            multiline
                            rows={8}
                            value={lyrics}
                            onChange={(e) => setLyrics(e.target.value)}
                            sx={{ 
                                '& .MuiOutlinedInput-root': { color: 'var(--input-text-color)', backgroundColor: 'var(--input-bg)' },
                                '& .MuiInputLabel-root': { color: 'var(--secondary-text-color)' },
                                '& .MuiInputLabel-root.Mui-focused': { color: COR_LARANJA },
                                '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: COR_LARANJA },
                            }}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle1" sx={{ color: COR_LARANJA, mb: 1 }}>Gêneros (Selecione todos que se aplicam):</Typography>
                        <FormGroup sx={{ maxHeight: '200px', overflowY: 'auto' }}>
                            <Grid container>
                                {GENRE_OPTIONS.map((genre) => (
                                    <Grid item xs={6} key={genre}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox 
                                                    checked={selectedGenres.includes(genre)} 
                                                    onChange={() => handleGenreChange(genre)} 
                                                    sx={{ color: 'var(--secondary-text-color)', '&.Mui-checked': { color: COR_LARANJA } }}
                                                />
                                            }
                                            label={<Typography variant="body2" sx={{ color: 'var(--text-color)' }}>{genre}</Typography>}
                                        />
                                    </Grid>
                                ))}
                                <Grid item xs={12}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox 
                                                checked={showOtherGenreField} 
                                                onChange={handleOtherGenreToggle} 
                                                sx={{ color: 'var(--secondary-text-color)', '&.Mui-checked': { color: COR_LARANJA } }}
                                            />
                                        }
                                        label={<Typography variant="body2" sx={{ color: 'var(--text-color)' }}>Outro(s)</Typography>}
                                    />
                                    {showOtherGenreField && ( 
                                        <TextField
                                            label="Especifique outros gêneros (separados por vírgula)"
                                            fullWidth
                                            size="small"
                                            value={otherGenre}
                                            onChange={(e) => setOtherGenre(e.target.value)}
                                            sx={{ 
                                                mt: 1, 
                                                '& .MuiOutlinedInput-root': { color: 'var(--input-text-color)', backgroundColor: 'var(--input-bg)' },
                                                '& .MuiInputLabel-root': { color: 'var(--secondary-text-color)' },
                                                '& .MuiInputLabel-root.Mui-focused': { color: COR_LARANJA },
                                                '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: COR_LARANJA },
                                            }}
                                        />
                                    )}
                                </Grid>
                            </Grid>
                        </FormGroup>

                        <Typography variant="subtitle1" sx={{ color: COR_LARANJA, mt: 3, mb: 1 }}>Capa da Música (Opcional):</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <input
                                accept="image/*"
                                style={{ display: 'none' }}
                                id="cover-upload-button"
                                type="file"
                                onChange={handleFileChange}
                            />
                            <label htmlFor="cover-upload-button">
                                <Button 
                                    variant="contained" 
                                    component="span" 
                                    startIcon={<CloudUploadIcon />}
                                    sx={{ 
                                        backgroundColor: COR_LARANJA, 
                                        '&:hover': { backgroundColor: 'var(--darker-orange)' },
                                        color: 'white'
                                    }}
                                >
                                    Escolher Capa
                                </Button>
                            </label>
                            <Typography variant="body2" sx={{ ml: 2, color: 'var(--secondary-text-color)' }}>
                                {coverFileName || (song.coverUrl ? 'Capa atual será mantida' : 'Nenhuma capa selecionada')}
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
                {error && <Typography color="error" sx={{ mt: 2 }}>Erro: {error}</Typography>}
            </DialogContent>
            <DialogActions sx={{ p: '16px' }}>
                <Button onClick={onClose} sx={{ color: 'var(--secondary-text-color)' }} disabled={isLoading}>
                    Cancelar
                </Button>
                <Button 
                    onClick={handleSave} 
                    variant="contained" 
                    disabled={isLoading}
                    sx={{ 
                        backgroundColor: COR_LARANJA, 
                        '&:hover': { backgroundColor: 'var(--darker-orange)' },
                        '&:disabled': { backgroundColor: 'rgba(255, 107, 0, 0.5)', color: 'rgba(255, 255, 255, 0.5)' },
                        color: 'white'
                    }}
                >
                    {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}