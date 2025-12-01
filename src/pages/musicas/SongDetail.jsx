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

// Função auxiliar para formatar tempo (segundos -> mm:ss)
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
    // CORREÇÃO: Pegar o ID do primeiro artista do array para buscar álbuns relacionados
    if (song && song.artists && song.artists.length > 0) {
      const mainArtistId = song.artists[0]._id || song.artists[0].id;
      dispatch(fetchAlbumsByArtist(mainArtistId));
    } else if (song && song.artist && typeof song.artist === 'string') {
        // Fallback para legado
        dispatch(fetchAlbumsByArtist(song.artist));
    }
  }, [song, dispatch]); 

  const handlePlaySong = () => {
    if (song) {
      dispatch(playSong(song));
    }
  };

  if (songStatus === 'loading') {
    return <main><h1>Carregando...</h1></main>;
  }

  if (songStatus === 'failed' || !song) {
    return <main><h1>Música não encontrada</h1></main>;
  }

  // Lógica para obter nome do artista (Array -> String)
  const artistName = Array.isArray(song.artists) && song.artists.length > 0
    ? song.artists.map(a => a.name).join(', ')
    : (song.artist || 'Desconhecido');

  // Lógica para pegar o ID do artista principal (para links)
  const mainArtistId = song.artists?.[0]?._id || song.artists?.[0]?.id;

  // Lógica para gravadora
  const label = song.album?.recordLabel || 'Gravadora não informada';

  return (
    <main>
      <AlbumHeader 
        cover={song.cover} 
        type={'Single'} 
        title={song.title} 
        artist={artistName} // Passamos a string formatada
        artistId={mainArtistId} // Passamos o ID correto
        year={song.releaseDate ? new Date(song.releaseDate).getFullYear() : ""}
        duration={"1 música, " + formatTime(song.duration)} // Formatando tempo
        onPlay={handlePlaySong} 
      /> 
   
      <div className="song-list-container"> 
        <SongList 
          tracksArr={[song]} 
          onTrackClick={(clickedSong) => dispatch(playSong(clickedSong))}
        />
      </div>

      <ReleaseInfo
        releaseDate={song.releaseDate} 
        recordLabel={label} 
      />

      <Section title={`Mais de ${artistName}`} className="section-mais-do-artista">
        {artistAlbumsStatus === 'loading' && <p>Carregando álbuns...</p>}
        {artistAlbums.map((album) => {
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
        })}
      </Section>
      
      <div className="margin-bottom"></div>
    </main>
  );
}