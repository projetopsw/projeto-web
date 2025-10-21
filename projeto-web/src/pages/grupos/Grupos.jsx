import React, { useState } from 'react';
import { 
    Box, 
    Typography, 
    Button, 
    TextField, 
    TextareaAutosize, 
    InputBase, 
    Container, 
    styled, 
    Divider,
    Stack // <-- CRÍTICO: Stack estava faltando aqui
} from '@mui/material'; // <-- O Stack deve vir daqui
import { Link } from 'react-router-dom';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import HeadphonesIcon from '@mui/icons-material/Headphones';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
<<<<<<< Updated upstream
// --- Dados Mock de Exemplo ---
const mockGrupos = [
    { id: 1, name: "Teste", currentSong: "Musica 1", members: "igor, ana e mais 5", status: "Ao vivo", cover: "/assets/img/vacateste.jpg" },
    { id: 2, name: "Grupo legal 123", currentSong: "Musica 1", members: "ana, beatriz e mais 12", status: "Ao vivo", cover: "/assets/img/vacateste.jpg" },
    { id: 3, name: "Grupo legal", currentSong: "Música 2", members: "maria, beatriz e mais 4", status: "Ao vivo", cover: "/assets/img/vacateste.jpg" },
];

// --- Componentes Estilizados ---
=======
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import ShareIcon from '@mui/icons-material/Share';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// Redux Thunks consolidadas
import {
    fetchGroups,
    deleteGroup,
    selectGroupStatus, 
    updateGroupDetails,
    createGroup,
} from '../../redux/grupoSlice';
import {
    selectAllGroups,
} from '../../redux/grupoSlice'; 

const DEFAULT_GROUP_COVER = 'https://placehold.co/600x600/607D8B/white?text=GRUPO';

// --------------------------------------------------------------------------
// Funções Auxiliares e Styled Components (MANTIDOS)
// --------------------------------------------------------------------------
>>>>>>> Stashed changes

const GruposContainer = styled(Box)(({ theme }) => ({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
    marginBottom: '40px',
}));
<<<<<<< Updated upstream

const GrupoCard = styled(Box)(({ theme, isNew = false }) => ({
    background: isNew ? 'var(--border-color)' : 'var(--header-bg)',
=======
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
>>>>>>> Stashed changes
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: isNew ? 'none' : '0 4px 15px rgba(0,0,0,0.5)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
    position: 'relative',
    height: isNew ? 'auto' : '100%',
    
    // Novo Grupo (Estilo 'dashed')
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
    
    // Grupo Normal Hover
    ...(!isNew && {
        '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: '0 8px 20px rgba(0,0,0,0.7)',
        },
    }),
}));
<<<<<<< Updated upstream

// --- Sub-componente: Card de Grupo ---
const GrupoItem = ({ grupo }) => (
    <Link to={`/grupos/${grupo.id}`} style={{ textDecoration: 'none' }}>
        <GrupoCard>
            <Box className="img-cima" sx={{ position: 'relative' }}>
                <img src={grupo.cover} alt={`Capa do grupo ${grupo.name}`} style={{ width: '100%', height: '150px', objectFit: 'cover', filter: 'brightness(70%)' }} />
                <Typography variant="caption" className="grupo-status" sx={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0, 0, 0, 0.6)', color: 'var(--text-color)', padding: '5px 10px', borderRadius: '20px', display: 'flex', alignItems: 'center' }}>
                    <HeadphonesIcon sx={{ color: 'var(--orange)', fontSize: '14px', mr: 0.5 }} /> {grupo.status}
                </Typography>
            </Box>
=======
const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });

// --------------------------------------------------------------------------
// 1. Modal de Compartilhamento (MANTIDO)
// --------------------------------------------------------------------------

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


// --------------------------------------------------------------------------
// 2. Modal de Edição (MANTIDO)
// --------------------------------------------------------------------------

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
                        className="custom-textfield"
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
                        className="custom-textarea"
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
                            className="btn-primary-orange"
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
                            className="btn-primary-orange"
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


// --------------------------------------------------------------------------
// 3. Componente GrupoItem (CORRIGIDO: Apenas para garantir que a comparação seja feita corretamente)
// --------------------------------------------------------------------------

const GrupoItem = React.memo(({ grupo, onJoin, currentUserId, onDelete, onEdit, onShare }) => {
    const listenersCount = grupo.listeners?.length || 0;
    const currentUserIdStr = String(currentUserId);
    const isListening = (grupo.listeners || []).includes(currentUserIdStr);
    
    // CORREÇÃO: Garante que creatorId seja convertido para string para comparação consistente
    const isCreator = String(grupo.creatorId) === currentUserIdStr; 

    const isMember = useMemo(() => (grupo.members || []).includes(currentUserIdStr), [grupo.members, currentUserIdStr]);

    const statusColor = listenersCount > 0 ? 'var(--orange)' : 'var(--secondary-text-color)';
    const buttonBg = isListening ? '#666' : 'var(--orange)';

    return (
        <Box className="grupo-card">
            <Link to={`/grupos/${grupo.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <Box className="img-cima" sx={{ position: 'relative' }}>
                    <img
                        src={grupo.cover || DEFAULT_GROUP_COVER}
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

                    {/* Botões de Ação: SHARE, EDIT, DELETE - VISÍVEIS APENAS PARA O CRIADOR CORRETO */}
                    <Stack direction="row" spacing={1} sx={{ position: 'absolute', bottom: 10, right: 10 }}>
                        
                        {/* COMPARTILHAR */}
                        <IconButton 
                            size="small" 
                            className="card-action-btn icon-orange"
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

>>>>>>> Stashed changes
            <Box className="conteudo-baixo" sx={{ padding: '15px' }}>
                <Typography variant="h6" component="h3" sx={{ margin: 0, fontSize: '20px', color: 'var(--text-color)' }}>
                    {grupo.name}
                </Typography>
<<<<<<< Updated upstream
                <Box className="info-musica" sx={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-color)', fontSize: '14px', margin: '8px 0', overflow: 'hidden' }}>
                    <MusicNoteIcon sx={{ color: 'var(--orange)', fontSize: '14px' }} />
                    Tocando: {grupo.currentSong}
                </Box>
                <Typography variant="body2" className="info-integrantes" sx={{ fontSize: '13px', color: '#999', marginBottom: '15px' }}>
                    Integrantes: {grupo.members}
                </Typography>
                <Button variant="contained" className="btn-entrar" sx={{ 
                    width: '100%', padding: '12px', borderRadius: '8px',
                    backgroundColor: 'var(--orange)', color: 'white', fontWeight: 'bold',
                    '&:hover': { backgroundColor: 'var(--darker-orange)' }
                }}>
                    Entrar no grupo
=======
                <Button
                    variant="contained"
                    className="btn-primary-orange"
                    onClick={() => onJoin(grupo.id)}
                    disabled={isListening}
                    sx={{
                        width: '100%', padding: '12px', borderRadius: '8px',
                        backgroundColor: buttonBg,
                        '&:hover': { backgroundColor: buttonBg === '#666' ? '#666' : 'var(--darker-orange)' },
                    }}
                >
                    {isListening ? 'Ouvindo Agora' : 'Entrar na Sala'}
>>>>>>> Stashed changes
                </Button>
            </Box>
        </GrupoCard>
    </Link>
);

<<<<<<< Updated upstream

function Grupos() {
    // Estado para controlar a exibição do formulário
    const [isFormVisible, setIsFormVisible] = useState(false);
=======
// --------------------------------------------------------------------------
// 4. Componente Principal Grupos (CORRIGIDO: Lógica de filtragem invertida)
// --------------------------------------------------------------------------

function Grupos() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const currentUserId = String(useSelector((state) => state.auth.user?.id) || '');
    
    const allGroups = useSelector(selectAllGroups);
    const groupsStatus = useSelector(selectGroupStatus);

    const [isFormVisible, setIsFormVisible] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [groupDescription, setGroupDescription] = useState('');
    const [groupCoverFile, setGroupCoverFile] = useState(null);
    const [fileName, setFileName] = useState('Nenhum arquivo selecionado');
    const [editingGroup, setEditingGroup] = useState(null);
    const [groupToShare, setGroupToShare] = useState(null);

    // CORREÇÃO DA LÓGICA DE FILTRAGEM:
    const { myCreatedGroups, myMemberGroups, featuredGroups } = useMemo(() => {
        const created = [];
        const member = [];
        const featured = [];

        allGroups.forEach((g) => {
            // CORREÇÃO: Garante que a comparação de ID seja sempre string vs string
            const isCreator = String(g.creatorId) === currentUserId;
            // Verifica se o usuário é membro (assumindo que g.members é um array de strings)
            const isMember = g.members && g.members.some(memberId => String(memberId) === currentUserId); 

            if (isCreator) {
                // Se o currentUserId é o criador
                created.push(g);
            } else if (isMember) {
                // Se é membro, mas não o criador (Grupo que Eu Participo)
                member.push(g);
            } else { 
                // Não é criador e não é membro (Outros Grupos)
                featured.push(g);
            }
        });

        return { 
            myCreatedGroups: created, 
            myMemberGroups: member,
            featuredGroups: featured 
        };
    }, [allGroups, currentUserId]); // A lista de dependências está correta

    // Efeito para buscar grupos na montagem
    useEffect(() => {
        if (groupsStatus === 'idle' && currentUserId) {
            dispatch(fetchGroups());
        }
    }, [groupsStatus, currentUserId, dispatch]);

    const resetForm = () => {
        setGroupName(''); setGroupDescription(''); setGroupCoverFile(null); setFileName('Nenhum arquivo selecionado');
    };
    
    // Funções de manipulação de arquivo e criação (MANTIDAS)
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
        let coverBase64 = DEFAULT_GROUP_COVER;
        
        try {
            if (groupCoverFile) {
                coverBase64 = await fileToBase64(groupCoverFile);
            }

            const newGroupData = {
                name: groupName.trim(),
                description: groupDescription.trim(),
                creatorId: currentUserId, // ✅ O ID do usuário logado é definido como o criador
                cover: coverBase64,
                members: [currentUserId], // ✅ O usuário logado é adicionado como primeiro membro
                listeners: [],
                currentSong: '',
                status: 'Inativo',
            };
            
            const resultAction = await dispatch(createGroup(newGroupData)).unwrap();
            
            setIsFormVisible(false);
            resetForm();
            navigate(`/grupos/${resultAction.id}`);
            
        } catch (error) {
            console.error('Falha ao criar o grupo:', error);
            alert('Não foi possível criar o grupo: ' + (error.message || 'Erro desconhecido.'));
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // Funções de ação de grupo (MANTIDAS)
    const handleUpdateGroup = async (payload) => {
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
>>>>>>> Stashed changes

    return (
        <main className="content-area">
            {/* --------------------------- */}
            {/* SEÇÃO PRINCIPAL DE GRUPOS */}
            {/* --------------------------- */}
            <Box sx={{ display: isFormVisible ? 'none' : 'block' }}>
<<<<<<< Updated upstream

=======
                
                {/* 1. Meus Grupos Criados (Agora exibe corretamente APENAS os grupos criados pelo usuário) */}
>>>>>>> Stashed changes
                <Box className="meus-grupos">
                    <Typography variant="h5" component="h2" sx={{ marginBottom: '15px', color: 'var(--secondary-text-color)' }}>
                        Meus Grupos
                    </Typography>
                    <GruposContainer>
                        {/* Cartão de Criar Novo Grupo */}
                        <GrupoCard isNew onClick={() => setIsFormVisible(true)}>
                            <AddCircleIcon className="icone-add" sx={{ fontSize: '40px', color: 'var(--orange)', marginBottom: '10px' }} />
                            <Typography sx={{ fontSize: '16px', fontWeight: 'bold' }}>Criar novo grupo</Typography>
                        </GrupoCard>

                        {/* Mapeamento dos Meus Grupos (Mock) */}
                        {mockGrupos.slice(0, 1).map((grupo) => ( // Exemplo: Apenas o primeiro é "Meu Grupo"
                            <GrupoItem key={grupo.id} grupo={grupo} />
                        ))}
                    </GruposContainer>
                </Box>

                <Divider sx={{ my: 4, borderColor: 'var(--border-color)' }} /> 

<<<<<<< Updated upstream
                <Box className="grupos-destaque">
                    <Typography variant="h5" component="h2" sx={{ marginBottom: '15px', color: 'var(--secondary-text-color)' }}>
                        Grupos em Destaque
                    </Typography>
                    <GruposContainer>
                        {/* Mapeamento de Grupos em Destaque */}
                        {mockGrupos.map((grupo) => (
                            <GrupoItem key={grupo.id} grupo={grupo} />
                        ))}
                    </GruposContainer>
                </Box>
            </Box>


            {/* --------------------------- */}
            {/* FORMULÁRIO DE CRIAÇÃO DE GRUPO */}
            {/* --------------------------- */}
            <Box className="form-grupo" sx={{ display: isFormVisible ? 'block' : 'none', maxWidth: '500px', margin: '0 auto', padding: '20px', background: 'var(--card-bg)', borderRadius: '12px' }}>
                <Typography variant="h5" component="h2" sx={{ marginBottom: '20px' }}>
                    Criar novo grupo
=======
                {/* 2. Grupos que Eu Participo (Agora exibe corretamente os grupos onde o usuário NÃO é o criador) */}
                {myMemberGroups.length > 0 && (
                    <Box className="meus-grupos-participantes">
                        <Typography
                            variant="h5"
                            component="h2"
                            className="section-title"
                        >
                            Grupos que Eu Participo ({myMemberGroups.length})
                        </Typography>
                        <GruposContainer>
                            {/* Listagem dos Grupos Participantes */}
                            {myMemberGroups.map((grupo) => (
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
                )}
                
                {myMemberGroups.length > 0 && featuredGroups.length > 0 && (
                    <Divider sx={{ my: 4, borderColor: 'var(--border-color)' }} />
                )}


                {/* 3. Outros Grupos (Destaque) */}
                {featuredGroups.length > 0 && (
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
                )}
            </Box>

            {/* Formulário de Criação de Grupo (MANTIDO) */}
            <Box
                sx={{
                    display: isFormVisible ? 'block' : 'none',
                    position: 'relative',
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
>>>>>>> Stashed changes
                </Typography>
                <form>
                    <Typography component="label" htmlFor="nome-grupo" sx={{ display: 'block', mt: 2 }}>Nome do Grupo</Typography>
                    <TextField fullWidth id="nome-grupo" placeholder="Ex: Grupo da Galera" variant="outlined" sx={{ mb: 2, '& input': { color: 'var(--text-color)' }, '& fieldset': { borderColor: 'var(--border-color)' } }} />

                    <Typography component="label" htmlFor="descricao-grupo" sx={{ display: 'block' }}>Descrição</Typography>
                    <TextareaAutosize minRows={3} id="descricao-grupo" style={{ width: '100%', marginBottom: '20px', padding: '10px', backgroundColor: 'var(--input-bg)', color: 'var(--text-color)', border: `1px solid var(--border-color)`, borderRadius: '4px' }} />

<<<<<<< Updated upstream
                    <Typography component="label" htmlFor="imagem-grupo" sx={{ display: 'block' }}>Imagem de Capa</Typography>
                    <Box className="upload-container" sx={{ display: 'flex', alignItems: 'center', gap: '10px', mb: 3 }}>
                        <Typography variant="body2" className="file-name">Nenhum arquivo selecionado</Typography>
                        <Button component="label" variant="contained" className="btn-upload" sx={{ backgroundColor: 'var(--orange)', '&:hover': { backgroundColor: 'var(--darker-orange)' } }}>
=======
                    <Typography component="label" sx={{ display: 'block', color: 'var(--secondary-text-color)' }}>Imagem de Capa (Opcional)</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', mb: 3 }}>
                        <Typography variant="body2" sx={{ color: 'var(--secondary-text-color)' }}>{fileName}</Typography>
                        <Button 
                            component="label" 
                            variant="contained"
                            className="btn-primary-orange"
                        >
>>>>>>> Stashed changes
                            Escolher arquivo
                            <input type="file" hidden id="imagem-grupo" accept="image/*" />
                        </Button>
                    </Box>

                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                        <Button variant="outlined" className="btn-cancelar" onClick={() => setIsFormVisible(false)} sx={{ color: 'var(--text-color)', borderColor: 'var(--border-color)' }}>Cancelar</Button>
                        <Button type="submit" variant="contained" className="btn-criar" sx={{ backgroundColor: 'var(--orange)', '&:hover': { backgroundColor: 'var(--darker-orange)' } }}>Criar</Button>
                    </Stack>
                </form>
            </Box>
<<<<<<< Updated upstream
=======


            {/* Modal de Edição de Grupo (MANTIDO) */}
            {editingGroup && (
                <EditGroupModal
                    group={editingGroup}
                    onClose={() => setEditingGroup(null)}
                    onSave={handleUpdateGroup}
                    groupsStatus={groupsStatus}
                />
            )}

            {/* Modal de Compartilhamento (MANTIDO) */}
            {groupToShare && (
                <ShareGroupModal
                    group={groupToShare}
                    onClose={handleCloseShareModal}
                />
            )}
>>>>>>> Stashed changes
        </main>
    );
}

export default Grupos;