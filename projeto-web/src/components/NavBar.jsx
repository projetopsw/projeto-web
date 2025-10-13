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

    const handleThemeToggle = () => {
        setIsLightTheme(prev => !prev);
    };

    const themeClass = isLightTheme ? 'light-theme' : '';


    return (
        <AppBar position="fixed" sx={{ 
            backgroundColor: 'var(--header-bg)', 
            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
            height: '50px',
            justifyContent: 'center',
        }}>
            <Toolbar disableGutters sx={{ 
                minHeight: '40px', 
                justifyContent: 'center', 
                position: 'relative',
                padding: '0 20px',
            }}>
                <Box sx={{ position: 'absolute', left: '2%', display: 'flex', alignItems: 'center' }}>
                    <a href="/">
                        <img 
                            src="/assets/img/vaca-logo.png" 
                            alt="Logo Moosica" 
                            style={{ width: '40px', transition: 'transform 0.3s ease' }} 
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        />
                    </a>
                </Box>

                {/* ✅ Passa a prop initialQuery para o Search */}
                <Search initialQuery={initialQuery} /> 

                <Box sx={{ 
                    position: 'absolute', 
                    right: '2%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '15px' 
                }}>
                    
                    <UserProfileIcon />

                    <ThemeSwitchContainer 
                        className={themeClass} 
                        id="theme-toggle" 
                        onClick={handleThemeToggle}
                        sx={{ position: 'relative', right: 'unset' }}
                    >
                        <i className="fas fa-sun" id="sun-icon" style={{ color: isLightTheme ? 'var(--secondary-text-color)' : 'var(--orange)' }}></i>
                        <i className="fas fa-moon" id="moon-icon" style={{ color: isLightTheme ? 'var(--orange)' : 'var(--secondary-text-color)' }}></i>
                        <span className="theme-toggle-btn"></span>
                    </ThemeSwitchContainer>

                </Box>

            </Toolbar>
        </AppBar>
    );
}

export default NavBar;