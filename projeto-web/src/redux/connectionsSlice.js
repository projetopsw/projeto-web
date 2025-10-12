import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// 🚨 CERTIFIQUE-SE DE QUE ESTA IMPORTAÇÃO ESTÁ CORRETA 🚨
import { setUserData } from './userSlice'; 

const API_URL = 'http://localhost:3001/users';

// --- Thunks Assíncronos ---

export const fetchConnectionsData = createAsyncThunk(
    'connections/fetchData',
    async (currentUserId, { rejectWithValue }) => {
        try {
            const currentUserIdStr = String(currentUserId);
            const allUsers = await (await fetch(API_URL)).json();
            
            const userMap = allUsers.reduce((map, user) => {
                map[String(user.id)] = user;
                return map;
            }, {});

            const currentUser = userMap[currentUserIdStr];
            if (!currentUser) {
                return rejectWithValue('Usuário atual não encontrado no banco de dados.');
            }

            const friendsIds = new Set((currentUser.friends || []).map(String));
            const pendingIds = new Set((currentUser.friendshipRequests || []).map(String));
            
            const knownIds = new Set([...friendsIds, ...pendingIds, currentUserIdStr]);

            const friends = Array.from(friendsIds)
                                .map(id => userMap[id])
                                .filter(user => user != null); 

            const pendingRequests = Array.from(pendingIds)
                                        .map(id => userMap[id])
                                        .filter(user => user != null);


            const sentRequests = allUsers.filter(user => {
                const userIdStr = String(user.id);
                if (userIdStr !== currentUserIdStr && (user.friendshipRequests || []).map(String).includes(currentUserIdStr)) {
                    knownIds.add(userIdStr);
                    return true;
                }
                return false;
            });
            
            const suggestions = allUsers.filter(user => 
                !knownIds.has(String(user.id))
            );
            
            return { friends, pendingRequests, sentRequests, suggestions };

        } catch (error) {
            console.error("Erro ao buscar dados de conexões:", error);
            return rejectWithValue(error.message);
        }
    }
);


export const toggleFriendRequest = createAsyncThunk(
    'connections/toggleRequest',
    async ({ currentUserId, targetUser }, { rejectWithValue }) => {
        const currentUserIdStr = String(currentUserId);
        const targetUserIdStr = String(targetUser.id);

        const isRequestPending = (targetUser.friendshipRequests || []).map(String).includes(currentUserIdStr);
        
        const updatedRequests = isRequestPending
            ? (targetUser.friendshipRequests || []).map(String).filter(id => id !== currentUserIdStr)
            : [...(targetUser.friendshipRequests || []).map(String), currentUserIdStr];

        try {
            const response = await fetch(`${API_URL}/${targetUserIdStr}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ friendshipRequests: updatedRequests }),
            });
            const data = await response.json();
            
            return { updatedTargetUser: data, type: isRequestPending ? 'cancel' : 'send' };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const acceptFriendRequest = createAsyncThunk(
    'connections/acceptRequest',
    // O requester agora é robusto para ser o objeto ou apenas o ID (caso o componente envie errado)
    async ({ accepterId, requester }, { dispatch, rejectWithValue }) => {
        const accepterIdStr = String(accepterId);
        
        // CORREÇÃO ROBUSTA: Pega o ID seja de requester.id ou se requester for o próprio ID
        const requesterIdStr = String(requester.id || requester); 

        try {
            // Se o requester não for um objeto completo, buscamos ele (garantindo o objeto para o retorno)
            let requesterProfile = requester;
            if (!requesterProfile.name) { 
                const res = await fetch(`${API_URL}/${requesterIdStr}`);
                requesterProfile = await res.json();
            }

            // 1. Atualiza o Aceitador (Você) - Remove de pendentes e adiciona a amigos
            const accepterResponse = await fetch(`${API_URL}/${accepterIdStr}`);
            const accepter = await accepterResponse.json();

            const updatedAccepterFields = {
                friends: [...(accepter.friends || []).map(String), requesterIdStr],
                friendshipRequests: (accepter.friendshipRequests || []).map(String).filter(id => id !== requesterIdStr)
            };
            const accepterUpdate = await fetch(`${API_URL}/${accepterIdStr}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedAccepterFields),
            }).then(res => res.json());

            // 2. Atualiza o Requerente (Novo Amigo) - Adiciona você a lista de amigos dele
            const updatedRequesterFields = {
                friends: [...(requesterProfile.friends || []).map(String), accepterIdStr]
            };
            const requesterUpdate = await fetch(`${API_URL}/${requesterIdStr}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedRequesterFields),
            }).then(res => res.json());
            
            // 3. Atualiza o usuário logado no Redux principal
            dispatch(setUserData(accepterUpdate));
            
            // Retorna o perfil COMPLETO do novo amigo (requerido pelo reducer)
            return requesterUpdate; 

        } catch (error) {
            console.error("Erro ao aceitar pedido:", error);
            return rejectWithValue("Falha ao aceitar solicitação e sincronizar perfis.");
        }
    }
);

export const declineFriendRequest = createAsyncThunk(
    'connections/declineRequest',
    async ({ recipientId, requesterId }, { dispatch, rejectWithValue }) => {
        const recipientIdStr = String(recipientId);
        const requesterIdStr = String(requesterId);

        try {
            const recipientResponse = await fetch(`${API_URL}/${recipientIdStr}`);
            if (!recipientResponse.ok) {
                 throw new Error('Falha ao buscar o perfil do recipiente.');
            }
            const recipient = await recipientResponse.json();
            
            const updatedRequests = (recipient.friendshipRequests || []).map(String).filter(id => id !== requesterIdStr);
            
            const response = await fetch(`${API_URL}/${recipientIdStr}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ friendshipRequests: updatedRequests }),
            });
            
            if (!response.ok) {
                 throw new Error('Falha ao atualizar o servidor.');
            }
            const recipientUpdate = await response.json();

            dispatch(setUserData(recipientUpdate));
            
            return { declinedRequestId: requesterIdStr };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// --- SLICE ---
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
            // --- fetchConnectionsData ---
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
            
            // --- toggleFriendRequest (Enviar/Cancelar) ---
            .addCase(toggleFriendRequest.fulfilled, (state, action) => {
                const { updatedTargetUser, type } = action.payload;
                const targetIdStr = String(updatedTargetUser.id);
                
                if (type === 'cancel') {
                    state.sentRequests = state.sentRequests.filter(req => String(req.id) !== targetIdStr);
                    
                    if (!state.friends.some(f => String(f.id) === targetIdStr) &&
                        !state.suggestions.some(sug => String(sug.id) === targetIdStr)) {
                        state.suggestions.push(updatedTargetUser);
                    }
                } 
                else if (type === 'send') {
                    state.sentRequests.push(updatedTargetUser); 
                    state.suggestions = state.suggestions.filter(sug => String(sug.id) !== targetIdStr);
                }
            })

            // --- acceptFriendRequest (Aceitar) ---
            .addCase(acceptFriendRequest.fulfilled, (state, action) => {
                const newFriend = action.payload;
                
                if (!newFriend || !newFriend.id) {
                    console.error("Payload do acceptFriendRequest incompleto ou nulo:", newFriend);
                    return; 
                }

                const newFriendIdStr = String(newFriend.id);
                
                // 1. Adiciona à lista de Amigos (checa duplicidade)
                if (!state.friends.some(f => String(f.id) === newFriendIdStr)) {
                    state.friends.push(newFriend);
                }
                
                // 2. Remove de Pedidos Pendentes
                state.pendingRequests = state.pendingRequests.filter(req => String(req.id) !== newFriendIdStr);
                
                // 3. Remove de sugestões
                state.suggestions = state.suggestions.filter(sug => String(sug.id) !== newFriendIdStr);
            })

            // --- declineFriendRequest (Recusar) ---
            .addCase(declineFriendRequest.fulfilled, (state, action) => {
                const { declinedRequestId } = action.payload;
                const declinedIdStr = String(declinedRequestId);
                
                state.pendingRequests = state.pendingRequests.filter(req => String(req.id) !== declinedIdStr);
            });
    },
});

export default connectionsSlice.reducer;