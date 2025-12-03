import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
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

    useEffect(() => {
        if (effectiveId) {
            dispatch(fetchSongById(effectiveId));
        }
    }, [effectiveId, dispatch]);

    useEffect(() => {
        if (song && song.artists && song.artists.length > 0) {
            const mainArtistId = song.artists[0]._id || song.artists[0].id;
            if (mainArtistId) {
                dispatch(fetchAlbumsByArtist(mainArtistId));
            }
        } else if (song && song.artist && typeof song.artist === 'string') {
            dispatch(fetchAlbumsByArtist(song.artist));
        }
    }, [song, dispatch]); 

    // Função que dispara a ação playSong com o objeto completo da música.
    const handlePlaySong = () => {
        if (song) {
            // Garante que o objeto passado contém a capa e o ID, que são essenciais para a UI.
            const songPayload = {
                id: song._id,
                title: song.title,
                artist: song.artists && song.artists.length > 0 
                    ? song.artists.map(a => a.name || a.username).join(', ') 
                    : (song.artist || 'Desconhecido'),
                cover: song.cover || (song.album && song.album.cover),
                // Adicione outros campos necessários aqui, como o caminho do áudio real se ele existisse:
                // audioUrl: song.audioUrl || `/api/musics/stream/${song._id}`,
            };
            dispatch(playSong(songPayload));
        }
    };

    if (songStatus === 'loading') {
        return <main><h1>Carregando...</h1></main>;
    }

    if (songStatus === 'failed' || !song) {
        return <main><h1>Música não encontrada</h1></main>;
    }

    // CORREÇÃO CRÍTICA: Prioriza 'name' (Artista da API) e tenta 'username' (Usuário) como fallback.
    const artistName = Array.isArray(song.artists) && song.artists.length > 0
        ? song.artists.map(a => a.name || a.username || 'Artista Desconhecido').join(', ')
        : (song.artist || 'Desconhecido');

    // Mantenha o ID do objeto que está populando o campo 'artists'.
    const mainArtistId = Array.isArray(song.artists) && song.artists.length > 0 
        ? (song.artists[0]._id || song.artists[0].id)
        : null;

    const label = song.album?.recordLabel || song.recordLabel || 'Gravadora não informada';

    return (
        <main>
            <AlbumHeader 
                cover={song.cover} 
                type={'Single'} 
                title={song.title} 
                artist={artistName}
                artistId={mainArtistId}
                year={song.releaseDate ? new Date(song.releaseDate).getFullYear() : ""}
                duration={"1 música, " + formatTime(song.duration)}
                onPlay={handlePlaySong} 
            /> 
            
            <div className="song-list-container"> 
                <SongList 
                    tracksArr={[song]} 
                    onTrackClick={handlePlaySong} // Chame handlePlaySong ao clicar na track list
                />
            </div>

            {song.lyrics && (
                <div className="song-lyrics-container">
                    <h2>Letra</h2>
                    <pre className="song-lyrics-text">{song.lyrics}</pre>
                </div>
            )}

            <ReleaseInfo
                releaseDate={song.releaseDate} 
                recordLabel={label} 
            />

            <Section title={`Mais de ${artistName}`} className="section-mais-do-artista">
                {artistAlbumsStatus === 'loading' && <p>Carregando álbuns...</p>}
                {artistAlbums.length > 0 ? (
                    artistAlbums.map((album) => {
                        let albArtist = 'Desconhecido';
                        if (album.artists && Array.isArray(album.artists)) {
                            // Usando 'name' primeiro para a listagem de álbuns
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