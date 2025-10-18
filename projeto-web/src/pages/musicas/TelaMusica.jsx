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

import { useSelector, useDispatch } from 'react-redux'; 
import { fetchTopArtists } from '../../redux/artistaInfoSlice';
import './css/TelaMusica.css';
import Comentarios from '../../components/Comentarios'; 
import { useNavigate } from 'react-router-dom'; 

const EMPTY_ARTIST_MAP = {};

function TelaMusica() {
    const dispatch = useDispatch();
    const navigate = useNavigate(); 
    const scrollRef = useRef(null); 
    const [scrollPosition, setScrollPosition] = useState(0); 

    const artistStatus = useSelector(state => state.artistInfo?.isLoading);
    const artistError = useSelector(state => state.artistInfo?.error);
    
    const artistMap = useSelector(state => state.artistInfo?.artistMap || EMPTY_ARTIST_MAP);

    useEffect(() => {
        if (artistStatus === 'idle') {
            dispatch(fetchTopArtists());
        }
    }, [artistStatus, dispatch]); 

    const currentSong = useSelector(state => state.player.currentSong); 

    const musicaAtual = currentSong || {
        id: "default-song-placeholder", 
        title: "Nenhuma Música Tocando", 
        artist: "Artista Desconhecido",
        artistId: null, 
        cover: "/assets/img/vacamario.jpg", 
        descricao: "Sem descrição.",
        letra: "Sem letra.", 
        lyrics: "Sem letra.", 
    };
    
    const musicaImagem = musicaAtual.cover || musicaAtual.imagem; 
    const musicaTitulo = musicaAtual.title || musicaAtual.titulo; 
    const musicaArtista = musicaAtual.artist || musicaAtual.artista; 
    const musicaId = musicaAtual.id;
    const artistaId = musicaAtual.artistId; 

    const artistaInfo = artistMap[artistaId];

    const [abaAtiva, setAbaAtiva] = useState('letra');

    const [likes, setLikes] = useState(15);
    const [dislikes, setDislikes] = useState(3);
    const [userRating, setUserRating] = useState(0); 

    const handleArtistClick = () => {
        if (artistaId) {
            navigate(`/artista/${artistaId}`); 
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


    // --- Componente da Aba DESCRIÇÃO (ADAPTADO) ---
    const DescriptionTabContent = () => (
        <Box>
            {/* Bloco de Rating com a barra de progresso */}
            <Stack direction="row" spacing={2} alignItems="center" className="like-dislike-buttons" sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton 
                        onClick={handleLike} 
                        aria-label="like"
                        // 💡 Cores adaptadas: Ícone ativo (laranja), Ícone inativo (cor do texto), Hover (laranja)
                        sx={{ color: userRating === 1 ? 'var(--orange, #ff7533)' : 'var(--text-color, white)', 
                              '&:hover': { color: 'var(--orange, #ff7533)' } }}
                    >
                        <ThumbUpIcon />
                    </IconButton>
                    <Typography 
                        variant="body1" 
                        // 💡 Cor do Texto adaptada
                        sx={{ color: 'var(--text-color, white)', minWidth: '20px' }}
                    >
                        {likes}
                    </Typography>
                </Box>

                <Box sx={{ flexGrow: 1 }}>
                    <LinearProgress 
                        variant="determinate" 
                        value={likePercentage} 
                        sx={{ 
                            height: 8, 
                            borderRadius: 5, 
                            // 💡 Fundo da barra inativa (input-bg para ser neutro no tema claro)
                            backgroundColor: 'var(--input-bg, rgba(255, 255, 255, 0.3))',
                            '& .MuiLinearProgress-bar': {
                                // 💡 Cor da barra de progresso (Laranja)
                                backgroundColor: 'var(--orange, #ff7533)',
                            }
                        }}
                    />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography 
                        variant="body1" 
                        // 💡 Cor do Texto adaptada
                        sx={{ color: 'var(--text-color, white)', minWidth: '20px', textAlign: 'right' }}
                    >
                        {dislikes}
                    </Typography>
                    <IconButton 
                        onClick={handleDislike} 
                        aria-label="dislike"
                        // 💡 Cores adaptadas: Ícone ativo (laranja), Ícone inativo (cor do texto), Hover (laranja)
                        sx={{ color: userRating === -1 ? 'var(--orange, #ff7533)' : 'var(--text-color, white)', 
                              '&:hover': { color: 'var(--orange, #ff7533)' } }}
                    >
                        <ThumbDownIcon />
                    </IconButton>
                </Box>
            </Stack>

            {/* Descrição da Música */}
            <Typography variant="body1" className="content-text" sx={{ color: 'var(--text-color, white)' }}>
                {musicaAtual.descricao || 'Descrição indisponível.'}
            </Typography>
        </Box>
    );


    // --- Componente da Aba ARTISTA (ADAPTADO) ---
    const ArtistTabContent = () => {
        if (artistStatus === 'loading') {
            // 💡 Cores de texto adaptadas
            return <Typography variant="body1" sx={{ color: 'var(--text-color, white)' }}>Carregando informações do artista...</Typography>;
        }
        
        if (artistStatus === 'failed') {
            // 💡 Cores de texto adaptadas
            return <Typography variant="body1" color="error" sx={{ color: 'var(--darker-orange, #ff7533)' }}>Erro ao carregar dados dos artistas: {artistError}</Typography>;
        }
        
        return (
            <Box>
                {artistaInfo ? (
                    <>
                        <Typography 
                            variant="h5" 
                            component="h2" 
                            gutterBottom 
                            className="musica-artista" 
                            // 💡 Cores de título adaptadas
                            sx={{ 
                                mt: 1, 
                                mb: 2, 
                                cursor: 'pointer', 
                                color: 'var(--title-color, white)',
                                '&:hover': { 
                                    textDecoration: 'underline', 
                                    color: 'var(--orange, #ff7533)' // Laranja no hover
                                } 
                            }}
                            onClick={handleArtistClick}
                        >
                            Sobre {artistaInfo.name}
                        </Typography>
                        
                        {artistaInfo.image && (
                            <CardMedia
                                component="img"
                                image={artistaInfo.image}
                                alt={`Imagem de ${artistaInfo.name}`}
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
                        )}
                        
                        <Typography 
                            variant="body1" 
                            className="content-text"
                            // 💡 Cores de texto adaptadas
                            sx={{ color: 'var(--text-color, white)' }}
                        >
                            {artistaInfo.about || 'Informação sobre o artista não disponível.'}
                        </Typography>
                    </>
                ) : (
                    // 💡 Cores de texto adaptadas
                    <Typography variant="body1" sx={{ color: 'var(--text-color, white)' }}>
                        Informações detalhadas sobre o artista "{musicaArtista}" indisponíveis. (Certifique-se de que o `artistId` da música está correto).
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
                        // 💡 Cores de texto adaptadas
                        color: 'var(--text-color, white)' 
                    }} 
                >
                    {musicaAtual.lyrics || musicaAtual.letra || 'Letra indisponível.'}
                </Typography>
            );
        } else if (abaAtiva === 'comentarios') {
            // Presumimos que o componente Comentarios lida com suas próprias cores
            content = <Comentarios musicaId={musicaId} />;
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
                    // 💡 Cor de Fundo da aba (card-bg ou um fundo sutil)
                    backgroundColor: 'var(--card-bg, rgba(255, 255, 255, 0.05))', 
                    borderRadius: 1,
                    // 💡 Cor da barra de rolagem (se necessário, pode ser estilizada via CSS ou Webkit)
                    // Para o conteúdo interno, o texto já foi adaptado em cada subcomponente.
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
            // 💡 Cor do Texto do Container (fallback para todos os filhos)
            sx={{ color: 'var(--text-color, white)' }} 
        >
            {/* Bloco de Informações da Música (Fixo) */}
            <Box className="player-info-block">
                <Typography 
                    variant="h4" 
                    component="h1" 
                    gutterBottom 
                    className="musica-titulo"
                    // 💡 Cor do Título
                    sx={{ color: 'var(--title-color, white)' }}
                >
                    {musicaTitulo}
                </Typography>
                <Typography 
                    variant="h6" 
                    gutterBottom 
                    className="musica-artista"
                    // 💡 Cor do Artista
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

            {/* Bloco de Opções e Conteúdo*/}
            <Box className="options-block">
                {/* Botões das Abas (Fixo) */}
                <Stack direction="row" spacing={1} className="options-buttons">
                    {['artista', 'descricao', 'letra', 'comentarios'].map(aba => (
                        <Button 
                            key={aba}
                            variant={abaAtiva === aba ? 'contained' : 'outlined'} 
                            onClick={() => {
                                setAbaAtiva(aba);
                                setScrollPosition(0); 
                            }}
                            // 💡 Estilos do Botão adaptados
                            sx={{
                                // Contained: Fundo laranja, Texto branco/padrão
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