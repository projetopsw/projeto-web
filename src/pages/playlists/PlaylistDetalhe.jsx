import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Typography, CircularProgress } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import api from '../../services/api';
import { setQueue, playSong } from '../../redux/playerSlice';
import PlaylistHeader from './PlaylistHeader';
import PlaylistActions from './PlaylistActions';
import SongTable from './SongTable';
import EditPlaylistModal from './EditPlaylistModal';
import { mapSongSafe, calculateTotalDuration } from './playlistUtils'; 

const LIKED_SONGS_COVER = '/assets/img/liked_cover_0.png';
const DEFAULT_PLAYLIST_COVER = '/assets/img/vibe_cover_2.png'; 

function PlaylistDetalhe() {
    const { id } = useParams();
    const navigate = useNavigate();

    const dispatch = useDispatch();
   
    const { currentSong, isPlaying } = useSelector(state => state.player);
    const user = useSelector(state => state.user?.user) || useSelector(state => state.auth?.user);
    const USER_ID = user?._id || user?.id || '';

    const [playlistDetails, setPlaylistDetails] = useState(null);
    const [localSongs, setLocalSongs] = useState([]);
    const [originalSongs, setOriginalSongs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [sortKey, setSortKey] = useState('custom');

    useEffect(() => {
        let isMounted = true;
        const loadData = async () => {
            if (id === '0' && !USER_ID) return;
            
            setIsLoading(true);
            try {
                let details = null;
                let rawSongs = [];
                let songIds = [];

                if (id === '0') {
                    const userRes = await api.get(`/users/${USER_ID}`);
                    const userData = userRes.data;
                    songIds = (userData.likedSongs || []).filter(Boolean);
                    details = {
                        id: '0',
                        name: 'Músicas Curtidas',
                        description: 'Todas as músicas que você curtiu.',
                        img: LIKED_SONGS_COVER,
                        isPublic: false,
                        creator: 'Você',
                        creatorId: USER_ID,
                    };
                } else {
                    const playlistResponse = await api.get(`/playlists/${id}`);
                    const playlistData = playlistResponse.data;
                    songIds = playlistData.songs || [];
                    details = {
                        ...playlistData,
                        name: playlistData.title, 
                        img: playlistData.cover || DEFAULT_PLAYLIST_COVER, 
                        creator: playlistData.user?.username || 'Você', 
                        creatorId: playlistData.user?._id || playlistData.user?.id || USER_ID,
                        isPublic: playlistData.isPublic
                    };
                }

                if (songIds.length > 0) {
                    if (typeof songIds[0] === 'object' && (songIds[0].title || songIds[0].name)) {
                        rawSongs = songIds;
                    } else {
                        const songsPromises = songIds.map(songId => api.get(`/songs/${songId}`));
                        const results = await Promise.allSettled(songsPromises);
                        rawSongs = results.filter(r => r.status === 'fulfilled').map(r => r.value.data);
                    }
                }

                const cleanSongs = rawSongs.map(mapSongSafe).filter(Boolean);

                if (isMounted) {
                    details.songCount = cleanSongs.length;
                    details.duration = calculateTotalDuration(cleanSongs);
                    setPlaylistDetails(details);
                    setOriginalSongs(cleanSongs);
                    setLocalSongs(cleanSongs);
                }
            } catch (error) {
                console.error("Erro playlist:", error);
                if (isMounted) setPlaylistDetails(null);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        loadData();
        return () => { isMounted = false; };
    }, [id, USER_ID]);

    useEffect(() => {
        if (!originalSongs || originalSongs.length === 0) return;
        let sorted = [...originalSongs];
        if (sortKey !== 'custom') {
            sorted.sort((a, b) => {
                let valA = a[sortKey] || '';
                let valB = b[sortKey] || '';
                let comparison = String(valA).localeCompare(String(valB), 'pt', { sensitivity: 'base' });
                return sortKey === 'added' ? comparison * -1 : comparison;
            });
        }
        setLocalSongs(sorted);
    }, [sortKey, originalSongs]);

    const handleUpdatePlaylist = async (updatedData) => {
        if (!updatedData.title.trim()) return alert("Título obrigatório.");
        try {
            await api.patch(`/playlists/${id}`, updatedData);
            window.location.reload();
        } catch (error) {
            alert("Erro ao atualizar.");
        }
    };

    const handleDeletePlaylist = async () => {
        if (id === "0") return;
        if (window.confirm(`Excluir "${playlistDetails.name}"?`)) {
            try {
                await api.delete(`/playlists/${id}`);
                navigate('/playlists');
            } catch (error) {
                alert("Erro ao excluir.");
            }
        }
    };

    const onDragEnd = (result) => {
        if (!result.destination || result.destination.index === result.source.index) return;
        const items = Array.from(localSongs);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        setLocalSongs(items);
    };

    const handlePlaylistPlay = () => {
        if (localSongs.length > 0) {
        
            dispatch(setQueue({
                songs: localSongs,
                startIndex: 0,
            }));
        }
    };

    if (isLoading) return <main className="content-area" style={{paddingTop:'50px', display:'flex', justifyContent:'center'}}><CircularProgress color="warning" /></main>;
    if (!playlistDetails) return <main className="content-area" style={{paddingTop:'50px', textAlign:'center'}}><Typography variant="h4" color="error">Playlist não encontrada.</Typography><Button onClick={() => navigate('/playlists')} sx={{mt:2, color:'var(--orange)'}}>Voltar</Button></main>;

    const isCustomPlaylist = id !== "0"; 
    const isOwner = playlistDetails.creatorId === USER_ID;
    const isThisPlaylistPlaying = isPlaying && localSongs.some(song => song.id === currentSong?.id);

    return (
        <main className="content-area playlist-page">
            <PlaylistHeader 
                playlistDetails={playlistDetails} 
                isOwner={isOwner} 
                isCustom={isCustomPlaylist} 
                onOpenEdit={() => setIsEditModalOpen(true)} 
            />
            
            <PlaylistActions 
                onPlay={handlePlaylistPlay}
                isPlaying={isThisPlaylistPlaying}
                isDisabled={localSongs.length === 0}
                onSortChange={setSortKey}
                sortKey={sortKey}
                onDelete={handleDeletePlaylist}
                isOwner={isOwner}
                isCustom={isCustomPlaylist}
            />
            
            <SongTable 
                songs={localSongs}
                onDragEnd={onDragEnd}
                isCustom={isCustomPlaylist}
                isOwner={isOwner}
                sortKey={sortKey}
                currentSong={currentSong}
                isPlaying={isPlaying}
            />

            <EditPlaylistModal 
                open={isEditModalOpen} 
                onClose={() => setIsEditModalOpen(false)} 
                onSave={handleUpdatePlaylist}
                initialData={playlistDetails}
            />
        </main>
    );
}

export default PlaylistDetalhe;