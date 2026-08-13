// client/src/components/chat/PrivacySelectorModal.jsx
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

// Helper to compute mutual connections from followers + following
const getMutualConnections = (user) => {
  const following = (user.following || []).map(u => u._id?.toString() || u.toString());
  const followers = (user.followers || []).map(u => u._id?.toString() || u.toString());
  return following.filter(id => followers.includes(id));
};

const PrivacySelectorModal = ({ setting, selectedIds, onClose, onSave }) => {
  const { user } = useSelector((state) => state.auth);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(selectedIds);
  const [connections, setConnections] = useState([]);

  useEffect(() => {
    const mutual = getMutualConnections(user);
    setConnections(mutual);
  }, [user]);

  const toggleSelect = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const filtered = connections.filter(id => {
    const contact = user.following.find(f => f._id?.toString() === id || f.toString() === id) ||
                    user.followers.find(f => f._id?.toString() === id || f.toString() === id);
    const name = contact?.fullName || contact?.username || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const handleSave = () => {
    onSave(selected);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-96 max-h-[80vh] overflow-y-auto p-4">
        <h3 className="text-lg font-semibold mb-2">Select contacts for {setting}</h3>
        <input
          type="text"
          placeholder="Search contacts..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full mb-2 p-2 border rounded"
        />
        <div className="space-y-1">
          {filtered.map(id => {
            const contact = user.following.find(f => f._id?.toString() === id || f.toString() === id) ||
                            user.followers.find(f => f._id?.toString() === id || f.toString() === id);
            const name = contact?.fullName || contact?.username || id;
            return (
              <label key={id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selected.includes(id)}
                  onChange={() => toggleSelect(id)}
                  className="mr-2"
                />
                {name}
              </label>
            );
          })}
        </div>
        <div className="flex justify-end mt-4 space-x-2">
          <button onClick={onClose} className="px-3 py-1 rounded bg-gray-300 dark:bg-gray-600">
            Cancel
          </button>
          <button onClick={handleSave} className="px-3 py-1 rounded bg-blue-600 text-white">
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacySelectorModal;
