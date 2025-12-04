import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchSongById, fetchAlbumsByArtist } from '../../redux/catalogoSlice';
import { playSong } from '../../redux/playerSlice.js';
import AlbumHeader from '../../components/AlbumHeader.jsx';
import SongList from '../../components/SongList.jsx';
import Section from '../../components/Section.jsx';
import AlbumCard from '../../components/AlbumCard.jsx';
import ReleaseInfo from '../../components/ReleaseInfo.jsx';
import './css/SongAlbumDetail.css';

const formatTime = (seconds) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export default function SongDetail({ songID }) {
    const { id: routeId } = useParams();
    const effectiveId = songID || routeId;
    const dispatch = useDispatch();

    const { details: song, status: songStatus } = useSelector((state) => state.catalog.selectedSong);
    const { items: artistAlbums, status: artistAlbumsStatus } = useSelector((state) => state.catalog.albumsByArtist);

    const mainArtistIdForFetch = (song) => {
        if (!song) return null;
        if (Array.isArray(song.artists) && song.artists.length > 0) {
            return song.artists[0]._id || song.artists[0].id;
        }
        if (song.owner) {
            return song.owner._id || song.owner.id;
        }
        return null;
    };

    useEffect(() => {
        if (effectiveId) {
            dispatch(fetchSongById(effectiveId));
        }
    }, [effectiveId, dispatch]);

    useEffect(() => {
        const idToFetch = mainArtistIdForFetch(song);
        if (song && idToFetch) {
            dispatch(fetchAlbumsByArtist(idToFetch));
        }
    }, [song, dispatch]); 

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

    if (songStatus === 'loading') {
        return <main><h1>Carregando... 🎧</h1></main>;
    }

    if (songStatus === 'failed' || !song) {
        return <main><h1>Música não encontrada 😥</h1></main>;
    }

    const artistName = Array.isArray(song.artists) && song.artists.length > 0
        ? song.artists.map(a => a.name || a.username || 'Artista Desconhecido').join(', ')
        : (song.owner && song.owner.username)
            ? song.owner.username
            : (song.artist || 'Desconhecido');

    const mainArtistId = Array.isArray(song.artists) && song.artists.length > 0 
        ? (song.artists[0]._id || song.artists[0].id)
        : song.owner 
            ? (song.owner._id || song.owner.id)
            : null;
            
    const linkPath = song.isArtistUpload ? '/artist/' : '/perfil/';

    const ownerName = song.owner 
        ? (song.owner.name || song.owner.username || 'Proprietário Desconhecido')
        : null;
        
    const ownerId = song.owner 
        ? (song.owner._id || song.owner.id) 
        : null;
        
    const label = song.album?.recordLabel || song.recordLabel || 'Não informada';
    
    return (
        <main>
            <AlbumHeader 
                cover={song.cover} 
                type={'Single'} 
                title={song.title} 
                artist={artistName}
                artistId={mainArtistId} 
                artistLinkPrefix={linkPath} 
                year={song.releaseDate ? new Date(song.releaseDate).getFullYear() : ""}
                duration={"1 música, " + formatTime(song.duration)}
                onPlay={handlePlaySong} 
            /> 
            
            <div className="song-list-container"> 
                <SongList 
                    tracksArr={[song]} 
                    onTrackClick={handlePlaySong}
                />
            </div>
            
            {song.lyrics && (
                <div className="song-lyrics-container">
                    <h2>Letra 🎶</h2>
                    <pre className="song-lyrics-text">{song.lyrics}</pre>
                </div>
            )}

            <ReleaseInfo
                releaseDate={song.releaseDate} 
                recordLabel={label} 
                genres={song.generos && song.generos.length > 0 ? song.generos.join(', ') : 'N/A'}
            />

            <Section title={`Mais de ${artistName}`} className="section-mais-do-artista">
                {artistAlbumsStatus === 'loading' && <p>Carregando álbuns...</p>}
                {artistAlbums.length > 0 ? (
                    artistAlbums.map((album) => {
                        let albArtist = 'Desconhecido';
                        if (album.artists && Array.isArray(album.artists)) {
                            albArtist = album.artists.map(a => a.name || a.username || 'Desconhecido').join(', ');
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
                ) : (
                    <p>Nenhum outro álbum encontrado para este artista.</p>
                )}
            </Section>
            
            <div className="margin-bottom-large"></div>
        </main>
    );
}