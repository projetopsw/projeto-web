import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addComment } from '../redux/comentarioSlice';

import { 
    Box, 
    Typography, 
    TextField, 
    Button, 
    List, 
    ListItem, 
    ListItemText, 
    Divider 
} from '@mui/material';

/**
 * @param {string} musicaId - O ID único da música para chavear o estado no Redux.
 */
function Comentarios({ musicaId }) {
    const dispatch = useDispatch();

    const comentarios = useSelector(state => state.comments[musicaId] || []);

    const [novoComentario, setNovoComentario] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (novoComentario.trim() === '') return;

        dispatch(addComment({ 
            musicaId: musicaId, 
            texto: novoComentario.trim() 
        }));

        setNovoComentario('');
    };

    return (
        <Box sx={{ padding: 0 }}>
            <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
                <TextField
                    label="Adicionar um comentário"
                    multiline
                    fullWidth
                    rows={3}
                    value={novoComentario}
                    onChange={(e) => setNovoComentario(e.target.value)}
                    variant="outlined"
                    InputLabelProps={{ style: { color: '#ff7533' } }}
                    sx={{ 
                        mb: 1, 
                        '& .MuiInputBase-input': { color: 'white' },
                        '& .MuiOutlinedInput-root': {
                            '& fieldset': { borderColor: '#555' },
                            '&:hover fieldset': { borderColor: '#ff7533' },
                            '&.Mui-focused fieldset': { borderColor: '#ff7533' },
                        }
                    }}
                />
                <Button 
                    type="submit" 
                    variant="contained" 
                    disabled={novoComentario.trim() === ''}
                    sx={{
                        backgroundColor: '#ff7533 !important',
                        '&:hover': { backgroundColor: '#e66a2e !important' },
                        mt: 1 
                    }}
                >
                    Cowmentar
                </Button>
            </Box>

            <Typography variant="h6" gutterBottom sx={{ color: '#ff7533', borderTop: '1px solid #444', pt: 2 }}>
                Cowmentários ({comentarios.length})
            </Typography>
            
            {comentarios.length === 0 ? (
                <Typography variant="body2" sx={{ color: '#b3b3b3' }}>
                    Nenhum cowmentário ainda. Seja o primeiro a opinar!
                </Typography>
            ) : (
                <List disablePadding>
                    {comentarios.map((comentario, index) => (
                        <React.Fragment key={comentario.id}>
                            <ListItem alignItems="flex-start" sx={{ px: 0, py: 1 }}>
                                <ListItemText
                                    primary={
                                        <Typography sx={{ fontWeight: 'bold', color: 'white' }}>
                                            {comentario.autor}
                                        </Typography>
                                    }
                                    secondary={
                                        <React.Fragment>
                                            <Typography
                                                sx={{ display: 'block', color: '#e0e0e0', whiteSpace: 'pre-wrap' }}
                                                component="span"
                                                variant="body2"
                                            >
                                                {comentario.texto}
                                            </Typography>
                                            <Typography
                                                sx={{ display: 'block', color: '#b3b3b3', fontSize: '0.75rem', mt: 0.5 }}
                                                component="span"
                                                variant="caption"
                                            >
                                                {comentario.data}
                                            </Typography>
                                        </React.Fragment>
                                    }
                                />
                            </ListItem>
                            {index < comentarios.length - 1 && <Divider component="li" sx={{ borderColor: '#444' }} />}
                        </React.Fragment>
                    ))}
                </List>
            )}
        </Box>
    );
}

export default Comentarios;