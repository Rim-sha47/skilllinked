import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Fetch all companies
export const fetchCompanies = createAsyncThunk(
  'companies/fetchAll',
  async (_, thunkAPI) => {
    try {
      const response = await axios.get(`${API_URL}/companies`);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Follow a company
export const followCompany = createAsyncThunk(
  'companies/follow',
  async (companyId, thunkAPI) => {
    try {
      const { auth } = thunkAPI.getState();
      const config = {
        headers: { Authorization: `Bearer ${auth.token}` },
      };
      const response = await axios.post(`${API_URL}/companies/${companyId}/follow`, {}, config);
      return { companyId, data: response.data, userId: auth.user._id };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Unfollow a company
export const unfollowCompany = createAsyncThunk(
  'companies/unfollow',
  async (companyId, thunkAPI) => {
    try {
      const { auth } = thunkAPI.getState();
      const config = {
        headers: { Authorization: `Bearer ${auth.token}` },
      };
      const response = await axios.delete(`${API_URL}/companies/${companyId}/follow`, config);
      return { companyId, data: response.data, userId: auth.user._id };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const initialState = {
  companies: [],
  isLoading: false,
  error: null,
};

const companySlice = createSlice({
  name: 'companies',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Companies
      .addCase(fetchCompanies.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCompanies.fulfilled, (state, action) => {
        state.isLoading = false;
        state.companies = action.payload;
        state.error = null;
      })
      .addCase(fetchCompanies.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Follow Company
      .addCase(followCompany.fulfilled, (state, action) => {
        const { companyId, userId } = action.payload;
        const company = state.companies.find(c => c._id === companyId);
        if (company) {
          if (!company.followers) company.followers = [];
          if (!company.followers.includes(userId)) {
             company.followers.push(userId);
          }
        }
      })
      
      // Unfollow Company
      .addCase(unfollowCompany.fulfilled, (state, action) => {
        const { companyId, userId } = action.payload;
        const company = state.companies.find(c => c._id === companyId);
        if (company && company.followers) {
          company.followers = company.followers.filter(id => id !== userId);
        }
      });
  },
});

export default companySlice.reducer;
