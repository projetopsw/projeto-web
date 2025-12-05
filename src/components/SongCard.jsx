import React from 'react';
import { FaPlay } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';

const SongCard = ({ 
    id, 
    cover, 
    title, 
    artist, 
    artistId,
    isArtistUpload,
    isUserUpload
}) => {
    const navigate = useNavigate();
    
    let artistPath = '';
    if (artistId) {
        if (isArtistUpload) {
            artistPath = `/artista/${artistId}`;
        } else if (isUserUpload) {
            artistPath = `/usuario/${artistId}`;
        }
    }

    const handleCardClick = () => {
        navigate(`/song/${id}`);
    };

    return (
        <div className="card" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
            <img src={cover} alt={title} className="card-image" />
            <div className="card-info">
                <h4 className="card-title">{title}</h4>
                
                {artistPath ? (
                    <Link 
                        to={artistPath} 
                        className="card-artist" 
                        onClick={(e) => e.stopPropagation()}
                    >
                        {artist}
                    </Link>
                ) : (
                    <p className="card-artist">{artist}</p>
                )}
            </div>
            <button 
                className="play-button" 
                onClick={(e) => { 
                    e.stopPropagation(); 
                }}
            >
                <FaPlay />
            </button>
        </div>
    );
};

export default SongCard;