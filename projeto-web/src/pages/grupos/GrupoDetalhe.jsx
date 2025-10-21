<<<<<<< Updated upstream
=======
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    addSingleSongToQueue,
    removeSongFromQueue
} from '../../redux/playerSlice';

import {
    selectGroupById,
    fetchGroups
} from '../../redux/grupoSlice';

import { selectUser } from '../../redux/userSlice'; 


import {
    Box,
    Typography,
    Divider,
    List,
    ListItem,
    ListItemText,
    Paper,
    styled,
    CircularProgress,
    Avatar,
    ListItemAvatar,
    IconButton,
    Grid
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'; 

import SearchMusicLocal from '../../components/SearchMusic';
import './Grupo.css';


// ----------------------------------------------------
// DADOS FIXOS: SIMULAÇÃO DO DB.JSON/API (USUÁRIOS)
// ----------------------------------------------------
const ALL_USERS_FROM_DB = [
    { id: "1", name: "Bebel", email: "anabel@email.com", img: "https://w7.pngwing.com/pngs/787/162/png-transparent-hello-kitty-hello-kitty-cartoon-desktop-wallpaper-character-thumbnail.png" },
    { id: "2", name: "Bia", email: "bia@email.com", img: "https://akamai.sscdn.co/uploadfile/letras/fotos/b/b/c/1/bbc12de6f692c1c9fd655f3a377f2c71.jpg" },
    { id: "3", name: "IgorGodoy", email: "igor@email.com", img: "/assets/img/piano_cover_3.png" },
    { id: "4", name: "Malu", email: "malu@email.com", img: "https://pm1.aminoapps.com/7759/2711b1c6d2da142fc9c8680b7527caf246662c52r1-521-521v2_hq.jpg" },
    { id: "e297", name: "Diogo", email: "Diogo@email.com", img: "https://img.freepik.com/vetores-premium/imagem-de-perfil-de-personagem-de-desenho-animado-avatar-jovem_18591-55057.jpg" },
    { id: "101", name: "Luiza", email: "luiza@email.com", img: "/assets/img/vibe_cover_2.png" },
    { id: "102", name: "André", email: "andre@email.com", img: "/assets/img/rock_cover_1.png" },
    { id: "201", name: "Pedro", email: "pedro@email.com", img: "/assets/img/liked_cover_0.png" },
    { id: "202", name: "Carla", email: "carla@email.com", img: "https://i.pinimg.com/originals/c6/de/4f/c6de4fbc92c32c25dd90c41884968d63.jpg" },
    { id: "71a1", name: "Ana Isabel", email: "anaisabel@email.com", img: "/assets/img/rock_cover_1.png" }
];


// ----------------------------------------------------
// ESTILO para os Quadrados (Paper)
// ----------------------------------------------------
const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(3),
    backgroundColor: 'var(--card-bg)',
    borderRadius: '12px',
    boxShadow: '0 4px 12px var(--shadow-color-dark)',
    
    '&.header-box': {
        height: 'auto',
    },
    '&.queue-box': {
        flexGrow: 1,
        overflowY: 'auto',
        minHeight: 'calc(100vh - 280px)',
    }
}));


function GrupoDetalhe() {
    const { id } = useParams();
    const groupId = id;
    const dispatch = useDispatch();
    
    // ====================================================================
    // 💡 DADOS DO REDUX
    // ====================================================================
    const groupDataRedux = useSelector((state) => selectGroupById(state, groupId));
    const groupStatus = useSelector((state) => state.groups.status);

    // Usuário Logado (para identificar "Você" e "Adicionado por")
    const userFromUserSlice = useSelector(selectUser); 
    const currentUser = useMemo(() => ({
        id: String(userFromUserSlice?.id || '1'), // ID de fallback para 'Bebel' (Dono do mock)
        name: userFromUserSlice?.name || 'Bebel', 
        identifier: String(userFromUserSlice?.id || '1'), 
    }), [userFromUserSlice]);

    // Fila de Reprodução
    const queue = useSelector(state => state.player.queue || []);
    const currentSong = useSelector(state => state.player.currentSong);
    const queueIndex = useSelector(state => state.player.queueIndex);
    
    // ====================================================================
    // 💡 MOCK DE DADOS E ESTADO LOCAL
    // ====================================================================
    // MOCK de dados de Grupo (Apenas se o Redux falhar ou estiver vazio)
    // Usamos IDs do seu db.json: 1 (Bebel), 2 (Bia), 3 (IgorGodoy), 4 (Malu)
    const mockGroupDetails = useMemo(() => ({
        id: groupId, // Garante que o ID do mock corresponde ao parâmetro da URL
        name: 'Grupo Padrão (Mock)',
        description: 'Um grupo de fallback caso o grupo real não seja encontrado.',
        creatorId: '1', // Bebel é a criadora
        members: ['1', '2', '3', '4', '101', '71a1'], // Lista de IDs de membros
    }), [groupId]);

    // O grupo a ser renderizado (preferência pelo Redux)
    const currentGroup = groupDataRedux || mockGroupDetails;

    // Apenas os usuários precisam de estado local de inicialização
    const [allUsers, setAllUsers] = useState([]); 
    
    // ----------------------------------------------------
    // 💡 LÓGICA DE BUSCA DE DADOS (Grupo + Todos os Usuários)
    // ----------------------------------------------------

    useEffect(() => {
        // Simula o carregamento de todos os usuários do DB (RÁPIDO)
        setAllUsers(ALL_USERS_FROM_DB);

        // Tenta buscar grupos se o estado for 'idle' e o grupo não estiver no Redux
        if (groupStatus === 'idle' && !groupDataRedux) {
            dispatch(fetchGroups());
        }
    }, [dispatch, groupDataRedux, groupStatus]);


    // ----------------------------------------------------
    // 💡 FUNÇÃO PRINCIPAL: MAPEAMENTO DE MEMBROS
    // ----------------------------------------------------
    const groupMembersDetails = useCallback(() => {
        
        if (!currentGroup || allUsers.length === 0) return [];
        
        // Pega os IDs do array 'members' ou 'memberIds' (usado para flexibilidade)
        const memberIds = currentGroup.members?.map(String) || currentGroup.memberIds?.map(String) || [];
        const creatorId = String(currentGroup.creatorId);
        
        // Garante que a lista de IDs de membros inclua o criador e seja única
        const uniqueMemberIds = Array.from(new Set([...memberIds, creatorId]));

        const memberDetails = uniqueMemberIds
            .map(memberId => {
                // Busca o objeto do usuário na lista 'allUsers'
                const user = allUsers.find(u => String(u.id) === memberId);
                
                if (!user) {
                    return null;
                }

                return {
                    id: String(user.id),
                    name: user.name,
                    identifier: String(user.id), 
                    img: user.img || null,
                    // CORREÇÃO REFORÇADA: Garante que os IDs são strings em ambos os lados
                    isCreator: String(user.id) === String(creatorId),
                    isCurrentUser: String(user.id) === String(currentUser.id),
                };
            })
            .filter(Boolean) // Remove IDs não encontrados (null)
            // Ordena: Dono (Criador) primeiro, depois por nome
            .sort((a, b) => {
                 if (a.isCreator) return -1;
                 if (b.isCreator) return 1;
                 return a.name.localeCompare(b.name);
            });
            
        return memberDetails;

    }, [groupDataRedux, currentGroup, allUsers, currentUser.id]); // currentGroup (que usa mock) é a dependência

    const membersDetails = groupMembersDetails();
    
    // ----------------------------------------------------
    // FUNÇÕES DE GESTÃO DA FILA
    // ----------------------------------------------------
    
    const getAddedByName = useCallback((addedByValue) => {
        // Compara o addedByValue (pode ser ID ou um identificador) com o usuário logado
        if (String(addedByValue) === String(currentUser.id) || addedByValue === currentUser.identifier) {
            return `Você (${currentUser.name})`; 
        }
        
        // Procura na lista DETALHADA de membros
        const member = membersDetails.find(m => String(m.id) === String(addedByValue) || m.identifier === addedByValue);
        
        // Se encontrado, retorna o nome. Se não, retorna o ID/Identificador
        return member ? member.name : addedByValue || 'Desconhecido';
    }, [currentUser, membersDetails]);

    // ... (handleAddToQueue e handleRemoveFromQueue permanecem os mesmos)
    const handleAddToQueue = (song) => {
        const userIdentifier = currentUser.identifier;
        if (!userIdentifier || userIdentifier.includes('desconhecido')) {
            alert("Você precisa estar logado para adicionar músicas à fila.");
            return;
        }

        const songWithUser = {
            ...song,
            addedBy: userIdentifier 
        };

        dispatch(addSingleSongToQueue(songWithUser));
    };
    
    const handleRemoveFromQueue = (songId) => {
        dispatch(removeSongFromQueue(songId));
    };


    // ----------------------------------------------------
    // ESTADOS DE CARREGAMENTO E ERRO
    // ----------------------------------------------------
    if (groupStatus === 'loading' || allUsers.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-color)' }}>
                <CircularProgress sx={{ color: 'var(--orange)' }} />
                <Typography sx={{ ml: 2 }}>Carregando dados do grupo e membros...</Typography>
            </Box>
        );
    }

    // Se a busca terminou (succeeded) e o grupo específico não foi encontrado (null), 
    // e o mock não está sendo usado (ou seja, mockGroupDetails.id não corresponde ao groupId),
    // o que é improvável com a lógica atual, mas é a verificação mais segura.
    if (!groupDataRedux && groupStatus === 'succeeded' && currentGroup.id !== groupId) {
        return <Typography sx={{ p: 5, color: 'red' }}>Grupo não encontrado.</Typography>;
    }
    
    const membersNeedsScroll = membersDetails.length > 8; 
    
    // ----------------------------------------------------
    // RENDERIZAÇÃO PRINCIPAL (Usa currentGroup)
    // ----------------------------------------------------

    return (
        <>
            <main className="content-area" 
                style={{ 
                    padding: '20px 40px', 
                    display: 'flex', 
                    flexDirection: 'column',
                    minHeight: '100%' 
                }}
            >
                
                <Grid container spacing={4} sx={{ flexGrow: 1 }}>

                    {/* Quadrado 1: Nome do Grupo + Descrição + Lista de Membros */}
                    <Grid item xs={12}>
                        <StyledPaper elevation={3} className="header-box">
                            <Box sx={{ mb: 1 }}>
                                <Typography variant="h4" sx={{ color: 'var(--title-color)', mb: 0.5 }}>
                                    {currentGroup.name}
                                </Typography>
                                
                                {currentGroup.description && (
                                    <Typography variant="subtitle1" sx={{ color: 'var(--secondary-text-color)', mb: 2 }}>
                                        {currentGroup.description}
                                    </Typography>
                                )}
                                
                                <Divider sx={{ my: 1, borderColor: 'var(--border-color)' }} />

                                <Typography variant="h6" sx={{ color: 'var(--title-color)', mb: 1, fontWeight: 'bold' }}>
                                    Integrantes ({membersDetails.length}):
                                </Typography>
                            </Box>
                            
                            {/* Lista de Integrantes */}
                            <Box sx={{ 
                                maxHeight: membersNeedsScroll ? '200px' : 'none', 
                                overflowY: membersNeedsScroll ? 'auto' : 'visible',
                                pr: membersNeedsScroll ? 1 : 0 
                            }}>
                                <List dense disablePadding>
                                    {membersDetails.length > 0 ? (
                                        membersDetails.map((member) => {
                                            return (
                                                <ListItem
                                                    key={member.id}
                                                    sx={{ 
                                                        py: 0.5, 
                                                        px: 0,
                                                        borderBottom: '1px dotted var(--border-color-light)',
                                                        '&:last-child': { borderBottom: 'none' }
                                                    }}
                                                >
                                                    <ListItemAvatar>
                                                        {/* Avatar do Membro */}
                                                        <Avatar src={member.img} sx={{ width: 32, height: 32 }} />
                                                    </ListItemAvatar>

                                                    <ListItemText
                                                        primary={
                                                            <Typography 
                                                                variant="body1" 
                                                                sx={{ color: member.isCurrentUser ? 'var(--orange)' : 'var(--text-color)' }}
                                                            >
                                                                {/* 💡 AQUI EXIBE O NOME DO MEMBRO, DONO E VOCÊ */}
                                                                {member.name} 
                                                                {member.isCurrentUser && <span style={{ marginLeft: '8px' }}>(Você)</span>}
                                                                {member.isCreator && (
                                                                    <span style={{ fontWeight: 'bold', marginLeft: '8px', color: 'var(--orange)' }}>(Dono)</span>
                                                                )}
                                                            </Typography>
                                                        }
                                                        secondary={`ID: ${member.id}`}
                                                        sx={{ ml: 1 }}
                                                    />
                                                </ListItem>
                                            );
                                        })
                                    ) : (
                                        <Typography variant="body2" sx={{ color: 'var(--secondary-text-color)', p: 1 }}>
                                            Nenhum membro encontrado neste grupo.
                                        </Typography>
                                    )}
                                </List>
                            </Box>
                        </StyledPaper>
                    </Grid>

                    {/* Quadrado 2: Busca e Fila de Reprodução */}
                    <Grid item xs={12} sx={{ flexGrow: 1 }}>
                        <StyledPaper elevation={3} className="queue-box">
                            <Typography variant="h5" sx={{ color: 'var(--title-color)', mb: 2 }}>
                                🎵 Adicionar Música à Fila
                            </Typography>
                            
                            <Box sx={{ mb: 4, position: 'relative' }}>
                                <SearchMusicLocal 
                                    onSongSelect={handleAddToQueue} 
                                />
                            </Box>
                            
                            <Divider sx={{ my: 3, borderColor: 'var(--border-color)' }} />

                            {/* Fila de Reprodução Atual */}
                            <Box>
                                <Typography variant="h5" sx={{ color: 'var(--title-color)', mb: 2 }}>
                                    Fila de Reprodução
                                </Typography>
                                
                                {currentSong ? (
                                    <Paper elevation={1} sx={{ 
                                            p: 1.5, 
                                            mb: 2, 
                                            backgroundColor: 'var(--bg-light)', 
                                            borderLeft: '4px solid var(--orange)',
                                            display: 'flex', 
                                            alignItems: 'center'
                                        }}>
                                        <Avatar 
                                            src={currentSong.cover} 
                                            alt={currentSong.title} 
                                            variant="square"
                                            sx={{ width: 48, height: 48, mr: 2, borderRadius: '4px' }}
                                        />
                                        <Box>
                                        <Typography variant="body1" sx={{ color: 'var(--orange)', fontWeight: 'bold' }}>
                                            Tocando Agora ({queueIndex + 1}/{queue.length}):
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'var(--text-color)' }}>
                                            {currentSong.title}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'var(--secondary-text-color)' }}>
                                            {currentSong.artist} 
                                            {currentSong.addedBy && ` | Adicionado por: ${getAddedByName(currentSong.addedBy)}`}
                                        </Typography>
                                        </Box>
                                    </Paper>
                                ) : (
                                    <Typography sx={{ color: 'var(--secondary-text-color)', mb: 2 }}>
                                        Nenhuma música tocando. Adicione a primeira!
                                    </Typography>
                                )}
                                
                                {/* Próximas na Fila */}
                                <Typography variant="h6" sx={{ color: 'var(--title-color)', mb: 2 }}>
                                    Próximas na Fila ({queue.length - (queueIndex + 1)} restantes)
                                </Typography>
                                
                                {queue.length > 0 && queueIndex !== -1 ? (
                                    <List dense>
                                        {queue.slice(queueIndex + 1).map((song, index) => (
                                            <ListItem
                                                key={song.id + '-' + (queueIndex + 1 + index)} 
                                                sx={{ 
                                                    borderBottom: '1px solid var(--border-color-light)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between'
                                                     }}
                                            >
                                            <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0, flexGrow: 1 }}>
                                                <ListItemAvatar>
                                                    <Avatar 
                                                        src={song.cover} 
                                                        alt={song.title} 
                                                        variant="square"
                                                        sx={{ width: 40, height: 40, borderRadius: '4px' }}
                                                    />
                                                </ListItemAvatar>
                                                
                                                <ListItemText
                                                    primary={<Typography sx={{ color: 'var(--text-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        #{queueIndex + 2 + index}: {song.title}
                                                        </Typography>}
                                                    secondary={<Typography sx={{ color: 'var(--secondary-text-color)' }}>{song.artist}</Typography>}
                                                    sx={{ ml: 1 }} 
                                                />
                                                </Box>
                                                
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                                                    {song.addedBy ? (
                                                        <Typography variant="caption" sx={{ color: 'var(--secondary-text-color)', minWidth: 150, textAlign: 'right' }}>
                                                            Adicionado por: <br/><strong>{getAddedByName(song.addedBy)}</strong> 
                                                        </Typography>
                                                    ) : (
                                                                <Typography variant="caption" sx={{ color: 'var(--secondary-text-color)', minWidth: 150, textAlign: 'right' }}>
                                                                    Adicionado por: <br/>Desconhecido
                                                                </Typography>
                                                        )}
                                                        <IconButton 
                                                            onClick={() => handleRemoveFromQueue(song.id)}
                                                            size="small"
                                                            sx={{ color: 'var(--orange)' }}
                                                            aria-label="remover música"
                                                        >
                                                            <DeleteOutlineIcon />
                                                        </IconButton>
                                                </Box>
                                            </ListItem>
                                        ))}
                                    </List>
                                ) : (
                                    <Typography sx={{ color: 'var(--secondary-text-color)' }}>
                                        A fila de espera está vazia.
                                    </Typography>
                                )}
                            </Box>
                        </StyledPaper>
                    </Grid>

                </Grid>
                
            </main>
        </>
    );
}

export default GrupoDetalhe;
>>>>>>> Stashed changes
