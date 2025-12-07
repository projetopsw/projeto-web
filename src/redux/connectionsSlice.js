import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { setUserData } from './userSlice'; 

const API_URL = 'http://localhost:3000/users'; 

const getAuthHeaders = (token) => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
});


// --- THUNKS DE DADOS ---

const fetchConnectionsData = createAsyncThunk( 
    'connections/fetchData',
    async (currentUserId, { rejectWithValue, getState }) => {
        
        const state = getState();
        const userToken = state.user.user?.token; 
        
        if (!userToken) {
            console.error("Token não encontrado. Não é possível buscar conexões.");
            return rejectWithValue('Token de autenticação não encontrado. Usuário não está logado.');
        }
        
        const headers = { 'Authorization': `Bearer ${userToken}` };
        
        try {
            const allUsersRes = await fetch(API_URL, { headers });
            if (!allUsersRes.ok) throw new Error(`Falha ao buscar todos os usuários: Status ${allUsersRes.status}`);
            
            const allUsersFromApi = await allUsersRes.json(); 
            
            const allUsers = allUsersFromApi.map(u => ({
                ...u,
                id: String(u.id || u._id) 
            }));

            const currentUserIdStr = String(currentUserId); 
            const currentUser = allUsers.find(u => String(u.id) === currentUserIdStr);

            if (!currentUser) {
                return rejectWithValue('Usuário atual não encontrado após o login.');
            }

            const fetchDetails = (ids) => {
                const uniqueIds = Array.from(new Set(ids.map(id => String(id))));
                return allUsers.filter(u => uniqueIds.includes(String(u.id)));
            };

            const friends = fetchDetails(currentUser.friends || []);
            const pendingRequests = fetchDetails(currentUser.friendshipRequests || []);
            
            const sentRequests = allUsers.filter(user => 
                user.id !== currentUserIdStr &&
                (user.friendshipRequests || []).map(String).includes(currentUserIdStr)
            );
            
            const existingConnectionsIds = new Set([
                currentUserIdStr,
                ...friends.map(f => String(f.id)),
                ...pendingRequests.map(p => String(p.id)),
                ...sentRequests.map(s => String(s.id))
            ]);

            const suggestions = allUsers.filter(user =>
                !existingConnectionsIds.has(String(user.id))
            );
            
            return { friends, pendingRequests, sentRequests, suggestions };

        } catch (error) {
            console.error("Erro no fetchConnectionsData:", error);
            return rejectWithValue(error.message || 'Falha na comunicação com o servidor.');
        }
    }
);

// --- THUNKS DE AÇÃO ---

const toggleFriendRequest = createAsyncThunk(
    'connections/toggleRequest',
    async ({ currentUserId, targetUser }, { dispatch, rejectWithValue, getState }) => {
        const state = getState();
        const userToken = state.user.user?.token;
        if (!userToken) return rejectWithValue('Token de autenticação não encontrado.');

        const currentUserIdStr = String(currentUserId);
        const targetUserIdStr = String(targetUser.id || targetUser._id);
        const authHeaders = getAuthHeaders(userToken);

        try {
            // Busca o estado atual dos usuários para manipulação de arrays
            const [currentUserRes, targetUserRes] = await Promise.all([
                fetch(`${API_URL}/${currentUserIdStr}`, { headers: { 'Authorization': `Bearer ${userToken}` } }),
                fetch(`${API_URL}/${targetUserIdStr}`, { headers: { 'Authorization': `Bearer ${userToken}` } })
            ]);

            const currentUser = await currentUserRes.json();
            const target = await targetUserRes.json();

            const targetRequests = target.friendshipRequests || [];
            const isRequestSent = targetRequests.map(String).includes(currentUserIdStr);

            let updatedTargetRequests;
            let finalMessage;

            if (isRequestSent) {
                // Cancelar pedido
                updatedTargetRequests = targetRequests.filter(id => String(id) !== currentUserIdStr);
                finalMessage = `Pedido cancelado para ${targetUser.name || targetUser.username}.`;
            } else {
                // Enviar pedido
                updatedTargetRequests = [...targetRequests.map(String), currentUserIdStr];
                finalMessage = `Pedido enviado para ${targetUser.name || targetUser.username}.`;
            }

            // Atualiza o usuário alvo (adiciona/remove o ID do usuário logado dos pedidos)
            const patchRes = await fetch(`${API_URL}/${targetUserIdStr}`, {
                method: 'PATCH',
                headers: authHeaders,
                body: JSON.stringify({ friendshipRequests: updatedTargetRequests }),
            });

            if (!patchRes.ok) throw new Error('Falha ao atualizar o pedido no servidor.');
            
            // O setUserData não é chamado aqui, pois não alteramos o usuário logado diretamente.
            // O componente Conexoes.jsx dispara o re-fetch se houver mudança nos estados de conexões.

            return { targetId: targetUserIdStr, isCancelled: isRequestSent, message: finalMessage };

        } catch (error) {
            console.error("[ERRO NO TOGGLE REQUEST]:", error.message);
            return rejectWithValue(error.message || 'Falha ao enviar/cancelar pedido.');
        }
    }
);


const acceptFriendRequest = createAsyncThunk(
    'connections/acceptRequest',
    async ({ accepterId, requester }, { dispatch, rejectWithValue, getState }) => {
        const state = getState();
        const userToken = state.user.user?.token;
        if (!userToken) return rejectWithValue('Token de autenticação não encontrado.');

        const accepterIdStr = String(accepterId);
        const requesterIdStr = String(requester.id || requester._id); // Garante a consistência do ID
        const authHeaders = getAuthHeaders(userToken);
        
        try {
            // 1. Atualiza o aceitador (adiciona o amigo, remove o pedido)
            const accepterResponse = await fetch(`${API_URL}/${accepterIdStr}`, { headers: { 'Authorization': `Bearer ${userToken}` } });
            const accepter = await accepterResponse.json();

            const updatedAccepter = {
                friends: [...(accepter.friends || []).map(String), requesterIdStr],
                friendshipRequests: (accepter.friendshipRequests || []).filter(id => String(id) !== requesterIdStr)
            };
            const resAccepter = await fetch(`${API_URL}/${accepterIdStr}`, {
                method: 'PATCH',
                headers: authHeaders,
                body: JSON.stringify(updatedAccepter),
            });
            const freshAccepter = await resAccepter.json();
            
            // 2. Atualiza o requisitante (adiciona o amigo)
            const requesterResponse = await fetch(`${API_URL}/${requesterIdStr}`, { headers: { 'Authorization': `Bearer ${userToken}` } });
            const freshRequester = await requesterResponse.json();
            
            const updatedRequester = {
                friends: [...(freshRequester.friends || []).map(String), accepterIdStr]
            };
            await fetch(`${API_URL}/${requesterIdStr}`, {
                method: 'PATCH',
                headers: authHeaders,
                body: JSON.stringify(updatedRequester),
            });
            
            // 3. Atualiza o estado global com o usuário logado que aceitou o pedido
            // Isso aciona a atualização de estado, e o useEffect em Conexoes.jsx fará o fetch
            dispatch(setUserData(freshAccepter));
            
            // 💡 CORREÇÃO APLICADA: Não há chamada imediata para fetchConnectionsData aqui.

            return requester; 
        } catch (error) { 
            console.error("[ERRO NO ACCEPT REQUEST]:", error.message);
            return rejectWithValue(error.message || 'Falha ao aceitar pedido.');
        }
    }
);

const declineFriendRequest = createAsyncThunk(
    'connections/declineRequest',
    async ({ recipientId, requesterId }, { dispatch, rejectWithValue, getState }) => {
        const state = getState();
        const userToken = state.user.user?.token;
        if (!userToken) return rejectWithValue('Token de autenticação não encontrado.');
        
        const recipientIdStr = String(recipientId);
        const requesterIdStr = String(requesterId);
        const authHeaders = getAuthHeaders(userToken);
        
        try {
            // Remove o ID do requerente da lista de pedidos de amizade do recipiente
            const recipientResponse = await fetch(`${API_URL}/${recipientIdStr}`, { headers: { 'Authorization': `Bearer ${userToken}` } });
            const recipient = await recipientResponse.json(); 

            const updatedRequests = (recipient.friendshipRequests || []).filter(id => String(id) !== requesterIdStr);
            
            const response = await fetch(`${API_URL}/${recipientIdStr}`, {
                method: 'PATCH',
                headers: authHeaders,
                body: JSON.stringify({ friendshipRequests: updatedRequests }),
            });
            const freshRecipient = await response.json();
            
            dispatch(setUserData(freshRecipient));
            
            // 💡 CORREÇÃO APLICADA: Não há chamada imediata para fetchConnectionsData aqui.
            
            return { declinedRequestId: requesterIdStr };
        } catch (error) {
            return rejectWithValue(error.message || 'Falha ao recusar pedido.');
        }
    }
);

const removeFriend = createAsyncThunk(
    'connections/removeFriend',
    async ({ currentUserId, targetUserId }, { dispatch, rejectWithValue, getState }) => {
        const state = getState();
        const userToken = state.user.user?.token;
        if (!userToken) return rejectWithValue('Token de autenticação não encontrado.');

        const currentUserIdStr = String(currentUserId);
        const targetUserIdStr = String(targetUserId);
        const authHeaders = getAuthHeaders(userToken);

        try {
            // 1. Atualiza o usuário logado (remove o amigo)
            const currentUserRes = await fetch(`${API_URL}/${currentUserIdStr}`, { headers: { 'Authorization': `Bearer ${userToken}` } });
            const currentUser = await currentUserRes.json();
            const updatedFriendsUser = (currentUser.friends || []).filter(id => String(id) !== targetUserIdStr);

            const patchUserRes = await fetch(`${API_URL}/${currentUserIdStr}`, {
                method: 'PATCH',
                headers: authHeaders,
                body: JSON.stringify({ friends: updatedFriendsUser }),
            });
            const freshCurrentUser = await patchUserRes.json();

            // 2. Atualiza o usuário alvo (remove o amigo)
            const targetUserRes = await fetch(`${API_URL}/${targetUserIdStr}`, { headers: { 'Authorization': `Bearer ${userToken}` } });
            const targetUser = await targetUserRes.json();
            const updatedFriendsTarget = (targetUser.friends || []).filter(id => String(id) !== currentUserIdStr);
            
            await fetch(`${API_URL}/${targetUserIdStr}`, {
                method: 'PATCH',
                headers: authHeaders,
                body: JSON.stringify({ friends: updatedFriendsTarget }),
            });

            // 3. Atualiza o estado global com o usuário logado que removeu o amigo
            dispatch(setUserData(freshCurrentUser));
            
            // 💡 CORREÇÃO APLICADA: Não há chamada imediata para fetchConnectionsData aqui.

            return { removedFriendId: targetUserIdStr };
        } catch (error) {
            return rejectWithValue(error.message || 'Falha ao remover amigo.');
        }
    }
);


// --- SLICE E EXPORTS ---

const connectionsSlice = createSlice({
    name: 'connections',
    initialState: {
        friends: [],
        pendingRequests: [],
        sentRequests: [],
        suggestions: [],
        status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            // --- Handlers de fetchConnectionsData ---
            .addCase(fetchConnectionsData.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchConnectionsData.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.friends = action.payload.friends;
                state.pendingRequests = action.payload.pendingRequests;
                state.sentRequests = action.payload.sentRequests;
                state.suggestions = action.payload.suggestions;
                state.error = null;
            })
            .addCase(fetchConnectionsData.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
                // Limpa os dados em caso de falha de autenticação
                state.friends = [];
                state.pendingRequests = [];
                state.sentRequests = [];
                state.suggestions = [];
            })

            .addCase(toggleFriendRequest.pending, (state) => { state.status = 'loading'; })
            .addCase(toggleFriendRequest.fulfilled, (state) => { 
                state.status = 'idle'; // Volta para idle, o useEffect fará o re-fetch
            })
            .addCase(toggleFriendRequest.rejected, (state, action) => { 
                state.status = 'failed'; 
                state.error = action.payload; 
            })

            .addCase(acceptFriendRequest.fulfilled, (state) => { 
                state.status = 'idle'; 
            })
            .addCase(declineFriendRequest.fulfilled, (state) => { 
                state.status = 'idle'; 
            })
            .addCase(removeFriend.fulfilled, (state) => { 
                state.status = 'idle'; 
            });
    },
});

export default connectionsSlice.reducer;

export { 
    fetchConnectionsData, 
    toggleFriendRequest, 
    acceptFriendRequest, 
    declineFriendRequest,
    removeFriend 
};