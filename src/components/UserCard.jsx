import React from 'react';
import { Card, CardContent, Typography, Avatar, Box, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom'; 
import GroupIcon from '@mui/icons-material/Group';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

const defaultImage = "https://placehold.co/400x400?text=U"; 

function UserCard({ name, email, friends, following, image, id }) {
    const navigate = useNavigate(); 
    
    const friendCount = friends ? friends.length : 0;
    const followingCount = following ? following.length : 0;
    
    const userImage = image || defaultImage; 

    const handleCardClick = () => {
        navigate(`/perfil/${id}`);
    };

    return (
        <Card 
            sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 2, 
                p: 2, 
                backgroundColor: 'var(--card-bg, rgba(255, 255, 255, 0.05))', 
                color: 'var(--text-color, white)', 
                width: '100%',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-color-dark) 0px 4px 6px -1px, var(--shadow-color-light) 0px 2px 4px -2px',
                cursor: 'pointer',
                '&:hover': {
                    backgroundColor: 'var(--button-hover-bg, rgba(255, 255, 255, 0.1))', 
                }
            }}
            onClick={handleCardClick}
        >
            <Avatar 
                alt={name} 
                src={userImage} 
                sx={{ width: 60, height: 60, mr: 3 }} 
            />
            <CardContent sx={{ flexGrow: 1, p: 0, '&:last-child': { pb: 0 } }}>
                <Typography 
                    variant="h6" 
                    component="div" 
                    sx={{ fontWeight: 'bold', color: 'var(--title-color, white)' }}
                >
                    {name}
                </Typography>
                <Typography 
                    variant="body2" 
                    sx={{ color: 'var(--secondary-text-color, rgba(255, 255, 255, 0.7))' }} 
                >
                    {email}
                </Typography>

                <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <GroupIcon 
                            fontSize="small" 
                            sx={{ mr: 0.5, color: 'var(--orange, #ff7533)' }} 
                        />
                        <Typography 
                            variant="body2"
                            sx={{ color: 'inherit'}}
                        >
                            {friendCount} Amigos
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PersonAddIcon 
                            fontSize="small" 
                            sx={{ mr: 0.5, color: 'var(--orange, #ff7533)' }} 
                        />
                        <Typography 
                            variant="body2"
                            sx={{ color: 'inherit'}}
                        >
                            {followingCount} Seguindo
                        </Typography>
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
}

export default UserCard;