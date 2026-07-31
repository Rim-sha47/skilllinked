import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { updateUser } from './authSlice';

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const fetchConnections = createAsyncThunk('connections/fetchConnections', async (_, { rejectWithValue }) => {
  try {
    return await api.get('/connections');
  } catch (err) { return rejectWithValue(err.message); }
});

export const fetchPendingRequests = createAsyncThunk('connections/fetchPending', async (_, { rejectWithValue }) => {
  try {
    return await api.get('/connections/pending');
  } catch (err) { return rejectWithValue(err.message); }
});

export const fetchSuggestions = createAsyncThunk('connections/fetchSuggestions', async (_, { rejectWithValue }) => {
  try {
    return await api.get('/connections/suggestions');
  } catch (err) { return rejectWithValue(err.message); }
});

export const sendConnectionRequest = createAsyncThunk('connections/sendRequest', async (userId, { rejectWithValue }) => {
  try {
    await api.post(`/connections/request/${userId}`);
    return userId; // Return the ID so we can remove them from suggestions
  } catch (err) { return rejectWithValue(err.message); }
});

export const acceptConnectionRequest = createAsyncThunk('connections/acceptRequest', async (connectionId, { dispatch, rejectWithValue }) => {
  try {
    await api.put(`/connections/accept/${connectionId}`);
    dispatch(fetchConnections()); // Instantly update My Connections list
    return connectionId;
  } catch (err) { return rejectWithValue(err.message); }
});

export const removeConnection = createAsyncThunk('connections/remove', async (connectionId, { rejectWithValue }) => {
  try {
    await api.delete(`/connections/${connectionId}`);
    return connectionId;
  } catch (err) { return rejectWithValue(err.message); }
});

export const followUser = createAsyncThunk('connections/followUser', async (userId, { dispatch, rejectWithValue, getState }) => {
  try {
    const res = await api.post(`/connections/follow/${userId}`);
    const currentUser = getState().auth.user;
    if (currentUser && !currentUser.following?.includes(userId)) {
      dispatch(updateUser({ following: [...(currentUser.following || []), userId] }));
    }
    return { userId, followersCount: res.followersCount };
  } catch (err) { return rejectWithValue(err.message); }
});

export const unfollowUser = createAsyncThunk('connections/unfollowUser', async (userId, { dispatch, rejectWithValue, getState }) => {
  try {
    const res = await api.delete(`/connections/follow/${userId}`);
    const currentUser = getState().auth.user;
    if (currentUser && currentUser.following?.includes(userId)) {
      dispatch(updateUser({ following: currentUser.following.filter(id => id !== userId) }));
    }
    return { userId, followersCount: res.followersCount };
  } catch (err) { return rejectWithValue(err.message); }
});

export const removeFollower = createAsyncThunk('connections/removeFollower', async (userId, { dispatch, rejectWithValue, getState }) => {
  try {
    const res = await api.delete(`/connections/follower/${userId}`);
    const currentUser = getState().auth.user;
    if (currentUser && currentUser.followers?.includes(userId)) {
      dispatch(updateUser({ followers: currentUser.followers.filter(id => id !== userId) }));
    }
    return { userId, followersCount: res.followersCount };
  } catch (err) { return rejectWithValue(err.message); }
});

// ─── Slice ────────────────────────────────────────────────────────────────────

const initialState = {
  connections: [],
  pendingRequests: [],
  suggestions: [],
  isLoading: false,
  error: null,
};

const connectionSlice = createSlice({
  name: 'connections',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // ── fetchConnections ──
    builder.addCase(fetchConnections.pending, (state) => { state.isLoading = true; });
    builder.addCase(fetchConnections.fulfilled, (state, action) => {
      state.isLoading = false;
      state.connections = action.payload;
    });
    builder.addCase(fetchConnections.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });

    // ── fetchPendingRequests ──
    builder.addCase(fetchPendingRequests.fulfilled, (state, action) => {
      state.pendingRequests = action.payload;
    });

    // ── fetchSuggestions ──
    builder.addCase(fetchSuggestions.fulfilled, (state, action) => {
      state.suggestions = action.payload;
    });

    // ── sendConnectionRequest ── (mark as pending — the other user must accept)
    builder.addCase(sendConnectionRequest.fulfilled, (state, action) => {
      const suggestion = state.suggestions.find(u => u._id === action.payload);
      if (suggestion) {
        suggestion.connectionStatus = 'pending';
      }
    });

    // ── acceptConnectionRequest ── (remove from pendingRequests)
    builder.addCase(acceptConnectionRequest.fulfilled, (state, action) => {
      state.pendingRequests = state.pendingRequests.filter(r => r._id !== action.payload);
    });

    // ── removeConnection ── (remove from both connections and pendingRequests)
    builder.addCase(removeConnection.fulfilled, (state, action) => {
      state.connections = state.connections.filter(c => c._id !== action.payload);
      state.pendingRequests = state.pendingRequests.filter(r => r._id !== action.payload);
    });
  },
});

export default connectionSlice.reducer;

