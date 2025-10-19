// src/components/SearchMusic.jsx

import React, { useState, useEffect, useMemo } from 'react';
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
    // 💡 NOVOS IMPORTS
    Avatar,
    ListItemAvatar
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add'; // Ícone para adicionar à fila
import api from '../services/api.js'; // Ajuste o caminho conforme necessário

// ----------------------------------------------------
// FUNÇÕES AUXILIARES (Mantidas)
// ----------------------------------------------------

const normalizeName = (str) => {
    if (!str) return '';
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
};

const filterDataByQuery = (data, query, field, mode = 'starts_with') => {
    if (!query || !data || data.length === 0) return [];
    
    const lowerQuery = normalizeName(query);

    return data.filter(item => {
        const fieldValue = item[field];
        if (!fieldValue) return false;

        const lowerFieldValue = normalizeName(String(fieldValue));
        
        if (mode === 'exact') return lowerFieldValue === lowerQuery;
        if (mode === 'includes') return lowerFieldValue.includes(lowerQuery);
        // Tenta buscar o nome do artista se o campo for o 'artist' (do db.json)
        if (field === 'artist' && mode === 'includes') return lowerFieldValue.includes(lowerQuery);
        
        return lowerFieldValue.startsWith(lowerQuery); // starts_with
    });
};

// ----------------------------------------------------
// ESTILOS MUI (Mantidos)
// ----------------------------------------------------

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
    borderRadius: '8px',
    zIndex: 100, 
    marginTop: '5px',
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

// ----------------------------------------------------
// COMPONENTE PRINCIPAL: SearchMusicLocal
// ----------------------------------------------------

function SearchMusicLocal({ onSongSelect }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [allSongs, setAllSongs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Carrega TODAS as músicas uma vez ao montar o componente (Mantido)
    useEffect(() => {
        const fetchAllSongs = async () => {
            setIsLoading(true);
            try {
                const response = await api.get('/topSongs'); 
                setAllSongs(response.data);
                setError(null);
            } catch (err) {
                console.error("Erro ao carregar todas as músicas:", err);
                setError("Falha ao carregar a lista de músicas.");
            } finally {
                 setIsLoading(false);
            }
        };
        fetchAllSongs();
    }, []);

    // Filtra as músicas em tempo real (Mantido)
    const searchResults = useMemo(() => {
        if (!searchTerm.trim()) return [];

        let mainSongs = filterDataByQuery(allSongs, searchTerm, 'title', 'starts_with');
        
        const relatedSongsByTitle = filterDataByQuery(allSongs, searchTerm, 'title', 'includes');
        const relatedSongsByArtist = filterDataByQuery(allSongs, searchTerm, 'artist', 'includes');

        const uniqueSongs = [...new Map(
            [...mainSongs, ...relatedSongsByTitle, ...relatedSongsByArtist].map(song => [song.id, song])
        ).values()];

        return uniqueSongs.slice(0, 10); 

    }, [searchTerm, allSongs]);


    const handleClearSearch = () => {
        setSearchTerm('');
    };

    const handleInputChange = (event) => {
        setSearchTerm(event.target.value);
    };
    
    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
        }
        event.stopPropagation();
    };

    const handleAddSong = (song) => {
        onSongSelect(song); 
        setSearchTerm(''); // Limpa a busca após adicionar
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

            {/* Lista de Resultados de Busca Condicional */}
            {searchTerm.trim() && !error && (
                <SearchResultsBox>
                    {isLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                            <CircularProgress size={20} sx={{ color: 'var(--orange)' }} />
                        </Box>
                    ) : searchResults.length > 0 ? (
                        <List dense>
                            {searchResults.map((song) => (
                                <ListItem
                                    key={song.id}
                                    secondaryAction={
                                        // AÇÃO PRINCIPAL: Ao clicar, chama a função do GrupoDetalhe
                                        <IconButton edge="end" aria-label="add to queue" onClick={() => handleAddSong(song)}>
                                            <AddIcon sx={{ color: 'var(--orange)' }} />
                                        </IconButton>
                                    }
                                    sx={{ 
                                        '&:hover': { 
                                            backgroundColor: 'var(--hover-bg)', 
                                            cursor: 'default' 
                                        },
                                        // 💡 Garantir que o texto fique alinhado ao lado da capa
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                >
                                    {/* 💡 Adicionado: Capa da Música nos Resultados da Busca */}
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
}

export default SearchMusicLocal;