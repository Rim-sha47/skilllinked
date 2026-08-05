import { configureStore } from '@reduxjs/toolkit';
import authReducer         from './slices/authSlice';
import themeReducer        from './slices/themeSlice';
import connectionReducer   from './slices/connectionSlice';
import profileReducer      from './slices/profileSlice';
import notificationReducer from './slices/notificationSlice';
import jobReducer          from './slices/jobSlice';
import messagingReducer    from './slices/messagingSlice';
import companyReducer      from './slices/companySlice';
import feedReducer         from './slices/feedSlice';
import sidebarReducer      from './slices/sidebarSlice';
import chatSettingsReducer from './slices/chatSettingsSlice';
import channelsReducer     from './slices/channelsSlice';
import aiReducer           from './slices/aiSlice';
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
    feed:          feedReducer,
    sidebar:       sidebarReducer,
    chatSettings:  chatSettingsReducer,
    channels:      channelsReducer,
    ai:            aiReducer,
  },
});

export default store;

