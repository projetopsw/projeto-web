import React, { useState } from 'react'; 
import { useNavigate } from 'react-router-dom';
import { IconButton, Menu, MenuItem, Avatar } from '@mui/material';
import { logout } from '../redux/loginSlice'; 
import { useSelector, useDispatch } from 'react-redux';

function UserProfileIcon() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.user);

  const isAdmin = user?.role === 'admin';

  const profileImageUrl = user?.img || user?.image || '/assets/img/default_profile.png';
  const displayName = user?.name || user?.username || 'Visitante';

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

  const handleUploadClick = () => {
    navigate('/upload');
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
            border: '2px solid var(--border-color)', 
            transition: 'opacity 0.2s',
            '&:hover': { opacity: 0.9 },
          }}
        >
          {displayName && displayName.charAt(0).toUpperCase()}
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
            border: '1px solid var(--border-color)',
            marginTop: 1,
            '& .MuiMenuItem-root': {
              '&:hover': { backgroundColor: 'var(--input-bg)' },
            },
          },
        }}
      >
        <MenuItem sx={{ fontWeight: 'bold', cursor: 'default', '&:hover': { backgroundColor: 'transparent !important' } }}>
          Olá, {displayName}!
        </MenuItem>
      
        <div style={{ borderBottom: '1px solid var(--border-color)', margin: '5px 0' }}></div>

        <MenuItem onClick={handleProfileClick}>Ver Perfil</MenuItem>

        {isAdmin && [
          <MenuItem key="upload" onClick={handleUploadClick}>
            Upload de Músicas
          </MenuItem>,

          <MenuItem
            key="admin"
            onClick={handleAdminClick}
            sx={{ fontWeight: 'bold', color: 'var(--orange)' }}
          >
            Admin Dashboard 
          </MenuItem>
        ]}
        
        <MenuItem onClick={handleLogout} sx={{ color: '#f44336' }}>
            Sair
        </MenuItem>
      </Menu>
    </div>
  );
}

export default UserProfileIcon;