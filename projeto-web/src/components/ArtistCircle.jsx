import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlay } from 'react-icons/fa';

const ArtistCircle = ({ id, image, name, onClick, isArtist = true, isUser = false }) => {
    const navigate = useNavigate();
    
    const pathPrefix = isUser ? '/perfil' : '/artist'; 
    
    const handleClick = onClick || (() => navigate(`${pathPrefix}/${id}`));

    if (!name || (!image && !isUser)) {
        console.warn(`ArtistCircle rendering with missing data: ID=${id}, Name=${name}, Image=${image}`);
    }

    const finalImage = image || 'https://placehold.co/400x400?text=Image';

    return (
        <div 
            onClick={handleClick} 
            className="artist-circle" 
            style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }} 
        >
            <img 
                src={finalImage} 
                alt={name || 'Usuário/Artista'} 
                className={`artist-image ${isUser ? 'user-image-style' : 'artist-image-style'}`}
            />
            <h3 className="artist-name" style={{ color: 'var(--text-primary)', textAlign: 'center', marginTop: '8px' }}>
                {name || 'Nome Desconhecido'}
            </h3>
            
            {/* {isArtist && !isUser && <FaPlay className="play-icon" />} */}
            <button className="play-button">
                    <FaPlay />
            </button>
        </div>
    );
};

export default ArtistCircle;