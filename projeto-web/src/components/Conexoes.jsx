import React, { useState, useEffect } from 'react';
import { Box, Typography, Divider, Button, CircularProgress } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import '../index.css'; 

import Navigation from './Navigation.jsx'; 
import Section from './Section.jsx'; 
import ArtistCircle from './ArtistCircle.jsx'; 

import { 
    fetchConnectionsData, 
    toggleFriendRequest, 
    acceptFriendRequest, 
    declineFriendRequest 
} from '../redux/connectionsSlice';

const navItemsData = ["Amigos", "Sugestões", "Pedidos", "Enviados"];


export default function Conexoes() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const currentUser = useSelector(state => state.auth.user); 

    const [selectedFilter, setSelectedFilter] = useState('Amigos');
    
    const { friends, pendingRequests, sentRequests, suggestions, status } = useSelector((state) => state.connections);

    const handleUserClick = (id) => navigate(`/perfil/${id}`);

    useEffect(() => {
        if (currentUser && currentUser.id) {
            dispatch(fetchConnectionsData(currentUser.id));
        }
    }, [dispatch, currentUser]); 
    
    // --- Funções de Ação Centralizadas ---

    const handleToggleRequest = (targetUser) => {
        dispatch(toggleFriendRequest({ currentUserId: currentUser.id, targetUser }));

        const isSent = sentRequests.some(req => req.id === targetUser.id);
        alert(isSent 
            ? `Pedido para ${targetUser.name} cancelado.` 
            : `Pedido para ${targetUser.name} enviado!`);
    };

    const handleAcceptRequest = (requester) => {
        dispatch(acceptFriendRequest({ accepterId: currentUser.id, requester: requester }));
        alert(`Você agora está conectado com ${requester.name}!`);
    };

    const handleDeclineRequest = (requester) => {
        dispatch(declineFriendRequest({ recipientId: currentUser.id, requesterId: requester.id }));
        alert(`Pedido de ${requester.name} recusado.`);
    };

    const renderContent = () => {
        if (status === 'loading') {
            return <CircularProgress sx={{ mt: 3, color: 'var(--orange)' }} />;
        }
        switch (selectedFilter) {
            case 'Amigos':
                return (
                    <Section title={`Peões Amigos (${friends.length})`}>
                        {friends.map((f) => 
                            <ArtistCircle 
                                key={f.id} 
                                {...f} 
                                onClick={() => handleUserClick(f.id)} 
                                isUser={true} // <<-- CORRIGIDO: Oculta o Player
                            />
                        )}
                    </Section>
                );
            case 'Sugestões':
                return (
                    <Section title={"Sugestões para Você"}>
                        {suggestions.map((sug) => {
                            const isSent = sentRequests.some(req => req.id === sug.id);
                            return (
                                <Box key={sug.id} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 1 }}>
                                    <ArtistCircle 
                                        {...sug} 
                                        onClick={() => handleUserClick(sug.id)} 
                                        isUser={true} // <<-- CORRIGIDO: Oculta o Player
                                    />
                                    <Button variant={isSent ? "outlined" : "contained"} size="small"
                                        sx={{ 
                                            mt: 1, 
                                            ...(isSent 
                                                ? { color: 'var(--secondary-text-color)', borderColor: 'var(--secondary-text-color)' } 
                                                : { bgcolor: 'var(--orange)', '&:hover': { bgcolor: 'darkorange' } })
                                        }}
                                        onClick={() => handleToggleRequest(sug)}>
                                        {isSent ? 'Enviado' : 'Adicionar'}
                                    </Button>
                                </Box>
                            );
                        })}
                    </Section>
                );

            case 'Pedidos':
                return (
                    <Section title={`Pedidos Pendentes (${pendingRequests.length})`}>
                        {pendingRequests.map((request) => (
                            <Box key={request.id} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 1 }}>
                                <ArtistCircle 
                                    {...request} 
                                    onClick={() => handleUserClick(request.id)} 
                                    isUser={true} // <<-- CORRIGIDO: Oculta o Player
                                />
                                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                    <Button variant="contained" size="small" sx={{ bgcolor: 'var(--orange)', '&:hover': { bgcolor: 'darkorange' } }}
                                        onClick={() => handleAcceptRequest(request)} >
                                        Aceitar
                                    </Button>
                                    <Button variant="outlined" size="small" sx={{ color: 'var(--text-primary)', borderColor: 'var(--text-primary)' }}
                                        onClick={() => handleDeclineRequest(request)} >
                                        Recusar
                                    </Button>
                                </Box>
                            </Box>
                        ))}
                    </Section>
                );

            case 'Enviados':
                return (
                    <Section title={`Pedidos Enviados (${sentRequests.length})`}>
                        {sentRequests.map((request) => (
                            <Box key={request.id} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 1 }}>
                                <ArtistCircle 
                                    {...request} 
                                    onClick={() => handleUserClick(request.id)} 
                                    isUser={true} // <<-- CORRIGIDO: Oculta o Player
                                />
                                <Button variant="outlined" size="small"
                                    sx={{ mt: 1, color: 'var(--text-primary)', borderColor: 'var(--text-primary)' }}

                                    onClick={() => handleToggleRequest(request)} >
                                    Cancelar Pedido
                                </Button>
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
            <Box sx={{ p: { xs: 2, md: 4, lg: 6 }, pb: 15 }} className="conexoes-font">
                <Typography variant="h4" sx={{ mb: 3, color: 'var(--text-primary)' }}>
                    Peões Conectados 🔗
                </Typography>

                <Navigation navItemsData={navItemsData} selectedItem={selectedFilter} setSelectedItem={setSelectedFilter} />
                <Divider sx={{ my: 4 }} />

                {renderContent()}
                <div className="margin-bottom"></div>
            </Box>
        </main>
    );
}