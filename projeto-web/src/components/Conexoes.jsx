// src/pages/Conexoes/Conexoes.jsx

import React, { useState, useEffect } from 'react';
import { Box, Typography, Divider, Button } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import '../index.css'; 

import Navigation from './Navigation.jsx'; 
import Section from './Section.jsx'; 
import ArtistCircle from './ArtistCircle.jsx'; 


const API_URL = 'http://localhost:3001'; 
const navItemsData = ["Amigos", "Sugestões", "Pedidos"];

export default function Conexoes() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    const [selectedFilter, setSelectedFilter] = useState('Amigos');
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    
    const user = useSelector(state => state.user.user); 
    const { items: friendDetails } = useSelector(state => state.auth.friends);
    
    const pendingRequests = [
        { id: '101', name: 'Maria Fofoqueira', image: 'https://placehold.co/400x400?text=Pedido+1' },
        { id: '102', name: 'Zé Capataz', image: 'https://placehold.co/400x400?text=Pedido+2' },
    ];

    const handleUserClick = (id) => {
        navigate(`/perfil/${id}`); 
    };
    
    useEffect(() => {
        if (selectedFilter === 'Sugestões' && user && user.id) {
            const fetchSuggestions = async () => {
                setIsLoadingSuggestions(true);
                await new Promise(resolve => setTimeout(resolve, 500)); 
                
                const data = [
                    { id: '201', name: 'Pedro Mugido', image: 'https://placehold.co/400x400?text=Sugestão+1' },
                    { id: '202', name: 'Carla Cangaia', image: 'https://placehold.co/400x400?text=Sugestão+2' },
                    { id: '203', name: 'João Vaqueiro', image: 'https://placehold.co/400x400?text=Sugestão+3' },
                ];
                setSuggestions(data);
                setIsLoadingSuggestions(false);
            };

            fetchSuggestions();
        }
    }, [selectedFilter, user]);

    const renderContent = () => {
        switch (selectedFilter) {
            case 'Amigos':
                if (friendDetails.length === 0) {
                    return <Typography sx={{ mt: 3, color: 'var(--secondary-text-color)' }}>Você não tem amigos conectados ainda.</Typography>;
                }
                return (
                    <Section key={"Amigos"} title={`Peões Amigos (${friendDetails.length})`}>
                        {friendDetails.map((friend) => (
                            <ArtistCircle 
                                key={friend.id}
                                id={friend.id}
                                image={friend.image || 'https://placehold.co/400x400?text=Amigo'}
                                name={friend.name}
                                onClick={() => handleUserClick(friend.id)}
                            />
                        ))}
                    </Section>
                );

            case 'Sugestões':
                if (isLoadingSuggestions) {
                    return <Typography sx={{ mt: 3 }}>Carregando sugestões...</Typography>;
                }
                if (suggestions.length === 0) {
                    return <Typography sx={{ mt: 3, color: 'var(--secondary-text-color)' }}>Sem sugestões de conexão no momento.</Typography>;
                }
                return (
                    <Section key={"Sugestões"} title={"Sugestões para Você"}>
                        {suggestions.map((sug) => (
                            <Box key={sug.id} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 1 }}>
                                <ArtistCircle 
                                    id={sug.id}
                                    image={sug.image}
                                    name={sug.name}
                                    onClick={() => handleUserClick(sug.id)} 
                                />
                                <Button 
                                    variant="contained" 
                                    size="small"
                                    sx={{ mt: 1, bgcolor: 'var(--orange)', '&:hover': { bgcolor: 'darkorange' } }}
                                >
                                    Conectar
                                </Button>
                            </Box>
                        ))}
                    </Section>
                );

            case 'Pedidos':
                if (pendingRequests.length === 0) {
                    return <Typography sx={{ mt: 3, color: 'var(--secondary-text-color)' }}>Você não tem pedidos de conexão pendentes.</Typography>;
                }
                return (
                    <Section key={"Pedidos"} title={`Pedidos Pendentes (${pendingRequests.length})`}>
                        {pendingRequests.map((request) => (
                            <Box key={request.id} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 1 }}>
                                <ArtistCircle 
                                    id={request.id}
                                    image={request.image}
                                    name={request.name}
                                    onClick={() => handleUserClick(request.id)}
                                />
                                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                    <Button 
                                        variant="contained" 
                                        size="small"
                                        sx={{ bgcolor: 'var(--orange)', '&:hover': { bgcolor: 'darkorange' } }}
                                    >
                                        Aceitar
                                    </Button>
                                    <Button 
                                        variant="outlined" 
                                        size="small"
                                        sx={{ color: 'var(--text-primary)', borderColor: 'var(--text-primary)' }}
                                    >
                                        Recusar
                                    </Button>
                                </Box>
                            </Box>
                        ))}
                    </Section>
                );

            default:
                return null;
        }
    };

    return (
        <main>
            <Box 
                sx={{ 
                    p: { xs: 2, md: 4, lg: 6 }, 
                    pb: 15,
                }} 
                className="conexoes-font"
            >
                <Typography variant="h4" sx={{ mb: 3, color: 'var(--text-primary)' }}>
                    Peões Conectados 🔗
                </Typography>

                <Navigation 
                    navItemsData={navItemsData}
                    selectedItem={selectedFilter}
                    setSelectedItem={setSelectedFilter} 
                />

                <Divider sx={{ my: 4 }} />

                {renderContent()}

                <div className="margin-bottom"></div>
            </Box>
        </main>
    );
}