import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { IconButton } from '@mui/material';
import AlbumIcon from '@mui/icons-material/Album';

import {
    togglePlayPause,
    updateCurrentTime,
    setDuration,
    skipNext,
    skipPrevious,
} from '../redux/playerSlice';

const MUSIC_DETAIL_PATH_BASE = '/musica/';

// A função formatTime continua a mesma
const formatTime = (time) => {
    if (isNaN(time) || time < 0) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

function Player() {
    const {
        currentSong,
        isPlaying,
        currentTime,
        duration,
        volume
    } = useSelector((state) => state.player);
    
    const dispatch = useDispatch();
    
    // CORREÇÃO 1: O `useRef` foi movido para DENTRO do componente.
    const audioRef = useRef(new Audio());
    
    const [localVolume, setLocalVolume] = useState(volume);

    useEffect(() => {
        // CORREÇÃO 2: Acessando o volume sempre com .current
        audioRef.current.volume = volume;
        setLocalVolume(volume);
    }, [volume]);

    // Lógica dos `useEffect`s simplificada para maior clareza
    useEffect(() => {
        if (currentSong && currentSong.caminho) {
            // Se a música for diferente, atualiza o src
            if (audioRef.current.src !== currentSong.caminho) {
                audioRef.current.src = currentSong.caminho;
            }
        }
    }, [currentSong]);
    
    useEffect(() => {
        if (isPlaying && currentSong) {
            audioRef.current.play().catch(e => console.error("Erro ao tentar tocar áudio:", e));
        } else {
            audioRef.current.pause();
        }
    }, [isPlaying, currentSong]);

    useEffect(() => {
        // CORREÇÃO 3: Corrigido o erro de digitação de `audioEl.current` para `audioRef.current`
        const audioEl = audioRef.current;

        const setAudioData = () => dispatch(setDuration(audioEl.duration));
        const updateTime = () => dispatch(updateCurrentTime(audioEl.currentTime));
        const handleEnded = () => dispatch(skipNext());

        audioEl.addEventListener('loadedmetadata', setAudioData);
        audioEl.addEventListener('timeupdate', updateTime);
        audioEl.addEventListener('ended', handleEnded);

        return () => {
            audioEl.removeEventListener('loadedmetadata', setAudioData);
            audioEl.removeEventListener('timeupdate', updateTime);
            audioEl.removeEventListener('ended', handleEnded);
        };
    }, [dispatch]);

    const handlePlayPause = (e) => {
        e.stopPropagation();
        dispatch(togglePlayPause());
    };
    
    const handleVolumeChange = (event) => {
        if (event) event.stopPropagation();
        const newVolume = parseFloat(event.target.value);
        setLocalVolume(newVolume);
        
        // CORREÇÃO 2: Usando .current
        audioRef.current.volume = newVolume;
    };
    
    const handleSeek = (event) => {
        if (event) event.stopPropagation();
        if (!duration) return;
    
        const bar = event.currentTarget;
        const clickPosition = event.clientX - bar.getBoundingClientRect().left;
        const clickPercent = clickPosition / bar.offsetWidth;
        const newTime = clickPercent * duration;
        
        // CORREÇÃO 2: Usando .current
        audioRef.current.currentTime = newTime;
        
        dispatch(updateCurrentTime(newTime));
    };
    
    // As funções handleSkipNext e handleSkipPrevious continuam iguais...
    const handleSkipNext = (e) => { /* ... */ };
    const handleSkipPrevious = (e) => { /* ... */ };

    // O JSX também continua o mesmo...
    const progress = (currentTime / duration) * 100 || 0;
    const songName = currentSong ? `${currentSong.title} - ${currentSong.artist}` : " ";
    const detailRoute = currentSong ? `${MUSIC_DETAIL_PATH_BASE}${currentSong.id}` : MUSIC_DETAIL_PATH_BASE;
    const PlayPauseIcon = isPlaying ? "fas fa-pause" : "fas fa-play";
    const VolumeIcon = localVolume === 0 ? "fas fa-volume-mute" : localVolume < 0.5 ? "fas fa-volume-down" : "fas fa-volume-up";

    return (
        // Todo o seu JSX aqui... (não precisa mudar nada no return)
        <div style={{ position: 'relative', width: '100%', padding: '10px 0', backgroundColor: 'transparent' }}>
            
            <div className="barra-progresso-container">
                <span className="current-time">{formatTime(currentTime)}</span>
                <div
                    className="barra-progresso"
                    onClick={handleSeek}
                >
                    <div
                        className="progresso"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <span className="duration-time">{formatTime(duration)}</span>
            </div>

            <div className="player">
                <div className="controle-musica">
                    <button className="controle-btn" onClick={handleSkipPrevious}>
                        <i className="fas fa-backward"></i>
                    </button>
                    
                    <button
                        className="play-pause-btn"
                        onClick={handlePlayPause}
                    >
                        <i className={PlayPauseIcon}></i>
                    </button>
                    
                    <button className="controle-btn" onClick={handleSkipNext}>
                        <i className="fas fa-forward"></i>
                    </button>
                </div>

                <p className="song-info">{songName}</p>
                
                <div className="volume-control">
                    <i className={VolumeIcon}></i>
                    <input
                        type="range"
                        min="0" max="1" step="0.01"
                        value={localVolume}
                        onChange={handleVolumeChange}
                        className="volume-slider"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            </div>

            <Link
                to={detailRoute}
                style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 10,
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <IconButton
                    aria-label="Abrir página da música"
                    disabled={!currentSong}
                    sx={{
                        color: 'var(--orange)',
                        '&:hover': { backgroundColor: 'rgba(255, 117, 51, 0.1)' }
                    }}
                >
                    <AlbumIcon sx={{ fontSize: '30px' }} />
                </IconButton>
            </Link>
        </div>
    );
}

export default Player;