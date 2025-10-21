import React from 'react';
import { Box } from '@mui/material';

/**
 * Componente de barra visual para mostrar a proporção de likes.
 * @param {number} likePercentage 
 */
function BarraLikes({ likePercentage }) {
    const dislikePercentage = 100 - likePercentage;

    return (
        <Box 
            sx={{
                width: '100%',
                height: 8, 
                backgroundColor: '#555',
                borderRadius: 4,
                overflow: 'hidden',
                mt: 1, 
            }}
        >
            <Box
                sx={{
                    width: `${likePercentage}%`,
                    height: '100%',
                    backgroundColor: '#ff7533', 
                    transition: 'width 0.3s ease-in-out',
                }}
            />
        </Box>
    );
}

export default BarraLikes;