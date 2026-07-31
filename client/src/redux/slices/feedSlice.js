import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchPosts = createAsyncThunk('feed/fetchPosts', async (feedType = 'foryou', { rejectWithValue }) => {
  try {
    return await api.get(`/posts?type=${feedType}`);
  } catch (err) { return rejectWithValue(err.message); }
});

export const fetchUserPosts = createAsyncThunk('feed/fetchUserPosts', async (userId, { rejectWithValue }) => {
  try {
    return await api.get(`/posts?userId=${userId}`);
  } catch (err) { return rejectWithValue(err.message); }
});

export const createPost = createAsyncThunk('feed/createPost', async (formData, { rejectWithValue }) => {
  try {
    return await api.post('/posts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  } catch (err) { return rejectWithValue(err.message); }
});

export const updatePost = createAsyncThunk('feed/updatePost', async ({ postId, text }, { rejectWithValue }) => {
  try {
    return await api.put(`/posts/${postId}`, { text });
  } catch (err) { return rejectWithValue(err.message); }
});

export const deletePost = createAsyncThunk('feed/deletePost', async (postId, { rejectWithValue }) => {
  try {
    await api.delete(`/posts/${postId}`);
    return postId;
  } catch (err) { return rejectWithValue(err.message); }
});

export const sharePost = createAsyncThunk('feed/sharePost', async (postId, { rejectWithValue }) => {
  try {
    const res = await api.post(`/posts/share/${postId}`);
    return { postId, shares: res.shares };
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
    return response.savedPosts;
  } catch (err) { return rejectWithValue(err.message); }
});

export const commentOnPost = createAsyncThunk('feed/comment', async ({ postId, text }, { rejectWithValue }) => {
  try {
    const comments = await api.post(`/posts/comment/${postId}`, { text });
    return { postId, comments };
  } catch (err) { return rejectWithValue(err.message); }
});

export const replyToComment = createAsyncThunk('feed/replyToComment', async ({ postId, commentId, text }, { rejectWithValue }) => {
  try {
    const comments = await api.post(`/posts/comment/reply/${postId}/${commentId}`, { text });
    return { postId, comments };
  } catch (err) { return rejectWithValue(err.message); }
});

export const editComment = createAsyncThunk('feed/editComment', async ({ postId, commentId, text }, { rejectWithValue }) => {
  try {
    const comments = await api.put(`/posts/comment/${postId}/${commentId}`, { text });
    return { postId, comments };
  } catch (err) { return rejectWithValue(err.message); }
});

export const deleteComment = createAsyncThunk('feed/deleteComment', async ({ postId, commentId }, { rejectWithValue }) => {
  try {
    const comments = await api.delete(`/posts/comment/${postId}/${commentId}`);
    return { postId, comments };
  } catch (err) { return rejectWithValue(err.message); }
});

// ─── Slice ─────────────────────────────────────────────────────────────────────

const feedSlice = createSlice({
  name: 'feed',
  initialState: {
    posts: [],
    userPosts: [],
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

    builder.addCase(fetchUserPosts.pending, (state) => { state.isLoading = true; });
    builder.addCase(fetchUserPosts.fulfilled, (state, action) => {
      state.isLoading = false;
      state.userPosts = action.payload;
    });
    builder.addCase(fetchUserPosts.rejected, (state) => { state.isLoading = false; });

    builder.addCase(createPost.pending, (state) => { state.isPosting = true; });
    builder.addCase(createPost.fulfilled, (state, action) => {
      state.isPosting = false;
      state.posts.unshift(action.payload);
      state.userPosts.unshift(action.payload);
    });
    builder.addCase(createPost.rejected, (state) => { state.isPosting = false; });

    builder.addCase(updatePost.fulfilled, (state, action) => {
      const idx = state.posts.findIndex(p => p._id === action.payload._id);
      if (idx !== -1) state.posts[idx] = action.payload;
      const idx2 = state.userPosts.findIndex(p => p._id === action.payload._id);
      if (idx2 !== -1) state.userPosts[idx2] = action.payload;
    });

    builder.addCase(deletePost.fulfilled, (state, action) => {
      state.posts = state.posts.filter(p => p._id !== action.payload);
      state.userPosts = state.userPosts.filter(p => p._id !== action.payload);
    });

    builder.addCase(toggleLikePost.fulfilled, (state, action) => {
      const post = state.posts.find(p => p._id === action.payload.postId);
      if (post) post.reactions = action.payload.likes;
      const userPost = state.userPosts.find(p => p._id === action.payload.postId);
      if (userPost) userPost.reactions = action.payload.likes;
    });

    builder.addCase(sharePost.fulfilled, (state, action) => {
      const post = state.posts.find(p => p._id === action.payload.postId);
      if (post) post.shares = action.payload.shares;
      const userPost = state.userPosts.find(p => p._id === action.payload.postId);
      if (userPost) userPost.shares = action.payload.shares;
    });

    builder.addCase(commentOnPost.fulfilled, (state, action) => {
      const post = state.posts.find(p => p._id === action.payload.postId);
      if (post) post.comments = action.payload.comments;
      const userPost = state.userPosts.find(p => p._id === action.payload.postId);
      if (userPost) userPost.comments = action.payload.comments;
    });

    builder.addCase(replyToComment.fulfilled, (state, action) => {
      const post = state.posts.find(p => p._id === action.payload.postId);
      if (post) post.comments = action.payload.comments;
      const userPost = state.userPosts.find(p => p._id === action.payload.postId);
      if (userPost) userPost.comments = action.payload.comments;
    });

    builder.addCase(editComment.fulfilled, (state, action) => {
      const post = state.posts.find(p => p._id === action.payload.postId);
      if (post) post.comments = action.payload.comments;
      const userPost = state.userPosts.find(p => p._id === action.payload.postId);
      if (userPost) userPost.comments = action.payload.comments;
    });

    builder.addCase(deleteComment.fulfilled, (state, action) => {
      const post = state.posts.find(p => p._id === action.payload.postId);
      if (post) post.comments = action.payload.comments;
      const userPost = state.userPosts.find(p => p._id === action.payload.postId);
      if (userPost) userPost.comments = action.payload.comments;
    });
  },
});

export default feedSlice.reducer;
