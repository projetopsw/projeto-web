import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { IconButton } from '@mui/material';
import AlbumIcon from '@mui/icons-material/Album';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import RepeatIcon from '@mui/icons-material/Repeat'; // NOVO ÍCONE DE REPETIÇÃO
import RepeatOneIcon from '@mui/icons-material/RepeatOne'; // ÍCONE REPETIR UMA MÚSICA

import {
    togglePlayPause,
    updateCurrentTime,
    setDuration,
    skipNext,
    skipPrevious,
    toggleShuffle,
    toggleRepeat, // IMPORTADO
} from '../redux/playerSlice';

const MUSIC_DETAIL_PATH_BASE = '/musica/';

const REPEAT_MODES = {
    OFF: 0,
    QUEUE: 1,
    SONG: 2,
};

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
        volume,
        isShuffling,
        repeatMode, // NOVO ESTADO
        queue, 
    } = useSelector((state) => state.player);
    
    const dispatch = useDispatch();
    
    const audioRef = useRef(new Audio());
    
    const [localVolume, setLocalVolume] = useState(volume);

    useEffect(() => {
        audioRef.current.volume = volume;
        setLocalVolume(volume);
    }, [volume]);

    useEffect(() => {
        if (currentSong && currentSong.caminho) {
            audioRef.current.src = currentSong.caminho;
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
        const audioEl = audioRef.current;

        // NOVO: Define loop=true quando o modo é Repeat Song.
        audioEl.loop = repeatMode === REPEAT_MODES.SONG;

        const setAudioData = () => dispatch(setDuration(audioEl.duration));
        const updateTime = () => dispatch(updateCurrentTime(audioEl.currentTime));
        
        // A função handleEnded no Redux Slice agora trata a repetição, a menos que seja Repeat Song (onde o .loop do HTML5 toma conta)
        const handleEnded = () => {
             if (repeatMode !== REPEAT_MODES.SONG) {
                 dispatch(skipNext());
             }
        };

        audioEl.addEventListener('loadedmetadata', setAudioData);
        audioEl.addEventListener('timeupdate', updateTime);
        audioEl.addEventListener('ended', handleEnded);

        return () => {
            audioEl.removeEventListener('loadedmetadata', setAudioData);
            audioEl.removeEventListener('timeupdate', updateTime);
            audioEl.removeEventListener('ended', handleEnded);
        };
    }, [dispatch, repeatMode]); // Dependência adicionada

    const handlePlayPause = (e) => {
        e.stopPropagation();
        dispatch(togglePlayPause());
    };
    
    const handleVolumeChange = (event) => {
        if (event) event.stopPropagation();
        const newVolume = parseFloat(event.target.value);
        setLocalVolume(newVolume);
        
        audioRef.current.volume = newVolume;
    };
    
    const handleSeek = (event) => {
        if (event) event.stopPropagation();
        if (!duration) return;
    
        const bar = event.currentTarget;
        const clickPosition = event.clientX - bar.getBoundingClientRect().left;
        const clickPercent = clickPosition / bar.offsetWidth;
        const newTime = clickPercent * duration;
        
        audioRef.current.currentTime = newTime;
        
        dispatch(updateCurrentTime(newTime));
    };
    
    const handleSkipNext = (e) => { 
        e.stopPropagation();
        dispatch(skipNext());
    };
    
    const handleSkipPrevious = (e) => { 
        e.stopPropagation();
        dispatch(skipPrevious());
    };

    const handleToggleShuffle = (e) => {
        e.stopPropagation();
        if (queue.length > 0) {
            dispatch(toggleShuffle());
        }
    };
    
    // NOVO HANDLER DE REPETIÇÃO
    const handleToggleRepeat = (e) => {
        e.stopPropagation();
        dispatch(toggleRepeat());
    };

    // Função auxiliar para renderizar o ícone de repetição correto
    const getRepeatIcon = () => {
        switch (repeatMode) {
            case REPEAT_MODES.QUEUE:
                return <RepeatIcon />;
            case REPEAT_MODES.SONG:
                return <RepeatOneIcon />;
            case REPEAT_MODES.OFF:
            default:
                return <RepeatIcon />;
        }
    };

    const progress = (currentTime / duration) * 100 || 0;
    const songName = currentSong ? `${currentSong.title} - ${currentSong.artist}` : " ";
    const detailRoute = currentSong ? `${MUSIC_DETAIL_PATH_BASE}${currentSong.id}` : MUSIC_DETAIL_PATH_BASE;
    const PlayPauseIcon = isPlaying ? "fas fa-pause" : "fas fa-play";
    const VolumeIcon = localVolume === 0 ? "fas fa-volume-mute" : localVolume < 0.5 ? "fas fa-volume-down" : "fas fa-volume-up";

    return (
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
                    
                    <IconButton
                        className="controle-btn"
                        onClick={handleToggleShuffle}
                        disabled={queue.length <= 1}
                        sx={{
                            color: isShuffling ? 'var(--orange)' : 'var(--secondary-text-color)',
                            '&:hover': { color: 'var(--text-color)' }
                        }}
                    >
                        <ShuffleIcon />
                    </IconButton>
                    
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
                    
                    {/* BOTÃO DE REPETIÇÃO FUNCIONAL */}
                    <IconButton 
                        className="controle-btn" 
                        onClick={handleToggleRepeat}
                        sx={{ 
                            color: repeatMode !== REPEAT_MODES.OFF ? 'var(--orange)' : 'var(--secondary-text-color)',
                            '&:hover': { color: 'var(--text-color)' },
                            // Adiciona um ponto se estiver no modo Repeat Song
                            ...(repeatMode === REPEAT_MODES.SONG && { 
                                '& .MuiSvgIcon-root': { position: 'relative' },
                                '& .MuiSvgIcon-root:after': {
                                    content: '""',
                                    position: 'absolute',
                                    bottom: '0px',
                                    right: '0px',
                                    width: '4px',
                                    height: '4px',
                                    borderRadius: '50%',
                                    backgroundColor: 'var(--orange)',
                                }
                            })
                        }}
                    >
                        {getRepeatIcon()}
                    </IconButton>

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