// src/components/ArtistCircle.jsx (NOVA VERSÃO REVISADA)

import React from 'react';
import { FaPlay } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

// isArtist é o padrão (para playlists/artistas), isUser é específico para Perfil/Conexoes
const ArtistCircle = ({ id, image, name, onClick, isArtist = true, isUser = false }) => {
    const navigate = useNavigate();
    
    // Define o prefixo da rota
    // Se isUser for TRUE, a rota é /perfil/:id (para Peões)
    // Caso contrário, a rota é /artist/:id (para Artistas)
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
            
            {/* CORREÇÃO APLICADA: O ícone de play SÓ é exibido se NÃO for um usuário. */}
            {isArtist && !isUser && <FaPlay className="play-icon" />}
        </div>
    );
};

export default ArtistCircle;