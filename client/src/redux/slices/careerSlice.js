import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const fetchCareerInsights = createAsyncThunk(
  'career/fetchInsights',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/career/insights');
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch career insights');
    }
  }
);

export const analyzeResume = createAsyncThunk(
  'career/analyzeResume',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post('/career/resume/analyze');
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to analyze resume');
    }
  }
);

export const sendCareerCoachMessage = createAsyncThunk(
  'career/coachMessage',
  async ({ message, history }, { rejectWithValue }) => {
    try {
      const response = await api.post('/career/coach', { message, history });
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get AI coach response');
    }
  }
);

const initialState = {
  insights: null,
  isFetchingInsights: false,
  insightsError: null,
  
  isAnalyzingResume: false,
  analyzeResumeError: null,
  
  coachHistory: [],
  isCoachResponding: false,
  coachError: null,
};

const careerSlice = createSlice({
  name: 'career',
  initialState,
  reducers: {
    clearCoachHistory: (state) => {
      state.coachHistory = [];
    },
    addCoachUserMessage: (state, action) => {
      state.coachHistory.push({ role: 'user', content: action.payload });
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Insights
      .addCase(fetchCareerInsights.pending, (state) => {
        state.isFetchingInsights = true;
        state.insightsError = null;
      })
      .addCase(fetchCareerInsights.fulfilled, (state, action) => {
        state.isFetchingInsights = false;
        state.insights = action.payload;
      })
      .addCase(fetchCareerInsights.rejected, (state, action) => {
        state.isFetchingInsights = false;
        state.insightsError = action.payload;
      })
      // Analyze Resume
      .addCase(analyzeResume.pending, (state) => {
        state.isAnalyzingResume = true;
        state.analyzeResumeError = null;
      })
      .addCase(analyzeResume.fulfilled, (state, action) => {
        state.isAnalyzingResume = false;
        if (state.insights) {
          state.insights.resumeAnalysis = action.payload.analysis;
          state.insights.recommendedSkills = action.payload.recommendedSkills;
        }
      })
      .addCase(analyzeResume.rejected, (state, action) => {
        state.isAnalyzingResume = false;
        state.analyzeResumeError = action.payload;
      })
      // Coach Message
      .addCase(sendCareerCoachMessage.pending, (state) => {
        state.isCoachResponding = true;
        state.coachError = null;
      })
      .addCase(sendCareerCoachMessage.fulfilled, (state, action) => {
        state.isCoachResponding = false;
        state.coachHistory.push({ role: 'assistant', content: action.payload.reply });
      })
      .addCase(sendCareerCoachMessage.rejected, (state, action) => {
        state.isCoachResponding = false;
        state.coachError = action.payload;
        // Optionally add an error message to history
        state.coachHistory.push({ role: 'assistant', content: 'Sorry, I am temporarily unavailable. Please try again.' });
      });
  }
});

export const { clearCoachHistory, addCoachUserMessage } = careerSlice.actions;
export default careerSlice.reducer;
