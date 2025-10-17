import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { setUserData } from './userSlice'; 

const API_URL = 'http://localhost:3001/users';


const fetchConnectionsData = createAsyncThunk( 
    'connections/fetchData',
    async (currentUserId, { rejectWithValue }) => {
        try {
            const allUsers = await (await fetch(API_URL)).json(); 
            const currentUserIdStr = String(currentUserId); 
            const currentUser = allUsers.find(u => String(u.id) === currentUserIdStr);

            if (!currentUser) return rejectWithValue('Usuário atual não encontrado.');

            const fetchDetails = (ids) => {
                const uniqueIds = Array.from(new Set(ids.map(id => String(id))));
                return allUsers.filter(u => uniqueIds.includes(String(u.id)));
            };

            const friends = fetchDetails(currentUser.friends || []);
            const pendingRequests = fetchDetails(currentUser.friendshipRequests || []);
            
            // Busca reversa dos pedidos enviados
            const sentRequestsUsers = allUsers.filter(user => 
                (user.friendshipRequests || []).includes(currentUserIdStr)
            );
            const sentRequests = sentRequestsUsers;
            
            const existingConnectionsIds = new Set([
                currentUserIdStr,
                ...(currentUser.friends || []).map(String),
                ...(currentUser.friendshipRequests || []).map(String),
                ...sentRequests.map(u => String(u.id))
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

const toggleFriendRequest = createAsyncThunk(
    'connections/toggleRequest',
    async ({ currentUserId, targetUser }, { rejectWithValue }) => {
        // ... Lógica de toggle Friend Request
        const currentUserIdStr = String(currentUserId);
        const targetUserIdStr = String(targetUser.id);
        const targetResponse = await fetch(`${API_URL}/${targetUserIdStr}`);
        const freshTargetUser = await targetResponse.json();
        const isAlreadySent = (freshTargetUser.friendshipRequests || []).includes(currentUserIdStr);
        const updatedRequests = isAlreadySent
            ? (freshTargetUser.friendshipRequests || []).filter(id => String(id) !== currentUserIdStr)
            : [...(freshTargetUser.friendshipRequests || []), currentUserIdStr];

        try {
            const response = await fetch(`${API_URL}/${targetUserIdStr}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ friendshipRequests: updatedRequests }),
            });
            return { updatedTargetUser: await response.json(), wasSent: isAlreadySent };
        } catch (error) { return rejectWithValue(error.message); }
    }
);

const acceptFriendRequest = createAsyncThunk(
    'connections/acceptRequest',
    async ({ accepterId, requester }, { dispatch, rejectWithValue }) => {
        const accepterIdStr = String(accepterId);
        const requesterIdStr = String(requester.id);
        
        const accepterResponse = await fetch(`${API_URL}/${accepterIdStr}`);
        const accepter = await accepterResponse.json();

        const updatedAccepter = {
            friends: [...(accepter.friends || []), requesterIdStr],
            friendshipRequests: (accepter.friendshipRequests || []).filter(id => String(id) !== requesterIdStr)
        };
        const resAccepter = await fetch(`${API_URL}/${accepterIdStr}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedAccepter),
        });
        const freshAccepter = await resAccepter.json();

        const requesterResponse = await fetch(`${API_URL}/${requesterIdStr}`);
        const freshRequester = await requesterResponse.json();
        
        const updatedRequester = {
            friends: [...(freshRequester.friends || []), accepterIdStr]
        };
        await fetch(`${API_URL}/${requesterIdStr}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedRequester),
        });
        
        dispatch(setUserData(freshAccepter));
        return requester; 
    }
);

const declineFriendRequest = createAsyncThunk(
    'connections/declineRequest',
    async ({ recipientId, requesterId }, { dispatch, rejectWithValue }) => {
        const recipientIdStr = String(recipientId);
        const requesterIdStr = String(requesterId);
        
        const recipientResponse = await fetch(`${API_URL}/${recipientIdStr}`);
        const recipient = await recipientResponse.json(); 

        const updatedRequests = (recipient.friendshipRequests || []).filter(id => String(id) !== requesterIdStr);
        
        const response = await fetch(`${API_URL}/${recipientIdStr}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ friendshipRequests: updatedRequests }),
        });
        const freshRecipient = await response.json();
        
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
                fetch(`${API_URL}/${currentUserIdStr}`),
                fetch(`${API_URL}/${targetUserIdStr}`)
            ]);
            
            if (!currentUserRes.ok || !targetUserRes.ok) throw new Error("Falha ao buscar usuários para remoção.");
            
            const currentUser = await currentUserRes.json();
            const targetUser = await targetUserRes.json();

            const updatedCurrentUserFriends = (currentUser.friends || []).filter(id => String(id) !== targetUserIdStr);
            const updatedTargetUserFriends = (targetUser.friends || []).filter(id => String(id) !== currentUserIdStr);

            await Promise.all([
                fetch(`${API_URL}/${currentUserIdStr}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ friends: updatedCurrentUserFriends }) }),
                fetch(`${API_URL}/${targetUserIdStr}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ friends: updatedTargetUserFriends }) })
            ]);
            
            const freshCurrentUser = await (await fetch(`${API_URL}/${currentUserIdStr}`)).json();
            
            dispatch(setUserData(freshCurrentUser));
            dispatch(fetchConnectionsData(currentUserId)); 
            
            return { targetUserId: targetUserIdStr }; 
            
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);



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
                if (!wasSent) { state.sentRequests.push(updatedTargetUser); state.suggestions = state.suggestions.filter(u => String(u.id) !== String(updatedTargetUser.id)); } 
                else { state.sentRequests = state.sentRequests.filter(u => String(u.id) !== String(updatedTargetUser.id)); state.suggestions.push(updatedTargetUser); }
            })
            .addCase(acceptFriendRequest.fulfilled, (state, action) => {
                const newFriend = action.payload;
                state.friends.push(newFriend);
                state.pendingRequests = state.pendingRequests.filter(req => String(req.id) !== String(newFriend.id));
            })
            .addCase(declineFriendRequest.fulfilled, (state, action) => {
                const { declinedRequestId } = action.payload;
                state.pendingRequests = state.pendingRequests.filter(req => String(req.id) !== String(declinedRequestId));
            })
            .addCase(removeFriend.fulfilled, (state, action) => {
                const { targetUserId } = action.payload;
                state.friends = state.friends.filter(f => String(f.id) !== String(targetUserId));
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