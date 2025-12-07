import React from 'react';
import { Box } from '@mui/material';

function BarraLikes({ likePercentage }) {
    const safeLikePercentage = isNaN(likePercentage) || likePercentage === null || likePercentage === undefined
        ? 0
        : likePercentage;
    const effectiveLikePercentage = Math.max(0, Math.min(100, safeLikePercentage));

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
                    width: `${effectiveLikePercentage}%`,
                    height: '100%',
                    backgroundColor: '#ff7533', 
                    transition: 'width 0.3s ease-in-out',
                }}
            />
        </Box>
    );
}

export default BarraLikes;