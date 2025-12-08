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
    
    const CARACTERES_MAXIMOS = 24; 

    const truncateText = (text, maxLength) => {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.slice(0, maxLength) + '...';
    };
    
    let artistPath = '';
    if (artistId) {
        if (isArtistUpload) {
            artistPath = `/artist/${artistId}`;
        } else if (isUserUpload) {
            artistPath = `/user/${artistId}`;
        }
    }

    const handleCardClick = () => {
        navigate(`/song/${id}`);
    };

    const displayArtist = truncateText(artist, CARACTERES_MAXIMOS);

    return (
        <div className="card" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
            <img src={cover} alt={title} className="card-image" />
            <div className="card-info">
                <h4 className="card-title" title={title}>
                    {truncateText(title, 20)}
                </h4>
                
                {artistPath ? (
                    <Link 
                        to={artistPath} 
                        className="card-artist" 
                        onClick={(e) => e.stopPropagation()}
                        title={artist} 
                    >
                        {displayArtist}
                    </Link>
                ) : (
                    <p 
                        className="card-artist" 
                        title={artist} 
                    >
                        {displayArtist}
                    </p>
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