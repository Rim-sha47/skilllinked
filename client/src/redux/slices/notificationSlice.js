import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchNotifications = createAsyncThunk('notifications/fetch', async (_, { rejectWithValue }) => {
  try {
    return await api.get('/notifications');
  } catch (err) { return rejectWithValue(err.message); }
});

export const markNotificationRead = createAsyncThunk('notifications/markRead', async (id, { rejectWithValue }) => {
  try {
    await api.put(`/notifications/${id}/read`);
    return id;
  } catch (err) { return rejectWithValue(err.message); }
});

export const markAllNotificationsRead = createAsyncThunk('notifications/markAllRead', async (_, { rejectWithValue }) => {
  try {
    await api.put('/notifications/read-all');
  } catch (err) { return rejectWithValue(err.message); }
});

export const deleteNotification = createAsyncThunk('notifications/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/notifications/${id}`);
    return id;
  } catch (err) { return rejectWithValue(err.message); }
});

// ─── Slice ─────────────────────────────────────────────────────────────────────

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    isLoading: false,
    error: null,
  },
  reducers: {
    // Push a real-time notification from socket
    addRealtimeNotification: (state, action) => {
      state.items.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchNotifications.pending, (state) => { state.isLoading = true; });
    builder.addCase(fetchNotifications.fulfilled, (state, action) => {
      state.isLoading = false;
      state.items = action.payload;
    });
    builder.addCase(fetchNotifications.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });

    builder.addCase(markNotificationRead.fulfilled, (state, action) => {
      const n = state.items.find(i => i._id === action.payload);
      if (n) n.isRead = true;
    });

    builder.addCase(markAllNotificationsRead.fulfilled, (state) => {
      state.items.forEach(n => { n.isRead = true; });
    });

    builder.addCase(deleteNotification.fulfilled, (state, action) => {
      state.items = state.items.filter(n => n._id !== action.payload);
    });
  },
});

export const { addRealtimeNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
