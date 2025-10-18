import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconButton, Menu, MenuItem } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import { logout } from '../redux/loginSlice';
import { useSelector, useDispatch } from 'react-redux';

function UserProfileIcon() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user: authUser } = useSelector((state) => state.auth);
  const updatedUser = useSelector((state) => state.user.user);

  const displayName = updatedUser?.name || authUser?.name || 'Visitante';

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

  const handleLogout = () => {
    dispatch(logout());
    console.log('Usuário deslogado!');
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
          backgroundColor: 'var(--darker-orange)',
          color: 'var(--text-color)',
          padding: '4px',
          borderRadius: '50%',
          '&:hover': {
            backgroundColor: 'var(--orange)',
          },
        }}
      >
        <PersonIcon sx={{ fontSize: '28px' }} />
      </IconButton>

      <Menu
        id="profile-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'profile-button',
        }}
      >
        <MenuItem>Olá, {displayName}!</MenuItem>
        <MenuItem onClick={handleProfileClick}>Ver Perfil</MenuItem>
        <MenuItem onClick={handleLogout}>Sair</MenuItem>
      </Menu>
    </div>
  );
}

export default UserProfileIcon;
