import React from 'react';
import { FaPlay } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const AlbumCard = ({ id, cover, title, artist }) => {
  return (
    <Link to={`/album/${id}`} className="card">
      <img src={cover} alt={title} className="card-image" />
      <div className="card-info">
        <h4 className="card-title">{title}</h4>
        <p className="card-artist">{artist}</p>
      </div>
      <button className="play-button">
        <FaPlay />
      </button>
    </Link>
  );
};

export default AlbumCard;