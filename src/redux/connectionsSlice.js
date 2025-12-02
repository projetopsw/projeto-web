import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { setUserData } from './userSlice'; 
// CORREÇÃO DE CAMINHO: Aponta para src/services/api.js
import api from '../services/api'; 

const USER_ROUTE = '/users';

// --- Thunks Assíncronos ---

const fetchConnectionsData = createAsyncThunk( 
    'connections/fetchData',
    async (currentUserId, { rejectWithValue }) => {
        try {
            // CORREÇÃO CRÍTICA: Forçando o Axios a buscar os dados sem cache (evita 304)
            const response = await api.get(USER_ROUTE, {
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                }
            }); 
            
            const allUsers = response.data; 

            if (!allUsers || allUsers.length === 0) {
                return rejectWithValue('Nenhum usuário encontrado no sistema.');
            }

            const currentUserIdStr = String(currentUserId); 
            const currentUser = allUsers.find(u => String(u._id) === currentUserIdStr || String(u.id) === currentUserIdStr);

            if (!currentUser) return rejectWithValue('Usuário atual não encontrado após a busca.');

            const fetchDetails = (ids) => {
                const uniqueIds = Array.from(new Set(ids.map(id => String(id))));
                return allUsers.filter(u => uniqueIds.includes(String(u._id) || String(u.id)));
            };

            const friends = fetchDetails(currentUser.friends || []);
            const pendingRequests = fetchDetails(currentUser.friendshipRequests || []);
            
            const sentRequestsUsers = allUsers.filter(user => 
                (user.friendshipRequests || []).includes(currentUserIdStr)
            );
            const sentRequests = sentRequestsUsers;
            
            const existingConnectionsIds = new Set([
                currentUserIdStr,
                ...(currentUser.friends || []).map(String),
                ...(currentUser.friendshipRequests || []).map(String),
                ...sentRequests.map(u => String(u._id) || String(u.id))
            ]);

            const suggestions = allUsers.filter(user =>
                !existingConnectionsIds.has(String(user._id) || String(user.id))
            );
            
            return { friends, pendingRequests, sentRequests, suggestions };

        } catch (error) {
            console.error("Erro no fetchConnectionsData:", error);
            return rejectWithValue(error.response?.data?.message || error.message || 'Falha na comunicação com o servidor.');
        }
    }
);

const toggleFriendRequest = createAsyncThunk(
    'connections/toggleRequest',
    async ({ currentUserId, targetUser }, { rejectWithValue }) => {
        const currentUserIdStr = String(currentUserId);
        const targetUserIdStr = String(targetUser._id || targetUser.id);
        
        const targetResponse = await api.get(`${USER_ROUTE}/${targetUserIdStr}`);
        const freshTargetUser = targetResponse.data;
        
        const isAlreadySent = (freshTargetUser.friendshipRequests || []).includes(currentUserIdStr);
        const updatedRequests = isAlreadySent
            ? (freshTargetUser.friendshipRequests || []).filter(id => String(id) !== currentUserIdStr)
            : [...(freshTargetUser.friendshipRequests || []), currentUserIdStr];

        try {
            const response = await api.patch(`${USER_ROUTE}/${targetUserIdStr}`, { 
                friendshipRequests: updatedRequests 
            });
            return { updatedTargetUser: response.data, wasSent: isAlreadySent };
        } catch (error) { return rejectWithValue(error.message); }
    }
);

const acceptFriendRequest = createAsyncThunk(
    'connections/acceptRequest',
    async ({ accepterId, requester }, { dispatch, rejectWithValue }) => {
        const accepterIdStr = String(accepterId);
        const requesterIdStr = String(requester._id || requester.id);
        
        const accepterResponse = await api.get(`${USER_ROUTE}/${accepterIdStr}`);
        const accepter = accepterResponse.data;

        const updatedAccepter = {
            friends: [...(accepter.friends || []), requesterIdStr],
            friendshipRequests: (accepter.friendshipRequests || []).filter(id => String(id) !== requesterIdStr)
        };
        
        const resAccepter = await api.patch(`${USER_ROUTE}/${accepterIdStr}`, updatedAccepter);
        const freshAccepter = resAccepter.data;

        const requesterResponse = await api.get(`${USER_ROUTE}/${requesterIdStr}`);
        const freshRequester = requesterResponse.data;
        
        const updatedRequester = {
            friends: [...(freshRequester.friends || []), accepterIdStr]
        };
        
        await api.patch(`${USER_ROUTE}/${requesterIdStr}`, updatedRequester);
        
        dispatch(setUserData(freshAccepter));
        return requester; 
    }
);

const declineFriendRequest = createAsyncThunk(
    'connections/declineRequest',
    async ({ recipientId, requesterId }, { dispatch, rejectWithValue }) => {
        const recipientIdStr = String(recipientId);
        const requesterIdStr = String(requesterId);
        
        const recipientResponse = await api.get(`${USER_ROUTE}/${recipientIdStr}`);
        const recipient = recipientResponse.data; 

        const updatedRequests = (recipient.friendshipRequests || []).filter(id => String(id) !== requesterIdStr);
        
        const response = await api.patch(`${USER_ROUTE}/${recipientIdStr}`, { 
            friendshipRequests: updatedRequests 
        });
        const freshRecipient = response.data;
        
        dispatch(setUserData(freshRecipient));
        return { declinedRequestId: requesterIdStr };
    }
);

const removeFriend = createAsyncThunk(
    'connections/removeFriend',
    async ({ currentUserId, targetUserId }, { dispatch, rejectWithValue }) => {
        const currentUserIdStr = String(currentUserId);
        const targetUserIdStr = String(targetUserId);

        try {
            const [currentUserRes, targetUserRes] = await Promise.all([
                api.get(`${USER_ROUTE}/${currentUserIdStr}`),
                api.get(`${USER_ROUTE}/${targetUserIdStr}`)
            ]);
            
            const currentUser = currentUserRes.data;
            const targetUser = targetUserRes.data;

            const updatedCurrentUserFriends = (currentUser.friends || []).filter(id => String(id) !== targetUserIdStr);
            const updatedTargetUserFriends = (targetUser.friends || []).filter(id => String(id) !== currentUserIdStr);

            await Promise.all([
                api.patch(`${USER_ROUTE}/${currentUserIdStr}`, { friends: updatedCurrentUserFriends }),
                api.patch(`${USER_ROUTE}/${targetUserIdStr}`, { friends: updatedTargetUserFriends })
            ]);
            
            const freshCurrentUser = (await api.get(`${USER_ROUTE}/${currentUserIdStr}`)).data;
            
            dispatch(setUserData(freshCurrentUser));
            dispatch(fetchConnectionsData(currentUserId)); 
            
            return { targetUserId: targetUserIdStr }; 
            
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// --- Slice ---

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
            .addCase(fetchConnectionsData.pending, (state) => { state.status = 'loading'; state.error = null; })
            .addCase(fetchConnectionsData.fulfilled, (state, action) => {
                state.status = 'succeeded';
                if (action.payload) {
                    state.friends = action.payload.friends || [];
                    state.pendingRequests = action.payload.pendingRequests || [];
                    state.sentRequests = action.payload.sentRequests || [];
                    state.suggestions = action.payload.suggestions || [];
                }
                state.error = null;
            })
            .addCase(fetchConnectionsData.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || 'Falha desconhecida na conexão.'; 
                state.friends = [];
                state.pendingRequests = [];
                state.sentRequests = [];
                state.suggestions = [];
            })
            .addCase(toggleFriendRequest.fulfilled, (state, action) => {
                const { updatedTargetUser, wasSent } = action.payload;
                // Usa _id para consistência, se o backend retornar _id
                const targetId = String(updatedTargetUser._id || updatedTargetUser.id);

                if (!wasSent) { 
                    state.sentRequests.push(updatedTargetUser); 
                    state.suggestions = state.suggestions.filter(u => String(u._id || u.id) !== targetId); 
                } else { 
                    state.sentRequests = state.sentRequests.filter(u => String(u._id || u.id) !== targetId); 
                    state.suggestions.push(updatedTargetUser); 
                }
            })
            .addCase(acceptFriendRequest.fulfilled, (state, action) => {
                const newFriend = action.payload;
                const friendId = String(newFriend._id || newFriend.id);
                state.friends.push(newFriend);
                state.pendingRequests = state.pendingRequests.filter(req => String(req._id || req.id) !== friendId);
            })
            .addCase(declineFriendRequest.fulfilled, (state, action) => {
                const { declinedRequestId } = action.payload;
                state.pendingRequests = state.pendingRequests.filter(req => String(req._id || req.id) !== String(declinedRequestId));
            })
            .addCase(removeFriend.fulfilled, (state, action) => {
                const { targetUserId } = action.payload;
                state.friends = state.friends.filter(f => String(f._id || f.id) !== String(targetUserId));
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