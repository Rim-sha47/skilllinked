import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import themeReducer from './slices/themeSlice';
import connectionReducer from './slices/connectionSlice';
import profileReducer from './slices/profileSlice';
import notificationReducer from './slices/notificationSlice';
import jobReducer from './slices/jobSlice';
import messagingReducer from './slices/messagingSlice';
import companyReducer from './slices/companySlice';
import feedReducer from './slices/feedSlice';
import sidebarReducer from './slices/sidebarSlice';
import chatSettingsReducer from './slices/chatSettingsSlice';
import channelsReducer from './slices/channelsSlice';
import aiReducer from './slices/aiSlice';
import careerReducer from './slices/careerSlice';

// Load messaging slice from localStorage
const loadMessagingState = () => {
  try {
    const serialized = localStorage.getItem('messagingState');
    if (serialized === null) return undefined;
    return JSON.parse(serialized);
  } catch (e) {
    console.warn('Failed to load messaging state', e);
    return undefined;
  }
};

// Save messaging slice to localStorage
const saveMessagingState = (state) => {
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem('messagingState', serialized);
  } catch (e) {
    console.warn('Failed to save messaging state', e);
  }
};

const preloadedState = {
  messaging: loadMessagingState(),
};

const store = configureStore({
  reducer: {
    auth: authReducer,
    theme: themeReducer,
    connections: connectionReducer,
    profile: profileReducer,
    notifications: notificationReducer,
    jobs: jobReducer,
    messaging: messagingReducer,
    companies: companyReducer,
    feed: feedReducer,
    sidebar: sidebarReducer,
    chatSettings: chatSettingsReducer,
    channels: channelsReducer,
    ai: aiReducer,
    career: careerReducer,
  },
  preloadedState,
});

store.subscribe(() => {
  const state = store.getState();
  saveMessagingState(state.messaging);
});

export default store;
