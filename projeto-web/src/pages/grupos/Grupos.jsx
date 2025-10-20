import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Typography,
    Button,
    TextField,
    TextareaAutosize,
    styled,
    Divider,
    Stack,
    CircularProgress,
    IconButton,
    Modal,
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import HeadphonesIcon from '@mui/icons-material/Headphones';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import ShareIcon from '@mui/icons-material/Share';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import api from '../../services/api';

import {
    fetchGroups,
    deleteGroup,
    selectGroupStatus, 
    updateGroupDetails,
} from '../../redux/grupoSlice'; 

import { 
    selectAllGroups,
    selectActiveGroupId 
} from '../../redux/grupoSlice'; 

const DEFAULT_GROUP_COVER = 'https://placehold.co/600x600/607D8B/white?text=GRUPO';



const GruposContainer = styled(Box)(({ theme }) => ({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
    marginBottom: '40px',
}));

const CustomTextField = styled(TextField)({
    width: '100%',
    marginBottom: '16px',
});

const StyledModalBox = styled(Box)(({ theme }) => ({
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    backgroundColor: 'var(--card-bg)',
    border: '2px solid var(--border-color)',
    borderRadius: '12px',
    boxShadow: 24,
    padding: '30px',
    maxWidth: '90%', 
}));

const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });


const ShareGroupModal = ({ group, onClose }) => {
    const groupUrl = `${window.location.origin}/grupos/${group.id}`;
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(groupUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000); 
        } catch (err) {
            console.error('Falha ao copiar:', err);
        }
    };

    return (
        <Modal open={true} onClose={onClose}>
            <StyledModalBox sx={{ width: 500 }}>
                <IconButton
                    onClick={onClose}
                    sx={{ position: 'absolute', right: 8, top: 8, color: 'var(--secondary-text-color)' }}
                >
                    <CloseIcon />
                </IconButton>
                <Typography variant="h5" sx={{ color: 'var(--orange)', mb: 1, mt: 1 }}>
                    Compartilhar Grupo
                </Typography>
                <Typography variant="h6" sx={{ color: 'var(--text-color)', mb: 3 }}>
                    {group.name}
                </Typography>

                <Typography variant="body2" sx={{ color: 'var(--secondary-text-color)', mb: 1 }}>
                    Copie o link abaixo e compartilhe com seus amigos:
                </Typography>

                <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                        fullWidth
                        value={groupUrl}
                        variant="outlined"
                        size="small"
                        InputProps={{
                            readOnly: true,
                            sx: { 
                                color: 'var(--text-color)', 
                                backgroundColor: 'var(--input-bg)',
                                '& fieldset': { borderColor: 'var(--border-color)' },
                            },
                        }}
                    />
                    <Button
                        className="btn-primary-orange" 
                        onClick={handleCopy}
                        sx={{
                            backgroundColor: copied ? '#4CAF50' : 'var(--orange)', 
                            '&:hover': { backgroundColor: copied ? '#4CAF50' : 'var(--darker-orange)' },
                            minWidth: '100px',
                        }}
                        startIcon={copied ? <CheckCircleIcon /> : <ContentCopyIcon />}
                    >
                        {copied ? 'Copiado!' : 'Copiar'}
                    </Button>
                </Stack>
                
                <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
                    <Button 
                        variant="outlined" 
                        onClick={onClose} 
                        sx={{ color: 'var(--text-color)', borderColor: 'var(--border-color)' }}
                    >
                        Fechar
                    </Button>
                </Stack>
            </StyledModalBox>
        </Modal>
    );
};


const EditGroupModal = ({ group, onClose, onSave, groupsStatus }) => {
    const [name, setName] = useState(group.name);
    const [description, setDescription] = useState(group.description || '');
    const [coverFile, setCoverFile] = useState(null);
    const [fileName, setFileName] = useState('Nenhum arquivo selecionado');
    
    const isSaving = groupsStatus === 'loading'; 
    

    useEffect(() => {
        setName(group.name);
        setDescription(group.description || '');
        setCoverFile(null);
        setFileName('Nenhum arquivo selecionado');
    }, [group]); 

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCoverFile(file);
            setFileName(file.name);
        } else {
            setCoverFile(null);
            setFileName('Nenhum arquivo selecionado');
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!name.trim() || isSaving) return;

        let newCover = group.cover;

        try {
            if (coverFile) {
                newCover = await fileToBase64(coverFile);
            }

            const updatedData = {
                name: name.trim(),
                description: description.trim(),
                cover: newCover,
            };

            await onSave({ groupId: group.id, data: updatedData });
            onClose(); 
            
        } catch (error) {
            console.error('Falha ao salvar o grupo:', error);
        } 
    };

    return (
        <Modal open={true} onClose={onClose}>
            <StyledModalBox>
                <IconButton
                    onClick={onClose}
                    sx={{ position: 'absolute', right: 8, top: 8, color: 'var(--secondary-text-color)' }}
                >
                    <CloseIcon />
                </IconButton>
                <Typography variant="h5" sx={{ color: 'var(--text-color)', mb: 3 }}>
                    Editar Grupo: {group.name}
                </Typography>
                <form onSubmit={handleSave}>
                    <Typography component="label" sx={{ display: 'block', mt: 1, color: 'var(--secondary-text-color)' }}>
                        Nome do Grupo *
                    </Typography>
                    <CustomTextField
                        className="custom-textfield" // USA A CLASSE CSS
                        placeholder="Nome do Grupo"
                        variant="filled"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        InputProps={{ disableUnderline: true }}
                        required
                    />

                    <Typography component="label" sx={{ display: 'block', color: 'var(--secondary-text-color)' }}>
                        Descrição
                    </Typography>
                    <TextareaAutosize
                        minRows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="custom-textarea" // USA A CLASSE CSS
                    />

                    <Typography component="label" sx={{ display: 'block', color: 'var(--secondary-text-color)' }}>
                        Nova Imagem de Capa (Opcional)
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', mb: 3 }}>
                        <Typography variant="body2" sx={{ color: 'var(--secondary-text-color)' }}>
                            {fileName}
                        </Typography>
                        <Button 
                            component="label" 
                            variant="contained" 
                            className="btn-primary-orange" // USA A CLASSE CSS
                        >
                            Escolher arquivo
                            <input type="file" hidden accept="image/*" onChange={handleFileChange} />
                        </Button>
                    </Box>

                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                        <Button variant="outlined" onClick={onClose} sx={{ color: 'var(--text-color)', borderColor: 'var(--border-color)' }}>
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            className="btn-primary-orange" // USA A CLASSE CSS
                            disabled={isSaving || !name.trim()}
                        >
                            {isSaving ? <CircularProgress size={24} color="inherit" /> : 'Salvar'}
                        </Button>
                    </Stack>
                </form>
            </StyledModalBox>
        </Modal>
    );
};



const GrupoItem = React.memo(({ grupo, onJoin, currentUserId, onDelete, onEdit, onShare }) => {
    const listenersCount = grupo.listeners?.length || 0;
    const currentUserIdStr = String(currentUserId); 
    const isListening = (grupo.listeners || []).includes(currentUserIdStr);
    const isCreator = String(grupo.creatorId) === currentUserIdStr;

    const isMember = useMemo(() => (grupo.members || []).includes(currentUserIdStr), [grupo.members, currentUserIdStr]);

    const statusColor = listenersCount > 0 ? 'var(--orange)' : 'var(--secondary-text-color)';
    const buttonBg = isListening ? '#666' : 'var(--orange)';

    return (
        <Box className="grupo-card">
            <Link to={`/grupos/${grupo.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <Box className="img-cima" sx={{ position: 'relative' }}>
                    <img
                        src={grupo.cover || DEFAULT_GROUP_COVER} // Adicionada fallback para a capa
                        alt={`Capa do grupo ${grupo.name}`}
                        className="card-cover"
                    />
                    {/* Status Ouvindo */}
                    <Typography
                        variant="caption"
                        sx={{
                            position: 'absolute', top: 10, right: 10, background: 'rgba(0, 0, 0, 0.6)',
                            color: 'var(--text-color)', padding: '5px 10px', borderRadius: '20px',
                            display: 'flex', alignItems: 'center',
                        }}
                    >
                        <HeadphonesIcon sx={{ color: statusColor, fontSize: '14px', mr: 0.5 }} /> 
                        {listenersCount} ouvindo
                    </Typography>

                    {/* Botões de Ação */}
                    <Stack direction="row" spacing={1} sx={{ position: 'absolute', bottom: 10, right: 10 }}>
                        
                        {/* COMPARTILHAR */}
                        <IconButton 
                            size="small" 
                            className="card-action-btn icon-orange"
                            // Garante que o clique não navegue para a página do grupo
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onShare(grupo); }} 
                        >
                            <ShareIcon fontSize="small" />
                        </IconButton>

                        {isCreator && (
                            <>
                                {/* EDITAR */}
                                <IconButton 
                                    size="small" 
                                    className="card-action-btn icon-orange"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(grupo); }}
                                >
                                    <EditIcon fontSize="small" />
                                </IconButton>
                                
                                {/* EXCLUIR */}
                                <IconButton 
                                    size="small" 
                                    className="card-action-btn icon-red"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(grupo.id); }}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </>
                        )}
                    </Stack>
                </Box>
            </Link>

            <Box className="conteudo-baixo" sx={{ padding: '15px' }}>
                <Link to={`/grupos/${grupo.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Typography
                        variant="h6"
                        component="h3"
                        sx={{ margin: 0, fontSize: '20px', color: 'var(--text-color)' }}
                    >
                        {grupo.name}
                    </Typography>
                </Link>
                <Box
                    sx={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-color)', fontSize: '14px', margin: '8px 0', overflow: 'hidden' }}
                >
                    <MusicNoteIcon sx={{ color: 'var(--orange)', fontSize: '14px' }} />
                    Tocando: {grupo.currentSong || 'N/A'}
                </Box>
                <Typography
                    variant="body2"
                    sx={{ fontSize: '13px', color: '#999', marginBottom: '15px' }}
                >
                    Total de membros: {grupo.members?.length || 0}
                </Typography>
                <Button
                    variant="contained"
                    className="btn-primary-orange"
                    // O onJoin agora simplesmente navega, o check de membro é feito no destino
                    onClick={() => onJoin(grupo.id)} 
                    disabled={isListening}
                    sx={{
                        width: '100%', padding: '12px', borderRadius: '8px',
                        backgroundColor: buttonBg,
                        '&:hover': { backgroundColor: buttonBg === '#666' ? '#666' : 'var(--darker-orange)' },
                    }}
                >
                    {isListening ? 'Ouvindo Agora' : 'Entrar na Sala'}
                </Button>
            </Box>
        </Box>
    );
});

// --------------------------------------------------------------------------
// 5. Componente Principal Grupos
// OTIMIZAÇÃO: Uso de useMemo para filtrar grupos
// --------------------------------------------------------------------------

function Grupos() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Melhorar a obtenção do ID e garantir que seja uma string
    const currentUserId = String(useSelector((state) => state.auth.user?.id) || ''); 

    const allGroups = useSelector(selectAllGroups);
    const groupsStatus = useSelector(selectGroupStatus);

    const [isFormVisible, setIsFormVisible] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false); // Mantido para o form de criação (POST)
    const [groupName, setGroupName] = useState('');
    const [groupDescription, setGroupDescription] = useState('');
    const [groupCoverFile, setGroupCoverFile] = useState(null);
    const [fileName, setFileName] = useState('Nenhum arquivo selecionado');
    const [editingGroup, setEditingGroup] = useState(null);
    const [groupToShare, setGroupToShare] = useState(null); 

    // Otimização: usa useMemo para evitar recalcular a lista a cada render
    const { myCreatedGroups, featuredGroups } = useMemo(() => {
        const created = allGroups.filter((g) => String(g.creatorId) === currentUserId);
        const featured = allGroups.filter((g) => String(g.creatorId) !== currentUserId);
        return { myCreatedGroups: created, featuredGroups: featured };
    }, [allGroups, currentUserId]);


    // Efeito para buscar grupos na montagem
    useEffect(() => {
        // Busca apenas se o status for 'idle' (ou 'failed' se desejar retry) e o usuário estiver logado
        if (groupsStatus === 'idle' && currentUserId) {
            dispatch(fetchGroups());
        }
    }, [groupsStatus, currentUserId, dispatch]);

    const resetForm = () => {
        setGroupName(''); setGroupDescription(''); setGroupCoverFile(null); setFileName('Nenhum arquivo selecionado');
    };

    // FUNÇÃO handleFileChange para o Formulário de CRIAÇÃO (Inalterado)
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
        if (!groupName.trim()) return;

        setIsSubmitting(true);
        let coverBase64 = DEFAULT_GROUP_COVER;
        if (groupCoverFile) {
            coverBase64 = await fileToBase64(groupCoverFile);
        }

        const newGroupData = {
            name: groupName.trim(),
            description: groupDescription.trim(),
            creatorId: currentUserId,
            cover: coverBase64,
            members: [currentUserId], // O criador é membro por padrão
            listeners: [],
            currentSong: '',
            status: 'Inativo',
        };

        try {
            // Assumindo que a API retorna o novo grupo
            const response = await api.post('/groups', newGroupData); 
            
            // Depois de criar, buscamos novamente para atualizar o estado global
            // OU melhor: podemos despachar uma ação para adicionar o grupo localmente,
            // mas manter o fetchGroups simplifica o código e garante o estado completo.
            dispatch(fetchGroups()); 
            
            setIsFormVisible(false);
            resetForm();
            navigate(`/grupos/${response.data.id}`);
        } catch (error) {
            console.error('Falha ao criar o grupo:', error);
            alert('Não foi possível criar o grupo.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // Função unificada para despacho de edição (passada ao Modal)
    const handleUpdateGroup = async (payload) => {
        // O status 'loading' para a edição será definido no Redux Slice
        await dispatch(updateGroupDetails(payload));
    };

    const handleJoinGroup = (groupId) => {
        navigate(`/grupos/${groupId}`);
    };

    const handleDeleteGroup = (groupId) => {
        if (window.confirm('Tem certeza que deseja deletar este grupo? Esta ação é irreversível.')) {
            dispatch(deleteGroup(groupId));
        }
    };

    const handleEditGroup = (group) => {
        setEditingGroup(group);
    };
    
    const handleShareGroup = (group) => {
        setGroupToShare(group); 
    };

    const handleCloseShareModal = () => {
        setGroupToShare(null); 
    };

    return (
        <main className="content-area">

            {/* Tratamento de Loading Global (Fetch de grupos) */}
            {groupsStatus === 'loading' && !allGroups.length && !isFormVisible && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                    <CircularProgress sx={{ color: 'var(--orange)' }} />
                    <Typography sx={{ ml: 2, color: 'var(--text-color)' }}>Carregando grupos...</Typography>
                </Box>
            )}

            <Box sx={{ display: isFormVisible ? 'none' : 'block' }}>
                
                {/* Meus Grupos Criados */}
                <Box className="meus-grupos">
                    <Typography
                        variant="h5"
                        component="h2"
                        className="section-title"
                    >
                        Meus Grupos Criados ({myCreatedGroups.length})
                    </Typography>
                    <GruposContainer>
                        {/* Card para Criar Novo Grupo */}
                        <Box 
                            className="grupo-card is-new"
                            onClick={() => { setIsFormVisible(true); resetForm(); }}
                        >
                            <AddCircleIcon
                                sx={{ fontSize: '40px', color: 'var(--orange)', marginBottom: '10px' }}
                            />
                            <Typography sx={{ fontSize: '16px', fontWeight: 'bold' }}>
                                Criar novo grupo
                            </Typography>
                        </Box>

                        {/* Listagem dos Grupos Criados */}
                        {myCreatedGroups.map((grupo) => (
                            <GrupoItem
                                key={grupo.id}
                                grupo={grupo}
                                onJoin={handleJoinGroup}
                                onDelete={handleDeleteGroup}
                                onEdit={handleEditGroup}
                                onShare={handleShareGroup}
                                currentUserId={currentUserId}
                            />
                        ))}
                    </GruposContainer>
                </Box>

                <Divider sx={{ my: 4, borderColor: 'var(--border-color)' }} />

                {/* Outros Grupos (Destaque) */}
                <Box className="grupos-destaque">
                    <Typography
                        variant="h5"
                        component="h2"
                        className="section-title"
                    >
                        Outros Grupos ({featuredGroups.length})
                    </Typography>
                    <GruposContainer>
                        {/* Listagem dos Outros Grupos */}
                        {featuredGroups.map((grupo) => (
                            <GrupoItem
                                key={grupo.id}
                                grupo={grupo}
                                onJoin={handleJoinGroup}
                                onDelete={handleDeleteGroup}
                                onEdit={handleEditGroup}
                                onShare={handleShareGroup}
                                currentUserId={currentUserId}
                            />
                        ))}
                    </GruposContainer>
                </Box>
            </Box>

            {/* Formulário de Criação de Grupo (Inalterado) */}
            <Box
                sx={{
                    display: isFormVisible ? 'block' : 'none',
                    maxWidth: '500px',
                    margin: '0 auto',
                    padding: '20px',
                    background: 'var(--card-bg)',
                    borderRadius: '12px',
                }}
            >
                <IconButton
                    onClick={() => setIsFormVisible(false)}
                    sx={{ position: 'absolute', right: 8, top: 8, color: 'var(--secondary-text-color)' }}
                >
                    <CloseIcon />
                </IconButton>
                <Typography variant="h5" sx={{ color: 'var(--orange)', mb: 3 }}>
                    Crie um Novo Grupo
                </Typography>
                <form onSubmit={handleCreateGroup}>
                    <Typography component="label" sx={{ display: 'block', mt: 1, color: 'var(--secondary-text-color)' }}>Nome do Grupo *</Typography>
                    <CustomTextField
                        className="custom-textfield"
                        placeholder="Nome do Grupo"
                        variant="filled"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        InputProps={{ disableUnderline: true }}
                        required
                    />

                    <Typography component="label" sx={{ display: 'block', color: 'var(--secondary-text-color)' }}>Descrição</Typography>
                    <TextareaAutosize
                        minRows={3}
                        value={groupDescription}
                        onChange={(e) => setGroupDescription(e.target.value)}
                        className="custom-textarea"
                    />

                    <Typography component="label" sx={{ display: 'block', color: 'var(--secondary-text-color)' }}>Imagem de Capa (Opcional)</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', mb: 3 }}>
                        <Typography variant="body2" sx={{ color: 'var(--secondary-text-color)' }}>{fileName}</Typography>
                        <Button 
                            component="label" 
                            variant="contained" 
                            className="btn-primary-orange"
                        >
                            Escolher arquivo
                            <input type="file" hidden accept="image/*" onChange={handleFileChange} />
                        </Button>
                    </Box>

                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                        <Button variant="outlined" onClick={() => setIsFormVisible(false)} sx={{ color: 'var(--text-color)', borderColor: 'var(--border-color)' }}>
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            className="btn-primary-orange"
                            disabled={isSubmitting || !groupName.trim()}
                        >
                            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Criar Grupo'}
                        </Button>
                    </Stack>
                </form>
            </Box>


            {/* Modal de Edição de Grupo */}
            {editingGroup && (
                <EditGroupModal
                    group={editingGroup}
                    onClose={() => setEditingGroup(null)}
                    onSave={handleUpdateGroup} // Passa a função de despacho otimizada
                    groupsStatus={groupsStatus} // Passa o status para controle do botão
                />
            )}

            {/* Modal de Compartilhamento */}
            {groupToShare && (
                <ShareGroupModal
                    group={groupToShare}
                    onClose={handleCloseShareModal}
                />
            )}
        </main>
    );
}

export default Grupos;