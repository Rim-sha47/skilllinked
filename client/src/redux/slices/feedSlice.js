import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchPosts = createAsyncThunk('feed/fetchPosts', async (_, { rejectWithValue }) => {
  try {
    return await api.get('/posts');
  } catch (err) { return rejectWithValue(err.message); }
});

export const createPost = createAsyncThunk('feed/createPost', async (formData, { rejectWithValue }) => {
  try {
    return await api.post('/posts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  } catch (err) { return rejectWithValue(err.message); }
});

export const toggleLikePost = createAsyncThunk('feed/toggleLike', async (postId, { rejectWithValue }) => {
  try {
    const likes = await api.put(`/posts/like/${postId}`);
    return { postId, likes };
  } catch (err) { return rejectWithValue(err.message); }
});

export const savePost = createAsyncThunk('feed/savePost', async (postId, { rejectWithValue }) => {
  try {
    const response = await api.put(`/posts/save/${postId}`);
    return response.savedPosts; // Returns array of saved post IDs
  } catch (err) { return rejectWithValue(err.message); }
});

export const commentOnPost = createAsyncThunk('feed/comment', async ({ postId, text }, { rejectWithValue }) => {
  try {
    const comments = await api.post(`/posts/comment/${postId}`, { text });
    return { postId, comments };
  } catch (err) { return rejectWithValue(err.message); }
});

// ─── Slice ─────────────────────────────────────────────────────────────────────

const feedSlice = createSlice({
  name: 'feed',
  initialState: {
    posts: [],
    isLoading: false,
    isPosting: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchPosts.pending, (state) => { state.isLoading = true; state.error = null; });
    builder.addCase(fetchPosts.fulfilled, (state, action) => {
      state.isLoading = false;
      state.posts = action.payload;
    });
    builder.addCase(fetchPosts.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });

    builder.addCase(createPost.pending, (state) => { state.isPosting = true; });
    builder.addCase(createPost.fulfilled, (state, action) => {
      state.isPosting = false;
      state.posts.unshift(action.payload);
    });
    builder.addCase(createPost.rejected, (state) => { state.isPosting = false; });

    builder.addCase(toggleLikePost.fulfilled, (state, action) => {
      const post = state.posts.find(p => p._id === action.payload.postId);
      if (post) post.reactions = action.payload.likes;
    });

    builder.addCase(commentOnPost.fulfilled, (state, action) => {
      const post = state.posts.find(p => p._id === action.payload.postId);
      if (post) post.comments = action.payload.comments;
    });
  },
});

export default feedSlice.reducer;
