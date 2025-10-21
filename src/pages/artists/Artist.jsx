import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchArtistById, fetchAlbums, fetchArtists } from '../../redux/catalogoSlice';

import ArtistHeader from '../../components/ArtistHeader.jsx';
import SongList from '../../components/SongList.jsx';
import Section from '../../components/Section.jsx';
import AlbumCard from '../../components/AlbumCard.jsx';
import ArtistCircle from '../../components/ArtistCircle.jsx';
import './artist.css';

export default function Artist({ artistID }) {
  const { id: routeId } = useParams();
  const effectiveId = artistID || routeId;

  const dispatch = useDispatch();

  const { details: artist, status: artistStatus } = useSelector((state) => state.catalog.selectedArtist);
  const { items: allAlbums, status: albumsStatus } = useSelector((state) => state.catalog.albums);
  const { items: allArtists, status: artistsStatus } = useSelector((state) => state.catalog.artists);

  useEffect(() => {
    if (effectiveId) {
      dispatch(fetchArtistById(effectiveId));
    }

    if (albumsStatus === 'idle') {
      dispatch(fetchAlbums());
    }
    if (artistsStatus === 'idle') {
      dispatch(fetchArtists());
    }
  }, [effectiveId, albumsStatus, artistsStatus, dispatch]);

  if (artistStatus === 'loading') {
    return <main><h1>Carregando Vaqueiro...</h1></main>;
  }

  if (artistStatus === 'failed' || !artist) {
    return <main><h1>Artista não encontrado</h1></main>;
  }

  return (
    <main className='main-artist-page'>
      <ArtistHeader artist={artist} />
      <div className="artist-song">
        <SongList tituloDaSecao={"Sucessos do Vaqueiro"} />

        <Section key={"Discografia"} title={"Discografia"}>
          {allAlbums
            .filter((album) => album.artist.includes(artist.name))
            .map((album) => (
              <AlbumCard
                key={album.id}
                id={album.id}
                cover={album.cover}
                title={album.title}
                artist={album.artist}
              />
            ))}
        </Section>

        <Section key={"Artistas Parecidos"} title={"Artistas Parecidos"}>
          {allArtists
            .filter((a) => String(a.id) !== String(artist.id))
            .map((a) => (
              <ArtistCircle
                key={a.id}
                id={a.id}
                image={a.image}
                name={a.name}
              />
            ))}
        </Section>
      </div>

      <div className="margin-bottom"></div>
    </main>
  );
}