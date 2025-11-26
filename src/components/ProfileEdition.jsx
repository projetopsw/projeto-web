import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, TextField, Button, Divider, Typography, CircularProgress,
    Dialog, DialogTitle, DialogContent, Grid, IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfile } from '../redux/userSlice';
import ProfileHeader from './ProfileHeader';

const API_URL = 'http://localhost:3000';
const SESSION_STORAGE_KEY = (userId) => `tempProfileImage_${userId}`;
const DEFAULT_USER_IMAGE = 'https://placehold.co/400x400?text=User';

const AVAILABLE_PROFILE_IMAGES = [
    '/assets/img/liked_cover_0.png',
    '/assets/inizia/img/piano_cover_3.png',
    '/assets/img/rock_cover_1.png',
    '/assets/img/vibe_cover_2.png',
    DEFAULT_USER_IMAGE
];

export default function ProfileEdition() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const user = useSelector((state) => state.user.user);
    const userId = user?.id || user?._id; // CORREÇÃO 1: Adiciona suporte a _id
    const authToken = user?.token; // CORREÇÃO 2: Pega o token do Redux/UserState, não do localStorage

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        currentPassword: '',
        newPassword: ''
    });

    const [errors, setErrors] = useState({});

    const [newProfileImage, setNewProfileImage] = useState(null);
    const [linkImage, setLinkImage] = useState('');

    useEffect(() => {
        if (user) {
            // CORREÇÃO 3: user.id pode estar ausente, verifica apenas a existência de user
            const currentUserId = user.id || user._id; 
            if (currentUserId) {
                const key = SESSION_STORAGE_KEY(currentUserId);
                const tempImage = sessionStorage.getItem(key);
                setNewProfileImage(tempImage);
            }

            setFormData(prev => ({
                ...prev,
                // CORREÇÃO 4: Suporta name ou username para o campo de edição
                name: user.name || user.username || '', 
                email: user.email || '',
            }));

            setIsLoading(false);
        } else {
            // Se o usuário não estiver carregado, ainda precisa parar de carregar
            setIsLoading(false); 
        }
    }, [user]); // userId pode ser derivado de user, simplificando a dependência

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: undefined }));
    };

    const handleImageUploadClick = () => {
        setLinkImage('');
        setIsImageModalOpen(true);
    };

    const handleImageSelect = (imageUrl) => {
        setNewProfileImage(imageUrl);
        // Usa user.id ou user._id para a chave do sessionStorage
        const currentUserId = user?.id || user?._id;
        if (currentUserId) {
            sessionStorage.setItem(SESSION_STORAGE_KEY(currentUserId), imageUrl);
        }
        setIsImageModalOpen(false);
    };

    const handleLinkImageSelect = () => {
        const trimmedLink = linkImage.trim();
        if (trimmedLink) {
            handleImageSelect(trimmedLink);
        }
    };

    const handleRemoveSelectedImage = () => {
        setNewProfileImage(null);
        const currentUserId = user?.id || user?._id;
        if (currentUserId) {
            sessionStorage.removeItem(SESSION_STORAGE_KEY(currentUserId));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setErrors({});

        // CORREÇÃO 5: Verifica se o token existe antes de prosseguir
        if (!userId || !authToken) {
            alert("Erro: Usuário não autenticado ou token ausente. Por favor, faça login novamente.");
            setIsSaving(false);
            return;
        }

        const { name, email, currentPassword, newPassword } = formData;
        const nameTrimmed = name.trim();

        if (nameTrimmed === '') {
            setErrors({ name: "O Username não pode estar vazio." });
            alert("Erro: O campo Username não pode estar vazio.");
            setIsSaving(false);
            return;
        }

        const newPasswordTrimmed = newPassword.trim();
        const currentPasswordTrimmed = currentPassword.trim();
        const isChangingPassword = newPasswordTrimmed !== '';

        if (isChangingPassword && currentPasswordTrimmed === '') {
            setErrors({ currentPassword: "É obrigatório fornecer a Senha Atual para alterar a senha." });
            alert("Erro: Você deve fornecer a Senha Atual para alterar a senha.");
            setIsSaving(false);
            return;
        }

        const dataToSendToServer = {
            username: nameTrimmed,
            email: email,
            // CORREÇÃO 6: Garante que a imagem enviada seja a nova temporária, a atual do usuário, ou a padrão.
            img: newProfileImage || user.img || DEFAULT_USER_IMAGE,
        };

        if (isChangingPassword) {
            dataToSendToServer.currentPassword = currentPasswordTrimmed;
            dataToSendToServer.newPassword = newPasswordTrimmed;
        }

        try {
            const response = await fetch(`${API_URL}/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`, // Usa o token do Redux (CORREÇÃO 2)
                    'Accept': 'application/json'
                },
                body: JSON.stringify(dataToSendToServer)
            });

            if (response.ok) {
                const responseData = await response.json();
                const responseUser = responseData.user || responseData;

                const nameFromForm = nameTrimmed;
                const imageFromForm = newProfileImage || responseUser.img || user.img || DEFAULT_USER_IMAGE;

                // CORREÇÃO 7: Mantém o token atual no payload se o backend não o retornar.
                const finalUserPayload = {
                    ...user, // Mantém todos os dados antigos (incluindo token)
                    ...responseUser, // Sobrescreve com dados novos do servidor
                    id: responseUser._id || responseUser.id || user.id || user._id,
                    username: responseUser.username || responseUser.name || nameFromForm,
                    name: responseUser.name || responseUser.username || nameFromForm,
                    img: imageFromForm,
                    image: imageFromForm,
                    token: user.token, // Garante que o token original seja mantido (essencial)
                };

                const currentUserId = user?.id || user?._id;
                if (currentUserId) {
                    sessionStorage.removeItem(SESSION_STORAGE_KEY(currentUserId));
                    setNewProfileImage(null);
                }

                dispatch(updateProfile(finalUserPayload));

                setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
                alert("Perfil atualizado com sucesso!");
                navigate('/perfil');
            } else {
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                alert(`Erro: ${errorData.message || response.statusText}. Por favor, verifique seus dados.`);
            }
        } catch (error) {
            alert("Erro de conexão. Verifique se o servidor está online e na porta 3000.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        const currentUserId = user?.id || user?._id;
        if (currentUserId) {
            sessionStorage.removeItem(SESSION_STORAGE_KEY(currentUserId));
            setNewProfileImage(null);
        }
        navigate('/perfil');
    };
    
    // CORREÇÃO 8: Memoiza o estilo para melhor performance
    const inputStyleProps = useMemo(() => {
        const ORANGE_COLOR = 'var(--orange)';
        const RED_COLOR_BORDER = '#f44336';
        const INPUT_BG = 'var(--input-bg)';
        const INPUT_TEXT_COLOR = 'var(--input-text-color)';

        return {
            ORANGE_COLOR,
            RED_COLOR_BORDER,
            saveButtonStyle: {
                backgroundColor: ORANGE_COLOR,
                color: 'white',
                borderRadius: 20,
                '&:hover': { backgroundColor: ORANGE_COLOR, opacity: 0.9 }
            },
            cancelButtonPrimaryStyle: {
                color: RED_COLOR_BORDER,
                borderColor: RED_COLOR_BORDER,
                borderRadius: 20,
                '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.1)', borderColor: RED_COLOR_BORDER }
            },
            inputFieldStyle: {
                '& .MuiFilledInput-root': {
                    backgroundColor: INPUT_BG,
                    color: INPUT_TEXT_COLOR,
                    '&.Mui-focused': { backgroundColor: INPUT_BG }
                },
                '& .Mui-disabled .MuiFilledInput-input': { WebkitTextFillColor: INPUT_TEXT_COLOR, opacity: 1 },
                '& .MuiInputLabel-filled': { color: INPUT_TEXT_COLOR }
            },
            INPUT_TEXT_COLOR,
        };
    }, []);

    const { ORANGE_COLOR, RED_COLOR_BORDER, saveButtonStyle, cancelButtonPrimaryStyle, inputFieldStyle } = inputStyleProps;

    if (isLoading) return <main><Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box></main>;

    if (!user || !userId) return <main><Typography color="error" sx={{ color: 'red', p: 4 }}>Não foi possível carregar os dados do perfil. (Usuário não autenticado ou ID ausente no Redux)</Typography></main>;

    const userDataToDisplay = user;
    const finalImage = newProfileImage || userDataToDisplay.img || DEFAULT_USER_IMAGE;

    const profileHeaderProps = {
        username: formData.name,
        playlists: userDataToDisplay.playlists ? userDataToDisplay.playlists.length : 0,
        friends: userDataToDisplay.friends ? userDataToDisplay.friends.length : 0,
        following: userDataToDisplay.following || [],
        img: finalImage,
        image: finalImage
    };

    return (
        <main>
            <Box sx={{ p: { xs: 2, md: 4, lg: 6 }, pb: 15 }}>
                <ProfileHeader
                    user={profileHeaderProps}
                    onEditClick={null}
                    onImageEditClick={handleImageUploadClick}
                />

                {newProfileImage && newProfileImage !== user.img && (
                    <Box sx={{ mt: -2, mb: 2 }}>
                        <Button
                            variant="text"
                            onClick={handleRemoveSelectedImage}
                            sx={{ color: RED_COLOR_BORDER, textTransform: 'none' }}
                            disabled={isSaving}
                        >
                            Remover imagem temporária
                        </Button>
                    </Box>
                )}

                <Divider sx={{ my: 4 }} />
                <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 600 }}>

                    <Typography variant="h6" component="p" sx={{ color: 'var(--texto-color)', mb: 2, fontWeight: 'bold' }}>
                        Dados do Perfil
                    </Typography>
                    <TextField
                        fullWidth
                        label="Username"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        margin="normal"
                        variant="filled"
                        sx={inputFieldStyle}
                        InputLabelProps={{ shrink: true }}
                        disabled={isSaving}
                        error={!!errors.name}
                        helperText={errors.name}
                    />
                    <TextField
                        fullWidth
                        label="E-mail"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        margin="normal"
                        variant="filled"
                        type="email"
                        sx={inputFieldStyle}
                        InputLabelProps={{ shrink: true }}
                        disabled={isSaving}
                    />

                    <Divider sx={{ my: 4 }} />

                    <Typography variant="h6" component="p" sx={{ color: 'var(--text-color)', mb: 2, fontWeight: 'bold' }}>
                        Alterar Senha
                    </Typography>

                    <TextField
                        fullWidth
                        label="Senha Atual *"
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        margin="normal"
                        variant="filled"
                        type="password"
                        sx={inputFieldStyle}
                        InputLabelProps={{ shrink: true }}
                        disabled={isSaving}
                        error={!!errors.currentPassword}
                        helperText={errors.currentPassword}
                    />

                    <TextField
                        fullWidth
                        label="Nova Senha"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                        margin="normal"
                        variant="filled"
                        type="password"
                        sx={inputFieldStyle}
                        InputLabelProps={{ shrink: true }}
                        disabled={isSaving}
                    />
                    <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-start' }}>
                        <Button
                            variant="outlined"
                            onClick={handleCancel}
                            sx={cancelButtonPrimaryStyle}
                            disabled={isSaving}
                        >
                            CANCELAR
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            sx={saveButtonStyle}
                            disabled={isSaving}
                        >
                            {isSaving ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Salvar'}
                        </Button>
                    </Box>
                </Box>
            </Box>

            <Dialog
                open={isImageModalOpen}
                onClose={() => setIsImageModalOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { bgcolor: 'var(--header-bg)', color: 'var(--text-color)' } }}
            >
                <DialogTitle sx={{ m: 0, p: 2, color: 'var(--text-color)' }}>
                    Selecione sua Imagem de Perfil
                    <IconButton
                        aria-label="close"
                        onClick={() => setIsImageModalOpen(false)}
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                            color: 'var(--secondary-text-color)',
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ borderBottom: '1px solid var(--border-color)' }}>

                    <Typography variant="subtitle1" sx={{ color: 'var(--text-color)', mb: 1, mt: 1, fontWeight: 'bold' }}>
                        Adicionar por URL:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mb: 4, alignItems: 'center' }}>
                        <TextField
                            fullWidth
                            label="URL da Imagem (Ex: https://image.com/minhafoto.jpg)"
                            value={linkImage}
                            onChange={(e) => setLinkImage(e.target.value)}
                            variant="filled"
                            size="small"
                            sx={{
                                ...inputFieldStyle,
                                '& .MuiInputLabel-filled': { color: 'var(--secondary-text-color)' },
                                '& .MuiFilledInput-input': { color: 'var(--text-color)' }
                            }}
                        />
                        <Button
                            variant="contained"
                            onClick={handleLinkImageSelect}
                            disabled={!linkImage.trim()}
                            sx={saveButtonStyle}
                        >
                            Aplicar
                        </Button>
                    </Box>
                    <Divider sx={{ my: 3, bgcolor: 'var(--border-color)' }} />

                    <Typography variant="subtitle1" sx={{ color: 'var(--text-color)', mb: 3, fontWeight: 'bold' }}>
                        Ou selecione uma imagem padrão:
                    </Typography>

                    <Grid
                        container
                        spacing={6}
                        justifyContent="center"
                    >
                        {AVAILABLE_PROFILE_IMAGES.map((url, index) => {

                            const isPngIcon = url.toLowerCase().endsWith('.png');

                            const imageStyles = isPngIcon
                                ? {
                                    objectFit: 'contain',
                                    transform: 'scale(1.2)',
                                    transition: 'transform 0.2s, border 0.2s',
                                    backgroundColor: 'transparent'
                                }
                                : {
                                    objectFit: 'cover',
                                    transform: 'scale(1)',
                                    transition: 'transform 0.2s, border 0.2s'
                                };

                            return (
                                <Grid
                                    key={index}
                                    sx={{ display: 'flex', justifyContent: 'center' }}
                                >
                                    <Box
                                        onClick={() => handleImageSelect(url)}
                                        sx={{
                                            cursor: 'pointer',
                                            p: 0.5,
                                            borderRadius: '50%',
                                            border: (newProfileImage === url)
                                                ? `4px solid ${ORANGE_COLOR}`
                                                : '4px solid transparent',
                                            transition: 'border 0.2s',
                                            '&:hover': { opacity: 0.8 },

                                            width: 120,
                                            height: 120,
                                            position: 'relative',
                                            flexShrink: 0
                                        }}
                                    >
                                        <Box
                                            component="img"
                                            src={url}
                                            alt={`Opção de perfil ${index + 1}`}
                                            sx={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: '100%',
                                                borderRadius: '50%',
                                                objectFit: imageStyles.objectFit,
                                                transform: imageStyles.transform,
                                                backgroundColor: imageStyles.backgroundColor
                                            }}
                                        />
                                    </Box>
                                </Grid>
                            );
                        })}
                    </Grid>
                </DialogContent>
            </Dialog>
        </main>
    );
}