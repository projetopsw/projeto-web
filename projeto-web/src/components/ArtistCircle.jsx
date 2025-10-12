import React from 'react';
import { FaPlay } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

// isArtist é o padrão (para playlists/artistas), isUser é específico para Perfil/Conexoes
const ArtistCircle = ({ id, image, name, onClick, isArtist = true, isUser = false }) => {
    const navigate = useNavigate();
    
    // Define o prefixo da rota
    const pathPrefix = isUser ? '/perfil' : '/artist'; 
    
    const handleClick = onClick || (() => navigate(`${pathPrefix}/${id}`));

    // Se o nome ou a imagem estiver faltando, retorne um placeholder (apenas para debug)
    if (!name || (!image && !isUser)) {
        console.warn(`ArtistCircle rendering with missing data: ID=${id}, Name=${name}, Image=${image}`);
    }

    // A imagem padrão agora usa a prop 'name' no alt e a URL fallback
    const finalImage = image || 'https://placehold.co/400x400?text=Image';

    return (
        <div 
            onClick={handleClick} 
            // Certifique-se de que a classe CSS 'artist-circle' define largura, altura e display flex
            className="artist-circle" 
            style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }} 
        >
            <img 
                src={finalImage} 
                alt={name || 'Usuário/Artista'} 
                // Certifique-se de que a classe CSS 'artist-image' define 'width: 100px; height: 100px; border-radius: 50%;'
                className={`artist-image ${isUser ? 'user-image-style' : 'artist-image-style'}`}
            />
            {/* Certifique-se de que a classe CSS 'artist-name' tem a cor branca ou --text-primary */}
            <h3 className="artist-name" style={{ color: 'var(--text-primary)', textAlign: 'center', marginTop: '8px' }}>
                {name || 'Nome Desconhecido'}
            </h3>
            
            {/* O ícone de play SÓ é exibido se for um artista E NÃO for um usuário. */}
            {isArtist && !isUser && <FaPlay className="play-icon" />}
        </div>
    );
};

export default ArtistCircle;