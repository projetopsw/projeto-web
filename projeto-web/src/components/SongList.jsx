import React from 'react'
import Song from './Song'

const tracksData = [
    { id: 1, rank: 1, coverUrl: 'https://placehold.co/250?text=song+cover.png', title: 'Título da Música 1', artist: 'Artista Famoso', album: 'Álbum X', duration: '3:49' },
    { id: 2, rank: 2, coverUrl: 'https://placehold.co/250?text=song+cover.png', title: 'Título da Música 2', artist: 'Artista Famoso', album: 'Álbum Y', duration: '4:12' },
    { id: 3, rank: 3, coverUrl: 'https://placehold.co/250?text=song+cover.png', title: 'Título da Música 3', artist: 'Artista Famoso', album: 'Álbum Z', duration: '3:05' },
    { id: 4, rank: 4, coverUrl: 'https://placehold.co/250?text=song+cover.png', title: 'Título da Música 4', artist: 'Artista Famoso', album: 'Álbum A', duration: '2:55' },
    { id: 5, rank: 5, coverUrl: 'https://placehold.co/250?text=song+cover.png', title: 'Título da Música 5', artist: 'Artista Famoso', album: 'Álbum B', duration: '3:20' },
];

export default function SongList( {tituloDaSecao = '', tracksArr = tracksData} ) {

    return (
        <div className="mais-tocadas">
            <h3>{tituloDaSecao}</h3>
            
            {tracksArr.map((song) => (
                <div 
                    key={song.id || song.rank}
                    className="song-wrapper"
                >
                    <Song 
                        rank={song.rank}
                        song={song} 
                        coverUrl={song.coverUrl || song.cover}
                        title={song.title}
                        artist={song.artist}
                        album={song.album}
                        duration={song.duration}
                    />
                </div>
            ))}
        </div>
    );
}