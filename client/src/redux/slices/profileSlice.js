import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { updateUser } from './authSlice';
import api from '../../services/api';

// Async Thunks
export const fetchMyProfile = createAsyncThunk(
  'profile/fetchMyProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/profiles/me');
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchProfileById = createAsyncThunk(
  'profile/fetchProfileById',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/profiles/user/${userId}`);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateBasicInfo = createAsyncThunk(
  'profile/updateBasicInfo',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await api.post('/profiles', profileData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);


export const updateAvatar = createAsyncThunk(
  'profile/updateAvatar',
  async (formData, { dispatch, rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      console.log('Uploading avatar, token:', token);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/profiles/avatar`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      console.log('Avatar upload response status:', response.status);
      if (!response.ok) {
        const errText = await response.text();
        console.error('Upload failed response body:', errText);
        throw new Error('Upload failed');
      }
      const data = await response.json();
      console.log('Avatar upload success data:', data);
      
      // Update the user in auth slice so it propagates everywhere
      dispatch(updateUser(data));
      
      return data;
    } catch (error) {
      console.error('Avatar upload thunk error:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const removeAvatar = createAsyncThunk(
  'profile/removeAvatar',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/profiles/avatar`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Removal failed');
      }
      const data = await response.json();
      dispatch(updateUser(data));
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateUserInfo = createAsyncThunk(
  'profile/updateUserInfo',
  async (userInfo, { dispatch, rejectWithValue }) => {
    try {
      const data = await api.put('/profiles/user-info', userInfo);
      dispatch(updateUser(data));
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'An error occurred');
    }
  }
);

export const addExperience = createAsyncThunk(
  'profile/addExperience',
  async (expData, { rejectWithValue }) => {
    try {
      const response = await api.post('/profiles/experience', expData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const removeExperience = createAsyncThunk(
  'profile/removeExperience',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/profiles/experience/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addEducation = createAsyncThunk(
  'profile/addEducation',
  async (eduData, { rejectWithValue }) => {
    try {
      const response = await api.post('/profiles/education', eduData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const removeEducation = createAsyncThunk(
  'profile/removeEducation',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/profiles/education/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addSkill = createAsyncThunk(
  'profile/addSkill',
  async (skillName, { rejectWithValue }) => {
    try {
      const response = await api.post('/profiles/skills', { name: skillName });
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const removeSkill = createAsyncThunk(
  'profile/removeSkill',
  async (skillName, { rejectWithValue }) => {
    try {
      await api.delete(`/profiles/skills/${skillName}`);
      return skillName;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addCertification = createAsyncThunk(
  'profile/addCertification',
  async (certData, { rejectWithValue }) => {
    try {
      const response = await api.post('/profiles/certifications', certData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const removeCertification = createAsyncThunk(
  'profile/removeCertification',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/profiles/certifications/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  data: null,
  isLoading: false,
  error: null,
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Profile
      .addCase(fetchMyProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.data = action.payload;
      })
      .addCase(fetchMyProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Profile By Id
      .addCase(fetchProfileById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProfileById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.data = action.payload;
      })
      .addCase(fetchProfileById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update Basic Info
      .addCase(updateBasicInfo.fulfilled, (state, action) => {
        if (state.data) {
          state.data = { ...state.data, ...action.payload };
        }
      })
      
      // Experience
      .addCase(addExperience.fulfilled, (state, action) => {
        if (state.data) {
          state.data.experience = [action.payload, ...(state.data.experience || [])];
        }
      })
      .addCase(removeExperience.fulfilled, (state, action) => {
        if (state.data && state.data.experience) {
          state.data.experience = state.data.experience.filter(e => e._id !== action.payload);
        }
      })

      // Education
      .addCase(addEducation.fulfilled, (state, action) => {
        if (state.data) {
          state.data.education = [action.payload, ...(state.data.education || [])];
        }
      })
      .addCase(removeEducation.fulfilled, (state, action) => {
        if (state.data && state.data.education) {
          state.data.education = state.data.education.filter(e => e._id !== action.payload);
        }
      })

      // Skills
      .addCase(addSkill.fulfilled, (state, action) => {
        if (state.data) {
          state.data.skills = [...(state.data.skills || []), action.payload.name];
        }
      })
      .addCase(removeSkill.fulfilled, (state, action) => {
        if (state.data && state.data.skills) {
          state.data.skills = state.data.skills.filter(s => s !== action.payload);
        }
      })

      // Certifications
      .addCase(addCertification.fulfilled, (state, action) => {
        if (state.data) {
          state.data.certifications = [action.payload, ...(state.data.certifications || [])];
        }
      })
      .addCase(removeCertification.fulfilled, (state, action) => {
        if (state.data && state.data.certifications) {
          state.data.certifications = state.data.certifications.filter(c => c._id !== action.payload);
        }
      });
  },
});

export default profileSlice.reducer;
