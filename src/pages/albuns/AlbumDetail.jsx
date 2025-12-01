import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { playSong } from '../../redux/playerSlice.js'; 
import AlbumHeader from '../../components/AlbumHeader.jsx';
import SongList from "../../components/SongList.jsx";
import ReleaseInfo from "../../components/ReleaseInfo.jsx";
import '../musicas/css/SongAlbumDetail.css';
import api from "../../services/api.js";

const calculateTotalDuration = (songs = []) => {
    if (!songs || songs.length === 0) return "0 min";
    
    const totalSeconds = songs.reduce((acc, curr) => acc + (curr.duration || 0), 0);
    
    const totalMinutes = Math.floor(totalSeconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${songs.length} músicas, ${hours}h${minutes}min`;
};

export default function AlbumDetail({ albumID }) {
  const { id: routeId } = useParams();
  const effectiveId = albumID || routeId;
  const dispatch = useDispatch();
  
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get(`/albums/${effectiveId}`)
      .then((res) => {
        setAlbum(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erro ao buscar álbum:", err);
        setError("Não foi possível carregar o álbum.");
        setLoading(false);
      });
  }, [effectiveId]);

  const handlePlayTrack = (track) => {
    dispatch(playSong(track));
  };

  const handlePlayAlbum = () => {
    if (album && album.songs && album.songs.length > 0) {
      dispatch(playSong(album.songs[0]));
    }
  };

  if (loading) {
    return <main><h1 style={{color:'white', textAlign:'center', marginTop:'50px'}}>Carregando músicas...</h1></main>;
  }

  if (error || !album) {
    return (
      <main>
        <h1 style={{color:'white', textAlign:'center', marginTop:'50px'}}>Álbum não encontrado</h1>
      </main>
    );
  }

  const artistNames = Array.isArray(album.artists) 
      ? album.artists.map(a => a.name).join(', ') 
      : (album.artist || 'Desconhecido');

  const mainArtistId = album.artists?.[0]?._id || album.artists?.[0]?.id;

  const releaseYear = album.releaseDate ? new Date(album.releaseDate).getFullYear() : "";

  return (
      <main>
          <AlbumHeader 
            cover={album.cover} 
            type={'Álbum'} 
            title={album.title} 
            artist={artistNames}  
            artistId={mainArtistId}
            year={releaseYear}  
            duration={calculateTotalDuration(album.songs)} 
            onPlay={handlePlayAlbum}
          /> 
          
          <div className="song-list-container">
            <SongList 
                tracksArr={album.songs || []} 
                onTrackClick={handlePlayTrack}
            />
          </div>

          {album.recordLabel && (
             <ReleaseInfo
                  releaseDate={album.releaseDate} 
                  recordLabel={album.recordLabel} 
                />
          )}

          
          
          <div className="margin-bottom"></div>
      </main>
  )
}