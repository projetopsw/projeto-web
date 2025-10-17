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
    if (song) {
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
    
  return (
    <main>
      <AlbumHeader 
        cover={song.cover} 
        type={'Single'} 
        title={song.title} 
        artist={song.artist} 
        artistId={song.artistId}
        year={new Date(song.releaseDate).getFullYear() || "2025"}
        duration={"1 música, " + song.duration}
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
      recordLabel={song.recordLabel} 
      />

      <Section title={`Mais de ${song.artist}`}>
        {artistAlbumsStatus === 'loading' && <p>Carregando álbuns...</p>}
        {artistAlbums.map((album) => (
          <AlbumCard
            key={album.id}
            id={album.id}
            cover={album.cover}
            title={album.title}
            artist={album.artist}
          />
        ))}
      </Section>
      
      <div className="margin-bottom"></div>
    </main>
  );
}