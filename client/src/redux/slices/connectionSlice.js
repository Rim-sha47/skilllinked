import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

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

export const acceptConnectionRequest = createAsyncThunk('connections/acceptRequest', async (connectionId, { rejectWithValue }) => {
  try {
    await api.put(`/connections/accept/${connectionId}`);
    return connectionId;
  } catch (err) { return rejectWithValue(err.message); }
});

export const removeConnection = createAsyncThunk('connections/remove', async (connectionId, { rejectWithValue }) => {
  try {
    await api.delete(`/connections/${connectionId}`);
    return connectionId;
  } catch (err) { return rejectWithValue(err.message); }
});

export const followUser = createAsyncThunk('connections/followUser', async (userId, { rejectWithValue }) => {
  try {
    const res = await api.post(`/connections/follow/${userId}`);
    return { userId, followersCount: res.followersCount };
  } catch (err) { return rejectWithValue(err.message); }
});

export const unfollowUser = createAsyncThunk('connections/unfollowUser', async (userId, { rejectWithValue }) => {
  try {
    const res = await api.delete(`/connections/follow/${userId}`);
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

    // ── sendConnectionRequest ── (remove from suggestions optimistically)
    builder.addCase(sendConnectionRequest.fulfilled, (state, action) => {
      state.suggestions = state.suggestions.filter(u => u._id !== action.payload);
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

