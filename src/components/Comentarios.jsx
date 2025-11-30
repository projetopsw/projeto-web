import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { postComment, fetchComments } from '../redux/comentarioSlice';

import CommentAuthorLink from './CommentAuthorLink.jsx'; 

import { 
    Box, 
    Typography, 
    TextField, 
    Button, 
    List, 
    ListItem, 
    ListItemText, 
    Divider,
} from '@mui/material';

function Comentarios({ musicaId }) {
    const dispatch = useDispatch();

    const usuarioLogado = useSelector(state => state.user.user);
    const nomeUsuario = usuarioLogado?.name || usuarioLogado?.username || 'Anônimo'; 
    const isUserLoggedIn = !!usuarioLogado; 

    const rawState = useSelector(state => state.comments[musicaId]);

    const comentarioState = useMemo(() => {
        return rawState || { data: [], status: 'idle', error: null };
    }, [rawState]);

    const comentarios = comentarioState.data;
    const status = comentarioState.status;
    const error = comentarioState.error;

    const [novoComentario, setNovoComentario] = useState('');
    
    useEffect(() => {
        if (status === 'idle') {
            dispatch(fetchComments(musicaId));
        }
    }, [musicaId, dispatch, status]); 

    const handleSubmit = (e) => {
        e.preventDefault();
        const textoLimpo = novoComentario.trim();
        
        if (textoLimpo === '' || !isUserLoggedIn) return; 

        dispatch(postComment({ 
            musicaId: musicaId, 
            texto: textoLimpo,
            autor: nomeUsuario, 
            autorId: usuarioLogado._id || usuarioLogado.id, 
            autorImage: usuarioLogado.img || usuarioLogado.image 
        }));

        setNovoComentario('');
    };

    const formatarData = (dataServidor) => {
        if (!dataServidor) return 'Data Desconhecida';
        
        try {
            const data = new Date(dataServidor);
            return data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return dataServidor;
        }
    };
    
    let conteudoComentarios;
    
    if (status === 'loading') {
        conteudoComentarios = <Typography sx={{ color: '#b3b3b3' }}>Carregando cowmentários...</Typography>;
    } else if (status === 'failed') {
        conteudoComentarios = <Typography color="error">Erro ao carregar comentários: {error}</Typography>;
    } else if (comentarios.length === 0) {
        conteudoComentarios = (
            <Typography variant="body2" sx={{ color: '#b3b3b3' }}>
                Nenhum cowmentário ainda. Seja o primeiro a opinar!
            </Typography>
        );
    } else {
        conteudoComentarios = (
            <List disablePadding>
                {comentarios.map((comentario, index) => {
                    const autorData = comentario.autorId;
                    
                    if (autorData === null) return null;

                    return (
                        <React.Fragment key={comentario._id || comentario.id}>
                            <ListItem 
                                alignItems="flex-start" 
                                sx={{ 
                                    px: 0, 
                                    py: 1, 
                                    display: 'flex', 
                                    alignItems: 'flex-start'
                                }}
                            >
                                <Box sx={{ mr: 2, flexShrink: 0 }}> 
                                    <CommentAuthorLink autorData={autorData} />
                                </Box>
                                
                                <ListItemText
                                    sx={{ 
                                        mt: 0, 
                                        pt: 0, 
                                    }}
                                    
                                    primary={null} 
                                    
                                    secondary={
                                        <React.Fragment>
                                            <Typography
                                                sx={{ 
                                                    display: 'block', 
                                                    color: '#e0e0e0', 
                                                    whiteSpace: 'pre-wrap',
                                                    ml: 0 
                                                }}
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
                                                {formatarData(comentario.data)}
                                            </Typography>
                                        </React.Fragment>
                                    }
                                />
                            </ListItem>
                            {index < comentarios.length - 1 && <Divider component="li" sx={{ borderColor: '#444' }} />}
                        </React.Fragment>
                    );
                })}
            </List>
        );
    }

    return (
        <Box sx={{ padding: 0 }}>
            <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
                <TextField
                    label={isUserLoggedIn ? `Comentar como ${nomeUsuario}` : "Faça login para comentar"}
                    multiline
                    fullWidth
                    rows={3}
                    value={novoComentario}
                    onChange={(e) => setNovoComentario(e.target.value)}
                    variant="outlined"
                    disabled={!isUserLoggedIn} 
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
                    disabled={novoComentario.trim() === '' || status === 'loading' || !isUserLoggedIn} 
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
            
            {conteudoComentarios}
        </Box>
    );
}

export default Comentarios;