import React, { useState } from 'react';

import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toggleFollowArtistAsync } from '../redux/loginSlice';

const LIMITE_CARACTERES = 280; 
const monthlyListeners = (Math.random() * 10 + 1).toFixed(1);

export default function ArtistHeader({ artist = {} }) {
    const { name, about, image, id: artistId } = artist;

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { user } = useSelector(state => state.auth);
    const isFollowing = user?.following?.includes(artistId);

    const [isExpanded, setIsExpanded] = useState(false);


    const isLongText = about && about.length > LIMITE_CARACTERES;

    const handleToggleExpand = (e) => {
        e.preventDefault(); 
        setIsExpanded(!isExpanded);
    };
 
    const handleFollowClick = () => {
        if (user && artistId) {
            dispatch(toggleFollowArtistAsync({
                userId: user.id,
                artistId: artistId,
                currentFollowing: user.following || [],
            }));
        } else {
            navigate('/login');
        }
    };

    const displayedText = isExpanded || !isLongText 
        ? about 
        : about.substring(0, LIMITE_CARACTERES) + '...';
    const textoBotao = isFollowing ? 'Seguindo' : 'Seguir';
    const classeCondicional = isFollowing ? 'following' : '';

    return (
        <>
            <div className="artist-header flex">
                <div className="artist-info flex">
                    <h1 className="name-artist">{name}</h1>
                    <p className="artist-description">
                        {displayedText} 
                        {isLongText && (
                            <a href="#" onClick={handleToggleExpand}>
                                <strong>
                                    {isExpanded ? ' Ver menos' : ' Ver mais'}
                                </strong>
                            </a>
                        )}
                    </p>
                    <span>{monthlyListeners} Milhões de ouvintes mensais</span>
                </div>
            </div>

            <div className="artist-actions flex">
                <button 
                    className={`follow-btn ${classeCondicional}`} 
                    onClick={handleFollowClick}
                >
                    {textoBotao}
                </button>
            </div>
        </>
    );
}