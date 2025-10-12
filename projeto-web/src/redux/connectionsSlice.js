import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_URL = 'http://localhost:3001/users';

export const fetchConnectionsData = createAsyncThunk(
    'connections/fetchData',
    async (currentUserId, { rejectWithValue }) => {
        try {
            const allUsers = await (await fetch(API_URL)).json();
            const currentUser = allUsers.find(u => u.id === currentUserId);

            if (!currentUser) {
                return rejectWithValue('Usuário atual não encontrado.');
            }

            const fetchDetails = (ids) => allUsers.filter(u => ids.includes(u.id));

            const friends = fetchDetails(currentUser.friends);
            const pendingRequests = fetchDetails(currentUser.friendshipRequests);

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


export const toggleFriendRequest = createAsyncThunk(
    'connections/toggleRequest',
    async ({ currentUserId, targetUser }, { rejectWithValue }) => {
        const isAlreadySent = targetUser.friendshipRequests.includes(currentUserId);
        const updatedRequests = isAlreadySent
            ? targetUser.friendshipRequests.filter(id => id !== currentUserId)
            : [...targetUser.friendshipRequests, currentUserId];

        try {
            const response = await fetch(`${API_URL}/${targetUser.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ friendshipRequests: updatedRequests }),
            });
            const data = await response.json();
            return { updatedTargetUser: data, wasSent: isAlreadySent };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const acceptFriendRequest = createAsyncThunk(
    'connections/acceptRequest',
    async ({ accepterId, requester }, { rejectWithValue }) => {
        try {
            const accepterResponse = await fetch(`${API_URL}/${accepterId}`);
            const accepter = await accepterResponse.json();

            const updatedAccepter = {
                friends: [...accepter.friends, requester.id],
                friendshipRequests: accepter.friendshipRequests.filter(id => id !== requester.id)
            };
            await fetch(`${API_URL}/${accepterId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedAccepter),
            });

            const updatedRequester = {
                friends: [...requester.friends, accepterId]
            };
            await fetch(`${API_URL}/${requester.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedRequester),
            });
            
            return requester;

        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const declineFriendRequest = createAsyncThunk(
    'connections/declineRequest',
    async ({ recipientId, requesterId }, { getState, rejectWithValue }) => {
        try {
            const state = getState();
            const recipient = state.auth.user; 

            const updatedRequests = recipient.friendshipRequests.filter(id => id !== requesterId);
            await fetch(`${API_URL}/${recipientId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ friendshipRequests: updatedRequests }),
            });
            
            return { declinedRequestId: requesterId };
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
            .addCase(toggleFriendRequest.fulfilled, (state, action) => {
                const { updatedTargetUser, wasSent } = action.payload;
                if (wasSent) { 
                    state.sentRequests = state.sentRequests.filter(u => u.id !== updatedTargetUser.id);
                } else { 
                    state.sentRequests.push(updatedTargetUser);
                }
            })
            .addCase(acceptFriendRequest.fulfilled, (state, action) => {
                const newFriend = action.payload;
                state.friends.push(newFriend);
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