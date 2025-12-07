import React, { useState, useEffect } from 'react';
import { Box, Typography, Divider, Button, CircularProgress } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import '../index.css'; 

import Navigation from '../components/Navigation.jsx'; 
import Section from '../components/Section.jsx'; 
import ArtistCircle from '../components/ArtistCircle.jsx'; 

import { 
    fetchConnectionsData, 
    toggleFriendRequest, 
    acceptFriendRequest, 
    declineFriendRequest,
    removeFriend 
} from '../redux/connectionsSlice';

const navItemsData = ["Amigos", "Sugestões", "Pedidos", "Enviados"];
const DEFAULT_USER_IMAGE = 'https://placehold.co/400x400?text=User';


export default function Conexoes() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const currentUser = useSelector(state => state.user.user); 
    const userStatus = useSelector(state => state.user.status); 
    const currentUserId = currentUser?.id || currentUser?._id; 

    const { 
        friends, 
        pendingRequests, 
        sentRequests, 
        suggestions, 
        status: connectionsStatus, 
        error: connectionsError 
    } = useSelector((state) => state.connections);

    const [selectedFilter, setSelectedFilter] = useState('Amigos');
    
    const handleUserClick = (id) => navigate(`/perfil/${id}`);

    // 💡 Correção 1: Garante que só tentamos buscar dados se o ID existir e o usuário não estiver em estado de erro
    useEffect(() => {
        if (currentUserId && userStatus !== 'failed') {
            dispatch(fetchConnectionsData(String(currentUserId))); 
        } 
    }, [dispatch, currentUserId, userStatus]); 
    
    
    const handleToggleRequest = (targetUser) => {
        if (!currentUserId) {
            alert("Você precisa estar logado para fazer isso.");
            return;
        }
        
        const isSent = sentRequests.some(req => String(req.id) === String(targetUser.id));
        const isFriend = friends.some(f => String(f.id) === String(targetUser.id));
        
        if (isFriend) {
            dispatch(removeFriend({ currentUserId, targetUserId: targetUser.id }));
            alert(`Você removeu ${targetUser.name || targetUser.username} de seus amigos.`);
        } else {
            dispatch(toggleFriendRequest({ currentUserId, targetUser }));
            alert(`Pedido de amizade processado para ${targetUser.name || targetUser.username}.`);
        }
    };

    const handleAcceptRequest = (requester) => {
        if (!currentUserId) return;
        dispatch(acceptFriendRequest({ accepterId: currentUserId, requester: requester }));
        alert(`Você agora está conectado com ${requester.name || requester.username}!`);
    };

    const handleDeclineRequest = (requester) => {
        if (!currentUserId) return;
        dispatch(declineFriendRequest({ recipientId: currentUserId, requesterId: requester.id }));
        alert(`Pedido de ${requester.name || requester.username} recusado.`);
    };


    const renderContent = () => {
        
        // 1. Condição de Carregamento/Espera (inclui o 'loading' do user e 'connections')
        if (connectionsStatus === 'loading' || userStatus === 'loading') {
            return <CircularProgress sx={{ mt: 3, color: 'var(--orange)' }} />;
        }
        
        // 2. Condição de Falha no Fetch de Conexões (Autenticação 401 que não leva ao deslogue)
        if (connectionsStatus === 'failed' && connectionsError !== 'Token de autenticação não encontrado. Usuário não está logado.') {
            const errorMessage = connectionsError || "Erro ao carregar as conexões.";
            return (
                <Typography sx={{ mt: 3, color: 'red' }}>
                    ❌ {errorMessage}
                </Typography>
            );
        }

        // 💡 Correção 2: Condição de Não Logado (Estado Final)
        // Só mostra a mensagem de login se não houver currentUserId E o status do usuário for idle ou failed.
        // Se o status for 'succeeded' e currentUserId sumiu, algo está errado, mas não devemos mostrar a tela de login.
        if (!currentUserId && (userStatus === 'idle' || userStatus === 'failed')) {
            return <Typography sx={{ mt: 3, color: 'var(--text-primary)' }}>Por favor, faça login para ver suas conexões.</Typography>;
        }
        
        // Se chegamos aqui, o usuário está logado (currentUserId existe) e/ou o status é succeeded.

        switch (selectedFilter) {
            case 'Amigos':
                return (
                    <Section title={`Peões Amigos (${friends.length})`}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                            {friends.length === 0 ? (
                                <Typography sx={{ color: 'var(--secondary-text-color)' }}>Você ainda não tem amigos. Explore as sugestões!</Typography>
                            ) : (
                                friends.map((f) => 
                                    <ArtistCircle 
                                        key={f.id} 
                                        id={f.id}
                                        name={f.name || f.username || `Amigo ${f.id}`} 
                                        image={f.img || f.image || DEFAULT_USER_IMAGE} 
                                        onClick={() => handleUserClick(f.id)} 
                                        isUser={true} 
                                    />
                                )
                            )}
                        </Box>
                    </Section>
                );

            case 'Sugestões':
                return (
                    <Section title={`Sugestões para Você (${suggestions.length})`}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                            {suggestions.length === 0 ? (
                                <Typography sx={{ color: 'var(--secondary-text-color)' }}>Você adicionou todos os peões. Parabéns!</Typography>
                            ) : (
                                suggestions.map((sug) => {
                                    const isSent = sentRequests.some(req => String(req.id) === String(sug.id));
                                    return (
                                        <Box key={sug.id} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 1 }}>
                                            <ArtistCircle 
                                                id={sug.id}
                                                name={sug.name || sug.username || `Sugestão ${sug.id}`} 
                                                image={sug.img || sug.image || DEFAULT_USER_IMAGE} 
                                                onClick={() => handleUserClick(sug.id)} 
                                                isUser={true} 
                                            />
                                            <Button 
                                                variant={isSent ? "outlined" : "contained"} 
                                                size="small"
                                                sx={{ 
                                                    mt: 1, 
                                                    minWidth: '100px',
                                                    ...(isSent 
                                                        ? { 
                                                            bgcolor: 'transparent', 
                                                            color: 'var(--text-primary)', 
                                                            borderColor: 'var(--text-primary)',
                                                            '&:hover': { bgcolor: '#444', borderColor: 'var(--text-primary)' } 
                                                          } 
                                                        : { 
                                                            bgcolor: 'var(--orange)', 
                                                            '&:hover': { bgcolor: 'darkorange' } 
                                                          })
                                                }}
                                                onClick={() => handleToggleRequest(sug)}>
                                                {isSent ? 'CANCELAR SOLICITAÇÃO' : 'Adicionar'}
                                            </Button>
                                        </Box>
                                    );
                                })
                            )}
                        </Box>
                    </Section>
                );

            case 'Pedidos':
                return (
                    <Section title={`Pedidos Pendentes (${pendingRequests.length})`}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                            {pendingRequests.length === 0 ? (
                                <Typography sx={{ color: 'var(--secondary-text-color)' }}>Nenhum pedido de amizade pendente.</Typography>
                            ) : (
                                pendingRequests.map((request) => (
                                    <Box key={request.id} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 1 }}>
                                        <ArtistCircle 
                                            id={request.id}
                                            name={request.name || request.username || `Pedido ${request.id}`} 
                                            image={request.img || request.image || DEFAULT_USER_IMAGE} 
                                            onClick={() => handleUserClick(request.id)} 
                                            isUser={true} 
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
                                ))
                            )}
                        </Box>
                    </Section>
                );

            case 'Enviados':
                return (
                    <Section title={`Pedidos Enviados (${sentRequests.length})`}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                            {sentRequests.length === 0 ? (
                                <Typography sx={{ color: 'var(--secondary-text-color)' }}>Nenhum pedido de amizade enviado.</Typography>
                            ) : (
                                sentRequests.map((request) => (
                                    <Box key={request.id} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 1 }}>
                                        <ArtistCircle 
                                            id={request.id}
                                            name={request.name || request.username || `Enviado ${request.id}`} 
                                            image={request.img || request.image || DEFAULT_USER_IMAGE} 
                                            onClick={() => handleUserClick(request.id)} 
                                            isUser={true} 
                                        />
                                        <Button variant="outlined" size="small"
                                            sx={{ mt: 1, color: 'var(--text-primary)', borderColor: 'var(--text-primary)', minWidth: '100px' }}
                                            onClick={() => handleToggleRequest(request)} >
                                            CANCELAR SOLICITAÇÃO 
                                        </Button>
                                    </Box>
                                ))
                            )}
                        </Box>
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