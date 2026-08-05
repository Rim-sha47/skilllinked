import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// ── Thunks ────────────────────────────────────────────────────────────────────

export const fetchChannels = createAsyncThunk(
  'channels/fetchChannels',
  async ({ search = '', category = '' } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      return await api.get(`/channels?${params.toString()}`);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchFollowingChannels = createAsyncThunk(
  'channels/fetchFollowing',
  async (_, { rejectWithValue }) => {
    try {
      return await api.get('/channels/following');
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const toggleFollowChannel = createAsyncThunk(
  'channels/toggleFollow',
  async (channelId, { rejectWithValue }) => {
    try {
      return await api.put(`/channels/${channelId}/follow`);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const createChannel = createAsyncThunk(
  'channels/create',
  async (data, { rejectWithValue }) => {
    try {
      return await api.post('/channels', data);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const channelsSlice = createSlice({
  name: 'channels',
  initialState: {
    allChannels: [],
    followingChannels: [],
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchChannels.pending, (state) => { state.isLoading = true; })
      .addCase(fetchChannels.fulfilled, (state, action) => {
        state.isLoading = false;
        state.allChannels = action.payload;
      })
      .addCase(fetchChannels.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      .addCase(fetchFollowingChannels.fulfilled, (state, action) => {
        state.followingChannels = action.payload;
      })

      .addCase(toggleFollowChannel.fulfilled, (state, action) => {
        const { channelId, isFollowing, followerCount } = action.payload;
        // Update in allChannels
        const idx = state.allChannels.findIndex(c => c._id === channelId);
        if (idx !== -1) {
          state.allChannels[idx].isFollowing = isFollowing;
          state.allChannels[idx].followerCount = followerCount;
        }
        // Update followingChannels list
        if (!isFollowing) {
          state.followingChannels = state.followingChannels.filter(c => c._id !== channelId);
        }
      })

      .addCase(createChannel.fulfilled, (state, action) => {
        state.allChannels.unshift(action.payload);
        state.followingChannels.unshift(action.payload);
      });
  },
});

export default channelsSlice.reducer;
