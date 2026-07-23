import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchJobs = createAsyncThunk('jobs/fetch', async (params, { rejectWithValue }) => {
  try {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.location) query.set('location', params.location);
    if (params?.type) query.set('type', params.type);
    if (params?.remote) query.set('remote', params.remote);
    return await api.get(`/jobs?${query.toString()}`);
  } catch (err) { return rejectWithValue(err.message); }
});

export const fetchMyApplications = createAsyncThunk('jobs/fetchMyApplications', async (_, { rejectWithValue }) => {
  try {
    return await api.get('/jobs/applications/me');
  } catch (err) { return rejectWithValue(err.message); }
});

export const applyToJob = createAsyncThunk('jobs/apply', async ({ jobId, coverLetter }, { rejectWithValue }) => {
  try {
    return await api.post(`/jobs/${jobId}/apply`, { coverLetter });
  } catch (err) { return rejectWithValue(err.message); }
});

// ─── Slice ─────────────────────────────────────────────────────────────────────

const jobSlice = createSlice({
  name: 'jobs',
  initialState: {
    jobs: [],
    myApplications: [],
    isLoading: false,
    isApplying: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchJobs.pending, (state) => { state.isLoading = true; state.error = null; });
    builder.addCase(fetchJobs.fulfilled, (state, action) => {
      state.isLoading = false;
      state.jobs = action.payload;
    });
    builder.addCase(fetchJobs.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });

    builder.addCase(fetchMyApplications.fulfilled, (state, action) => {
      state.myApplications = action.payload;
    });

    builder.addCase(applyToJob.pending, (state) => { state.isApplying = true; });
    builder.addCase(applyToJob.fulfilled, (state, action) => {
      state.isApplying = false;
      state.myApplications.unshift(action.payload);
    });
    builder.addCase(applyToJob.rejected, (state) => { state.isApplying = false; });
  },
});

export default jobSlice.reducer;
