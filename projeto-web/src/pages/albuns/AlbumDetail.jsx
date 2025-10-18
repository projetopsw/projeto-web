import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import AlbumHeader from '../../components/AlbumHeader.jsx';
import SongList from "../../components/SongList.jsx";
import '../musicas/css/SongAlbumDetail.css'
import api from "../../services/api.js";


export default function AlbumDetail( {albumID} ) {
  const { id: routeId } = useParams();
  
  const effectiveId = albumID || routeId;
  
  const [album, setAlbum] = useState(null);

    useEffect(() => {
      api.get(`/topAlbums/${effectiveId}`)
        .then((res) => setAlbum(res.data))
        .catch((err) => console.error("Erro ao buscar álbum:", err));
    }, []);

    if (!album) {
    return (
      <main>
        <h1>Música não encontrada</h1>
      </main>
    );
  }
    
    return (
        <main>
            <AlbumHeader cover={album.cover} type={'Album'} title={album.title} artist={album.artist}  year={"2025"}  duration={"12 músicas, 53min 30s"} artistId={album.artistId} /> 
            <SongList />
        </main>
    )
}