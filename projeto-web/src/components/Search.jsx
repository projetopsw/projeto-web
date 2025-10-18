import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { InputBase, Box, styled, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';

const SearchContainer = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: '20px',
  backgroundColor: 'var(--input-bg)',
  width: '35%',
  minWidth: '200px',
  height: '35px',
  display: 'flex',
  alignItems: 'center',
  padding: '5px 15px',
  cursor: 'default',
  boxShadow: '0 2px 8px var(--shadow-color-dark)',
  transition: 'all 0.3s ease',

  '&:hover': {
    boxShadow: '0 4px 10px var(--shadow-color-light)',
    backgroundColor: 'var(--card-bg)',
  },

  '&:focus-within': {
    boxShadow: `0 0 0 2px var(--orange)`,
    transform: 'scale(1.01)',
  },
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
    padding: '10px 0',
    fontSize: '0.95rem',
  },
  '& ::placeholder': {
    color: 'var(--input-text-color)',
    opacity: 0.8,
  },
}));

function Search({ initialQuery = '' }) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState(initialQuery);

  useEffect(() => {
    setSearchTerm(initialQuery);
  }, [initialQuery]);

  const handleSearchNavigation = () => {
    const trimmedTerm = searchTerm.trim();

    if (!trimmedTerm) {
      console.log('Pesquisa vazia, navegação impedida.');
      return;
    }

    navigate(`/pesquisa?q=${encodeURIComponent(trimmedTerm)}`);
  };

  const handleClearSearch = () => {
    setSearchTerm('');

    if (initialQuery) {
      navigate(`/pesquisa`);
    }
  };

  const handleInputChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSearchNavigation();
    }
    event.stopPropagation();
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <SearchContainer>
        <SearchIconWrapper>
          <IconButton onClick={handleSearchNavigation} size="small" sx={{ p: 0 }}>
            <SearchIcon sx={{ color: 'var(--input-text-color)' }} />
          </IconButton>
        </SearchIconWrapper>
        <StyledInputBase
          placeholder="Search…"
          inputProps={{ 'aria-label': 'search' }}
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
    </Box>
  );
}

export default Search;
