// client/src/pages/Settings/PrivacySettings.jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import api from '../../services/api';
import { updateUser } from '../../redux/slices/authSlice';
import PrivacySelectorModal from '../../components/chat/PrivacySelectorModal';

const privacyOptions = ['Everyone', 'My Connections', 'Connections Except...', 'Only Share With...', 'Nobody'];

const PrivacySettings = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSetting, setModalSetting] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  const handleChange = async (field, value) => {
    try {
      const res = await api.put('/profiles/privacy-settings', { [field]: value });
      dispatch(updateUser({ privacySettings: res.data }));
    } catch (e) {
      console.error('Failed to update privacy', e);
    }
  };

  const openModal = (setting) => {
    setModalSetting(setting);
    const current = user.privacySettings?.[`${setting}Exceptions`] || user.privacySettings?.[`${setting}OnlyShare`] || [];
    setSelectedIds(current.map(id => id.toString()));
    setModalOpen(true);
  };

  const saveModal = async (ids) => {
    const field = modalSetting === 'lastSeen' || modalSetting === 'onlineStatus'
      ? `${modalSetting}Exceptions`
      : `${modalSetting}OnlyShare`;
    await handleChange(field, ids);
    setModalOpen(false);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Privacy Settings</h1>
      {/* Last Seen & Online */}
      <section className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h2 className="text-xl font-semibold mb-2">Last Seen & Online</h2>
        <div className="space-y-2">
          {privacyOptions.map(opt => (
            <label key={opt} className="flex items-center">
              <input
                type="radio"
                name="lastSeenOnline"
                value={opt}
                checked={user.privacySettings?.onlineStatus === opt || user.privacySettings?.lastSeen === opt}
                onChange={() => { handleChange('onlineStatus', opt); handleChange('lastSeen', opt); }}
                className="mr-2"
              />
              {opt}
            </label>
          ))}
        </div>
        <button onClick={() => openModal('onlineStatus')} className="mt-2 text-blue-600 underline">Manage Exceptions / Share With...</button>
      </section>
      {/* Profile Photo */}
      <section className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h2 className="text-xl font-semibold mb-2">Profile Photo</h2>
        <div className="space-y-2">
          {privacyOptions.map(opt => (
            <label key={opt} className="flex items-center">
              <input
                type="radio"
                name="profilePhoto"
                value={opt}
                checked={user.privacySettings?.profilePhoto === opt}
                onChange={() => handleChange('profilePhoto', opt)}
                className="mr-2"
              />
              {opt}
            </label>
          ))}
        </div>
        <button onClick={() => openModal('profilePhoto')} className="mt-2 text-blue-600 underline">Manage Exceptions / Share With...</button>
      </section>
      {/* Status */}
      <section className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h2 className="text-xl font-semibold mb-2">Status / Stories</h2>
        <div className="space-y-2">
          {privacyOptions.map(opt => (
            <label key={opt} className="flex items-center">
              <input
                type="radio"
                name="status"
                value={opt}
                checked={user.privacySettings?.status === opt}
                onChange={() => handleChange('status', opt)}
                className="mr-2"
              />
              {opt}
            </label>
          ))}
        </div>
        <button onClick={() => openModal('status')} className="mt-2 text-blue-600 underline">Manage Exceptions / Share With...</button>
      </section>
      {/* Placeholder sections */}
      <section className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4 opacity-60">
        <h2 className="text-xl font-semibold mb-2">Blocked Users (Coming Soon)</h2>
      </section>
      <section className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4 opacity-60">
        <h2 className="text-xl font-semibold mb-2">Read Receipts (Coming Soon)</h2>
      </section>
      <section className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4 opacity-60">
        <h2 className="text-xl font-semibold mb-2">Groups & Channels Privacy (Coming Soon)</h2>
      </section>
      {modalOpen && (
        <PrivacySelectorModal
          setting={modalSetting}
          selectedIds={selectedIds}
          onClose={() => setModalOpen(false)}
          onSave={saveModal}
        />
      )}
    </div>
  );
};

export default PrivacySettings;
