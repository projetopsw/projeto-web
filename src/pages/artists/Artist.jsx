import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchArtistById } from '../../redux/catalogoSlice';
import ArtistHeader from '../../components/ArtistHeader.jsx';
import SongList from '../../components/SongList.jsx';
import Section from '../../components/Section.jsx';
import AlbumCard from '../../components/AlbumCard.jsx';
import './artist.css';
import api from '../../services/api.js'; 

export default function Artist({ artistID }) {
  const { id: routeId } = useParams();
  const effectiveId = artistID || routeId;
  const dispatch = useDispatch();

  const { details: artist, status: artistStatus } = useSelector((state) => state.catalog.selectedArtist);
  
  const [artistAlbums, setArtistAlbums] = useState([]);
  const [loadingAlbums, setLoadingAlbums] = useState(true);

  const [topTracks, setTopTracks] = useState([]);
  const [loadingTracks, setLoadingTracks] = useState(true);


  useEffect(() => {
    if (effectiveId) {
      // 1. Redux (Dados do Artista)
      dispatch(fetchArtistById(effectiveId));

      // 2. Discografia
      setLoadingAlbums(true);
      api.get(`/artists/${effectiveId}/albums`)
         .then(res => setArtistAlbums(res.data))
         .catch(err => console.error("Erro álbuns", err))
         .finally(() => setLoadingAlbums(false));

      // 3. Sucessos
      setLoadingTracks(true);
      api.get(`/artists/${effectiveId}/top-tracks`)
          .then(res => setTopTracks(res.data))
          .catch(err => console.error("Erro top tracks", err))
          .finally(() => setLoadingTracks(false));
    }
  }, [effectiveId, dispatch]);

  if (artistStatus === 'loading') {
    return <main><h1 style={{color: 'white', marginTop: '100px', textAlign:'center'}}>Carregando Vaqueiro...</h1></main>;
  }

  if (artistStatus === 'failed' || !artist) {
    return <main><h1 style={{color: 'white', marginTop: '100px', textAlign:'center'}}>Artista não encontrado</h1></main>;
  }

  return (
    <main className='main-artist-page'>
      <ArtistHeader artist={artist} />
      
      <div className="artist-song">
        {/* Sucessos do Vaqueiro */}
        {loadingTracks ? (
            <p style={{color:'white', padding:'20px'}}>Carregando sucessos...</p>
        ) : (
            <SongList 
                tituloDaSecao={"Sucessos do Vaqueiro"} 
                tracksArr={topTracks}  
            />
        )}

        {/* Discografia */}
        <Section key={"Discografia"} title={"Discografia"}>
          {loadingAlbums ? <p style={{color:'white'}}>Carregando discografia...</p> : 
            artistAlbums.map((album) => {
                let artistName = "Desconhecido";
                if(album.artists && album.artists.length > 0) {
                    artistName = album.artists.map(a => a.name).join(', ');
                }
                return (
                  <AlbumCard
                    key={album._id || album.id}
                    id={album._id || album.id}
                    cover={album.cover}
                    title={album.title}
                    artist={artistName}
                  />
                );
            })
          }
        </Section>

      </div>
      <div className="margin-bottom"></div>
    </main>
  );
}