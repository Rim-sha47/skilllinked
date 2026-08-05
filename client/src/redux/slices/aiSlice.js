import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchAIHistory = createAsyncThunk('ai/fetchHistory', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/ai/history');
    return res;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const clearAIHistory = createAsyncThunk('ai/clearHistory', async (_, { rejectWithValue }) => {
  try {
    const res = await api.delete('/ai/history');
    return res;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const sendAIMessage = createAsyncThunk('ai/sendMessage', async ({ prompt, conversationId, category }, { rejectWithValue }) => {
  try {
    const res = await api.post('/ai/chat', { prompt, conversationId, category });
    return res;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const analyzeFile = createAsyncThunk('ai/analyzeFile', async (formData, { rejectWithValue }) => {
  try {
    const res = await api.post('/ai/analyze-file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

const initialState = {
  conversations: [],
  currentConversation: null,
  isTyping: false,
  error: null,
};

const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    setCurrentConversation: (state, action) => {
      state.currentConversation = action.payload;
    },
    addLocalMessage: (state, action) => {
      if (!state.currentConversation) {
        state.currentConversation = { messages: [] };
      }
      state.currentConversation.messages.push(action.payload);
    },
    setTyping: (state, action) => {
      state.isTyping = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAIHistory.fulfilled, (state, action) => {
        state.conversations = action.payload;
        if (!state.currentConversation && action.payload.length > 0) {
          state.currentConversation = action.payload[0];
        }
      })
      .addCase(sendAIMessage.pending, (state) => {
        state.isTyping = true;
      })
      .addCase(sendAIMessage.fulfilled, (state, action) => {
        state.isTyping = false;
        if (!state.currentConversation) {
          state.currentConversation = { _id: action.payload.conversationId, messages: [] };
        }
        state.currentConversation.messages.push({ role: 'assistant', content: action.payload.reply });
        state.currentConversation._id = action.payload.conversationId;
      })
      .addCase(sendAIMessage.rejected, (state, action) => {
        state.isTyping = false;
        state.error = action.payload;
        if (state.currentConversation) {
           state.currentConversation.messages.push({ role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' });
        }
      })
      .addCase(clearAIHistory.fulfilled, (state) => {
        state.conversations = [];
        state.currentConversation = null;
      });
  },
});

export const { setCurrentConversation, addLocalMessage, setTyping } = aiSlice.actions;
export default aiSlice.reducer;
