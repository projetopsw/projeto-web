import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchSongById, fetchAlbumsByArtist } from '../../redux/catalogoSlice';
import { playSong } from '../../redux/playerSlice.js';
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

    const { details: song, status: songStatus } = useSelector((state) => state.catalog.selectedSong);
    const { items: artistAlbums, status: artistAlbumsStatus } = useSelector((state) => state.catalog.albumsByArtist);
    
    const currentUser = useSelector(state => state.auth.user); 
    const currentUserId = currentUser?._id || currentUser?.id;
    const isAdmin = currentUser?.role === 'admin'; 

    useEffect(() => {
        if (effectiveId) {
            dispatch(fetchSongById(effectiveId));
        }
    }, [effectiveId, dispatch]);

    useEffect(() => {
        if (song) {
            const currentSongArtistIds = getArtistIds(song);
            
            const mainArtistId = currentSongArtistIds[0];

            if (mainArtistId) {
                dispatch(fetchAlbumsByArtist(mainArtistId));

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
    let isArtistUpload = false;
    let isUserUpload = false;
    let mainArtistId = null;

    if (song) {
        if (Array.isArray(song.artists) && song.artists.length > 0) {
            const mainArtist = song.artists[0];
            mainArtistId = mainArtist._id || mainArtist.id;
            isArtistUpload = !!mainArtist.isArtistUpload;
            finalArtistName = song.artists.map(a => a.name || a.username).join(', ');
        } else if (song.owner) {
            mainArtistId = song.owner._id || song.owner.id;
            isUserUpload = true;
            finalArtistName = song.owner.username || song.owner.name;
        }
        
        if (mainArtistId && !isUserUpload) isArtistUpload = true;
    }
    
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

    return (
        <main>
            <AlbumHeader 
                cover={albumCover} 
                songCover={musicCover} 
                type={'Single'} 
                title={song.title} 
                artist={finalArtistName}
                artistId={mainArtistId} 
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