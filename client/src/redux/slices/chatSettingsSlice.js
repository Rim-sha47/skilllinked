import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

// Async thunk to update chat preferences
export const updateChatPreferences = createAsyncThunk(
  'chatSettings/updatePreferences',
  async (preferences, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const config = {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      };
      const res = await axios.put(`${API_BASE_URL}/profiles/chat-preferences`, preferences, config);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Async thunk to upload custom wallpaper
export const uploadChatWallpaper = createAsyncThunk(
  'chatSettings/uploadWallpaper',
  async (formData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${auth.token}`,
        },
      };
      const res = await axios.post(`${API_BASE_URL}/profiles/chat-preferences/wallpaper`, formData, config);
      return res.data.wallpaperUrl;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const initialState = {
  global: {
    theme: 'system',
    wallpaper: '',
    accentColor: 'blue',
    bubbleColorSent: '',
    bubbleColorReceived: '',
    blur: 0,
    opacity: 100,
    fontSize: 'medium',
    bubbleRadius: 'lg'
  },
  perChat: [],
  status: 'idle',
  error: null,
};

const chatSettingsSlice = createSlice({
  name: 'chatSettings',
  initialState,
  reducers: {
    setChatPreferences: (state, action) => {
      if (action.payload?.global) {
        state.global = { ...state.global, ...action.payload.global };
      }
      if (action.payload?.perChat) {
        state.perChat = action.payload.perChat;
      }
    },
    updateLocalGlobalPreference: (state, action) => {
      state.global = { ...state.global, ...action.payload };
    },
    updateLocalPerChatPreference: (state, action) => {
      const { chatId, ...settings } = action.payload;
      const existingIndex = state.perChat.findIndex(pc => pc.chatId === chatId);
      if (existingIndex !== -1) {
        state.perChat[existingIndex] = { ...state.perChat[existingIndex], ...settings };
      } else {
        state.perChat.push({ chatId, ...settings });
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateChatPreferences.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateChatPreferences.fulfilled, (state, action) => {
        state.status = 'succeeded';
        if (action.payload.global) {
          state.global = { ...state.global, ...action.payload.global };
        }
        if (action.payload.perChat) {
          state.perChat = action.payload.perChat;
        }
      })
      .addCase(updateChatPreferences.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

export const { setChatPreferences, updateLocalGlobalPreference, updateLocalPerChatPreference } = chatSettingsSlice.actions;
export default chatSettingsSlice.reducer;
