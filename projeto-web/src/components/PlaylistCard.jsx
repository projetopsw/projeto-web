import React from 'react';
import { FaPlay } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const DEFAULT_COVER = 'https://placehold.co/600x600?text=Playlist';
const DEFAULT_TITLE = 'Playlist Desconhecida';

const PlaylistCard = ({ id, cover, title, artist }) => {
    const finalCover = cover || DEFAULT_COVER;
    const finalTitle = title || DEFAULT_TITLE;

    return (
        <Link to={`/playlist/${id}`} className="card playlist-card">
            <img src={finalCover} alt={finalTitle} className="card-image" /> 
            <div className="card-info">
                <h4 className="card-title">{finalTitle}</h4> 
                <p className="card-artist">Feito por {artist}</p>
            </div>
            <button className="play-button">
                <FaPlay />
            </button>
        </Link>
    );
};

export default PlaylistCard;