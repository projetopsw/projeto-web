import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchSongById, fetchAlbumsByArtist } from '../../redux/catalogoSlice';
import { playSong } from '../../redux/playerSlice.js';

import { fetchVotes, toggleVote } from '../../redux/votesSlice'; 
import BarraLikes from '../../components/BarraLikes'; 
import Comentarios from '../../components/Comentarios'; 
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import { Box, Typography, Stack, IconButton } from '@mui/material';

import AlbumHeader from '../../components/AlbumHeader.jsx';
import SongList from '../../components/SongList.jsx';
import Section from '../../components/Section.jsx';
import AlbumCard from '../../components/AlbumCard.jsx';
import SongCard from '../../components/SongCard.jsx'; 
import ReleaseInfo from '../../components/ReleaseInfo.jsx';
import DeleteConfirmationModal from '../../components/DeleteMusica.jsx';
import mongoApi from '../../services/mongoApi.js';
import './css/SongAlbumDetail.css';


const formatTime = (seconds) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const getArtistIds = (item) => {
    const ids = [];
    if (!item) return ids;

    if (item.artists && Array.isArray(item.artists)) {
        item.artists.forEach(a => {
            const id = a._id || a.id;
            if (id) ids.push(String(id));
        });
    } 
    else if (item.artist && typeof item.artist === 'object') {
        const id = item.artist._id || item.artist.id;
        if (id) ids.push(String(id));
    } 
    else if (item.artist && typeof item.artist === 'string') {
        ids.push(String(item.artist));
    }
    else if (item.owner) {
        const id = item.owner._id || item.owner.id;
        if (id) ids.push(String(id));
    }
    
    return ids;
};

export default function SongDetail({ songID }) {
    const { id: routeId } = useParams();
    const effectiveId = songID || routeId;
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [relatedSongs, setRelatedSongs] = useState([]); 
    
    const [artistImageFromApi, setArtistImageFromApi] = useState(null);

    const { details: song, status: songStatus } = useSelector((state) => state.catalog.selectedSong);
    const { items: artistAlbums, status: artistAlbumsStatus } = useSelector((state) => state.catalog.albumsByArtist);
    
    const currentUser = useSelector(state => state.user.user); 
    const currentUserId = currentUser?._id || currentUser?.id || "USUARIO_PADRAO";
    const isAdmin = currentUser?.role === 'admin'; 
    const token = useSelector(state => state.auth.token); 

    const voteStatus = useSelector(state => state.votes[effectiveId]) || {
        likes: 0,
        dislikes: 0,
        userAction: null, 
        status: 'idle',
        error: null,
    };
    
    const { likes, dislikes, userAction } = voteStatus;
    const totalVotes = likes + dislikes;
    const likePercentage = totalVotes > 0 ? (likes / totalVotes) * 100 : 50;

    const handleLike = () => {
        if (!token || currentUserId === "USUARIO_PADRAO") {
            console.error("Usuário não autenticado. Faça login para votar.");
            alert("Você precisa estar logado para votar.");
            return;
        }
        const newAction = userAction === 'like' ? null : 'like';
        if (effectiveId) {
            dispatch(toggleVote({ songId: effectiveId, userId: currentUserId, action: newAction, token })); 
        }
    };

    const handleDislike = () => {
        if (!token || currentUserId === "USUARIO_PADRAO") {
            console.error("Usuário não autenticado. Faça login para votar.");
            alert("Você precisa estar logado para votar.");
            return;
        }
        const newAction = userAction === 'dislike' ? null : 'dislike';
        if (effectiveId) {
            dispatch(toggleVote({ songId: effectiveId, userId: currentUserId, action: newAction, token })); 
        }
    };
    
    useEffect(() => {
        if (effectiveId) {
            dispatch(fetchSongById(effectiveId));
            
            if (currentUserId !== "USUARIO_PADRAO") {
                   dispatch(fetchVotes({ songId: effectiveId, userId: currentUserId })); 
            }
        }
    }, [effectiveId, currentUserId, dispatch]);

    useEffect(() => {
        if (song) {
            const currentSongArtistIds = getArtistIds(song);
            const mainArtistId = currentSongArtistIds[0];

            if (mainArtistId) {
                dispatch(fetchAlbumsByArtist(mainArtistId));

                const isUserUpload = song.owner && (song.owner._id === mainArtistId || song.owner.id === mainArtistId);
                
                if (!isUserUpload) {
                    const fetchArtistData = async () => {
                        try {
                            const response = await mongoApi.get(`/artists/${mainArtistId}`);
                            if (response.data) {
                                const img = response.data.image || response.data.picture || response.data.avatar || response.data.img;
                                setArtistImageFromApi(img);
                            }
                        } catch (error) {
                            console.log("Não foi possível buscar detalhes extras do artista (imagem).");
                        }
                    };
                    fetchArtistData();
                }

                const fetchRelatedSongs = async () => {
                    try {
                        const response = await mongoApi.get('/songs');
                        const allSongs = response.data;
                        
                        const filtered = allSongs.filter(candidateSong => {
                            if ((candidateSong._id || candidateSong.id) === (song._id || song.id)) return false;
                            const candidateIds = getArtistIds(candidateSong);
                            return currentSongArtistIds.some(currentId => candidateIds.includes(currentId));
                        });
                        
                        setRelatedSongs(filtered.slice(0, 6));
                    } catch (error) {
                        console.error("Erro ao buscar músicas relacionadas:", error);
                    }
                };
                fetchRelatedSongs();
            }
        }
    }, [song, dispatch]); 

    const handleDeleteSong = async () => {
        if (!song || !effectiveId) return;
        try {
            await mongoApi.delete(`/songs/${effectiveId}`);
            alert('Música deletada com sucesso!'); 
            navigate('/'); 
        } catch (error) {
            console.error('Erro ao deletar a música:', error);
            alert('Falha ao deletar a música. Tente novamente.');
        }
    };
    
    const handlePlaySong = () => {
        if (song) {
             const artistForPlayer = Array.isArray(song.artists) && song.artists.length > 0 
                ? song.artists.map(a => a.name || a.username).join(', ') 
                : (song.owner ? song.owner.username : (song.artist || 'Desconhecido'));

            const songPayload = {
                id: song._id,
                title: song.title,
                artist: artistForPlayer,
                cover: song.cover || (song.album && song.album.cover),
            };
            dispatch(playSong(songPayload));
        }
    };

    if (songStatus === 'loading') return <main><h1>Carregando... 🎧</h1></main>;
    if (songStatus === 'failed' || !song) return <main><h1>Música não encontrada 😥</h1></main>;

    let finalArtistName = 'Desconhecido';
    
    let finalArtistImage = null; 
    
    let isArtistUpload = false;
    let isUserUpload = false;
    let mainArtistId = null;

    if (song) {
        if (Array.isArray(song.artists) && song.artists.length > 0) {
            const mainArtist = song.artists[0];
            mainArtistId = mainArtist._id || mainArtist.id;
            isArtistUpload = !!mainArtist.isArtistUpload;
            finalArtistName = song.artists.map(a => a.name || a.username).join(', ');
            
            finalArtistImage = mainArtist.image || mainArtist.picture || mainArtist.avatar; 

        } else if (song.owner) {
            mainArtistId = song.owner._id || song.owner.id;
            isUserUpload = true;
            finalArtistName = song.owner.username || song.owner.name;
            
            finalArtistImage = song.owner.avatar || song.owner.image; 
        }

        if (mainArtistId && !isUserUpload) isArtistUpload = true;
        
        if (!finalArtistImage && song.artist && typeof song.artist === 'object') {
             finalArtistImage = song.artist.image || song.artist.picture;
        }
    }
 
    const displayImage = finalArtistImage || artistImageFromApi;

    const isOwner = currentUserId && (
        (isArtistUpload && mainArtistId === currentUserId) || 
        (isUserUpload && song.owner?._id === currentUserId)
    );
    const canDelete = isAdmin || isOwner;

    let artistLinkPrefix = isArtistUpload ? '/artist/' : '/perfil/';
    const albumCover = song.album?.cover || null; 
    const musicCover = song.cover || null; 
    
    const currentAlbumId = song.album?._id || song.album?.id;
    const currentSongIdsForCheck = getArtistIds(song);
    
    const filteredAlbums = artistAlbums.filter(album => {
        if ((album._id || album.id) === currentAlbumId) return false;
        const albumArtistIds = getArtistIds(album);
        return currentSongIdsForCheck.some(id => albumArtistIds.includes(id));
    });

    const LikeDislikeBar = () => (
        <Box sx={{ p: 2, mb: 3, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton 
                        onClick={handleLike} 
                        aria-label="like" 
                        disabled={voteStatus.status === 'loading' && userAction !== 'like'} 
                        sx={{ color: userAction === 'like' ? 'var(--orange, #ff7533)' : 'var(--text-color, white)', '&:hover': { color: 'var(--orange, #ff7533)' } }}
                    >
                        <ThumbUpIcon />
                    </IconButton>
                    <Typography variant="body1" sx={{ color: 'var(--text-color, white)', minWidth: '20px' }}>{likes}</Typography>
                </Box>

                <Box sx={{ flexGrow: 1 }}>
                    <BarraLikes likePercentage={likePercentage} />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ color: 'var(--text-color, white)', minWidth: '20px', textAlign: 'right' }}>{dislikes}</Typography>
                    <IconButton 
                        onClick={handleDislike} 
                        aria-label="dislike" 
                        disabled={voteStatus.status === 'loading' && userAction !== 'dislike'}
                        sx={{ color: userAction === 'dislike' ? 'var(--orange, #ff7533)' : 'var(--text-color, white)', '&:hover': { color: 'var(--orange, #ff7533)' } }}
                    >
                        <ThumbDownIcon />
                    </IconButton>
                </Box>
            </Stack>
        </Box>
    );

    return (
        <main>
            <AlbumHeader 
                cover={albumCover} 
                songCover={musicCover} 
                type={'Single'} 
                title={song.title} 
                artist={finalArtistName}
                artistId={mainArtistId} 
                artistImg={displayImage}
                artistLinkPrefix={artistLinkPrefix} 
                year={song.releaseDate ? new Date(song.releaseDate).getFullYear() : ""}
                duration={"1 música, " + formatTime(song.duration)}
                genres={song.genres} 
                onPlay={handlePlaySong} 
            >
                {canDelete && (
                     <div className="options-menu" style={{ position: 'relative' }}>
                          <button 
                              className="more-options-button"
                              onClick={() => setShowDeleteModal(true)}
                              style={{ background: 'none', border: '1px solid white', color: 'white', padding: '8px 15px', borderRadius: '20px', cursor: 'pointer', marginTop: '10px' }}
                          >
                              ... Deletar Música
                          </button>
                     </div>
                )}
            </AlbumHeader> 

            <div className="song-list-container"> 
                <SongList tracksArr={[song]} onTrackClick={handlePlaySong} />
            </div>
            
            {song.lyrics && (
                <div className="song-lyrics-container">
                    <h2>Letra 🎶</h2>
                    <pre className="song-lyrics-text">{song.lyrics}</pre>
                </div>
            )}
            
            <ReleaseInfo
                releaseDate={song.releaseDate} 
                recordLabel={song.album?.recordLabel || song.recordLabel || 'Não informada'} 
                genres={song.genres && song.genres.length > 0 ? song.genres.join(', ') : 'N/A'}
            />

            <Section title={`Mais de ${finalArtistName}`} className="section-mais-do-artista">
                {artistAlbumsStatus === 'loading' && <p>Carregando...</p>}
                
                {filteredAlbums.length > 0 ? (
                    filteredAlbums.map((album) => {
                        let albArtist = 'Desconhecido';
                        if (album.artists && Array.isArray(album.artists)) {
                            albArtist = album.artists.map(a => a.name).join(', ');
                        }
                        return (
                            <AlbumCard
                                key={album.id || album._id}
                                id={album.id || album._id}
                                cover={album.cover}
                                title={album.title}
                                artist={albArtist}
                            />
                        );
                    })
                ) : relatedSongs.length > 0 ? (
                    relatedSongs.map((relatedSong) => (
                        <SongCard 
                            key={relatedSong._id}
                            id={relatedSong._id}
                            title={relatedSong.title}
                            artist={finalArtistName}
                            cover={relatedSong.cover || relatedSong.album?.cover}
                            artistId={mainArtistId}
                        />
                    ))
                ) : (
                    <p style={{ opacity: 0.6 }}>Nenhum outro conteúdo encontrado.</p>
                )}
            </Section>
            
            <LikeDislikeBar />
            
            <div className="section-comentarios" style={{ padding: '0 20px', margin: '30px 0' }}>
                <h2>Comentários 💬</h2>
                <Comentarios musicaId={effectiveId} />
            </div>
            
            <div className="margin-bottom-large"></div>
            
            <DeleteConfirmationModal
                show={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteSong}
                itemTitle={song.title}
            />
        </main>
    );
}