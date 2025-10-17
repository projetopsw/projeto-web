import React, { useState, useEffect } from 'react';
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

const EMPTY_ARTIST_MAP = {};

function TelaMusica() {
    const dispatch = useDispatch();

    // Busca o estado do slice do artista para verificar o status e erro
    const artistStatus = useSelector(state => state.artistInfo?.isLoading);
    const artistError = useSelector(state => state.artistInfo?.error);
    
    // Busca o mapa de artistas do state
    const artistMap = useSelector(state => state.artistInfo?.artistMap || EMPTY_ARTIST_MAP);

    useEffect(() => {
        if (artistStatus === 'idle') {
            dispatch(fetchTopArtists());
        }
    }, [artistStatus, dispatch]); 

    const { currentSong } = useSelector(state => state.player); 

    const musicaAtual = currentSong || {
        id: "default-song-placeholder", 
        title: "Nenhuma Música Tocando", 
        artist: "Artista Desconhecido",
        artistId: null, // Default
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

    // Estado para like/dislike (mantido localmente)
    const [likes, setLikes] = useState(15);
    const [dislikes, setDislikes] = useState(3);
    const [userRating, setUserRating] = useState(0); 

    // Lógica para Like/Dislike (Mantida inalterada)
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
    
    // Cálculo para a barra de progresso
    const totalVotes = likes + dislikes;
    const likePercentage = totalVotes > 0 ? (likes / totalVotes) * 100 : 50;

    // --- Componente da Aba DESCRIÇÃO (MANTIDO INALTERADO) ---
    const DescriptionTabContent = () => (
        <Box>
            {/* Bloco de Rating com a barra de progresso */}
            <Stack direction="row" spacing={2} alignItems="center" className="like-dislike-buttons" sx={{ mb: 2 }}>
                {/* ... (Botões de Like/Dislike) ... */}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton 
                        onClick={handleLike} 
                        aria-label="like"
                        sx={{ color: userRating === 1 ? '#ff7533' : 'white', '&:hover': { color: '#ff7533' } }}
                    >
                        <ThumbUpIcon />
                    </IconButton>
                    <Typography variant="body1" sx={{ color: 'white', minWidth: '20px' }}>
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
                            backgroundColor: 'rgba(255, 255, 255, 0.3)',
                            '& .MuiLinearProgress-bar': {
                                backgroundColor: '#ff7533',
                            }
                        }}
                    />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ color: 'white', minWidth: '20px', textAlign: 'right' }}>
                        {dislikes}
                    </Typography>
                    <IconButton 
                        onClick={handleDislike} 
                        aria-label="dislike"
                        sx={{ color: userRating === -1 ? '#ff7533' : 'white', '&:hover': { color: '#ff7533' } }}
                    >
                        <ThumbDownIcon />
                    </IconButton>
                </Box>
            </Stack>

            {/* Descrição da Música */}
            <Typography variant="body1" className="content-text">
                {musicaAtual.descricao || 'Descrição indisponível.'}
            </Typography>
        </Box>
    );


    // --- Componente da Aba ARTISTA (MANTIDO INALTERADO) ---
    const ArtistTabContent = () => {
        // ... (Lógica de Carregamento/Erro e Conteúdo do Artista) ...
        if (artistStatus === 'loading') {
            return <Typography variant="body1">Carregando informações do artista...</Typography>;
        }
        
        if (artistStatus === 'failed') {
            return <Typography variant="body1" color="error">Erro ao carregar dados dos artistas: {artistError}</Typography>;
        }
        
        return (
            <Box>
                {artistaInfo ? (
                    <>
                        <Typography variant="h5" component="h2" gutterBottom className="musica-artista" sx={{ mt: 1, mb: 2 }}>
                            Sobre {artistaInfo.name}
                        </Typography>
                        
                        {artistaInfo.image && (
                            <CardMedia
                                component="img"
                                image={artistaInfo.image}
                                alt={`Imagem de ${artistaInfo.name}`}
                                sx={{ width: 150, height: 150, borderRadius: '50%', mb: 2, objectFit: 'cover' }}
                            />
                        )}
                        
                        <Typography variant="body1" className="content-text">
                            {artistaInfo.about || 'Informação sobre o artista não disponível.'}
                        </Typography>
                    </>
                ) : (
                    <Typography variant="body1">
                        Informações detalhadas sobre o artista "{musicaArtista}" indisponíveis. (Certifique-se de que o `artistId` da música está correto).
                    </Typography>
                )}
            </Box>
        );
    };

    // 🚨 NOVO: Container para o conteúdo das abas que pode rolar 
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
                    // Removemos maxHeight e overflowY do Typography para o Box fazer a rolagem
                    sx={{ whiteSpace: 'pre-wrap' }} 
                >
                    {musicaAtual.lyrics || musicaAtual.letra || 'Letra indisponível.'}
                </Typography>
            );
        } else if (abaAtiva === 'comentarios') {
            content = <Comentarios musicaId={musicaId} />;
        }

        // 🚨 NOVO BOX COM ROLAGEM: Este Box agora lida com o overflow e a altura máxima
        return (
            <Box 
                className="aba-content-scroll"
                sx={{
                    // Altura máxima baseada na tela - ajustada por estimativa para caber o player info + botões
                    // Você pode precisar ajustar esse valor (ex: '60vh') dependendo do seu layout
                    maxHeight: '65vh', 
                    overflowY: 'auto', // Habilita a rolagem vertical
                    p: 2, // Adiciona padding para o scroll não ficar colado na borda
                    mt: 1,
                    backgroundColor: 'rgba(255, 255, 255, 0.05)', // Fundo para destacar
                    borderRadius: 1
                }}
            >
                {content}
            </Box>
        );
    };


    return (
        <Container maxWidth="lg" className="tela-musica-container">
            {/* Bloco de Informações da Música (Fixo) */}
            <Box className="player-info-block">
                <Typography variant="h4" component="h1" gutterBottom className="musica-titulo">
                    {musicaTitulo}
                </Typography>
                <Typography variant="h6" gutterBottom className="musica-artista">
                    {musicaArtista}
                </Typography>

                <CardMedia
                    component="img"
                    image={musicaImagem}
                    alt={`Capa do álbum de ${musicaTitulo}`}
                    className="album-art"
                />
            </Box>

            {/* Bloco de Opções e Conteúdo (Agora com rolagem controlada) */}
            <Box className="options-block">
                {/* Botões das Abas (Fixo) */}
                <Stack direction="row" spacing={1} className="options-buttons">
                    <Button 
                        variant={abaAtiva === 'artista' ? 'contained' : 'outlined'} 
                        onClick={() => setAbaAtiva('artista')}
                    >
                        Artista
                    </Button>
                    <Button 
                        variant={abaAtiva === 'descricao' ? 'contained' : 'outlined'} 
                        onClick={() => setAbaAtiva('descricao')}
                    >
                        Descrição
                    </Button>
                    <Button 
                        variant={abaAtiva === 'letra' ? 'contained' : 'outlined'} 
                        onClick={() => setAbaAtiva('letra')}
                    >
                        Letra
                    </Button>
                    <Button 
                        variant={abaAtiva === 'comentarios' ? 'contained' : 'outlined'} 
                        onClick={() => setAbaAtiva('comentarios')}
                    >
                        Comentários
                    </Button>
                </Stack>

                {/* 🚨 Usando o NOVO componente de rolagem aqui */}
                <ScrollableContent />

            </Box>
        </Container>
    );
}

export default TelaMusica;