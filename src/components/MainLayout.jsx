import React from 'react';
import { Outlet } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { skipNext } from '../redux/playerSlice';
import Header from './Header';
import Footer from './Footer';
import Player from './Player';
import { Box } from '@mui/material'; 

const MainLayout = () => {
    const dispatch = useDispatch();

    const handleSongEnd = () => {
        console.log("Música atual finalizada. Disparando skipNext.");
        dispatch(skipNext());
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            
            <Header />

            <main className="main-content-area" style={{ flexGrow: 1, paddingBottom: '80px' }}> 
                <Outlet />
            </main>

            <Box 
                sx={{ 
                    position: 'fixed', 
                    bottom: 0, 
                    left: 0, 
                    right: 0, 
                    zIndex: 1000, 
                    backgroundColor: 'var(--card-bg)',
                    borderTop: '1px solid var(--border-color)',
                    padding: '10px 0'
                }}
            >
                <Player onSongEnd={handleSongEnd} />
            </Box>

        </Box>
    );
};

export default MainLayout;