import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// ─── Async Thunks ──────────────────────────────────────────────────────────────

export const fetchStories = createAsyncThunk('sidebar/fetchStories', async (_, { rejectWithValue }) => {
  try { return await api.get('/stories'); }
  catch (err) { return rejectWithValue(err.message); }
});

export const createStory = createAsyncThunk('sidebar/createStory', async (formData, { rejectWithValue }) => {
  try {
    return await api.post('/stories', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  } catch (err) { return rejectWithValue(err.message); }
});

export const viewStory = createAsyncThunk('sidebar/viewStory', async (storyId, { rejectWithValue }) => {
  try { await api.put(`/stories/${storyId}/view`); return storyId; }
  catch (err) { return rejectWithValue(err.message); }
});

export const updateStory = createAsyncThunk('sidebar/updateStory', async ({ id, caption }, { rejectWithValue }) => {
  try { return await api.put(`/stories/${id}`, { caption }); }
  catch (err) { return rejectWithValue(err.message); }
});

export const deleteStory = createAsyncThunk('sidebar/deleteStory', async (id, { rejectWithValue }) => {
  try { await api.delete(`/stories/${id}`); return id; }
  catch (err) { return rejectWithValue(err.message); }
});

export const fetchCallHistory = createAsyncThunk('sidebar/fetchCallHistory', async (_, { rejectWithValue }) => {
  try { return await api.get('/calls'); }
  catch (err) { return rejectWithValue(err.message); }
});

export const createCallRecord = createAsyncThunk('sidebar/createCallRecord', async (data, { rejectWithValue }) => {
  try { return await api.post('/calls', data); }
  catch (err) { return rejectWithValue(err.message); }
});

export const fetchStarredMessages = createAsyncThunk('sidebar/fetchStarredMessages', async (_, { rejectWithValue }) => {
  try { return await api.get('/messages/starred'); }
  catch (err) { return rejectWithValue(err.message); }
});

// ─── Slice ─────────────────────────────────────────────────────────────────────

const sidebarSlice = createSlice({
  name: 'sidebar',
  initialState: {
    activeTab: 'chats', // chats | status | communities | calls | starred | archived | settings | profile
    stories: [],
    isLoadingStories: false,
    calls: [],
    isLoadingCalls: false,
    starredMessages: [],
    isLoadingStarred: false,
  },
  reducers: {
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    addStory: (state, action) => {
      state.stories.unshift(action.payload);
    },
    markStoryViewed: (state, action) => {
      const story = state.stories.find(s => s._id === action.payload);
      if (story && !story.viewedByMe) story.viewedByMe = true;
    },
    removeStarredMessage: (state, action) => {
      state.starredMessages = state.starredMessages.filter(m => m._id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Stories
      .addCase(fetchStories.pending, (state) => { state.isLoadingStories = true; })
      .addCase(fetchStories.fulfilled, (state, action) => {
        state.isLoadingStories = false;
        state.stories = action.payload || [];
      })
      .addCase(fetchStories.rejected, (state) => { state.isLoadingStories = false; })
      .addCase(createStory.fulfilled, (state, action) => {
        if (action.payload) state.stories.unshift(action.payload);
      })
      .addCase(updateStory.fulfilled, (state, action) => {
        if (action.payload) {
          const idx = state.stories.findIndex(s => s._id === action.payload._id);
          if (idx !== -1) state.stories[idx] = action.payload;
        }
      })
      .addCase(deleteStory.fulfilled, (state, action) => {
        state.stories = state.stories.filter(s => s._id !== action.payload);
      })
      // Calls
      .addCase(fetchCallHistory.pending, (state) => { state.isLoadingCalls = true; })
      .addCase(fetchCallHistory.fulfilled, (state, action) => {
        state.isLoadingCalls = false;
        state.calls = action.payload || [];
      })
      .addCase(fetchCallHistory.rejected, (state) => { state.isLoadingCalls = false; })
      .addCase(createCallRecord.fulfilled, (state, action) => {
        if (action.payload) state.calls.unshift(action.payload);
      })
      // Starred
      .addCase(fetchStarredMessages.pending, (state) => { state.isLoadingStarred = true; })
      .addCase(fetchStarredMessages.fulfilled, (state, action) => {
        state.isLoadingStarred = false;
        state.starredMessages = action.payload || [];
      })
      .addCase(fetchStarredMessages.rejected, (state) => { state.isLoadingStarred = false; });
  },
});

export const { setActiveTab, addStory, markStoryViewed, removeStarredMessage } = sidebarSlice.actions;
export default sidebarSlice.reducer;
