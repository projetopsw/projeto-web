import React from 'react';
import ArtistCircle from './ArtistCircle'; 

const similarArtistsData = [
    { id: 1, name: 'Artista 1', imageUrl: 'https://placehold.co/200?text=Artist+1.png' },
    { id: 2, name: 'Artista 2', imageUrl: 'https://placehold.co/200?text=Artist+2.png' },
    { id: 3, name: 'Artista 3', imageUrl: 'https://placehold.co/200?text=Artist+3.png' },
    { id: 4, name: 'Artista 4', imageUrl: 'https://placehold.co/200?text=Artist+4.png' },
];

export default function ArtistParecidos() {
    return (
        <div className="seus-artistas">
            <h3>Artistas parecidos</h3>
            <div className="artists-container flex">
                {similarArtistsData.map((artist) => (
                    <ArtistCircle 
                        key={artist.id}
                        imageUrl={artist.imageUrl}
                        name={artist.name}
                    />
                ))}
            </div>
        </div>
    );
}