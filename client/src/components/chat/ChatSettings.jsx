import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateLocalGlobalPreference, updateChatPreferences, uploadChatWallpaper } from '../../redux/slices/chatSettingsSlice';

const ChatSettings = () => {
  const dispatch = useDispatch();
  const { global } = useSelector((state) => state.chatSettings);

  const handleThemeChange = (e) => {
    const theme = e.target.value;
    dispatch(updateLocalGlobalPreference({ theme }));
    dispatch(updateChatPreferences({ global: { theme } }));
  };

  const handleBlurChange = (e) => {
    const blur = parseInt(e.target.value);
    dispatch(updateLocalGlobalPreference({ blur }));
    dispatch(updateChatPreferences({ global: { blur } }));
  };

  const handleUploadWallpaper = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const wallpaper = await dispatch(uploadChatWallpaper(formData)).unwrap();
      dispatch(updateLocalGlobalPreference({ wallpaper }));
      dispatch(updateChatPreferences({ global: { wallpaper } }));
    } catch (err) {
      console.error('Failed to upload wallpaper', err);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-dark-card rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Chat Customization</h2>
      
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Theme</label>
        <select 
          value={global.theme} 
          onChange={handleThemeChange}
          className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Background Blur</label>
        <input 
          type="range" 
          min="0" 
          max="20" 
          value={global.blur} 
          onChange={handleBlurChange}
          className="w-full"
        />
        <div className="text-right text-xs text-gray-500 mt-1">{global.blur}px</div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Upload Custom Wallpaper</label>
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleUploadWallpaper} 
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
        />
        {global.wallpaper && (
          <div className="mt-4">
            <p className="text-sm mb-2">Current Wallpaper:</p>
            <img src={global.wallpaper} alt="Wallpaper" className="w-48 h-48 object-cover rounded-lg shadow" />
          </div>
        )}
      </div>

      {/* Additional settings for font size, bubble radius, accent color can go here */}
    </div>
  );
};

export default ChatSettings;
