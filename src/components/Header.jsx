import React from 'react';
import { Box, IconButton } from '@mui/material';
import NavBar from './NavBar';
import '../pages/playlists/Playlists.css';
import '../index.css';

import SideBar from './SideBar'; 

function Header() {
  return (
    <header>
      <NavBar />
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100%',
          width: '80px',
          zIndex: 999,
          display: { xs: 'none', md: 'flex' } 
        }}
      >
        <SideBar isMobile={false} />
      </Box>
    </header>
  );
}

export default Header;