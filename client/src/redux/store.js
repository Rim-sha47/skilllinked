import { configureStore } from '@reduxjs/toolkit';
import authReducer         from './slices/authSlice';
import themeReducer        from './slices/themeSlice';
import connectionReducer   from './slices/connectionSlice';
import profileReducer      from './slices/profileSlice';
import notificationReducer from './slices/notificationSlice';
import jobReducer          from './slices/jobSlice';
import messagingReducer    from './slices/messagingSlice';
import companyReducer      from './slices/companySlice';

const store = configureStore({
  reducer: {
    auth:          authReducer,
    theme:         themeReducer,
    connections:   connectionReducer,
    profile:       profileReducer,
    notifications: notificationReducer,
    jobs:          jobReducer,
    messaging:     messagingReducer,
    companies:     companyReducer,
  },
});

export default store;
