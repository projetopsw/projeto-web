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

    // Extraindo o usuário e o status de loading
    const currentUser = useSelector(state => state.user.user); 
    const userStatus = useSelector(state => state.user.status); // Use o status para saber quando terminou de carregar

    // NOVO: Extrai o ID de forma segura para monitoramento
    const currentUserId = currentUser?.id; 

    const [selectedFilter, setSelectedFilter] = useState('Amigos');
    
    const { friends, pendingRequests, sentRequests, suggestions, status, error } = useSelector((state) => state.connections);

    const handleUserClick = (id) => navigate(`/perfil/${id}`);

    // 🚨 CORREÇÃO PRINCIPAL NO useEffect 🚨
    useEffect(() => {
        // Garante que o usuário terminou de carregar (sucesso ou falha)
        if (userStatus !== 'loading') {
            // Se o ID existe, carrega as conexões
            if (currentUserId) {
                dispatch(fetchConnectionsData(String(currentUserId))); 
            } 
            // Se o ID não existe (e userStatus não é loading), 
            // o usuário não está logado ou houve falha no login, 
            // e a mensagem de "Por favor, faça login" será exibida.
        }
        
        // A dependência agora é mais clara e dispara o fetch quando o ID muda de null para um valor
    }, [dispatch, currentUserId, userStatus]); 
    
    
    const handleToggleRequest = (targetUser) => {
        // Verifica se o ID do usuário logado está disponível antes de agir
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
            alert(isSent 
                ? `Pedido para ${targetUser.name || targetUser.username} cancelado.` 
                : `Pedido para ${targetUser.name || targetUser.username} enviado!`);
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
        // Verifica o status de carregamento do USUÁRIO (userStatus) ou das CONEXÕES (status)
        if (userStatus === 'loading' || status === 'loading') {
            return <CircularProgress sx={{ mt: 3, color: 'var(--orange)' }} />;
        }
        
        // Se o usuário não tem ID e não está carregando, ele não está logado
        if (!currentUserId) {
            return <Typography sx={{ mt: 3, color: 'var(--text-primary)' }}>Por favor, faça login para ver suas conexões.</Typography>;
        }
        
        if (status === 'failed') {
            return (
                <Typography sx={{ mt: 3, color: 'red' }}>
                    ❌ Erro ao carregar as conexões.
                </Typography>
            );
        }

        // O restante do switch-case permanece o mesmo, usando friends, suggestions, etc.
        switch (selectedFilter) {
            case 'Amigos':
                return (
                    <Section title={`Peões Amigos (${friends.length})`}>
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
                    </Section>
                );

            case 'Sugestões':
                return (
                    <Section title={`Sugestões para Você (${suggestions.length})`}>
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
                                            variant={isSent ? "contained" : "contained"} 
                                            size="small"
                                            sx={{ 
                                                mt: 1, 
                                                minWidth: '100px',
                                                ...(isSent 
                                                    ? { 
                                                        bgcolor: 'var(--secondary-text-color)', 
                                                        color: 'var(--text-primary)', 
                                                        '&:hover': { bgcolor: '#444' } 
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
                    </Section>
                );

            case 'Pedidos':
                return (
                    <Section title={`Pedidos Pendentes (${pendingRequests.length})`}>
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
                    </Section>
                );

            case 'Enviados':
                return (
                    <Section title={`Pedidos Enviados (${sentRequests.length})`}>
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