import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// IMPORTANTE: Ajuste o caminho se userSlice.js não estiver na pasta acima
import { setUserData } from './userSlice'; 

const API_URL = 'http://localhost:3001/users';

// --- Thunks Assíncronos (Não exportados individualmente para evitar o Duplicate export) ---

const fetchConnectionsData = createAsyncThunk(
    'connections/fetchData',
    async (currentUserId, { rejectWithValue }) => {
        try {
            // Usando a URL completa para fetchAll
            const allUsers = await (await fetch('http://localhost:3001/users')).json(); 
            const currentUser = allUsers.find(u => u.id === currentUserId);

            if (!currentUser) {
                return rejectWithValue('Usuário atual não encontrado.');
            }

            const fetchDetails = (ids) => allUsers.filter(u => ids.includes(u.id));

            const friends = fetchDetails(currentUser.friends);
            const pendingRequests = fetchDetails(currentUser.friendshipRequests);

            // Re-calcula sentRequests (usuários que têm o currentUserId em seus friendshipRequests)
            const sentRequestsUsers = allUsers.filter(u => u.friendshipRequests.includes(currentUserId));
            const sentRequestIds = sentRequestsUsers.map(u => u.id);

            const suggestions = allUsers.filter(user =>
                user.id !== currentUserId &&
                !currentUser.friends.includes(user.id) &&
                !currentUser.friendshipRequests.includes(user.id) &&
                !sentRequestIds.includes(user.id)
            );
            
            return { friends, pendingRequests, sentRequests: sentRequestsUsers, suggestions };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const toggleFriendRequest = createAsyncThunk(
    'connections/toggleRequest',
    async ({ currentUserId, targetUser }, { rejectWithValue }) => {
        const isAlreadySent = targetUser.friendshipRequests.includes(currentUserId);
        const updatedRequests = isAlreadySent
            ? targetUser.friendshipRequests.filter(id => id !== currentUserId)
            : [...targetUser.friendshipRequests, currentUserId];

        try {
            // Atualiza o targetUser (PATCH)
            const response = await fetch(`${API_URL}/${targetUser.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ friendshipRequests: updatedRequests }),
            });
            const data = await response.json();
            
            // Retorna o usuário alvo atualizado e a flag
            return { updatedTargetUser: data, wasSent: isAlreadySent };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const acceptFriendRequest = createAsyncThunk(
    'connections/acceptRequest',
    async ({ accepterId, requester }, { dispatch, rejectWithValue }) => {
        try {
            // 1. Atualizar o ACENTER (Usuário Logado)
            const accepterResponse = await fetch(`${API_URL}/${accepterId}`);
            const accepter = await accepterResponse.json();

            const updatedAccepter = {
                friends: [...accepter.friends, requester.id],
                friendshipRequests: accepter.friendshipRequests.filter(id => id !== requester.id)
            };
            const resAccepter = await fetch(`${API_URL}/${accepterId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedAccepter),
            });
            const freshAccepter = await resAccepter.json();

            // 2. Atualizar o REQUESTER
            const updatedRequester = {
                friends: [...requester.friends, accepterId]
            };
            await fetch(`${API_URL}/${requester.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedRequester),
            });
            
            // 3. ATUALIZAÇÃO CRÍTICA DO ESTADO GLOBAL DO USUÁRIO LOGADO
            dispatch(setUserData(freshAccepter));
            
            return requester; // Retorna o amigo que foi aceito para o reducer

        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const declineFriendRequest = createAsyncThunk(
    'connections/declineRequest',
    async ({ recipientId, requesterId }, { dispatch, rejectWithValue }) => {
        try {
            // Busca o usuário mais recente (importante para atualização do userSlice)
            const recipientResponse = await fetch(`${API_URL}/${recipientId}`);
            const recipient = await recipientResponse.json(); 

            const updatedRequests = recipient.friendshipRequests.filter(id => id !== requesterId);
            
            const response = await fetch(`${API_URL}/${recipientId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ friendshipRequests: updatedRequests }),
            });
            const freshRecipient = await response.json();
            
            // ATUALIZAÇÃO CRÍTICA DO ESTADO GLOBAL DO USUÁRIO LOGADO
            dispatch(setUserData(freshRecipient));

            return { declinedRequestId: requesterId };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const removeFriend = createAsyncThunk(
    'connections/removeFriend',
    async ({ currentUserId, targetUserId }, { dispatch, rejectWithValue }) => {
        try {
            // 1. Fetch do usuário logado e do alvo para obter os dados mais recentes
            const [currentUserRes, targetUserRes] = await Promise.all([
                fetch(`${API_URL}/${currentUserId}`),
                fetch(`${API_URL}/${targetUserId}`)
            ]);
            
            if (!currentUserRes.ok || !targetUserRes.ok) {
                throw new Error("Falha ao buscar usuários para remoção.");
            }
            
            const currentUser = await currentUserRes.json();
            const targetUser = await targetUserRes.json();

            // 2. Lógica de remoção: filtra o ID do amigo de ambas as listas de 'friends'
            const updatedCurrentUserFriends = currentUser.friends.filter(id => String(id) !== String(targetUserId));
            const updatedTargetUserFriends = targetUser.friends.filter(id => String(id) !== String(currentUserId));

            // 3. Persistência: Atualiza o usuário logado no servidor (PATCH)
            const [updatedCurrentUserRes, updatedTargetUserRes] = await Promise.all([
                fetch(`${API_URL}/${currentUserId}`, {
                    method: 'PATCH', 
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ friends: updatedCurrentUserFriends })
                }),
                // 4. Persistência: Atualiza o usuário alvo no servidor (PATCH)
                fetch(`${API_URL}/${targetUserId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ friends: updatedTargetUserFriends })
                })
            ]);
            
            if (!updatedCurrentUserRes.ok || !updatedTargetUserRes.ok) {
                throw new Error("Falha ao salvar a remoção no servidor.");
            }
            
            const freshCurrentUser = await updatedCurrentUserRes.json();
            
            // 5. ATUALIZAÇÃO CRÍTICA: Atualiza o estado global do usuário logado
            dispatch(setUserData(freshCurrentUser));
            
            // 6. Dispara o fetch para garantir que todas as listas (friends, suggestions, etc.) sejam reconstruídas
            // Isso é importante, especialmente se a remoção afetar a lista de sugestões.
            dispatch(fetchConnectionsData(currentUserId));
            
            return { targetUserId }; 
            
        } catch (error) {
            console.error("Erro ao remover amigo:", error);
            return rejectWithValue(error.message);
        }
    }
);


// --- Slice e Reducers ---

const connectionsSlice = createSlice({
    name: 'connections',
    initialState: {
        friends: [],
        pendingRequests: [],
        sentRequests: [],
        suggestions: [],
        status: 'idle',
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            // FETCH DATA
            .addCase(fetchConnectionsData.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchConnectionsData.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.friends = action.payload.friends;
                state.pendingRequests = action.payload.pendingRequests;
                state.sentRequests = action.payload.sentRequests;
                state.suggestions = action.payload.suggestions;
            })
            .addCase(fetchConnectionsData.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            // TOGGLE REQUEST
            .addCase(toggleFriendRequest.fulfilled, (state, action) => {
                const { updatedTargetUser, wasSent } = action.payload;
                if (wasSent) { 
                    state.sentRequests = state.sentRequests.filter(u => u.id !== updatedTargetUser.id);
                } else { 
                    state.sentRequests.push(updatedTargetUser);
                }
            })
            // ACCEPT REQUEST
            .addCase(acceptFriendRequest.fulfilled, (state, action) => {
                const newFriend = action.payload;
                state.friends.push(newFriend);
                state.pendingRequests = state.pendingRequests.filter(req => req.id !== newFriend.id);
            })
            // DECLINE REQUEST
            .addCase(declineFriendRequest.fulfilled, (state, action) => {
                const { declinedRequestId } = action.payload;
                state.pendingRequests = state.pendingRequests.filter(
                    req => req.id !== declinedRequestId
                );
            })
            // REMOVE FRIEND
            .addCase(removeFriend.fulfilled, (state, action) => {
                // A lista local é atualizada. O fetchConnectionsData cuidará da lista de sugestões.
                const { targetUserId } = action.payload;
                state.friends = state.friends.filter(f => String(f.id) !== String(targetUserId));
            });
    },
});

export default connectionsSlice.reducer;

// EXPORTAÇÃO ÚNICA DE TODAS AS AÇÕES PARA EVITAR O ERRO 'Duplicate export'
export { 
    fetchConnectionsData, 
    toggleFriendRequest, 
    acceptFriendRequest, 
    declineFriendRequest,
    removeFriend
};