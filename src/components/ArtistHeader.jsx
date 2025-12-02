import React, { useState } from 'react';
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toggleFollowArtistAsync } from "../redux/loginSlice";

const LIMITE_CARACTERES = 280;
const monthlyListeners = (10.5).toFixed(1); 

export default function ArtistHeader({ artist = {} }) {
    const { name, about, image, id: artistId } = artist;

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { user } = useSelector(state => state.auth);
    const isFollowing = user?.following?.includes(artistId); 

    const [isExpanded, setIsExpanded] = useState(false);

    const isLongText = about && about.length > LIMITE_CARACTERES;

    const displayedText = isExpanded || !isLongText
        ? about
        : about?.substring(0, LIMITE_CARACTERES) + "...";

    const handleToggleExpand = (e) => {
        e.preventDefault();
        setIsExpanded(!isExpanded);
    };

    const handleFollowClick = () => {
        if (!user) return navigate("/login");

        dispatch(toggleFollowArtistAsync({
            userId: user.id || user._id,
            artistId,
            currentFollowing: user.following || [],
        }));
    };

    return (
        <header className="artist-header">
            <div className="artist-header-main-content flex"> 
                {image && (
                    <div className="artist-header-photo">
                        <img src={image} alt={name} className="artist-image"/> 
                    </div>
                )}

                <div className="artist-info flex"> 
                    <p className="artist-header-tag">ARTISTA</p>
                    <h1 className="name-artist">{name}</h1> 

                    <div className="artist-details flex">
                        <div className="artist-logo-container">
                        </div>
                        
                        <p className="artist-header-listeners lighter-text">
                            {monthlyListeners} milhões de ouvintes mensais
                        </p>
                        
                        <button
                            className={`artist-follow-btn ${isFollowing ? "following" : ""}`}
                            onClick={handleFollowClick}
                        >
                            {isFollowing ? "Seguindo" : "Seguir"}
                        </button>
                    </div>

                    {about && (
                        <div className="artist-header-description">
                            <p className='lighter-text'>
                                {displayedText}
                                {isLongText && (
                                    <a href="#" onClick={handleToggleExpand}>
                                        {isExpanded ? " Ver menos" : " Ver mais"}
                                    </a>
                                )}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}