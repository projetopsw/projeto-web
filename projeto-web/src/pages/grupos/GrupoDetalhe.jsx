import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux'; 
import { Box, Typography, Button, TextField, List, ListItem, ListItemText, ListItemAvatar, Avatar, InputBase, styled, Divider, IconButton, CircularProgress } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import PetsIcon from '@mui/icons-material/Pets'; 
import PersonIcon from '@mui/icons-material/Person';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import api from '../../services/api';

const LeaveButton = styled(Button)(({ theme }) => ({
    backgroundColor: 'var(--card-bg)',
    color: 'var(--text-color)',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    '&:hover': { backgroundColor: 'var(--input-bg)' },
}));

const SearchInputWrapper = styled(Box)(({ theme }) => ({
    position: 'relative', flexGrow: 1, backgroundColor: 'var(--input-bg)', borderRadius: '25px',
    display: 'flex', alignItems: 'center', padding: '0 15px', height: '40px', transition: 'box-shadow 0.2s',
    '&:focus-within': { boxShadow: `0 0 0 1px var(--orange)` },
}));

const StyledInput = styled(InputBase)(({ theme }) => ({
    flexGrow: 1, backgroundColor: 'transparent', border: 'none', padding: '12px 0',
    color: 'var(--text-color)', fontSize: '16px',
    '& input::placeholder': { color: 'var(--secondary-text-color)', opacity: 0.8 },
}));

const QueueItemBox = styled(Box)(({ theme }) => ({
    backgroundColor: 'var(--card-bg)', borderRadius: '8px', padding: '10px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
    transition: 'background-color 0.2s', cursor: 'pointer',
    '&:hover': { backgroundColor: 'var(--input-bg)' },
}));


function GrupoDetalhe() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [grupo, setGrupo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const userId = useSelector(state => state.auth.user?.id); 
    const userName = useSelector(state => state.auth.user?.username || 'Você');
    const MOCK_USER_NAME = userName;

    const removeListenerAndCheckDeletion = useCallback(async (groupId, currentUserId) => {
        try {
            const response = await api.get(`/groups/${groupId}`);
            const group = response.data;
            
            const isOwner = group.creatorId === currentUserId;
            
            const updatedListeners = (group.listeners || []).filter(
                listenerId => listenerId !== currentUserId
            );

            const newStatus = updatedListeners.length > 0 ? "Ao vivo" : "Offline";

            if (isOwner) {
                await api.delete(`/groups/${groupId}`);
                return { deleted: true, reason: 'Dono saiu' };
            }
            
            if (updatedListeners.length === 0) {
                await api.delete(`/groups/${groupId}`);
                return { deleted: true, reason: 'Vazio' };
            }

            await api.patch(`/groups/${groupId}`, {
                listeners: updatedListeners,
                status: newStatus
            });
            
            return { deleted: false };

        } catch (error) {
            if (error.response?.status === 404) {
                 return { deleted: true, reason: 'Já excluído' };
            }
            console.error("Erro na lógica de saída/exclusão:", error);
            return { deleted: false, reason: 'Erro na API' };
        }
    }, []);

    useEffect(() => {
        let isCancelled = false;

        const fetchGroupAndJoin = async () => {
            if (!userId) { 
                setIsLoading(true);
                return;
            }

            try {
                const response = await api.get(`/groups/${id}`);
                const initialGroup = response.data;
                setGrupo(initialGroup);

                let updatedMembers = initialGroup.members || [];
                if (!updatedMembers.includes(userId)) {
                    updatedMembers = [...updatedMembers, userId];
                    await api.patch(`/groups/${id}`, { members: updatedMembers });
                }

                let updatedListeners = initialGroup.listeners || [];
                if (!updatedListeners.includes(userId)) {
                    updatedListeners = [...updatedListeners, userId];
                    
                    const newStatus = "Ao vivo"; 

                    await api.patch(`/groups/${id}`, {
                        listeners: updatedListeners,
                        status: newStatus
                    });

                    if (!isCancelled) {
                        setGrupo(prev => ({ ...prev, listeners: updatedListeners, status: newStatus }));
                    }
                }
            } catch (error) {
                console.error("Erro ao carregar ou entrar no grupo:", error);
                navigate('/grupos');
            } finally {
                if (!isCancelled) {
                    setIsLoading(false);
                }
            }
        };

        fetchGroupAndJoin();

        return () => {
            isCancelled = true;
            
            (async () => {
                await removeListenerAndCheckDeletion(id, userId);
            })();
        };
    }, [id, navigate, removeListenerAndCheckDeletion, userId]);


    const handleLeaveGroup = async () => {
        if (!window.confirm("Você tem certeza que deseja sair deste grupo?")) return;
        if (!userId) return;

        try {
            const result = await removeListenerAndCheckDeletion(id, userId);

            if (result.deleted) {
                alert("O grupo foi excluído.");
            } else {
                const groupAfterLeaving = (await api.get(`/groups/${id}`)).data;
                const isCreator = groupAfterLeaving.creatorId === userId;
                
                if (!isCreator) {
                    const membersAfterLeaving = (groupAfterLeaving.members || []).filter(
                        memberId => memberId !== userId
                    );
                    
                    await api.patch(`/groups/${id}`, {
                        members: membersAfterLeaving
                    });
                    alert("Você saiu do grupo com sucesso!");
                } else {
                    alert("Você saiu da escuta do grupo com sucesso! Como criador, a sala foi mantida.");
                }
            }
            
            navigate('/grupos');

        } catch (error) {
            console.error("Erro ao processar saída do grupo:", error);
            alert("Houve um erro ao sair do grupo.");
            navigate('/grupos'); 
        }
    };


    if (isLoading || !grupo || !userId) {
        return (
            <main className="content-area" style={{paddingTop: '50px', textAlign: 'center'}}>
                <CircularProgress sx={{ color: 'var(--orange)' }} />
                <Typography sx={{ color: 'var(--text-color)', marginTop: '10px' }}>Preparando a sala...</Typography>
            </main>
        );
    }
    
    const isOwner = grupo.creatorId === userId; 
    const currentListenersCount = grupo.listeners?.length || 0;
    
    const mockQueue = [
        { id: 1, title: 'Música 1 (Mock)', cover: 'https://placehold.co/40x40/000/fff' },
        { id: 2, title: 'Música 2 (Mock)', cover: 'https://placehold.co/40x40/000/fff' },
    ];


    return (
        <main className="content-area">
            
            <Box className="header" sx={{ textAlign: 'right', marginBottom: '20px' }}>
                <LeaveButton variant="contained" onClick={handleLeaveGroup}>Sair do Grupo</LeaveButton>
            </Box>

            <Box className="main-content" sx={{ 
                display: 'flex', 
                gap: '20px',
                flexDirection: { xs: 'column', sm: 'row' } 
            }}>
                
                <Box className="left-panel" sx={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '8px', flex: 2, display: 'flex', flexDirection: 'column' }}>
                    
                    <Box className="search-bar" sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px', 
                        marginBottom: '20px', 
                        backgroundColor: 'var(--header-bg)',
                        padding: { xs: '10px', sm: '10px 15px' },
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        borderBottom: { xs: '1px solid var(--border-color)', sm: 'none' },
                        
                    }}>
                        
                        <Typography className="search-add" sx={{ 
                            color: 'var(--orange)', fontWeight: 'bold', 
                            whiteSpace: 'nowrap',
                            borderRight: { xs: 'none', sm: '1px solid var(--border-color)' }, 
                            width: { xs: '100%', sm: 'auto' },
                            textAlign: { xs: 'center', sm: 'left' },
                            padding: { xs: '0 0 10px 0', sm: '0 15px 0 0' },
                            borderBottom: { xs: '1px solid var(--border-color)', sm: 'none' },
                        }}>
                            Adicionar Música
                        </Typography>
                        
                        <Box sx={{ 
                            display: 'flex', alignItems: 'center', flexGrow: 1, 
                            padding: { xs: '0', sm: '0 10px' },
                            width: '100%',
                        }}>
                            <SearchIcon sx={{ color: 'var(--secondary-text-color)', fontSize: '24px', cursor: 'pointer', mr: 1 }} />
                            <StyledInput placeholder="Pesquisar" fullWidth disableUnderline />
                        </Box>
                    </Box>

                    <Typography variant="h6" className="section-title" sx={{ marginBottom: '15px', color: 'var(--text-color)' }}>Fila</Typography>
                    
                    <List className="queue-list" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '10px', p: 0 }}>
                        {mockQueue.map((item, index) => (
                            <QueueItemBox key={item.id}>
                                <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                                    <ListItemAvatar>
                                        <Avatar className="music-thumbnail" sx={{ width: 40, height: 40, borderRadius: '4px' }}>
                                            <img src={item.cover} alt="Capa" style={{ width: '100%', objectFit: 'cover' }} />
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText primary={item.title} primaryTypographyProps={{ className: 'music-title', sx: { color: 'var(--text-color)', marginLeft: '10px', flexGrow: 1 } }} />
                                </Box>

                                <IconButton aria-label="Remover" sx={{ p: 0 }}>
                                    <CloseIcon sx={{ color: 'var(--secondary-text-color)' }} />
                                </IconButton>
                            </QueueItemBox>
                        ))}
                    </List>
                </Box>

                <Box className="right-panel" sx={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '8px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    
                    <Box className="panel-section owner" sx={{ width: '100%', marginBottom: '20px' }}>
                        <Typography variant="subtitle1" className="section-subtitle" sx={{ marginBottom: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '5px' }}>Dono(a)</Typography>
                        <Box className="owner-info" sx={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-color)' }}>
                            
                            <PetsIcon sx={{ 
                                color: 'var(--orange)',
                                fontSize: '20px' 
                            }} />
                            
                            <Typography className="owner-name" sx={{ fontWeight: 'bold' }}>
                                {grupo.creatorId === userId ? MOCK_USER_NAME : `Usuário ${grupo.creatorId}`}
                            </Typography>
                        </Box>
                    </Box>

                    <Box className="panel-section participants" sx={{ width: '100%', marginBottom: '20px' }}>
                        <Typography variant="subtitle1" className="section-subtitle" sx={{ marginBottom: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '5px' }}>
                            Ouvindo Agora ({currentListenersCount})
                        </Typography>
                        <List className="participants-list" sx={{ p: 0 }}>
                            {grupo.listeners?.map((pId, index) => {
                                const isCurrentUser = pId === userId;
                                const textColor = isCurrentUser ? 'var(--orange)' : 'var(--text-color)';
                                const displayName = isCurrentUser ? MOCK_USER_NAME : `Usuário ${pId}`;

                                return (
                                    <ListItem key={index} sx={{ p: 0, mb: 0.5, color: textColor }}>
                                        <PersonIcon sx={{ color: isCurrentUser ? 'var(--orange)' : 'var(--secondary-text-color)', fontSize: '15px', mr: 1 }} />
                                        
                                        <ListItemText 
                                            primary={displayName} 
                                            primaryTypographyProps={{ 
                                                fontSize: '15px',
                                                fontWeight: isCurrentUser ? 'bold' : 'normal',
                                                color: textColor
                                            }} 
                                        />
                                    </ListItem>
                                );
                            })}
                        </List>

                        <Typography variant="subtitle1" className="section-subtitle" sx={{ marginTop: '20px', marginBottom: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '5px' }}>
                            Todos Membros ({grupo.members.length})
                        </Typography>
                        <List className="participants-list" sx={{ p: 0 }}>
                            {grupo.members?.map((pId, index) => {
                                const isCurrentUser = pId === userId;
                                const textColor = isCurrentUser ? 'var(--orange)' : 'var(--text-color)';
                                const displayName = isCurrentUser ? MOCK_USER_NAME : `Usuário ${pId}`;

                                return (
                                    <ListItem key={index} sx={{ p: 0, mb: 0.5, color: textColor }}>
                                        <PersonIcon sx={{ color: 'var(--secondary-text-color)', fontSize: '15px', mr: 1 }} />
                                        <ListItemText 
                                            primary={displayName} 
                                            primaryTypographyProps={{ 
                                                fontSize: '15px',
                                                fontWeight: isCurrentUser ? 'bold' : 'normal',
                                                color: textColor
                                            }} 
                                        />
                                    </ListItem>
                                );
                            })}
                        </List>
                    </Box>
                    
                    {isOwner && (
                        <Button variant="contained" className="settings-button" sx={{ 
                            backgroundColor: 'var(--orange)', color: 'white', 
                            padding: '10px 20px', borderRadius: '20px', 
                            marginTop: 'auto',
                            '&:hover': { backgroundColor: 'var(--darker-orange)' }
                        }}>
                            Configurações
                        </Button>
                    )}
                </Box>
            </Box>
        </main>
    );
}

export default GrupoDetalhe;