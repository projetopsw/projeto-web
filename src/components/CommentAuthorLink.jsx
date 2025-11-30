
import React from 'react';
import { Link } from 'react-router-dom';
import { Avatar, Typography, Box } from '@mui/material';

const DEFAULT_USER_IMAGE = '/assets/img/default_profile.png';
const DELETED_USER_IMAGE = '/assets/img/deleted_user.png';

export default function CommentAuthorLink({ autorData }) {
    
    const authorExists = !!autorData; 
    
    const userId = autorData?._id || autorData?.id; 

    const displayName = authorExists ? (autorData.name || autorData.username) : "Usuário Removido";
    const profileImage = authorExists 
        ? (autorData.img || autorData.image || DEFAULT_USER_IMAGE)
        : DELETED_USER_IMAGE;
    
    const isLinkEnabled = authorExists;

    if (isLinkEnabled) {
        return (
            <Link to={`/perfil/${userId}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar src={profileImage} alt={displayName} sx={{ width: 24, height: 24 }} />
                <Typography variant="subtitle2" sx={{ color: 'var(--text-primary)', fontWeight: 'bold', '&:hover': { textDecoration: 'underline' } }}>
                    {displayName}
                </Typography>
            </Link>
        );
    } 
    
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar src={DELETED_USER_IMAGE} alt={displayName} sx={{ width: 24, height: 24 }} />
            <Typography variant="subtitle2" sx={{ color: 'var(--secondary-text-color)' }}>
                {displayName}
            </Typography>
        </Box>
    );
}