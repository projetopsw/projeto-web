import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { playSong } from '../../redux/playerSlice.js'; 
import AlbumHeader from '../../components/AlbumHeader.jsx';
import SongList from "../../components/SongList.jsx";
import ReleaseInfo from "../../components/ReleaseInfo.jsx";
import Section from '../../components/Section.jsx';
import AlbumCard from '../../components/AlbumCard'; 
import '../musicas/css/SongAlbumDetail.css';
import api from "../../services/api.js";


const isGarbage = (text) => {
    if (!text) return false;
    const lower = text.toLowerCase();
    const blockedKeywords = [
        "karaoke", "tribute to", "ringtone", "instrumental version", 
        "originally performed by", "made famous by", "cover band", 
        "backing track", "silent track"
    ];
    return blockedKeywords.some(term => lower.includes(term));
};

const calculateTotalDuration = (songs = []) => {
    if (!songs || songs.length === 0) return "0 min";
    
    const totalSeconds = songs.reduce((acc, curr) => acc + (curr.duration || 0), 0);
    
    const totalMinutes = Math.floor(totalSeconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) return `${songs.length} músicas, ${hours}h ${minutes}min`;
    return `${songs.length} músicas, ${minutes} min`;
};

const getSafeArtistName = (obj) => {
    if (!obj) return 'Desconhecido';

    if (Array.isArray(obj.artists) && obj.artists.length > 0) {
        const names = obj.artists
            .filter(a => typeof a === 'object' && a.name)
            .map(a => a.name);
        
        if (names.length > 0) return names.join(', ');
    }

    if (obj.artist && typeof obj.artist === 'object' && obj.artist.name) {
        return obj.artist.name;
    }

    if (typeof obj.artist === 'string') {
        if (obj.artist.length > 20 && !obj.artist.includes(' ')) return 'Artista Desconhecido';
        return obj.artist;
    }

    return 'Desconhecido';
};

export default function AlbumDetail({ albumID }) {
  const { id: routeId } = useParams();
  const effectiveId = albumID || routeId;
  const dispatch = useDispatch();
  
  const [album, setAlbum] = useState(null);
  const [relatedAlbums, setRelatedAlbums] = useState([]); 
  const [artistImage, setArtistImage] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get(`/albums/${effectiveId}`)
      .then((res) => {
        setAlbum(res.data);
        if (res.data.artists && res.data.artists[0] && res.data.artists[0].image) {
            setArtistImage(res.data.artists[0].image);
        }
        setLoading(false);
      })
      .catch((err) => {  
        console.error("Erro ao buscar álbum:", err);
        setError("Não foi possível carregar o álbum.");
        setLoading(false);
      });
  }, [effectiveId]);

  useEffect(() => {
    if (album) {
        const mainArtist = (album.artists && album.artists[0]) || album.artist;
        const mainArtistId = (typeof mainArtist === 'object') ? (mainArtist._id || mainArtist.id) : null;
        
        if (mainArtistId) {
            if (!artistImage) {
                api.get(`/artists/${mainArtistId}`)
                    .then(res => {
                        if (res.data.image || res.data.cover) {
                            setArtistImage(res.data.image || res.data.cover);
                        }
                    })
                    .catch(err => console.error("Erro ao buscar imagem do artista:", err));
            }

            api.get(`/artists/${mainArtistId}/albums`)
                .then(res => {
                    const albumsList = res.data.items || res.data || [];
                    setRelatedAlbums(Array.isArray(albumsList) ? albumsList : []);
                })
                .catch(err => console.error("Erro ao buscar álbuns relacionados:", err));
        }
    }
  }, [album, artistImage]);

  const handlePlayTrack = (track) => {
    dispatch(playSong(track));
  };

  const handlePlayAlbum = () => {
    if (album && album.songs && album.songs.length > 0) {
      dispatch(playSong(album.songs[0]));
    }
  };

  if (loading) {
    return <main><h1 style={{color:'white', textAlign:'center', marginTop:'50px'}}>Carregando...</h1></main>;
  }

  if (error || !album) {
    return (
      <main>
        <h1 style={{color:'white', textAlign:'center', marginTop:'50px'}}>Álbum não encontrado</h1>
      </main>
    );
  }

  const artistNames = getSafeArtistName(album);

  const mainArtist = (album.artists && album.artists[0]) || album.artist;
  const mainArtistId = (typeof mainArtist === 'object') ? (mainArtist._id || mainArtist.id) : null;
  
  const releaseYear = album.releaseDate ? new Date(album.releaseDate).getFullYear() : "";

  const filteredAlbums = relatedAlbums.filter(relAlbum => {
      const relId = relAlbum._id || relAlbum.id;
      const currentId = album._id || album.id;
      
      if (relId === currentId) return false;
      if (!relAlbum.cover && !relAlbum.image) return false;
      if (isGarbage(relAlbum.title || relAlbum.name)) return false;

      return true;
  }).slice(0, 10);

  return (
      <main>
          <AlbumHeader 
            cover={album.cover} 
            type={'Álbum'} 
            title={album.title} 
            artist={artistNames}
            artistId={mainArtistId}
            artistImg={artistImage} 
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
          
          {filteredAlbums.length > 0 && (
            <Section title={`Mais de ${artistNames}`} className="section-mais-do-artista">
                <div className="section-scroll-container">
                    {filteredAlbums.map((relAlbum) => {
                        const albArtist = getSafeArtistName(relAlbum);

                        return (
                            <AlbumCard
                                key={relAlbum.id || relAlbum._id}
                                id={relAlbum.id || relAlbum._id}
                                cover={relAlbum.cover || relAlbum.image}
                                title={relAlbum.title || relAlbum.name}
                                artist={albArtist} 
                            />
                        );
                    })}
                </div>
            </Section>
          )}

          {filteredAlbums.length === 0 && (
             <div style={{ padding: '20px', opacity: 0.5, textAlign: 'center' }}>
                 <p>Nenhum outro álbum encontrado para este artista.</p>
             </div>
          )}
            
          <div className="margin-bottom-large"></div>
      </main>
  )
}