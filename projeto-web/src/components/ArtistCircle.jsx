import React from 'react';
import { useNavigate } from 'react-router-dom';

const ArtistCircle = ({ id, image, name, onClick, isArtist = true, isUser = false }) => {
    const navigate = useNavigate();
    
    const pathPrefix = isUser ? '/perfil' : '/artist'; 
    
    const handleClick = onClick || (() => navigate(`${pathPrefix}/${id}`));

    return (
        <div 
            onClick={handleClick} 
            className="artist-circle" 
            style={{ cursor: 'pointer' }}
        >
            <img 
                src={image || 'https://placehold.co/400x400?text=Image'} 
                alt={name} 
                className="artist-image" 
            />
            <h3 className="artist-name">{name}</h3>
        </div>
    );
};

export default ArtistCircle;