import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_URL = 'http://localhost:3001/users';

export const toggleFriendRequest = createAsyncThunk(
    'connections/toggleRequest',
    async ({ currentUserId, targetUser }, { rejectWithValue, dispatch }) => {
        try {
            const responseTarget = await fetch(`${API_URL}/${targetUser.id}`);
            const freshTargetUser = await responseTarget.json();
            
            const isAlreadySent = freshTargetUser.requestsReceived.includes(currentUserId);

            const updatedRequests = isAlreadySent
                ? freshTargetUser.requestsReceived.filter(id => id !== currentUserId)
                : [...freshTargetUser.requestsReceived, currentUserId];

            await fetch(`${API_URL}/${targetUser.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestsReceived: updatedRequests }),
            });

            const responseCurrentUser = await fetch(`${API_URL}/${currentUserId}`);
            const freshCurrentUser = await responseCurrentUser.json();

            const updatedSent = isAlreadySent
                ? freshCurrentUser.requestsSent.filter(id => id !== targetUser.id)
                : [...freshCurrentUser.requestsSent, targetUser.id];
            
            const updatedCurrentUser = await fetch(`${API_URL}/${currentUserId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestsSent: updatedSent }),
            });

            dispatch(fetchConnectionsData(currentUserId));
            
            return await updatedCurrentUser.json();

        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const acceptFriendRequest = createAsyncThunk(
    'connections/acceptRequest',
    async ({ accepterId, requester }, { rejectWithValue, dispatch }) => {
        try {
            const accepterResponse = await fetch(`${API_URL}/${accepterId}`);
            const accepter = await accepterResponse.json();
            
            await fetch(`${API_URL}/${accepterId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    friends: [...accepter.friends, requester.id],
                    requestsReceived: accepter.requestsReceived.filter(id => id !== requester.id) 
                }),
            });

            const requesterResponse = await fetch(`${API_URL}/${requester.id}`);
            const freshRequester = await requesterResponse.json();

            await fetch(`${API_URL}/${requester.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    friends: [...freshRequester.friends, accepterId],
                    requestsSent: freshRequester.requestsSent.filter(id => id !== accepterId)
                }),
            });
           
            dispatch(fetchConnectionsData(accepterId));
            return requester;

        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const declineFriendRequest = createAsyncThunk(
    'connections/declineRequest',
    async ({ recipientId, requesterId }, { rejectWithValue, dispatch }) => {
        try {
            const recipientResponse = await fetch(`${API_URL}/${recipientId}`);
            const recipient = await recipientResponse.json();

            const updatedRequests = recipient.requestsReceived.filter(id => id !== requesterId); 

            await fetch(`${API_URL}/${recipientId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestsReceived: updatedRequests }), 
            });
            
            dispatch(fetchConnectionsData(recipientId));
            return { declinedRequestId: requesterId };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchConnectionsData = createAsyncThunk(
    'connections/fetchData',
    async (currentUserId, { rejectWithValue }) => {
        if (!currentUserId) {
            return rejectWithValue('ID do usuário não fornecido.');
        }

        try {
            const response = await fetch(API_URL);
            const allUsers = await response.json();
            const currentUser = allUsers.find(u => u.id === currentUserId);

            if (!currentUser) {
                return rejectWithValue('Usuário atual não encontrado.');
            }

            const friendsIds = currentUser.friends || [];
            const receivedIds = currentUser.requestsReceived || [];
            const sentIds = currentUser.requestsSent || [];

            const fetchUserDetails = (ids) => allUsers.filter(u => ids.includes(u.id));

            const friends = fetchUserDetails(friendsIds);
            const pendingRequests = fetchUserDetails(receivedIds); 
            const sentRequests = fetchUserDetails(sentIds);       

            const suggestionIds = new Set([
                ...friendsIds,
                ...receivedIds,
                ...sentIds,
                currentUserId
            ]);

            const suggestions = allUsers.filter(user => !suggestionIds.has(user.id));
            
            return { friends, pendingRequests, sentRequests, suggestions };
        } catch (error) {
            console.error("Erro em fetchConnectionsData:", error);
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
            .addCase(acceptFriendRequest.fulfilled, (state, action) => {
                const newFriend = action.payload;
                state.pendingRequests = state.pendingRequests.filter(req => req.id !== newFriend.id);
            })
            .addCase(declineFriendRequest.fulfilled, (state, action) => {
                const { declinedRequestId } = action.payload;
                state.pendingRequests = state.pendingRequests.filter(
                    req => req.id !== declinedRequestId
                );
            });
    },
});

export default connectionsSlice.reducer;