import React, { useState, useEffect, useRef } from 'react';
import { 
    Box, 
    Typography, 
    Stack, 
    CardMedia, 
    Container,
    IconButton,
    Button,
    LinearProgress,
} from '@mui/material';

import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';

import { useSelector } from 'react-redux'; 
import './css/TelaMusica.css';
import Comentarios from '../../components/Comentarios'; 
import { useNavigate } from 'react-router-dom'; 

const DEFAULT_SONG_ID = "default-song-placeholder";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

function TelaMusica() {
    const navigate = useNavigate(); 
    const scrollRef = useRef(null); 
    const [scrollPosition, setScrollPosition] = useState(0); 

    const currentSong = useSelector(state => state.player.currentSong); 

    const musicaAtual = currentSong || {
        id: DEFAULT_SONG_ID, 
        title: "Nenhuma Música Tocando", 
        artist: "Artista Desconhecido",
        artistId: null, 
        cover: "/assets/img/vacamario.jpg", 
        descricao: "Sem descrição.",
        lyrics: "Sem letra.", 
    };

    const getFullUrl = (path) => {
        if (!path) return "/assets/img/default-profile.png"; 
        if (path.startsWith('http') || path.startsWith('/assets')) {
            return path;
        }
        return `${API_BASE_URL}${path}`;
    };

    const musicaImagem = getFullUrl(musicaAtual.cover || musicaAtual.imagem); 
    const musicaTitulo = musicaAtual.title || musicaAtual.titulo; 
    const musicaArtista = musicaAtual.artist || musicaAtual.artista; 
    
    const musicaId = musicaAtual._id || musicaAtual.id || DEFAULT_SONG_ID;
    
    let effectiveCreatorId = null; 
    let isArtistUpload = false; 
    let isUserUpload = false; 
    let creatorLinkPrefix = '/perfil/';
    let creatorProfileImage = null; 
    let creatorName = musicaArtista; 
    let creatorAbout = null;

    if (musicaAtual) {
        if (Array.isArray(musicaAtual.artists) && musicaAtual.artists.length > 0) {
            const mainCreator = musicaAtual.artists[0];
            effectiveCreatorId = mainCreator._id || mainCreator.id;
            isArtistUpload = !!mainCreator.isArtistUpload || mainCreator.role === 'artist'; 
            creatorName = mainCreator.name || mainCreator.username || 'Artista Desconhecido';
            creatorProfileImage = mainCreator.avatar || mainCreator.image || mainCreator.img;
            creatorAbout = mainCreator.about; 
            
        } else if (musicaAtual.owner) {
            const owner = musicaAtual.owner;
            effectiveCreatorId = owner._id || owner.id;
            isUserUpload = true;
            creatorName = owner.username || owner.name || 'Proprietário Desconhecido';
            creatorProfileImage = owner.avatar || owner.image || owner.img;
            creatorAbout = owner.about; 
        }

        if (effectiveCreatorId) {
            if (isArtistUpload) {
                creatorLinkPrefix = '/artista/';
            } else if (isUserUpload) {
                creatorLinkPrefix = '/perfil/';
            }
        }
    }
    const artistaId = effectiveCreatorId; 


    const [abaAtiva, setAbaAtiva] = useState('letra');

    const [likes, setLikes] = useState(15);
    const [dislikes, setDislikes] = useState(3);
    const [userRating, setUserRating] = useState(0); 

    const handleArtistClick = () => {
        if (artistaId) {
            navigate(`${creatorLinkPrefix}${artistaId}`); 
        }
    };

    const handleLike = () => {
        if (userRating === 1) { 
            setLikes(likes - 1);
            setUserRating(0);
        } else if (userRating === -1) {
            setDislikes(dislikes - 1);
            setLikes(likes + 1);
            setUserRating(1);
        } else {
            setLikes(likes + 1);
            setUserRating(1);
        }
    };

    const handleDislike = () => {
        if (userRating === -1) { 
            setDislikes(dislikes - 1);
            setUserRating(0);
        } else if (userRating === 1) {
            setLikes(likes - 1);
            setDislikes(dislikes + 1);
            setUserRating(-1);
        } else {
            setDislikes(dislikes + 1);
            setUserRating(-1);
        }
    };
    
    const totalVotes = likes + dislikes;
    const likePercentage = totalVotes > 0 ? (likes / totalVotes) * 100 : 50;
    
    useEffect(() => {
        const currentRef = scrollRef.current;

        const handleScroll = () => {
            if (currentRef) {
                setScrollPosition(currentRef.scrollTop);
            }
        };

        if (currentRef) {
            currentRef.addEventListener('scroll', handleScroll);
        }
        
        return () => {
            if (currentRef) {
                currentRef.removeEventListener('scroll', handleScroll);
            }
        };
    }, [abaAtiva]); 

    useEffect(() => {
        if (scrollRef.current && scrollPosition > 0) {
            scrollRef.current.scrollTop = scrollPosition;
        }
    }, [currentSong, scrollPosition, abaAtiva]); 

    const DescriptionTabContent = () => (
        <Box>
            <Stack direction="row" spacing={2} alignItems="center" className="like-dislike-buttons" sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton onClick={handleLike} aria-label="like" sx={{ color: userRating === 1 ? 'var(--orange, #ff7533)' : 'var(--text-color, white)', '&:hover': { color: 'var(--orange, #ff7533)' } }}>
                        <ThumbUpIcon />
                    </IconButton>
                    <Typography variant="body1" sx={{ color: 'var(--text-color, white)', minWidth: '20px' }}>{likes}</Typography>
                </Box>

                <Box sx={{ flexGrow: 1 }}>
                    <LinearProgress variant="determinate" value={likePercentage} sx={{ height: 8, borderRadius: 5, backgroundColor: 'var(--input-bg, rgba(255, 255, 255, 0.3))', '& .MuiLinearProgress-bar': { backgroundColor: 'var(--orange, #ff7533)' } }} />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ color: 'var(--text-color, white)', minWidth: '20px', textAlign: 'right' }}>{dislikes}</Typography>
                    <IconButton onClick={handleDislike} aria-label="dislike" sx={{ color: userRating === -1 ? 'var(--orange, #ff7533)' : 'var(--text-color, white)', '&:hover': { color: 'var(--orange, #ff7533)' } }}>
                        <ThumbDownIcon />
                    </IconButton>
                </Box>
            </Stack>

            <Typography variant="body1" className="content-text" sx={{ color: 'var(--text-color, white)' }}>
                {musicaAtual.descricao || 'Descrição indisponível.'}
            </Typography>
        </Box>
    );

    const ArtistTabContent = () => {
        
        const imageUrl = getFullUrl(creatorProfileImage);

        return (
            <Box>
                {effectiveCreatorId ? (
                    <>
                        <Typography 
                            variant="h5" 
                            component="h2" 
                            gutterBottom 
                            className="musica-artista" 
                            sx={{ 
                                mt: 1, 
                                mb: 2, 
                                cursor: 'pointer', 
                                color: 'var(--title-color, white)',
                                '&:hover': { 
                                    textDecoration: 'underline', 
                                    color: 'var(--orange, #ff7533)'
                                } 
                            }}
                            onClick={handleArtistClick}
                        >
                            Sobre {creatorName}
                        </Typography>
                        
                        <CardMedia
                            component="img"
                            image={imageUrl} 
                            alt={`Imagem de ${creatorName}`}
                            sx={{ 
                                width: 150, 
                                height: 150, 
                                borderRadius: '50%', 
                                mb: 2, 
                                objectFit: 'cover',
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                                '&:hover': { transform: 'scale(1.02)' }
                            }}
                            onClick={handleArtistClick}
                        />
                        
                        <Typography 
                            variant="body1" 
                            className="content-text"
                            sx={{ color: 'var(--text-color, white)' }}
                        >
                            {creatorAbout || `Informação detalhada sobre ${creatorName} não disponível.`}
                        </Typography>
                    </>
                ) : (
                    <Typography variant="body1" sx={{ color: 'var(--text-color, white)' }}>
                        Informações detalhadas sobre o criador "{musicaArtista}" indisponíveis.
                    </Typography>
                )}
            </Box>
        );
    };

    const ScrollableContent = () => {
        let content;

        if (abaAtiva === 'artista') {
            content = <ArtistTabContent />;
        } else if (abaAtiva === 'descricao') {
            content = <DescriptionTabContent />;
        } else if (abaAtiva === 'letra') {
            content = (
                <Typography 
                    variant="body1" 
                    className="content-text" 
                    sx={{ 
                        whiteSpace: 'pre-wrap',
                        color: 'var(--text-color, white)' 
                    }} 
                >
                    {musicaAtual.lyrics || musicaAtual.letra || 'Letra indisponível.'}
                </Typography>
            );
        } else if (abaAtiva === 'comentarios') {
            const isSongValid = musicaId && musicaId !== DEFAULT_SONG_ID;
            content = isSongValid ? (
                <Comentarios musicaId={musicaId} />
            ) : (
                <Typography variant="body1" sx={{ color: 'var(--text-color, white)' }}>
                    Comentários não disponíveis. Nenhuma música válida está tocando.
                </Typography>
            );
        }

        return (
            <Box 
                key={abaAtiva} 
                ref={scrollRef} 
                className="aba-content-scroll"
                sx={{
                    maxHeight: '65vh', 
                    overflowY: 'auto', 
                    p: 2, 
                    mt: 1,
                    backgroundColor: 'var(--card-bg, rgba(255, 255, 255, 0.05))', 
                    borderRadius: 1,
                }}
            >
                {content}
            </Box>
        );
    };


    return (
        <Container 
            maxWidth="lg" 
            className="tela-musica-container"
            sx={{ color: 'var(--text-color, white)' }} 
        >
            <Box className="player-info-block">
                <Typography 
                    variant="h4" 
                    component="h1" 
                    gutterBottom 
                    className="musica-titulo"
                    sx={{ color: 'var(--title-color, white)' }}
                >
                    {musicaTitulo}
                </Typography>
                <Typography 
                    variant="h6" 
                    gutterBottom 
                    className="musica-artista"
                    sx={{ color: 'var(--artist-color, rgba(255, 255, 255, 0.8))' }}
                >
                    {musicaArtista}
                </Typography>

                <CardMedia
                    component="img"
                    image={musicaImagem} 
                    alt={`Capa do álbum de ${musicaTitulo}`}
                    className="album-art"
                />
            </Box>

            <Box className="options-block">
                <Stack direction="row" spacing={1} className="options-buttons">
                    {['artista', 'descricao', 'letra', 'comentarios'].map(aba => (
                        <Button 
                            key={aba}
                            variant={abaAtiva === aba ? 'contained' : 'outlined'} 
                            onClick={() => {
                                setAbaAtiva(aba);
                                setScrollPosition(0); 
                            }}
                            sx={{
                                backgroundColor: abaAtiva === aba ? 'var(--orange, #ff7533)' : 'transparent',
                                color: abaAtiva === aba ? 'white' : 'var(--text-color, white)',
                                border: `1px solid ${abaAtiva === aba ? 'var(--orange, #ff7533)' : 'var(--border-color, rgba(255, 255, 255, 0.5))'}`,
                                '&:hover': {
                                    backgroundColor: abaAtiva === aba ? 'var(--darker-orange, #a64c1e)' : 'var(--button-hover-bg, rgba(255, 255, 255, 0.1))',
                                    color: 'var(--button-hover-color, white)',
                                    border: `1px solid ${abaAtiva === aba ? 'var(--darker-orange, #a64c1e)' : 'var(--button-hover-bg, rgba(255, 255, 255, 0.7))'}`,
                                }
                            }}
                        >
                            {aba.charAt(0).toUpperCase() + aba.slice(1)}
                        </Button>
                    ))}
                </Stack>

                <ScrollableContent />

            </Box>
        </Container>
    );
}

export default TelaMusica;