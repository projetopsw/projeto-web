// src/components/ProfileEdition.jsx

import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, Button, Divider, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfile } from '../redux/userSlice';
import ProfileHeader from './ProfileHeader'; 

const API_URL = 'http://localhost:3001'; 
const SESSION_STORAGE_KEY = (userId) => `tempProfileImage_${userId}`; 

export default function ProfileEdition() { // <-- CORREÇÃO: Deve ser exportado como default
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    const user = useSelector((state) => state.user.user); 
    const userId = user?.id; 

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const [formData, setFormData] = useState({ 
        name: '', 
        email: '', 
        currentPassword: '', 
        newPassword: ''
    });
    
    const [newProfileImage, setNewProfileImage] = useState(null);
    const fileInputRef = useRef(null); 
    
    // Efeito para carregar dados e a imagem persistente
    useEffect(() => {
        if (user && userId) {
            const key = SESSION_STORAGE_KEY(userId);
            
            // 1. Carrega a imagem temporária (se existir)
            const tempImage = sessionStorage.getItem(key);
            setNewProfileImage(tempImage);
            
            // 2. Carrega os dados do formulário
            setFormData(prev => ({
                ...prev,
                name: user.name || user.username || '', 
                email: user.email || '',
            }));
            
            setIsLoading(false);
        } else {
            setIsLoading(false);
            console.warn("Usuário não encontrado no estado do Redux. Verifique o fluxo de Login.");
        }
    }, [user, userId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            
            reader.onload = (upload) => {
                const imageDataUrl = upload.target.result;
                setNewProfileImage(imageDataUrl);
                
                // Salva a imagem temporária no sessionStorage
                sessionStorage.setItem(SESSION_STORAGE_KEY(userId), imageDataUrl);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleImageUploadClick = () => fileInputRef.current.click();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        
        if (!userId) {
            console.error("ID do usuário não encontrado. Não é possível salvar. Por favor, faça login novamente.");
            setIsSaving(false);
            return;
        }

        const currentUserData = user; 
        const { name, email, currentPassword, newPassword } = formData;
        
        const newPasswordTrimmed = newPassword.trim();
        const isChangingPassword = newPasswordTrimmed !== '';

        if (isChangingPassword) {
            if (currentPassword === '') {
                console.error("Você deve fornecer a Senha Atual para alterar a senha.");
                setIsSaving(false);
                return;
            }
            if (currentPassword !== currentUserData.password) {
                console.error("A Senha Atual inserida está incorreta. Não é possível salvar a nova senha.");
                setIsSaving(false);
                return;
            }
        }

        // 1. Cria o objeto de atualização completo (para o Redux/localStorage)
        let fullUserUpdate = {
            ...currentUserData, 
            name: name,
            email: email,
            img: newProfileImage || currentUserData.img, 
        };
        
        if (isChangingPassword) {
            fullUserUpdate.password = newPasswordTrimmed;
        }

        if (fullUserUpdate.username && fullUserUpdate.name) {
            delete fullUserUpdate.username;
        }
        
        // 2. Cria o objeto para enviar ao JSON-SERVER (Omite a Data URL longa)
        const dataToSendToServer = {
            ...currentUserData, 
            name: fullUserUpdate.name,
            email: fullUserUpdate.email,
        };
        
        if (isChangingPassword) {
            dataToSendToServer.password = fullUserUpdate.password;
        } else {
            dataToSendToServer.password = currentUserData.password;
        }
        
        // Remove a imagem se ela for a Data URL longa para evitar erro de payload
        if (dataToSendToServer.img && dataToSendToServer.img.startsWith('data:image')) {
             delete dataToSendToServer.img;
        }

        try {
            const response = await fetch(`${API_URL}/users/${userId}`, {
                method: 'PUT', 
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(dataToSendToServer) 
            });

            if (response.ok) {
                // 1. Limpa o estado de Data URL temporária
                sessionStorage.removeItem(SESSION_STORAGE_KEY(userId));
                setNewProfileImage(null); 
                
                // 2. Atualiza o Redux/localStorage com a versão COMPLETA (incluindo a imagem LONGA)
                dispatch(updateProfile(fullUserUpdate));
                
                setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
                console.log("Perfil atualizado com sucesso! (Imagem salva localmente)");
                navigate('/perfil'); 
            } else {
                console.error("Erro ao salvar perfil. Status:", response.status);
                console.error(`Falha ao atualizar. O servidor não aceitou os dados.`);
            }
        } catch (error) {
            console.error("Erro de rede ao salvar perfil:", error);
            console.error("Erro de conexão. Verifique se o json-server está online.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        // Limpa a imagem temporária se o usuário cancelar
        sessionStorage.removeItem(SESSION_STORAGE_KEY(userId));
        setNewProfileImage(null); 
        navigate('/perfil'); 
    }; 

    if (isLoading) return <main><Typography color="white">Carregando dados para edição...</Typography></main>;
    
    if (!user || !userId) return <main><Typography color="error" sx={{ color: 'red', p: 4 }}>Não foi possível carregar os dados do perfil. (Usuário não autenticado ou ID ausente no Redux)</Typography></main>;
    
    const ORANGE_COLOR = 'var(--orange)'; 
    const RED_COLOR_BORDER = '#f44336'; 
    const INPUT_BG = 'var(--input-bg)';
    const INPUT_TEXT_COLOR = 'var(--input-text-color)';

    const saveButtonStyle = {
        backgroundColor: ORANGE_COLOR,
        color: 'white',
        borderRadius: 20,
        '&:hover': { backgroundColor: ORANGE_COLOR, opacity: 0.9 }
    };

    const cancelButtonPrimaryStyle = {
        color: RED_COLOR_BORDER,
        borderColor: RED_COLOR_BORDER,
        borderRadius: 20,
        '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.1)', borderColor: RED_COLOR_BORDER }
    };

    const inputFieldStyle = {
        '& .MuiFilledInput-root': {
            backgroundColor: INPUT_BG,
            color: INPUT_TEXT_COLOR,
            '&.Mui-focused': { backgroundColor: INPUT_BG }
        },
        '& .Mui-disabled .MuiFilledInput-input': { WebkitTextFillColor: INPUT_TEXT_COLOR, opacity: 1 },
        '& .MuiInputLabel-filled': { color: INPUT_TEXT_COLOR }
    };
    
    const userDataToDisplay = user; 
    
    const profileHeaderProps = {
        username: userDataToDisplay.name || userDataToDisplay.username, 
        playlists: userDataToDisplay.playlists ? userDataToDisplay.playlists.length : 0, 
        friends: userDataToDisplay.friends ? userDataToDisplay.friends.length : 0,       
        following: userDataToDisplay.following || [],      
        img: newProfileImage || userDataToDisplay.img 
    };

    return (
        <main>
            <Box sx={{ p: { xs: 2, md: 4, lg: 6 }, pb: 15 }}>
                <ProfileHeader 
                    user={profileHeaderProps} 
                    onEditClick={null} 
                    onImageEditClick={handleImageUploadClick} 
                />
                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                />
                <Divider sx={{ my: 4 }} />
                <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 600 }}> 
                    
                    {/* SEÇÃO DE DADOS PESSOAIS */}
                    <Typography variant="h6" component="p" sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
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
                    
                    {/* SEÇÃO DE ALTERAÇÃO DE SENHA */}
                    <Typography variant="h6" component="p" sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
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
                            {isSaving ? 'Salvando...' : 'Salvar'}
                        </Button>
                    </Box>
                </Box>
            </Box>
        </main>
    );
}