import React, { useState } from 'react'; 
import { Box, IconButton, Typography, styled } from '@mui/material';
import { Link, useLocation } from 'react-router-dom'; 

import { useSelector, useDispatch } from 'react-redux'; 
import { togglePlayPause, skipNext } from '../redux/playerSlice'; 

import Player from './Player'; 

import HomeIcon from '@mui/icons-material/Home'; 
import QueueMusicIcon from '@mui/icons-material/QueueMusic'; 
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import GroupIcon from '@mui/icons-material/Group'; 
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';

const ACTIVE_COLOR = 'var(--orange)';
const INACTIVE_COLOR = 'var(--secondary-text-color)';

// ... (MobileMenuItem e MiniPlayerTabContainer mantidos) ...

const MobileMenuItem = ({ item, isActive }) => (
    <Link to={item.to} style={{ textDecoration: 'none', flexGrow: 1 }}>
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
                aria-label={item.label}
                sx={{
                    color: isActive ? ACTIVE_COLOR : 'var(--icon-color)',
                    padding: 0,
                    '&:hover': { backgroundColor: 'transparent', color: ACTIVE_COLOR },
                }}
            >
                <item.Icon sx={{ fontSize: '24px' }} />
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
                {item.label}
            </Typography>
        </Box>
    </Link>
);

const MiniPlayerTabContainer = styled(Box)(({ theme }) => ({
    position: 'fixed',
    bottom: 20, 
    right: 20,
    width: 'auto', 
    minWidth: '150px',
    height: '60px',
    borderRadius: '30px', 
    backgroundColor: 'var(--orange, #ff7533)', 
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    padding: '0 5px 0 15px', 
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.6)',
    zIndex: 1003,
    ['@media (min-width:600px)']: { 
        right: 40, 
        bottom: 40,
    },
}));

function Footer() {
    const location = useLocation(); 
    const [isFooterVisible, setIsFooterVisible] = useState(true);

    // ------------------------------------------------------------------
    // 💡 LÓGICA DE OCULTAÇÃO DO FOOTER (IMPLEMENTAÇÃO)
    // Verifica se o caminho atual corresponde ao padrão /grupos/:id
    // ------------------------------------------------------------------
    const path = location.pathname;
    
    // Regex para checar se o caminho é /grupos/ seguido por qualquer coisa (o ID)
    const isGrupoDetalhe = /^(\/grupos\/[^/]+)$/.test(path);

    // Se a rota for /grupos/:id, retorne null para não renderizar nada.
    if (isGrupoDetalhe) {
        return null;
    }
    // ------------------------------------------------------------------

    const toggleFooter = () => {
        setIsFooterVisible(prev => !prev);
    };

    const MiniPlayerTab = ({ onShowFooter }) => {
        const dispatch = useDispatch();
        const { isPlaying, currentSong } = useSelector(state => state.player); 
        
        const musicaAtual = currentSong || { title: "Música Não Selecionada" };

        return (
            <MiniPlayerTabContainer>
                <Typography 
                    variant="body2" 
                    sx={{ 
                        whiteSpace: 'nowrap', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        maxWidth: '100px',
                        fontWeight: 'bold',
                    }}
                >
                    {musicaAtual.title}
                </Typography>

                <IconButton 
                    onClick={() => dispatch(togglePlayPause())} 
                    sx={{ color: 'white', ml: 1, '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' } }}
                    aria-label={isPlaying ? "Pausar" : "Reproduzir"}
                >
                    {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                </IconButton>

                <IconButton 
                    onClick={() => dispatch(skipNext())} 
                    sx={{ color: 'white', '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' } }}
                    aria-label="Avançar"
                >
                    <SkipNextIcon />
                </IconButton>

                <IconButton 
                    onClick={onShowFooter}
                    aria-label="Mostrar Rodapé Completo"
                    sx={{ 
                        color: 'white', 
                        ml: 0.5,
                        backgroundColor: 'rgba(0, 0, 0, 0.1)',
                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.3)' } 
                    }}
                >
                    <KeyboardArrowUpIcon />
                </IconButton>
            </MiniPlayerTabContainer>
        );
    };

    if (!isFooterVisible) {
        return <MiniPlayerTab onShowFooter={toggleFooter} />; 
    }

    const FooterBarWithButton = ({ isMobile = false }) => (
        <div className="foo" style={{ 
            padding: isMobile ? '5px' : '0 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'var(--footer-bg)',
            height: isMobile ? 'auto' : '30px',
        }}>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--secondary-text-color)' }}>
                {isMobile ? `© 2025 Moosica.` : `© 2025 Moosica. Todos os direitos reservados.`}
            </p>
            <IconButton 
                onClick={toggleFooter} 
                aria-label="Ocultar Player" 
                sx={{ 
                    color: 'var(--icon-color)', 
                    p: 0.5,
                    ml: 1
                }}
            >
                <KeyboardArrowDownIcon />
            </IconButton>
        </div>
    );

    const mobileMenuItems = [
        { to: '/', label: 'Início', Icon: HomeIcon },
        { to: '/fila', label: 'Fila', Icon: QueueMusicIcon }, 
        { to: '/playlists', label: 'Playlists', Icon: LibraryMusicIcon },
        { to: '/grupos', label: 'Grupos', Icon: GroupIcon },
    ];


    return (
        <footer 
            style={{ 
                position: 'fixed', 
                bottom: 0, 
                left: 0, 
                width: '100%', 
                zIndex: 1001,
            }}
        >

            <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                width: '100%', 
                backgroundColor: 'var(--footer-bg)',
                paddingBottom: { xs: '60px', sm: '0' }, 
            }}>
                <Player />
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                    <FooterBarWithButton />
                </Box>
                <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
                    <FooterBarWithButton isMobile={true} />
                </Box>
            </Box>

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
                    return (
                        <MobileMenuItem 
                            key={item.label} 
                            item={item} 
                            isActive={location.pathname === item.to || 
                                         (item.to !== '/' && location.pathname.startsWith(item.to))} 
                        />
                    );
                })}
            </Box>
        </footer>
    );
}

export default Footer;