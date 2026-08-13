import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchJobs = createAsyncThunk('jobs/fetch', async (params, { rejectWithValue }) => {
  try {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.location) query.set('location', params.location);
    if (params?.types?.length) query.set('type', params.types.join(','));
    if (params?.remote) query.set('remote', 'true');
    return await api.get(`/jobs?${query.toString()}`);
  } catch (err) {
    return rejectWithValue(err.message || 'Failed to load jobs');
  }
});

export const fetchRecommendedJobs = createAsyncThunk('jobs/fetchRecommended', async (_, { rejectWithValue }) => {
  try {
    return await api.get('/jobs/recommended');
  } catch (err) {
    return rejectWithValue(err.message || 'Failed to load recommended jobs');
  }
});

export const fetchMyApplications = createAsyncThunk('jobs/fetchMyApplications', async (_, { rejectWithValue }) => {
  try {
    return await api.get('/jobs/applications/me');
  } catch (err) {
    return rejectWithValue(err.message || 'Failed to load applications');
  }
});

export const applyToJob = createAsyncThunk('jobs/apply', async ({ jobId, coverLetter }, { rejectWithValue }) => {
  try {
    return await api.post(`/jobs/${jobId}/apply`, { coverLetter });
  } catch (err) {
    return rejectWithValue(err.message || 'Failed to apply');
  }
});

export const fetchSavedJobs = createAsyncThunk('jobs/fetchSaved', async (_, { rejectWithValue }) => {
  try {
    return await api.get('/jobs/saved');
  } catch (err) {
    return rejectWithValue(err.message || 'Failed to load saved jobs');
  }
});

export const saveJob = createAsyncThunk('jobs/save', async (jobId, { rejectWithValue }) => {
  try {
    return await api.post(`/jobs/${jobId}/save`);
  } catch (err) {
    return rejectWithValue(err.message || 'Failed to save job');
  }
});

export const unsaveJob = createAsyncThunk('jobs/unsave', async (jobId, { rejectWithValue }) => {
  try {
    await api.delete(`/jobs/${jobId}/save`);
    return { jobId };
  } catch (err) {
    return rejectWithValue(err.message || 'Failed to unsave job');
  }
});

// ─── Slice ─────────────────────────────────────────────────────────────────────

const jobSlice = createSlice({
  name: 'jobs',
  initialState: {
    jobs: [],
    recommendedJobs: [],
    myApplications: [],
    savedJobIds: [],      // array of job _id strings
    isLoading: false,
    isApplying: false,
    isSaving: false,
    hasFetched: false,    // true after FIRST fetchJobs resolves (success or error)
    error: null,
  },
  reducers: {
    clearJobsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch jobs
    builder
      .addCase(fetchJobs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.hasFetched = true;
        state.jobs = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.isLoading = false;
        state.hasFetched = true;
        state.error = action.payload;
        state.jobs = [];
      });

    // Recommended jobs
    builder
      .addCase(fetchRecommendedJobs.fulfilled, (state, action) => {
        state.recommendedJobs = Array.isArray(action.payload) ? action.payload : [];
      });

    // My applications
    builder
      .addCase(fetchMyApplications.fulfilled, (state, action) => {
        state.myApplications = Array.isArray(action.payload) ? action.payload : [];
      });

    // Apply
    builder
      .addCase(applyToJob.pending, (state) => { state.isApplying = true; })
      .addCase(applyToJob.fulfilled, (state, action) => {
        state.isApplying = false;
        if (action.payload?.job) {
          const jobId = action.payload.job?._id || action.payload.job;
          if (jobId) state.myApplications.unshift(action.payload);
        } else {
          state.myApplications.unshift(action.payload);
        }
      })
      .addCase(applyToJob.rejected, (state) => { state.isApplying = false; });

    // Fetch saved jobs
    builder
      .addCase(fetchSavedJobs.fulfilled, (state, action) => {
        const list = Array.isArray(action.payload) ? action.payload : [];
        state.savedJobIds = list.map(s => s.job?._id || s.job).filter(Boolean).map(String);
      });

    // Save job
    builder
      .addCase(saveJob.pending, (state) => { state.isSaving = true; })
      .addCase(saveJob.fulfilled, (state, action) => {
        state.isSaving = false;
        const jobId = String(action.payload?.jobId);
        if (jobId && !state.savedJobIds.includes(jobId)) {
          state.savedJobIds.push(jobId);
        }
      })
      .addCase(saveJob.rejected, (state) => { state.isSaving = false; });

    // Unsave job
    builder
      .addCase(unsaveJob.pending, (state) => { state.isSaving = true; })
      .addCase(unsaveJob.fulfilled, (state, action) => {
        state.isSaving = false;
        const jobId = String(action.payload?.jobId);
        state.savedJobIds = state.savedJobIds.filter(id => id !== jobId);
      })
      .addCase(unsaveJob.rejected, (state) => { state.isSaving = false; });
  },
});

export const { clearJobsError } = jobSlice.actions;
export default jobSlice.reducer;
