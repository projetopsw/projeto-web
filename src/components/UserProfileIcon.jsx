// src/components/UserProfileIcon.jsx (CÓDIGO CORRIGIDO/REFORÇADO)

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconButton, Menu, MenuItem, Avatar } from '@mui/material';
import { logout } from '../redux/loginSlice';
import { useSelector, useDispatch } from 'react-redux';

function UserProfileIcon() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // 👑 LÊ O ESTADO DE AUTENTICAÇÃO
    const authState = useSelector((state) => state.auth);
    
    // Variável usada para a condição de renderização do link
    const isAdmin = authState.isAdmin;
    
    // Objeto user do authSlice (geralmente contém a role)
    const authUser = authState.user;

    // Objeto user do userSlice (geralmente contém updates de perfil, como a imagem)
    const updatedUser = useSelector((state) => state.user.user);

    // Usa o updatedUser se ele existir, mas garante que o 'role' do authUser
    // seja preservado no objeto final, caso o userSlice não o tenha.
    const user = { 
        ...(updatedUser || authUser), 
        role: authUser?.role, // Garante que a role sempre venha do objeto que a detém (authUser)
    };
    
    const profileImageUrl = user?.image || user?.img || '/assets/img/default_profile.png';
    
    const displayName = user?.name || 'Visitante';

    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleProfileClick = () => {
        navigate('/perfil');
        handleClose();
    };

    const handleAdminClick = () => {
        navigate('/admin');
        handleClose();
    };

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
        handleClose();
    };

    return (
        <div>
            <IconButton
                id="profile-button"
                aria-controls={open ? 'profile-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                aria-label="Perfil do Usuário"
                onClick={handleClick}
                sx={{
                    padding: 0,
                    borderRadius: '50%',
                    '&:hover': {
                        backgroundColor: 'transparent',
                    },
                }}
            >
                <Avatar 
                    alt={displayName} 
                    src={profileImageUrl} 
                    sx={{ 
                        width: 35, 
                        height: 35, 
                        backgroundColor: 'var(--darker-orange)', 
                        color: 'white',
                        transition: 'opacity 0.2s',
                        '&:hover': { opacity: 0.9 }
                    }} 
                >
                    {displayName.charAt(0)}
                </Avatar>
            </IconButton>

            <Menu
                id="profile-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                    'aria-labelledby': 'profile-button',
                }}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right', 
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right', 
                }}
                PaperProps={{
                    sx: {
                        backgroundColor: 'var(--sidebar-bg)',
                        color: 'var(--text-color)',
                        '& .MuiMenuItem-root': {
                            '&:hover': { backgroundColor: 'var(--input-bg)' }
                        }
                    }
                }}
            >
                <MenuItem sx={{ fontWeight: 'bold' }}>Olá, {displayName}!</MenuItem>
                <MenuItem onClick={handleProfileClick}>Ver Perfil</MenuItem>
                
                
                    <MenuItem onClick={handleAdminClick} sx={{ fontWeight: 'bold', color: 'var(--orange)' }}>
                        Admin Dashboard 👑
                    </MenuItem>
               
            
                <MenuItem onClick={handleLogout}>Sair</MenuItem>
            </Menu>
        </div>
    );
}

export default UserProfileIcon;