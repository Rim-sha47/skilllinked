import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// ─── Async Thunks ──────────────────────────────────────────────────────────────

export const fetchChats = createAsyncThunk('messaging/fetchChats', async (_, { rejectWithValue }) => {
  try { return await api.get('/chats'); }
  catch (err) { return rejectWithValue(err.message); }
});

export const accessOrCreateChat = createAsyncThunk('messaging/accessChat', async (userId, { rejectWithValue }) => {
  try { return await api.post('/chats', { userId }); }
  catch (err) { return rejectWithValue(err.message); }
});

export const fetchMessages = createAsyncThunk('messaging/fetchMessages', async ({ chatId, page = 1, limit = 50 }, { rejectWithValue }) => {
  try { 
    const res = await api.get(`/messages/${chatId}?page=${page}&limit=${limit}`); 
    return { ...res, chatId }; // Ensure we can identify the chat in the reducer
  }
  catch (err) { return rejectWithValue(err.message); }
});

export const sendMessage = createAsyncThunk('messaging/sendMessage', async ({ chatId, content, replyTo }, { rejectWithValue }) => {
  try { return await api.post('/messages', { chatId, content, replyTo: replyTo || null }); }
  catch (err) { return rejectWithValue(err.message); }
});

export const sendMedia = createAsyncThunk('messaging/sendMedia', async (formData, { rejectWithValue }) => {
  try {
    return await api.post('/messages/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  } catch (err) { return rejectWithValue(err.message); }
});

export const deleteMessage = createAsyncThunk('messaging/deleteMessage', async (messageId, { rejectWithValue }) => {
  try { await api.delete(`/messages/${messageId}`); return messageId; }
  catch (err) { return rejectWithValue(err.message); }
});

export const editMessage = createAsyncThunk('messaging/editMessage', async ({ messageId, content }, { rejectWithValue }) => {
  try { return await api.put(`/messages/${messageId}`, { content }); }
  catch (err) { return rejectWithValue(err.message); }
});

export const deleteForMe = createAsyncThunk('messaging/deleteForMe', async (messageId, { rejectWithValue }) => {
  try { return await api.put(`/messages/${messageId}/deleteForMe`); }
  catch (err) { return rejectWithValue(err.message); }
});

export const toggleStar = createAsyncThunk('messaging/toggleStar', async (messageId, { rejectWithValue }) => {
  try { return await api.put(`/messages/${messageId}/star`); }
  catch (err) { return rejectWithValue(err.message); }
});

export const togglePin = createAsyncThunk('messaging/togglePin', async (messageId, { rejectWithValue }) => {
  try { return await api.put(`/messages/${messageId}/pin`); }
  catch (err) { return rejectWithValue(err.message); }
});

export const reactToMessage = createAsyncThunk('messaging/reactToMessage', async ({ messageId, emoji }, { rejectWithValue }) => {
  try { return await api.put(`/messages/${messageId}/react`, { emoji }); }
  catch (err) { return rejectWithValue(err.message); }
});

export const markMessagesSeen = createAsyncThunk('messaging/markMessagesSeen', async (chatId, { rejectWithValue }) => {
  try { await api.put(`/messages/seen/${chatId}`); return chatId; }
  catch (err) { return rejectWithValue(err.message); }
});

export const pinChat = createAsyncThunk('messaging/pinChat', async (chatId, { rejectWithValue }) => {
  try { return await api.put(`/chats/${chatId}/pin`); }
  catch (err) { return rejectWithValue(err.message); }
});

export const muteChat = createAsyncThunk('messaging/muteChat', async (chatId, { rejectWithValue }) => {
  try { return await api.put(`/chats/${chatId}/mute`); }
  catch (err) { return rejectWithValue(err.message); }
});

export const archiveChat = createAsyncThunk('messaging/archiveChat', async (chatId, { rejectWithValue }) => {
  try { return await api.put(`/chats/${chatId}/archive`); }
  catch (err) { return rejectWithValue(err.message); }
});

export const blockUser = createAsyncThunk('messaging/blockUser', async (userId, { rejectWithValue }) => {
  try { return await api.put(`/chats/block/${userId}`); }
  catch (err) { return rejectWithValue(err.message); }
});

export const fetchBlockedUsers = createAsyncThunk('messaging/fetchBlockedUsers', async (_, { rejectWithValue }) => {
  try { return await api.get(`/chats/blocked-users`); }
  catch (err) { return rejectWithValue(err.message); }
});

export const hideChat = createAsyncThunk('messaging/hideChat', async (chatId, { rejectWithValue }) => {
  try { await api.delete(`/chats/${chatId}`); return chatId; }
  catch (err) { return rejectWithValue(err.message); }
});

// ─── Group Chat Thunks ─────────────────────────────────────────────────────────

export const createGroupChat = createAsyncThunk('messaging/createGroupChat', async ({ name, users }, { rejectWithValue }) => {
  try { return await api.post('/chats/group', { name, users }); }
  catch (err) { return rejectWithValue(err.message); }
});

export const renameGroup = createAsyncThunk('messaging/renameGroup', async ({ chatId, name }, { rejectWithValue }) => {
  try { return await api.put(`/chats/group/${chatId}/rename`, { name }); }
  catch (err) { return rejectWithValue(err.message); }
});

export const addGroupMember = createAsyncThunk('messaging/addGroupMember', async ({ chatId, userId }, { rejectWithValue }) => {
  try { return await api.put(`/chats/group/${chatId}/add`, { userId }); }
  catch (err) { return rejectWithValue(err.message); }
});

export const removeGroupMember = createAsyncThunk('messaging/removeGroupMember', async ({ chatId, userId }, { rejectWithValue }) => {
  try { return await api.put(`/chats/group/${chatId}/remove`, { userId }); }
  catch (err) { return rejectWithValue(err.message); }
});

export const leaveGroup = createAsyncThunk('messaging/leaveGroup', async (chatId, { rejectWithValue }) => {
  try { await api.put(`/chats/group/${chatId}/leave`); return chatId; }
  catch (err) { return rejectWithValue(err.message); }
});

// ─── Helper: sort chats (pinned first, then by latest message) ────────────────
const sortChats = (chats, userId) => {
  return [...chats].sort((a, b) => {
    const aPinned = a.pinnedBy?.map(String).includes(userId) ? 1 : 0;
    const bPinned = b.pinnedBy?.map(String).includes(userId) ? 1 : 0;
    if (bPinned !== aPinned) return bPinned - aPinned;
    const aTime = a.latestMessage?.createdAt || a.createdAt || 0;
    const bTime = b.latestMessage?.createdAt || b.createdAt || 0;
    return new Date(bTime) - new Date(aTime);
  });
};

// ─── Helper: update chat in list ──────────────────────────────────────────────
const updateChatInList = (state, updated) => {
  const idx = state.chats.findIndex(c => c._id === (updated._id || updated.chatId));
  if (idx !== -1) state.chats[idx] = { ...state.chats[idx], ...updated };
};

// ─── Slice ─────────────────────────────────────────────────────────────────────

const messagingSlice = createSlice({
  name: 'messaging',
  initialState: {
    chats: [],
    activeChatId: null,
    messages: {},           // keyed by chatId
    isLoadingChats: false,
    isLoadingMessages: false,
    isSending: false,
    blockedUsers: [],
    blockedUserDetails: [],
    error: null,
    replyingTo: null,
    currentUserId: null,
    pagination: {},         // keyed by chatId { page: 1, hasMore: false }
  },
  reducers: {
    setCurrentUserId: (state, action) => {
      state.currentUserId = action.payload;
    },
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
      if (!state.messages[chatId].find(m => m._id === msg._id)) {
        state.messages[chatId].push(msg);
      }
      const chat = state.chats.find(c => c._id === chatId);
      if (chat) {
        chat.latestMessage = msg;
        state.chats = sortChats(state.chats, state.currentUserId);
      }
    },
    removeMessage: (state, action) => {
      const { messageId, chatId } = action.payload;
      if (state.messages[chatId]) {
        const msg = state.messages[chatId].find(m => m._id === messageId);
        if (msg) { msg.isDeleted = true; msg.content = 'This message was deleted'; }
      }
    },
    // Real-time tick update: delivered or seen
    updateMessageStatus: (state, action) => {
      const { messageId, chatId, status } = action.payload;
      if (state.messages[chatId]) {
        const msg = state.messages[chatId].find(m => m._id === messageId);
        if (msg) msg.status = status;
      }
    },
    // All messages in a chat marked seen (blue ticks for all my messages)
    markChatSeen: (state, action) => {
      const chatId = action.payload;
      if (state.messages[chatId]) {
        state.messages[chatId] = state.messages[chatId].map(msg => ({ ...msg, status: 'seen' }));
      }
    },
    // Update a group chat (name, members)
    updateGroupChat: (state, action) => {
      updateChatInList(state, action.payload);
    },
  },
  extraReducers: (builder) => {
    // fetchChats
    builder.addCase(fetchChats.pending, (state) => { state.isLoadingChats = true; });
    builder.addCase(fetchChats.fulfilled, (state, action) => {
      state.isLoadingChats = false;
      state.chats = sortChats(action.payload, state.currentUserId);
    });
    builder.addCase(fetchChats.rejected, (state, action) => {
      state.isLoadingChats = false;
      state.error = action.payload;
    });

    // accessOrCreateChat
    builder.addCase(accessOrCreateChat.fulfilled, (state, action) => {
      const chat = action.payload;
      if (!state.chats.find(c => c._id === chat._id)) state.chats.unshift(chat);
      state.activeChatId = chat._id;
    });

    // fetchMessages
    builder.addCase(fetchMessages.pending, (state) => { state.isLoadingMessages = true; });
    builder.addCase(fetchMessages.fulfilled, (state, action) => {
      state.isLoadingMessages = false;
      const { messages, page, hasMore, chatId } = action.payload;
      if (page === 1) {
        state.messages[chatId] = messages;
      } else {
        state.messages[chatId] = [...messages, ...(state.messages[chatId] || [])];
      }
      state.pagination[chatId] = { page, hasMore };
    });
    builder.addCase(fetchMessages.rejected, (state) => { state.isLoadingMessages = false; });

    // sendMessage
    builder.addCase(sendMessage.pending, (state) => { state.isSending = true; });
    builder.addCase(sendMessage.fulfilled, (state, action) => {
      state.isSending = false;
      state.replyingTo = null;
      const msg = action.payload;
      const chatId = msg.chat?._id || msg.chat;
      if (!state.messages[chatId]) state.messages[chatId] = [];
      if (!state.messages[chatId].find(m => m._id === msg._id)) {
        state.messages[chatId].push(msg);
      }
      const chat = state.chats.find(c => c._id === chatId);
      if (chat) {
        chat.latestMessage = msg;
        state.chats = sortChats(state.chats, state.currentUserId);
      }
    });
    builder.addCase(sendMessage.rejected, (state) => { state.isSending = false; });

    // sendMedia
    builder.addCase(sendMedia.pending, (state) => { state.isSending = true; });
    builder.addCase(sendMedia.fulfilled, (state, action) => {
      state.isSending = false;
      state.replyingTo = null;
      const msg = action.payload;
      const chatId = msg.chat?._id || msg.chat;
      if (!state.messages[chatId]) state.messages[chatId] = [];
      if (!state.messages[chatId].find(m => m._id === msg._id)) {
        state.messages[chatId].push(msg);
      }
      const chat = state.chats.find(c => c._id === chatId);
      if (chat) { chat.latestMessage = msg; state.chats = sortChats(state.chats, state.currentUserId); }
    });
    builder.addCase(sendMedia.rejected, (state) => { state.isSending = false; });

    // deleteMessage (soft)
    builder.addCase(deleteMessage.fulfilled, (state, action) => {
      const messageId = action.payload;
      Object.keys(state.messages).forEach(chatId => {
        const msg = state.messages[chatId]?.find(m => m._id === messageId);
        if (msg) { msg.isDeleted = true; msg.content = 'This message was deleted'; }
      });
    });
    // from socket
    builder.addCase('messaging/messageDeleted', (state, action) => {
      const { messageId } = action.payload;
      Object.keys(state.messages).forEach(chatId => {
        const msg = state.messages[chatId]?.find(m => m._id === messageId);
        if (msg) { msg.isDeleted = true; msg.content = 'This message was deleted'; }
      });
    });

    // editMessage, deleteForMe, toggleStar, togglePin, reactToMessage all return the updated message
    [editMessage, deleteForMe, toggleStar, togglePin, reactToMessage].forEach(thunk => {
      builder.addCase(thunk.fulfilled, (state, action) => {
        const updatedMsg = action.payload;
        const chatId = updatedMsg.chat?._id || updatedMsg.chat;
        if (state.messages[chatId]) {
          const idx = state.messages[chatId].findIndex(m => m._id === updatedMsg._id);
          if (idx !== -1) state.messages[chatId][idx] = updatedMsg;
        }
      });
    });

    // markMessagesSeen
    builder.addCase(markMessagesSeen.fulfilled, (state, action) => {
      const chatId = action.payload;
      if (state.messages[chatId]) {
        state.messages[chatId] = state.messages[chatId].map(msg => ({ ...msg, status: 'seen' }));
      }
    });

    // pinChat
    builder.addCase(pinChat.fulfilled, (state, action) => {
      const { chatId, pinnedBy } = action.payload;
      const chat = state.chats.find(c => c._id === chatId);
      if (chat) { chat.pinnedBy = pinnedBy; state.chats = sortChats(state.chats, state.currentUserId); }
    });

    // muteChat
    builder.addCase(muteChat.fulfilled, (state, action) => {
      const { chatId, mutedBy } = action.payload;
      const chat = state.chats.find(c => c._id === chatId);
      if (chat) chat.mutedBy = mutedBy;
    });

    // archiveChat
    builder.addCase(archiveChat.fulfilled, (state, action) => {
      const { chatId, archivedBy } = action.payload;
      const chat = state.chats.find(c => c._id === chatId);
      if (chat) chat.archivedBy = archivedBy;
    });

    // blockUser
    builder.addCase(blockUser.fulfilled, (state, action) => {
      state.blockedUsers = action.payload.blockedUsers?.map(String) || [];
      // Also optimistic update of blockedUserDetails if it's unblocking
      if (!action.payload.isBlocked) {
        state.blockedUserDetails = state.blockedUserDetails.filter(u => action.payload.blockedUsers.map(String).includes(u._id));
      }
    });

    // fetchBlockedUsers
    builder.addCase(fetchBlockedUsers.fulfilled, (state, action) => {
      state.blockedUserDetails = action.payload;
    });

    // hideChat
    builder.addCase(hideChat.fulfilled, (state, action) => {
      const chatId = action.payload;
      state.chats = state.chats.filter(c => c._id !== chatId);
      if (state.activeChatId === chatId) {
        state.activeChatId = state.chats.length > 0 ? state.chats[0]._id : null;
      }
    });

    // createGroupChat
    builder.addCase(createGroupChat.fulfilled, (state, action) => {
      state.chats.unshift(action.payload);
      state.activeChatId = action.payload._id;
    });

    // renameGroup / addGroupMember / removeGroupMember
    [renameGroup, addGroupMember, removeGroupMember].forEach(thunk => {
      builder.addCase(thunk.fulfilled, (state, action) => {
        updateChatInList(state, action.payload);
      });
    });

    // leaveGroup
    builder.addCase(leaveGroup.fulfilled, (state, action) => {
      const chatId = action.payload;
      state.chats = state.chats.filter(c => c._id !== chatId);
      if (state.activeChatId === chatId) {
        state.activeChatId = state.chats.length > 0 ? state.chats[0]._id : null;
      }
    });
  },
});

export const {
  setCurrentUserId,
  setActiveChat,
  setReplyingTo,
  clearReplyingTo,
  receiveMessage,
  removeMessage,
  updateMessageStatus,
  markChatSeen,
  updateGroupChat,
} = messagingSlice.actions;

export default messagingSlice.reducer;
