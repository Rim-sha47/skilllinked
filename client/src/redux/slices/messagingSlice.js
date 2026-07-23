import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchChats = createAsyncThunk('messaging/fetchChats', async (_, { rejectWithValue }) => {
  try {
    return await api.get('/chats');
  } catch (err) { return rejectWithValue(err.message); }
});

export const accessOrCreateChat = createAsyncThunk('messaging/accessChat', async (userId, { rejectWithValue }) => {
  try {
    return await api.post('/chats', { userId });
  } catch (err) { return rejectWithValue(err.message); }
});

export const fetchMessages = createAsyncThunk('messaging/fetchMessages', async (chatId, { rejectWithValue }) => {
  try {
    return await api.get(`/messages/${chatId}`);
  } catch (err) { return rejectWithValue(err.message); }
});

export const sendMessage = createAsyncThunk('messaging/sendMessage', async ({ chatId, content, replyTo }, { rejectWithValue }) => {
  try {
    return await api.post('/messages', { chatId, content, replyTo: replyTo || null });
  } catch (err) { return rejectWithValue(err.message); }
});

export const sendMedia = createAsyncThunk('messaging/sendMedia', async (formData, { rejectWithValue }) => {
  try {
    const config = { headers: { 'Content-Type': 'multipart/form-data' } };
    return await api.post('/messages/upload', formData, config);
  } catch (err) { return rejectWithValue(err.message); }
});

export const deleteMessage = createAsyncThunk('messaging/deleteMessage', async (messageId, { rejectWithValue }) => {
  try {
    await api.delete(`/messages/${messageId}`);
    return messageId;
  } catch (err) { return rejectWithValue(err.message); }
});

// ─── Slice ─────────────────────────────────────────────────────────────────────

const messagingSlice = createSlice({
  name: 'messaging',
  initialState: {
    chats: [],
    activeChatId: null,
    messages: {},       // keyed by chatId
    isLoadingChats: false,
    isLoadingMessages: false,
    isSending: false,
    error: null,
    replyingTo: null,   // message object being replied to
  },
  reducers: {
    setActiveChat: (state, action) => {
      state.activeChatId = action.payload;
      state.replyingTo = null;
    },
    setReplyingTo: (state, action) => {
      state.replyingTo = action.payload;
    },
    clearReplyingTo: (state) => {
      state.replyingTo = null;
    },
    // Push a real-time message from socket
    receiveMessage: (state, action) => {
      const msg = action.payload;
      const chatId = msg.chat?._id || msg.chat;
      if (!state.messages[chatId]) state.messages[chatId] = [];
      // Avoid duplicates
      if (!state.messages[chatId].find(m => m._id === msg._id)) {
        state.messages[chatId].push(msg);
      }
      // Update latest message in chat list
      const chat = state.chats.find(c => c._id === chatId);
      if (chat) {
        chat.latestMessage = msg;
      }
    },
    removeMessage: (state, action) => {
      const { messageId, chatId } = action.payload;
      if (state.messages[chatId]) {
        state.messages[chatId] = state.messages[chatId].filter(m => m._id !== messageId);
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchChats.pending, (state) => { state.isLoadingChats = true; });
    builder.addCase(fetchChats.fulfilled, (state, action) => {
      state.isLoadingChats = false;
      state.chats = action.payload;
      if (action.payload.length > 0 && !state.activeChatId) {
        state.activeChatId = action.payload[0]._id;
      }
    });
    builder.addCase(fetchChats.rejected, (state, action) => {
      state.isLoadingChats = false;
      state.error = action.payload;
    });

    builder.addCase(accessOrCreateChat.fulfilled, (state, action) => {
      const chat = action.payload;
      if (!state.chats.find(c => c._id === chat._id)) {
        state.chats.unshift(chat);
      }
      state.activeChatId = chat._id;
    });

    builder.addCase(fetchMessages.pending, (state) => { state.isLoadingMessages = true; });
    builder.addCase(fetchMessages.fulfilled, (state, action) => {
      state.isLoadingMessages = false;
      const chatId = action.meta.arg;
      state.messages[chatId] = action.payload;
    });
    builder.addCase(fetchMessages.rejected, (state) => { state.isLoadingMessages = false; });

    builder.addCase(sendMessage.pending, (state) => { state.isSending = true; });
    builder.addCase(sendMessage.fulfilled, (state, action) => {
      state.isSending = false;
      state.replyingTo = null;
      const msg = action.payload;
      const chatId = msg.chat._id || msg.chat;
      if (!state.messages[chatId]) state.messages[chatId] = [];
      state.messages[chatId].push(msg);
      const chat = state.chats.find(c => c._id === chatId);
      if (chat) chat.latestMessage = msg;
    });
    builder.addCase(sendMessage.rejected, (state) => { state.isSending = false; });

    builder.addCase(sendMedia.pending, (state) => { state.isSending = true; });
    builder.addCase(sendMedia.fulfilled, (state, action) => {
      state.isSending = false;
      state.replyingTo = null;
      const msg = action.payload;
      const chatId = msg.chat._id || msg.chat;
      if (!state.messages[chatId]) state.messages[chatId] = [];
      state.messages[chatId].push(msg);
      const chat = state.chats.find(c => c._id === chatId);
      if (chat) chat.latestMessage = msg;
    });
    builder.addCase(sendMedia.rejected, (state) => { state.isSending = false; });

    builder.addCase(deleteMessage.fulfilled, (state, action) => {
      const messageId = action.payload;
      // Remove from all message arrays
      Object.keys(state.messages).forEach(chatId => {
        state.messages[chatId] = state.messages[chatId].filter(m => m._id !== messageId);
      });
    });
  },
});

export const { setActiveChat, setReplyingTo, clearReplyingTo, receiveMessage, removeMessage } = messagingSlice.actions;
export default messagingSlice.reducer;
