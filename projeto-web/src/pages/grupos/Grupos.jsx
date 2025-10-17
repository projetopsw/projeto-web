import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Typography, 
    Button, 
    TextField, 
    TextareaAutosize, 
    styled, 
    Divider,
    Stack,
    CircularProgress
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux'; 
import AddCircleIcon from '@mui/icons-material/AddCircle';
import HeadphonesIcon from '@mui/icons-material/Headphones';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import api from '../../services/api'; 
import UserSelector from '../../components/UserSelector'; 

const DEFAULT_GROUP_COVER = 'https://placehold.co/600x600/607D8B/white?text=GRUPO';

const GruposContainer = styled(Box)(({ theme }) => ({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
    marginBottom: '40px',
}));


const GrupoCard = styled(Box)(({ theme, isNew = false }) => ({
    background: isNew ? 'var(--border-color)' : 'var(--header-bg)',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: isNew ? 'none' : '0 4px 15px rgba(0,0,0,0.5)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
    position: 'relative',
    height: '100%',
    
    ...(isNew && {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: '30px 15px',
        border: '2px dashed #444',
        cursor: 'pointer',
        '&:hover': {
            borderColor: 'var(--orange)',
            boxShadow: '0 0 10px rgba(255, 107, 0, 0.3)',
            transform: 'none',
        },
    }),
    
    ...(!isNew && {
        '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: '0 8px 20px rgba(0,0,0,0.7)',
        },
    }),
}));

const CustomTextField = styled(TextField)(({ theme }) => ({
    '& .MuiInputBase-root': { 
        color: 'var(--text-color)', 
        backgroundColor: 'var(--input-bg)',
        borderRadius: '4px',
    }, 
    '& .MuiInputLabel-root': { 
        color: 'var(--secondary-text-color)' 
    },
    '& .MuiFilledInput-root': {
        backgroundColor: 'var(--input-bg)',
        '&:hover': {
            backgroundColor: 'var(--input-bg-hover)',
        },
        '&.Mui-focused': {
            backgroundColor: 'var(--input-bg)',
        },
        '&:after': {
            borderBottomColor: 'var(--orange)',
        },
    }
}));


const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
};


const GrupoItem = ({ grupo, onJoin, currentUserId }) => {
    const listenersCount = grupo.listeners?.length || 0;
    const isListening = (grupo.listeners || []).includes(currentUserId);
    const isMember = (grupo.members || []).includes(currentUserId);

    const statusColor = listenersCount > 0 ? 'var(--orange)' : 'var(--secondary-text-color)';
    
    const buttonText = isListening ? 'Ouvindo Agora' : 'Entrar na Sala';
    const buttonDisabled = isListening; 
    const buttonBg = isListening ? '#666' : 'var(--orange)';

    return (
        <GrupoCard>
            <Link to={`/grupos/${grupo.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <Box className="img-cima" sx={{ position: 'relative' }}>
                    <img src={grupo.cover} alt={`Capa do grupo ${grupo.name}`} style={{ width: '100%', height: '150px', objectFit: 'cover', filter: 'brightness(70%)' }} />
                    <Typography variant="caption" className="grupo-status" sx={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0, 0, 0, 0.6)', color: 'var(--text-color)', padding: '5px 10px', borderRadius: '20px', display: 'flex', alignItems: 'center' }}>
                        <HeadphonesIcon sx={{ color: statusColor, fontSize: '14px', mr: 0.5 }} /> {listenersCount} ouvindo
                    </Typography>
                </Box>
            </Link>
            <Box className="conteudo-baixo" sx={{ padding: '15px' }}>
                <Link to={`/grupos/${grupo.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Typography variant="h6" component="h3" sx={{ margin: 0, fontSize: '20px', color: 'var(--text-color)' }}>
                        {grupo.name}
                    </Typography>
                </Link>
                <Box className="info-musica" sx={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-color)', fontSize: '14px', margin: '8px 0', overflow: 'hidden' }}>
                    <MusicNoteIcon sx={{ color: 'var(--orange)', fontSize: '14px' }} />
                    Tocando: {grupo.currentSong || 'N/A'}
                </Box>
                <Typography variant="body2" className="info-integrantes" sx={{ fontSize: '13px', color: '#999', marginBottom: '15px' }}>
                    Total de membros: {grupo.members?.length || 0}
                </Typography>
                <Button 
                    variant="contained" 
                    className="btn-entrar" 
                    onClick={() => onJoin(grupo.id, isMember)}
                    disabled={buttonDisabled}
                    sx={{ 
                        width: '100%', padding: '12px', borderRadius: '8px',
                        backgroundColor: buttonBg, 
                        color: 'white', fontWeight: 'bold',
                        '&:hover': { backgroundColor: buttonBg === '#666' ? '#666' : 'var(--darker-orange)' }
                    }}
                >
                    {buttonText}
                </Button>
            </Box>
        </GrupoCard>
    );
};


function Grupos() {
    const userId = useSelector(state => state.auth.user?.id); 
    
    const currentUserId = userId || "1";

    const [isFormVisible, setIsFormVisible] = useState(false);
    const [myCreatedGroups, setMyCreatedGroups] = useState([]);
    const [featuredGroups, setFeaturedGroups] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [groupName, setGroupName] = useState('');
    const [groupDescription, setGroupDescription] = useState('');
    const [groupCoverFile, setGroupCoverFile] = useState(null);
    const [fileName, setFileName] = useState('Nenhum arquivo selecionado');
    const navigate = useNavigate();

    const leaveAllGroups = async (groups) => {
        const safeGroups = Array.isArray(groups) ? groups : [];
        const leavePromises = safeGroups.map(async (group) => {
            if ((group.listeners || []).includes(currentUserId)) {
                try {
                    const updatedListeners = (group.listeners || []).filter(id => id !== currentUserId);
                    const newStatus = updatedListeners.length > 0 ? "Ao vivo" : "Offline";

                    await api.patch(`/groups/${group.id}`, {
                        listeners: updatedListeners,
                        status: newStatus
                    });
                } catch (error) {
                    if (error.response?.status !== 404) {
                        console.error(`Erro ao sair do grupo ${group.id}:`, error);
                    }
                }
            }
        });
        await Promise.all(leavePromises);
    };

    const fetchGroups = async () => {
        if (!currentUserId) return; 
        
        setIsLoading(true);
        try {
            const allGroupsResponse = await api.get('/groups');
            const allGroups = Array.isArray(allGroupsResponse.data) ? allGroupsResponse.data : [];

            const createdGroups = allGroups.filter(g => g.creatorId === currentUserId);
            
            const otherGroups = allGroups.filter(g => g.creatorId !== currentUserId); 
            
            setMyCreatedGroups(createdGroups);
            setFeaturedGroups(otherGroups);

        } catch (error) {
            console.error("Erro ao carregar grupos:", error);
            setMyCreatedGroups([]);
            setFeaturedGroups([]); 
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, [currentUserId]);

    const resetForm = () => {
        setGroupName('');
        setGroupDescription('');
        setGroupCoverFile(null);
        setFileName('Nenhum arquivo selecionado');
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setGroupCoverFile(file);
            setFileName(file.name);
        } else {
            setGroupCoverFile(null);
            setFileName('Nenhum arquivo selecionado');
        }
    };

   const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim() || !currentUserId) return;

    setIsSubmitting(true);
    try {
        let coverData = DEFAULT_GROUP_COVER;
        if (groupCoverFile) {
            coverData = await fileToBase64(groupCoverFile);
        }

        const allGroupsResponse = await api.get('/groups');
        await leaveAllGroups(allGroupsResponse.data);

        const newGroupData = {
            name: groupName.trim(),
            description: groupDescription,
            cover: coverData, 
            creatorId: currentUserId, 
            members: [currentUserId],
            listeners: [currentUserId], 
            currentSong: null,
            status: "Ao vivo", 
        };

        const response = await api.post('/groups', newGroupData);
        
        const newGroupObject = response.data;
        const newGroupId = newGroupObject.id; 
        
        // *** SE O newGroupId ESTIVER VINDO COMO NÚMERO, GARANTA QUE É UMA STRING ***
        // newGroupId = String(newGroupId); 

        resetForm();
        setIsFormVisible(false);
        
        navigate(`/grupos/${newGroupId}`);

    } catch (error) {
        console.error("Erro ao criar grupo:", error);
        alert("Erro ao criar grupo. Verifique o json-server e o formato da resposta.");
    } finally {
        setIsSubmitting(false);
    }
};

    const handleJoinGroup = async (groupId, isAlreadyMember) => {
        if (!currentUserId) return;

        try {
            const allGroupsResponse = await api.get('/groups');
            await leaveAllGroups(allGroupsResponse.data);

            const groupResponse = await api.get(`/groups/${groupId}`);
            const group = groupResponse.data;

            let updatedMembers = group.members || [];
            
            if (!isAlreadyMember) {
                updatedMembers = [...updatedMembers, currentUserId];
            }
            
            let updatedListeners = group.listeners || [];
            updatedListeners = [...updatedListeners, currentUserId];

            const newStatus = "Ao vivo";

            await api.patch(`/groups/${groupId}`, { 
                members: updatedMembers,
                listeners: updatedListeners,
                status: newStatus 
            });

            navigate(`/grupos/${groupId}`);
            
        } catch (error) {
            console.error("Erro ao entrar no grupo:", error);
            alert("Não foi possível entrar no grupo. Tente novamente.");
        }
    };

    if (isLoading || !currentUserId) {
        return (
            <main className="content-area" style={{paddingTop: '50px', textAlign: 'center'}}>
                <CircularProgress sx={{ color: 'var(--orange)' }} />
                <Typography sx={{ color: 'var(--text-color)', marginTop: '10px' }}>Carregando Grupos...</Typography>
            </main>
        );
    }

    return (
        <main className="content-area">
            <UserSelector /> 
            
            <Box sx={{ display: isFormVisible ? 'none' : 'block' }}>

                <Box className="meus-grupos">
                    <Typography variant="h5" component="h2" sx={{ marginBottom: '15px', color: 'var(--secondary-text-color)' }}>
                        Meus Grupos Criados ({myCreatedGroups.length})
                    </Typography>
                    <GruposContainer>
                        <GrupoCard isNew onClick={() => { setIsFormVisible(true); resetForm(); }}>
                            <AddCircleIcon className="icone-add" sx={{ fontSize: '40px', color: 'var(--orange)', marginBottom: '10px' }} />
                            <Typography sx={{ fontSize: '16px', fontWeight: 'bold' }}>Criar novo grupo</Typography>
                        </GrupoCard>

                        {myCreatedGroups.map((grupo) => (
                            <GrupoItem 
                                key={grupo.id} 
                                grupo={grupo}
                                onJoin={handleJoinGroup}
                                currentUserId={currentUserId}
                            />
                        ))}
                    </GruposContainer>
                </Box>

                <Divider sx={{ my: 4, borderColor: 'var(--border-color)' }} /> 

                <Box className="grupos-destaque">
                    <Typography variant="h5" component="h2" sx={{ marginBottom: '15px', color: 'var(--secondary-text-color)' }}>
                        Outros Grupos ({featuredGroups.length})
                    </Typography>
                    <GruposContainer>
                        {featuredGroups.map((grupo) => (
                            <GrupoItem 
                                key={grupo.id} 
                                grupo={grupo}
                                onJoin={handleJoinGroup}
                                currentUserId={currentUserId}
                            />
                        ))}
                    </GruposContainer>
                </Box>
            </Box>

            <Box className="form-grupo" sx={{ display: isFormVisible ? 'block' : 'none', maxWidth: '500px', margin: '0 auto', padding: '20px', background: 'var(--card-bg)', borderRadius: '12px' }}>
                <Typography variant="h5" component="h2" sx={{ marginBottom: '20px', color: 'var(--text-color)' }}>
                    Criar novo grupo
                </Typography>
                <form onSubmit={handleCreateGroup}>
                    
                    <Typography component="label" htmlFor="nome-grupo" sx={{ display: 'block', mt: 2, color: 'var(--secondary-text-color)' }}>Nome do Grupo *</Typography>
                    <CustomTextField 
                        fullWidth 
                        id="nome-grupo" 
                        placeholder="Ex: Grupo da Galera" 
                        variant="filled" 
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        InputProps={{ disableUnderline: true }}
                        sx={{ mb: 2 }} 
                        required
                    />

                    <Typography component="label" htmlFor="descricao-grupo" sx={{ display: 'block', color: 'var(--secondary-text-color)' }}>Descrição</Typography>
                    <TextareaAutosize 
                        minRows={3} 
                        id="descricao-grupo" 
                        value={groupDescription}
                        onChange={(e) => setGroupDescription(e.target.value)}
                        style={{ 
                            width: '100%', 
                            marginBottom: '20px', 
                            padding: '10px', 
                            backgroundColor: 'var(--input-bg)', 
                            color: 'var(--text-color)', 
                            border: `1px solid var(--border-color)`, 
                            borderRadius: '4px',
                            resize: 'vertical',
                            boxSizing: 'border-box'
                        }} 
                    />

                    <Typography component="label" htmlFor="imagem-grupo" sx={{ display: 'block', color: 'var(--secondary-text-color)' }}>Imagem de Capa (Opcional)</Typography>
                    <Box className="upload-container" sx={{ display: 'flex', alignItems: 'center', gap: '10px', mb: 3 }}>
                        <Typography variant="body2" className="file-name" sx={{ color: 'var(--secondary-text-color)' }}>{fileName}</Typography>
                        <Button component="label" variant="contained" className="btn-upload" sx={{ backgroundColor: 'var(--orange)', '&:hover': { backgroundColor: 'var(--darker-orange)' } }}>
                            Escolher arquivo
                            <input 
                                type="file" 
                                hidden 
                                id="imagem-grupo" 
                                accept="image/*" 
                                onChange={handleFileChange}
                            />
                        </Button>
                    </Box>

                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                        <Button 
                            variant="outlined" 
                            className="btn-cancelar" 
                            onClick={() => { setIsFormVisible(false); resetForm(); }}
                            sx={{ color: 'var(--text-color)', borderColor: 'var(--border-color)' }}
                        >
                            Cancelar
                        </Button>
                        <Button 
                            type="submit" 
                            variant="contained" 
                            className="btn-criar" 
                            sx={{ backgroundColor: 'var(--orange)', '&:hover': { backgroundColor: 'var(--darker-orange)' } }}
                            disabled={isSubmitting || !groupName.trim()}
                        >
                            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Criar Grupo'}
                        </Button>
                    </Stack>
                </form>
            </Box>
        </main>
    );
}

export default Grupos;