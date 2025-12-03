import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { IconButton } from '@mui/material';
import AlbumIcon from '@mui/icons-material/Album';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import RepeatIcon from '@mui/icons-material/Repeat'; 
import RepeatOneIcon from '@mui/icons-material/RepeatOne'; 

import {
    togglePlayPause,
    updateCurrentTime,
    setDuration,
    skipNext,
    skipPrevious,
    toggleShuffle,
    toggleRepeat, 
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
        repeatMode, 
        queue, 
        selectedSongInfo, // <<< Adicionado para exibir o nome da música real
    } = useSelector((state) => state.player);
    
    const dispatch = useDispatch();
    
    // NOTA: O novo Audio() deve ser criado apenas uma vez
    const audioRef = useRef(new Audio());
    
    const [localVolume, setLocalVolume] = useState(volume);

    useEffect(() => {
        audioRef.current.volume = volume;
        setLocalVolume(volume);
    }, [volume]);

    // CORREÇÃO CRÍTICA AQUI: Usar 'audioUrl' do AMBIENT_SONG ou 'caminho' da música real
    useEffect(() => {
        if (currentSong && (currentSong.audioUrl || currentSong.caminho)) {
            const audioSource = currentSong.audioUrl || currentSong.caminho;
            audioRef.current.src = audioSource;
        }
    }, [currentSong]);
    
    useEffect(() => {
        if (isPlaying && currentSong) {
            // O load() é importante para garantir que o novo src seja processado antes do play()
            audioRef.current.load(); 
            audioRef.current.play().catch(e => {
                // Captura erro de autoplay bloqueado
                console.error("Erro ao tentar tocar áudio (autoplay bloqueado?):", e);
                // Você pode adicionar uma UI aqui pedindo ao usuário para interagir
            });
        } else {
            audioRef.current.pause();
        }
    }, [isPlaying, currentSong]);

    useEffect(() => {
        const audioEl = audioRef.current;

        audioEl.loop = repeatMode === REPEAT_MODES.SONG;

        const setAudioData = () => dispatch(setDuration(audioEl.duration));
        const updateTime = () => dispatch(updateCurrentTime(audioEl.currentTime));
        
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
    }, [dispatch, repeatMode]);

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
        if (queue.length > 1) { // Mudado para > 1, pois queue agora tem 1 item (ambient)
            dispatch(toggleShuffle());
        }
    };

    const handleToggleRepeat = (e) => {
        e.stopPropagation();
        dispatch(toggleRepeat());
    };

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
    
    // CORREÇÃO: Usa selectedSongInfo se existir, ou currentSong (que é a ambiente)
    const songDisplay = selectedSongInfo || currentSong; 
    const songName = songDisplay ? `${songDisplay.title} - ${songDisplay.artist}` : " ";
    const detailRoute = songDisplay ? `${MUSIC_DETAIL_PATH_BASE}${songDisplay.id}` : MUSIC_DETAIL_PATH_BASE;
    
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
                    
                    <IconButton 
                        className="controle-btn" 
                        onClick={handleToggleRepeat}
                        sx={{ 
                            color: repeatMode !== REPEAT_MODES.OFF ? 'var(--orange)' : 'var(--secondary-text-color)',
                            '&:hover': { color: 'var(--text-color)' },
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
                    disabled={!songDisplay}
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