import React from 'react';
import AlbumCard from './AlbumCard'; 

const artistPlaylistsData = [
    { id: 1, title: 'Último Lançamento', coverUrl: 'https://placehold.co/200?text=Album+1.png' },
    { id: 2, title: 'Ao Vivo no Festival', coverUrl: 'https://placehold.co/200?text=Album+2.png' },
    { id: 3, title: 'Singles Clássicos', coverUrl: 'https://placehold.co/200?text=Album+3.png' },
    { id: 4, title: 'Primeiros Sucessos', coverUrl: 'https://placehold.co/200?text=Album+4.png' },
];

export default function ArtistPlaylist() {
    return (
        <div className="suas-playlists">
            <h3>Álbuns</h3>
            <div className="playlists-container flex">
                {artistPlaylistsData.map((album) => (
                    <AlbumCard 
                        key={album.id}
                        coverUrl={album.coverUrl}
                        title={album.title}
                    />
                ))}
            </div>
        </div>
    );
}