import React from 'react';
// 💡 Importe useNavigate do react-router-dom
import { Card, CardContent, Typography, Avatar, Box, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom'; 
import GroupIcon from '@mui/icons-material/Group';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

// Se o usuário não tiver imagem, usamos uma placeholder
const defaultImage = "https://placehold.co/400x400?text=U"; 

/**
 * Componente de Card para exibir informações de um Usuário.
 */
function UserCard({ name, email, friends, following, image, id }) {
    // 💡 Inicializa o hook de navegação
    const navigate = useNavigate(); 
    
    const friendCount = friends ? friends.length : 0;
    const followingCount = following ? following.length : 0;
    
    const userImage = image || defaultImage; 

    // 💡 Função para lidar com o clique
    const handleCardClick = () => {
        // Redireciona para a página do perfil, usando o ID do usuário (ex: /perfil/4)
        navigate(`/perfil/${id}`);
    };

    return (
        <Card 
            sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 2, 
                p: 2, 
                backgroundColor: 'rgba(255, 255, 255, 0.05)', 
                color: 'white', 
                width: '100%',
                borderRadius: '8px',
                boxShadow: 'none',
                cursor: 'pointer', // Indica que é clicável
                '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                }
            }}
            // 💡 Adiciona o evento onClick
            onClick={handleCardClick}
        >
            <Avatar 
                alt={name} 
                src={userImage} 
                sx={{ width: 60, height: 60, mr: 3 }} 
            />
            <CardContent sx={{ flexGrow: 1, p: 0, '&:last-child': { pb: 0 } }}>
                <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                    {name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    {email}
                </Typography>

                {/* Contagem de Amigos e Seguidores */}
                <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <GroupIcon fontSize="small" sx={{ mr: 0.5, color: '#ff7533' }} />
                        <Typography variant="body2">{friendCount} Amigos</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PersonAddIcon fontSize="small" sx={{ mr: 0.5, color: '#ff7533' }} />
                        <Typography variant="body2">{followingCount} Seguindo</Typography>
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
}

export default UserCard;