import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Box, styled, IconButton } from '@mui/material'; 
import Search from './Search'; 
import UserProfileIcon from './UserProfileIcon';

const ThemeSwitchContainer = styled(Box)(({ theme }) => ({
    width: '60px',
    height: '30px',
    backgroundColor: 'var(--card-bg)',
    borderRadius: '20px',
    border: '2px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    zIndex: 10,
    
    '& i': { fontSize: '16px', transition: 'all 0.3s ease', zIndex: 0 },
    
    '& .theme-toggle-btn': {
        position: 'absolute',
        top: '50%',
        left: '4px',
        transform: 'translateY(-50%)',
        width: '20px',
        height: '20px',
        backgroundColor: 'var(--orange)',
        borderRadius: '50%',
        transition: 'all 0.3s ease',
        zIndex: 1,
    },

    '&.light-theme .theme-toggle-btn': { left: '36px' }
}));

function NavBar({ initialQuery = '' }) {
    const [isLightTheme, setIsLightTheme] = useState(false);
    
    useEffect(() => {
        const body = document.body;
        if (isLightTheme) {
            body.classList.add('light-theme');
        } else {
            body.classList.remove('light-theme');
        }
    }, [isLightTheme]);

    const handleThemeToggle = () => setIsLightTheme(prev => !prev);
    const themeClass = isLightTheme ? 'light-theme' : '';

    return (
        <AppBar position="fixed" sx={{
            backgroundColor: 'var(--header-bg)',
            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
            height: '50px',
            justifyContent: 'center',
        }}>
            <Toolbar disableGutters sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                padding: '0 1rem', 
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    <a href="/">
                        <img
                            src="/assets/img/vaca-logo.png"
                            alt="Logo Moosica"
                            style={{ width: '35px', display: 'block' }} 
                        />
                    </a>
                </Box>

                <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', mx: 2 }}>
                    <Search initialQuery={initialQuery} />
                </Box>

                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    flexShrink: 0,
                }}>
                    <UserProfileIcon />

                    <ThemeSwitchContainer
                        className={themeClass}
                        id="theme-toggle"
                        onClick={handleThemeToggle}
                        sx={{ position: 'relative' }}
                    >
                        <i className="fas fa-sun" style={{ color: isLightTheme ? 'var(--secondary-text-color)' : 'var(--orange)' }}></i>
                        <i className="fas fa-moon" style={{ color: isLightTheme ? 'var(--orange)' : 'var(--secondary-text-color)' }}></i>
                        <span className="theme-toggle-btn"></span>
                    </ThemeSwitchContainer>
                </Box>
            </Toolbar>
        </AppBar>
    );
}

export default NavBar;