import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setTestUser } from '../redux/loginSlice'; // Importa o novo action
import { Box, Typography, Select, MenuItem, styled } from '@mui/material';

const StyledSelect = styled(Select)(({ theme }) => ({
    minWidth: 180,
    color: 'var(--orange)',
    backgroundColor: 'var(--input-bg)',
    '& .MuiSelect-select': { padding: '10px 15px' },
    '&:before, &:after': { content: 'none' },
}));

const USER_PROFILES = [
    { id: "1", name: "Usuário 1 (Dono)" },
    { id: "2", name: "Usuário 2 (Membro A)" },
    { id: "3", name: "Usuário 3 (Membro B)" },
];

function UserSelector() {
    const dispatch = useDispatch();
    const currentUserId = useSelector(state => state.auth.user?.id || USER_PROFILES[0].id);
    const currentUserName = useSelector(state => state.auth.user?.username || USER_PROFILES[0].name);

    const handleChange = (event) => {
        const newId = event.target.value;
        const profile = USER_PROFILES.find(p => p.id === newId);
        
        if (profile) {
            dispatch(setTestUser(profile));
        }
    };

    return (
        <Box sx={{ mb: 3, p: 2, background: 'var(--card-bg)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body1" sx={{ color: 'var(--text-color)', whiteSpace: 'nowrap' }}>
                Usuário Teste Logado:
            </Typography>
            <StyledSelect
                value={currentUserId}
                onChange={handleChange}
                variant="filled"
            >
                {USER_PROFILES.map(p => (
                    <MenuItem key={p.id} value={p.id}>
                        {p.name}
                    </MenuItem>
                ))}
            </StyledSelect>
        </Box>
    );
}

export default UserSelector;