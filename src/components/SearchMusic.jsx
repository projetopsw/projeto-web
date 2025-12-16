import React, { useState, useEffect } from 'react';
import { 
    InputBase, 
    Box, 
    styled, 
    IconButton, 
    List, 
    ListItem, 
    ListItemText, 
    Typography, 
    CircularProgress,
    Avatar,
    ListItemAvatar
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import api from '../services/api.js'; 
import useDebounce from '../../backend/hooks/useDebounce'; 


const SearchContainer = styled('div')(({ theme }) => ({
    position: 'relative',
    borderRadius: '20px',
    backgroundColor: 'var(--input-bg)',
    width: '100%', 
    height: '40px', 
    display: 'flex',
    alignItems: 'center',
    padding: '5px 15px',
    cursor: 'default',
    boxShadow: '0 2px 8px var(--shadow-color-dark)',
    transition: 'all 0.3s ease',
}));

const SearchResultsBox = styled(Box)(({ theme }) => ({
    position: 'absolute',
    top: '100%', 
    left: 0,
    width: '100%',
    maxHeight: '300px',
    overflowY: 'auto',
    backgroundColor: 'var(--card-bg)',
    border: '1px solid var(--border-color)',
    borderRadius: '0 0 8px 8px', 
    zIndex: 100, 
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
    color: 'var(--input-text-color)',
    padding: '0 10px 0 6px',
    display: 'flex',
    alignItems: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
    color: 'var(--input-text-color)',
    width: '100%',
    '& .MuiInputBase-input': {
        padding: '5px 0', 
        fontSize: '1rem',
    },
    '& ::placeholder': {
        color: 'var(--input-text-color)',
        opacity: 0.7,
    },
}));

const SearchMusicBackend = ({ onSongSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    useEffect(() => {
        if (!debouncedSearchTerm.trim()) {
            setSearchResults([]);
            return;
        }

        const fetchResults = async () => {
            setIsLoading(true);
            setError(null);
            
            try {
                const response = await api.get(`/api/search`, { 
                    params: { 
                        query: debouncedSearchTerm,
                        category: 'musica'
                    }
                });
                
                const musicResults = response.data.results.musicas;
                
                const allTracks = [
                    ...(musicResults?.priority || []),
                    ...(musicResults?.related || [])
                ];

                const adaptedTracks = allTracks.map(track => {
                    const artistNames = Array.isArray(track.artists)
                        ? track.artists.map(a => a.name).join(', ')
                        : 'Desconhecido';

                    return {
                        ...track,
                        id: track._id,
                        artist: artistNames,
                        cover: track.cover || '/assets/img/default_song_cover.png'
                    };
                });
                
                setSearchResults(adaptedTracks);

            } catch (err) {
                console.error("Erro na busca de autocompletar:", err);
                setError("Falha na busca de músicas.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchResults();
    }, [debouncedSearchTerm]);


    const handleClearSearch = () => setSearchTerm('');
    const handleInputChange = (event) => setSearchTerm(event.target.value);
    
    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
        }
        event.stopPropagation();
    };

    const handleAddSong = (song) => {
        onSongSelect(song); 
        setSearchTerm(''); 
    }

    return (
        <Box sx={{ width: '100%', position: 'relative' }}>
            <SearchContainer>
                <SearchIconWrapper>
                    <SearchIcon sx={{ color: 'var(--input-text-color)' }} />
                </SearchIconWrapper>
                <StyledInputBase
                    placeholder="Buscar música para adicionar à fila..."
                    inputProps={{ 'aria-label': 'search music' }}
                    value={searchTerm}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                />
                {searchTerm && (
                    <IconButton
                        onClick={handleClearSearch}
                        sx={{ padding: '0 5px', color: 'var(--secondary-text-color)' }}
                        aria-label="limpar busca"
                        size="small"
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                )}
            </SearchContainer>

            {searchTerm.trim() && !error && (
                <SearchResultsBox>
                    {isLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                            <CircularProgress size={20} sx={{ color: 'var(--orange)' }} />
                        </Box>
                    ) : searchResults.length > 0 ? (
                        <List dense disablePadding>
                            {searchResults.map((song) => (
                                <ListItem
                                    key={song.id}
                                    onClick={() => handleAddSong(song)} 
                                    sx={{ 
                                        '&:hover': { 
                                            backgroundColor: 'var(--hover-bg)', 
                                            cursor: 'pointer' 
                                        },
                                        display: 'flex',
                                        alignItems: 'center',
                                        borderBottom: '1px solid var(--border-color-light)'
                                    }}
                                >
                                    <ListItemAvatar sx={{ minWidth: 'auto', mr: 1.5 }}>
                                        <Avatar 
                                            src={song.cover} 
                                            alt={song.title} 
                                            variant="square"
                                            sx={{ width: 40, height: 40, borderRadius: '4px' }}
                                        />
                                    </ListItemAvatar>
                                    
                                    <ListItemText
                                        primary={<Typography variant="body1" sx={{ color: 'var(--text-color)' }}>{song.title}</Typography>}
                                        secondary={<Typography variant="body2" sx={{ color: 'var(--secondary-text-color)' }}>{song.artist}</Typography>}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <Typography sx={{ p: 2, color: 'var(--secondary-text-color)' }}>
                            Nenhuma música encontrada para "{searchTerm}".
                        </Typography>
                    )}
                </SearchResultsBox>
            )}
            {error && <Typography sx={{ p: 2, color: 'red' }}>Erro: {error}</Typography>}
        </Box>
    );
};

export default SearchMusicBackend;