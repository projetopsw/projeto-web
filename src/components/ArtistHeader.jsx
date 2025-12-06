import React, { useState } from 'react';
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toggleFollowArtistAsync } from "../redux/loginSlice";

const monthlyListeners = (10.5).toFixed(1); 

export default function ArtistHeader({ artist = {} }) {
    const artistId = artist.id || artist._id; 
    const { name, image } = artist; 

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const {user} = useSelector(state => state.user);

    const isFollowing = user?.following?.includes(artistId); 

    const handleFollowClick = () => {
        if (!user) return navigate("/login");

       if (!artistId) {
            console.error("Erro: ID do artista não encontrado.", artist);
            return;
        }

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
                </div>
            </div>
        </header>
    );
}