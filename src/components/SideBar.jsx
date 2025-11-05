import React, { useState, useRef } from 'react';
import { Box, IconButton, Typography, Tooltip } from '@mui/material';
import { Link, useLocation } from 'react-router-dom'; // Adicionado useLocation para gerenciar o estado ativo
import HomeIcon from '@mui/icons-material/Home'; 
import QueueMusicIcon from '@mui/icons-material/QueueMusic';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import GroupIcon from '@mui/icons-material/Group';
import QueueOverlay from '../components/Fila'; 

const ACTIVE_COLOR = 'var(--orange)';
const INACTIVE_COLOR = 'var(--secondary-text-color)';

const SideButton = React.forwardRef(({ children, to, label, isProfile = false, isMobile = false, isActive = false, ...props }, ref) => {
    
    if (isMobile) {
        return (
            <Link to={to} style={{ textDecoration: 'none', flexGrow: 1 }}>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        transition: 'background-color 0.3s ease',
                    }}
                >
                    <IconButton
                        aria-label={label}
                        sx={{
                            color: isActive ? ACTIVE_COLOR : 'var(--icon-color)',
                            padding: 0,
                            '&:hover': { backgroundColor: 'transparent', color: ACTIVE_COLOR },
                        }}
                    >
                        {children}
                    </IconButton>
                    <Typography
                        variant="caption"
                        sx={{
                            color: isActive ? ACTIVE_COLOR : INACTIVE_COLOR,
                            fontSize: '10px',
                            paddingTop: '3px',
                            textTransform: 'uppercase',
                            fontWeight: 600,
                        }}
                    >
                        {label}
                    </Typography>
                </Box>
            </Link>
        );
    }

    return (
        <Tooltip 
            title={label} 
            placement="right" 
            arrow
            componentsProps={{
                tooltip: {
                    sx: {
                        backgroundColor: '#1a1a1a', 
                        fontSize: '0.9rem', 
                        padding: '8px 12px',
                        color: 'var(--text-color)',
                        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.5)', 
                    },
                },
                arrow: {
                    sx: {
                        color: '#1a1a1a',
                    },
                },
            }}
        >
            <Link to={to} style={{ textDecoration: 'none', width: '100%' }}>
                <Box 
                    ref={ref} 
                    sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        transition: 'background-color 0.3s ease', 
                        padding: '5px 0', 
                        width: '100%',
                        marginTop: isProfile ? '10px' : '0', 
                    }}
                    {...props} 
                >
                    <IconButton 
                        aria-label={label}
                        sx={{
                            backgroundColor: 'var(--card-bg)', padding: '10px', border: 'none',
                            borderRadius: isProfile ? '50%' : '8px', 
                            width: '60px', height: '60px', color: 'var(--icon-color)',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                backgroundColor: 'var(--darker-orange, #333)', 
                                color: 'var(--orange)',
                            },
                        }}
                    >
                        {children}
                    </IconButton>
                </Box>
            </Link>
        </Tooltip>
    );
});


const QueueButton = ({ isVisible, setIsVisible }) => {
    const buttonRef = useRef(null);
    const [overlayTop, setOverlayTop] = useState(0);

    React.useEffect(() => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setOverlayTop(rect.top);
        }
    }, [isVisible]);


    return (
        <Box
            sx={{
                position: 'relative', 
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
            }}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            <SideButton 
                to="/fila" 
                label="Fila" 
                ref={buttonRef} 
            >
                <QueueMusicIcon sx={{ fontSize: '28px' }} />
            </SideButton>
    
            <Box
                sx={{
                    position: 'fixed', 
                    top: overlayTop, 
                    left: '80px', 
                    zIndex: 1000,
                    height: `calc(100vh - ${overlayTop}px)`, 
                    opacity: isVisible ? 1 : 0,
                    visibility: isVisible ? 'visible' : 'hidden',
                    transition: 'opacity 0.3s ease, visibility 0.3s ease',
                    pointerEvents: isVisible ? 'auto' : 'none', 
                }}
            >
                <QueueOverlay />
            </Box>
        </Box>
    );
}

function SideBar() {
    const [isQueueVisible, setIsQueueVisible] = useState(false);
    const location = useLocation();
    const path = location.pathname;

    const mobileMenuItems = [
        { to: '/', label: 'Início', Icon: HomeIcon },
        { to: '/fila', label: 'Fila', Icon: QueueMusicIcon },
        { to: '/playlists', label: 'Playlists', Icon: LibraryMusicIcon },
        { to: '/grupos', label: 'Grupos', Icon: GroupIcon },
    ];
    
    const DesktopSideBar = () => (
        <Box
            component="nav" 
            sx={{
                display: { xs: 'none', md: 'flex' },
                position: 'fixed', 
                top: 0,
                left: 0,
                width: '80px', 
                height: '100vh', 
                backgroundColor: 'var(--sidebar-bg)',
                zIndex: 100, 
                
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: '5px', 
                paddingTop: '70px',
                paddingBottom: '10px', 
            }}
            className={'menu-lateral'}
        >
            <SideButton to="/" label="Início">
                <HomeIcon sx={{ fontSize: '28px' }} />
            </SideButton>

            <QueueButton 
                isVisible={isQueueVisible} 
                setIsVisible={setIsQueueVisible} 
            />
            
            <SideButton to="/playlists" label="Playlists">
                <LibraryMusicIcon sx={{ fontSize: '28px' }} />
            </SideButton>
            
            <SideButton to="/grupos" label="Grupos">
                <GroupIcon sx={{ fontSize: '28px' }} />
            </SideButton>
        </Box>
    );

    const MobileSideBar = () => (
        <Box
            className="menu-rodape-mobile"
            component="nav"
            sx={{
                display: { xs: 'flex', md: 'none' },
                position: 'fixed', 
                bottom: 0, 
                left: 0,
                width: '100%',
                height: '60px',
                zIndex: 1002, 
                boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.3)',
                backgroundColor: 'var(--sidebar-bg)',
                alignItems: 'center',
                justifyContent: 'space-around',
                padding: '0',
            }}
        >
            {mobileMenuItems.map((item) => {
                const isActive = path === item.to || (item.to !== '/' && path.startsWith(item.to));
                return (
                    <SideButton
                        key={item.label}
                        to={item.to}
                        label={item.label}
                        isMobile={true} 
                        isActive={isActive}
                    >
                        <item.Icon sx={{ fontSize: '24px' }} />
                    </SideButton>
                );
            })}
        </Box>
    );

    return (
        <>
            <DesktopSideBar />
            <MobileSideBar />
        </>
    );
}

export default SideBar;