// src/components/ArtistCircle.jsx (NOVA VERSÃO REVISADA)

import React from 'react';
import { FaPlay } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const ArtistCircle = ({ id, image, name, onClick, isArtist = true, isUser = false }) => {
    const navigate = useNavigate();
    
    // Define o prefixo da rota
    // Se isUser for true (usado em Conexões), a rota é /perfil/:id
    // Caso contrário (padrão para Home/Outros), a rota é /artist/:id
    const pathPrefix = isUser ? '/perfil' : '/artist'; 
    
    // Define a função de clique.
    // Se o componente que o usa passou um onClick (como a página Conexoes), ele é usado.
    // Se não, ele usa a função padrão de navegar.
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
            
            {/* O ícone de play geralmente só aparece para artistas/playlists */}
            {isArtist && !isUser && <FaPlay className="play-icon" />}
        </div>
    );
};

export default ArtistCircle;