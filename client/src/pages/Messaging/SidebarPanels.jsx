import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaPhone, FaVideo, FaPhoneSlash, FaSearch, FaTimes, FaCheck, FaCheckDouble,
  FaStar, FaArchive, FaUsers, FaArrowLeft, FaCog, FaUser, FaSignOutAlt,
  FaBell, FaShieldAlt, FaPalette, FaQuestionCircle, FaLock, FaCamera,
  FaUpload, FaEye, FaEyeSlash, FaReply, FaExternalLinkAlt, FaTrash,
  FaMicrophone, FaPlay, FaPause, FaArrowRight, FaCommentDots, FaEdit,
  FaChevronRight, FaUserCircle, FaPlus, FaGlobeAmericas, FaUserFriends,
  FaLongArrowAltDown, FaLongArrowAltUp, FaVideoSlash, FaPaperPlane,
} from 'react-icons/fa';
import {
  fetchStories, createStory, viewStory, updateStory, deleteStory,
  fetchCallHistory, createCallRecord,
  fetchStarredMessages,
} from '../../redux/slices/sidebarSlice';
import { setActiveChat, archiveChat, toggleStar, fetchBlockedUsers, blockUser } from '../../redux/slices/messagingSlice';
import { updateUser, logout } from '../../redux/slices/authSlice';
import api from '../../services/api';
import { socket } from '../../services/socket';
import { AccountPanel } from '../../components/chat/AccountPanels';
import { PrivacyPanel } from '../../components/chat/PrivacyPanels';
import { 
  StorageDataPanel, FacebookInstagramPanel, 
  AccessibilityPanel, AppLanguagePanel, MetaVerifiedPanel 
} from '../../components/chat/SettingsModals';
import ChatSettings from '../../components/chat/ChatSettings';

// ─── Helpers ────────────────────────────────────────────────────────────────
const getUserName = (u) => u?.fullName || u?.name || u?.username || 'User';
const getUserAvatar = (u) => {
  const p = u?.profilePicture || u?.avatar || null;
  return p === 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg' ? null : p;
};
const formatTime = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
const formatDate = (d) => {
  if (!d) return '';
  const date = new Date(d);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return formatTime(d);
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Avatar = ({ user, size = 'md', online, isGroup, ring }) => {
  const sizes = { xs: 'w-7 h-7 text-[10px]', sm: 'w-9 h-9 text-xs', md: 'w-11 h-11 text-base', lg: 'w-14 h-14 text-xl', xl: 'w-20 h-20 text-2xl' };
  const colors = ['from-blue-400 to-blue-600','from-purple-400 to-purple-600','from-emerald-400 to-emerald-600','from-orange-400 to-orange-600','from-pink-400 to-pink-600','from-teal-400 to-teal-600'];
  const name = isGroup ? (user?.chatName || 'G') : getUserName(user);
  const avatarUrl = isGroup ? null : getUserAvatar(user);
  const colorIdx = (name?.charCodeAt(0) || 0) % colors.length;
  return (
    <div className="relative flex-shrink-0">
      {avatarUrl ? (
        <img src={avatarUrl} alt={name} className={`${sizes[size]} rounded-full object-cover ${ring ? 'ring-2 ring-blue-400' : ''}`} />
      ) : (
        <div className={`${sizes[size]} rounded-full bg-gradient-to-br ${colors[colorIdx]} text-white flex items-center justify-center font-bold`}>
          {isGroup ? <FaUsers size={size === 'xl' ? 22 : 14} /> : name.charAt(0).toUpperCase()}
        </div>
      )}
      {online && !isGroup && (
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
      )}
    </div>
  );
};

// ─── Spinner ─────────────────────────────────────────────────────────────────
const Spinner = () => (
  <div className="flex items-center justify-center py-10">
    <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

// ─── PanelHeader ─────────────────────────────────────────────────────────────
const PanelHeader = ({ title, onBack, action }) => (
  <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-[#111b21] flex-shrink-0">
    {onBack && (
      <button onClick={onBack} className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
        <FaArrowLeft size={15} />
      </button>
    )}
    <h2 className="flex-1 text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
    {action}
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  STATUS PANEL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const StatusPanel = ({ onBack }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const { stories, isLoadingStories } = useSelector(s => s.sidebar);
  const { chats } = useSelector(s => s.messaging);
  const fileInputRef = useRef(null);

  const [viewing, setViewing] = useState(null); // { stories: [...], index: 0 }
  const [showViewers, setShowViewers] = useState(false);
  const [editingStory, setEditingStory] = useState(null); // story object being edited
  const [editCaptionText, setEditCaptionText] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [newCaptionText, setNewCaptionText] = useState('');
  const [selectedMentions, setSelectedMentions] = useState([]); // array of user objects/IDs
  const [showMentionPicker, setShowMentionPicker] = useState(false);

  useEffect(() => { dispatch(fetchStories()); }, [dispatch]);

  // Extract unique contacts from chats for mentioning
  const availableUsers = [];
  const addedIds = new Set();
  chats.forEach(c => {
    (c.users || []).forEach(u => {
      if (u._id !== user?._id && !addedIds.has(u._id)) {
        addedIds.add(u._id);
        availableUsers.push(u);
      }
    });
  });

  // Group by user
  const grouped = {};
  stories.forEach(s => {
    const uid = s.user?._id || s.user;
    if (!grouped[uid]) grouped[uid] = { user: s.user, stories: [] };
    grouped[uid].stories.push(s);
  });
  const myGroup = grouped[user?._id];
  const otherGroups = Object.values(grouped).filter(g => (g.user?._id || g.user) !== user?._id);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setShowUploadModal(true);
    e.target.value = null;
  };

  const handlePublishStory = async () => {
    const fd = new FormData();
    if (selectedFile) fd.append('file', selectedFile);
    fd.append('caption', newCaptionText);
    fd.append('mentions', JSON.stringify(selectedMentions.map(m => m._id)));
    await dispatch(createStory(fd));
    setShowUploadModal(false);
    setSelectedFile(null);
    setNewCaptionText('');
    setSelectedMentions([]);
  };

  const handleView = (group, storyIdx = 0) => {
    setViewing({ stories: group.stories, index: storyIdx });
    setShowViewers(false);
    dispatch(viewStory(group.stories[storyIdx]._id));
  };

  const currentStory = viewing ? viewing.stories[viewing.index] : null;
  const isMyStory = currentStory && ((currentStory.user?._id || currentStory.user) === user?._id);

  const handleDeleteCurrentStory = async () => {
    if (!currentStory) return;
    if (window.confirm('Delete this status update?')) {
      await dispatch(deleteStory(currentStory._id));
      if (viewing.stories.length > 1) {
        const updatedStories = viewing.stories.filter(s => s._id !== currentStory._id);
        const nextIdx = Math.min(viewing.index, updatedStories.length - 1);
        setViewing({ stories: updatedStories, index: nextIdx });
      } else {
        setViewing(null);
      }
    }
  };

  const handleSaveEditCaption = async () => {
    if (!editingStory) return;
    await dispatch(updateStory({ id: editingStory._id, caption: editCaptionText }));
    setViewing(prev => {
      if (!prev) return null;
      const updated = prev.stories.map(s => s._id === editingStory._id ? { ...s, caption: editCaptionText } : s);
      return { ...prev, stories: updated };
    });
    setEditingStory(null);
  };

  const toggleMentionUser = (targetUser) => {
    if (selectedMentions.some(m => m._id === targetUser._id)) {
      setSelectedMentions(selectedMentions.filter(m => m._id !== targetUser._id));
    } else {
      setSelectedMentions([...selectedMentions, targetUser]);
    }
  };

  const hasViewedAll = (group) =>
    group.stories.every(s => s.viewers?.map(v => typeof v === 'object' ? v._id : v).includes(user?._id));

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#111b21]">
      <PanelHeader title="Status" onBack={onBack} />

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* My Status */}
        <div className="px-4 py-3">
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">My Status</p>
          <div
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
            onClick={() => myGroup ? handleView(myGroup) : fileInputRef.current?.click()}
          >
            <div className="relative">
              <Avatar user={user} size="md" ring={!!myGroup} />
              {!myGroup && (
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900">
                  <FaPlus size={8} className="text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white text-sm">My status</p>
              <p className="text-xs text-gray-400">{myGroup ? `${myGroup.stories.length} update${myGroup.stories.length > 1 ? 's' : ''}` : 'Tap to add status update'}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); setShowUploadModal(true); }}
                className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Text
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                title="Add Media Status"
              >
                <FaCamera size={13} />
              </button>
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
        </div>

        {/* Recent Updates */}
        {otherGroups.length > 0 && (
          <div className="px-4 pb-2">
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Recent updates</p>
            {isLoadingStories ? <Spinner /> : otherGroups.map(group => {
              const uid = group.user?._id || group.user;
              const viewed = hasViewedAll(group);
              const latestStory = group.stories[0];
              return (
                <div key={uid} onClick={() => handleView(group)}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors mb-1">
                  <div className={`p-0.5 rounded-full ${viewed ? 'bg-gray-300 dark:bg-gray-600' : 'bg-gradient-to-tr from-blue-400 to-purple-500'}`}>
                    <Avatar user={group.user} size="md" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{getUserName(group.user)}</p>
                    <p className="text-xs text-gray-400">{formatDate(latestStory?.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {!isLoadingStories && otherGroups.length === 0 && (
          <div className="text-center py-12 px-6">
            <div className="text-4xl mb-3">👁️</div>
            <p className="text-gray-400 text-sm">No status updates yet.<br />Follow people to see their status.</p>
          </div>
        )}
      </div>

      {/* ── CREATE STATUS MODAL ── */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-2xl border border-gray-100 dark:border-gray-800">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Create Status Update</h3>
                <button onClick={() => { setShowUploadModal(false); setSelectedFile(null); setSelectedMentions([]); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <FaTimes size={18} />
                </button>
              </div>

              {selectedFile ? (
                <div className="mb-4 relative rounded-xl overflow-hidden bg-black max-h-48 flex items-center justify-center">
                  {selectedFile.type.startsWith('video/') ? (
                    <video src={URL.createObjectURL(selectedFile)} className="max-h-48 w-full object-contain" controls />
                  ) : (
                    <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="max-h-48 w-full object-contain" />
                  )}
                  <button onClick={() => setSelectedFile(null)} className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white">
                    <FaTimes size={12} />
                  </button>
                </div>
              ) : null}

              <textarea
                placeholder="Write a caption or status text..."
                value={newCaptionText}
                onChange={e => setNewCaptionText(e.target.value)}
                rows={3}
                className="w-full p-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none border border-transparent focus:border-blue-500 mb-3 resize-none"
              />

              {/* Mentions Pill Bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    🏷️ Mention People (@)
                  </span>
                  <button
                    onClick={() => setShowMentionPicker(!showMentionPicker)}
                    className="text-xs text-blue-500 hover:underline font-medium"
                  >
                    {showMentionPicker ? 'Done' : '+ Add Mention'}
                  </button>
                </div>

                {selectedMentions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {selectedMentions.map(m => (
                      <span key={m._id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                        @{getUserName(m)}
                        <button onClick={() => toggleMentionUser(m)} className="hover:text-red-500 ml-0.5"><FaTimes size={10} /></button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Mention Picker Dropdown */}
                {showMentionPicker && (
                  <div className="max-h-36 overflow-y-auto bg-gray-50 dark:bg-gray-800/80 rounded-xl p-2 border border-gray-200 dark:border-gray-700 custom-scrollbar flex flex-col gap-1">
                    {availableUsers.length === 0 ? (
                      <p className="text-xs text-gray-400 p-2 text-center">No contacts found to mention.</p>
                    ) : availableUsers.map(u => {
                      const isSelected = selectedMentions.some(m => m._id === u._id);
                      return (
                        <div
                          key={u._id}
                          onClick={() => toggleMentionUser(u)}
                          className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-colors ${
                            isSelected ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
                          }`}
                        >
                          <Avatar user={u} size="xs" />
                          <span className="text-xs font-medium text-gray-800 dark:text-gray-200 flex-1 truncate">{getUserName(u)}</span>
                          {isSelected && <FaCheck size={11} className="text-blue-500" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => { setShowUploadModal(false); setSelectedFile(null); setSelectedMentions([]); }}
                  className="px-4 py-2 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePublishStory}
                  disabled={!selectedFile && !newCaptionText.trim()}
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
                >
                  Share Status
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── EDIT CAPTION MODAL ── */}
      <AnimatePresence>
        {editingStory && (
          <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-2xl">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Edit Status Caption</h3>
              <textarea
                value={editCaptionText}
                onChange={e => setEditCaptionText(e.target.value)}
                rows={3}
                className="w-full p-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm text-gray-900 dark:text-white outline-none border border-transparent focus:border-blue-500 mb-4 resize-none"
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setEditingStory(null)} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">Cancel</button>
                <button onClick={handleSaveEditCaption} className="px-5 py-2 text-sm font-semibold bg-blue-500 text-white hover:bg-blue-600 rounded-xl">Save</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── FULLSCREEN STATUS VIEWER ── */}
      <AnimatePresence>
        {viewing && currentStory && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
            
            <div className="relative w-full h-full max-w-2xl flex flex-col justify-between p-4">
              {/* Progress bars */}
              <div className="absolute top-3 left-3 right-3 z-20 flex gap-1">
                {viewing.stories.map((_, i) => (
                  <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i <= viewing.index ? 'bg-white' : 'bg-white/30'}`} />
                ))}
              </div>

              {/* Header: User details + Edit/Delete/Close buttons */}
              <div className="relative z-20 flex items-center justify-between mt-5 px-2">
                <div className="flex items-center gap-3">
                  <Avatar user={currentStory.user} size="sm" />
                  <div>
                    <p className="text-white font-semibold text-sm">{getUserName(currentStory.user)}</p>
                    <p className="text-white/60 text-xs">{formatTime(currentStory.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isMyStory && (
                    <>
                      <button
                        onClick={() => { setEditingStory(currentStory); setEditCaptionText(currentStory.caption || ''); }}
                        className="p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white transition-colors"
                        title="Edit Caption"
                      >
                        <FaEdit size={15} />
                      </button>
                      <button
                        onClick={handleDeleteCurrentStory}
                        className="p-2.5 rounded-full bg-red-600/70 hover:bg-red-600 text-white transition-colors"
                        title="Delete Status"
                      >
                        <FaTrash size={14} />
                      </button>
                    </>
                  )}
                  <button onClick={() => setViewing(null)} className="p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white transition-colors">
                    <FaTimes size={18} />
                  </button>
                </div>
              </div>

              {/* Story Content Area (Media or Text-only) */}
              <div className="relative flex-1 my-4 flex flex-col items-center justify-center overflow-hidden rounded-2xl">
                {currentStory.media?.url ? (
                  currentStory.media?.type === 'video' ? (
                    <video src={currentStory.media.url} className="w-full h-full object-contain" autoPlay controls />
                  ) : (
                    <img src={currentStory.media.url} alt="status" className="w-full h-full object-contain" />
                  )
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-800 flex items-center justify-center p-8 text-center rounded-2xl">
                    <p className="text-white font-medium text-xl leading-relaxed">{currentStory.caption}</p>
                  </div>
                )}

                {/* Caption overlay for media status */}
                {currentStory.media?.url && currentStory.caption && (
                  <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md p-3 rounded-xl text-center">
                    <p className="text-white text-sm font-medium">{currentStory.caption}</p>
                  </div>
                )}

                {/* Mention Badges Tag Overlay */}
                {currentStory.mentions && currentStory.mentions.length > 0 && (
                  <div className="absolute top-4 left-4 flex flex-wrap gap-1.5 z-30 pointer-events-none">
                    {currentStory.mentions.map(m => {
                      const mObj = typeof m === 'object' ? m : { _id: m, name: 'User' };
                      return (
                        <span key={mObj._id} className="px-2.5 py-1 rounded-full bg-blue-600/80 backdrop-blur-md text-white text-xs font-semibold shadow-lg">
                          @{getUserName(mObj)}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Next / Previous touch navigation */}
                <div className="absolute inset-0 flex pointer-events-auto">
                  <div className="w-1/3 h-full cursor-pointer" onClick={() => {
                    if (viewing.index > 0) setViewing(v => ({ ...v, index: v.index - 1 }));
                    else setViewing(null);
                  }} />
                  <div className="w-2/3 h-full cursor-pointer" onClick={() => {
                    if (viewing.index < viewing.stories.length - 1) {
                      const nextIdx = viewing.index + 1;
                      dispatch(viewStory(viewing.stories[nextIdx]._id));
                      setViewing(v => ({ ...v, index: nextIdx }));
                    } else setViewing(null);
                  }} />
                </div>
              </div>

              {/* Bottom Footer: Viewers list toggle (If current user's story) */}
              {isMyStory && (
                <div className="relative z-20 flex flex-col items-center justify-center">
                  <button
                    onClick={() => setShowViewers(!showViewers)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-semibold transition-all"
                  >
                    <FaEye size={14} />
                    <span>{currentStory.viewers?.length || 0} Viewers</span>
                  </button>

                  {/* Viewers Drawer */}
                  <AnimatePresence>
                    {showViewers && (
                      <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 50, opacity: 0 }}
                        className="absolute bottom-12 w-full max-w-sm bg-gray-900/95 backdrop-blur-md border border-gray-800 rounded-2xl p-4 shadow-2xl max-h-60 overflow-y-auto custom-scrollbar"
                      >
                        <div className="flex justify-between items-center border-b border-gray-800 pb-2 mb-3">
                          <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            <FaEye className="text-blue-400" /> Viewed by ({currentStory.viewers?.length || 0})
                          </h4>
                          <button onClick={() => setShowViewers(false)} className="text-gray-400 hover:text-white">
                            <FaTimes size={13} />
                          </button>
                        </div>

                        {!currentStory.viewers || currentStory.viewers.length === 0 ? (
                          <p className="text-gray-400 text-xs text-center py-4">No viewers yet.</p>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {currentStory.viewers.map(v => {
                              const viewerObj = typeof v === 'object' ? v : { _id: v, name: 'User' };
                              return (
                                <div key={viewerObj._id} className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-gray-800/60">
                                  <Avatar user={viewerObj} size="sm" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-white text-xs font-semibold truncate">{getUserName(viewerObj)}</p>
                                    {viewerObj.username && <p className="text-gray-400 text-[11px]">@{viewerObj.username}</p>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  COMMUNITIES PANEL (Group chats as Communities)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const CommunitiesPanel = ({ onBack, onOpenChat, onCreateGroup }) => {
  const { chats } = useSelector(s => s.messaging);
  const { user } = useSelector(s => s.auth);
  const groups = chats.filter(c => c.isGroupChat);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#111b21]">
      <PanelHeader
        title="Communities"
        onBack={onBack}
        action={
          <button onClick={onCreateGroup}
            className="p-2 rounded-full text-blue-500 hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors" title="New Community">
            <FaPlus size={16} />
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {groups.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="text-5xl mb-4">👥</div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">No communities yet</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Create or join a group to see it here</p>
            <button onClick={onCreateGroup}
              className="mt-4 px-5 py-2.5 bg-blue-500 text-white rounded-full text-sm font-semibold hover:bg-blue-600 transition-colors">
              Create Community
            </button>
          </div>
        ) : groups.map(chat => {
          const memberCount = chat.users?.length || 0;
          const latestMsg = chat.latestMessage;
          return (
            <div key={chat._id} onClick={() => onOpenChat(chat._id)}
              className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-800/60 hover:bg-gray-50 dark:hover:bg-[#202c33] cursor-pointer transition-colors">
              <Avatar user={chat} isGroup size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-[15px] truncate">{chat.chatName}</p>
                <p className="text-xs text-gray-400">{memberCount} members • {latestMsg ? (latestMsg.content || 'Attachment') : 'No messages'}</p>
              </div>
              <FaChevronRight size={12} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  CALLS PANEL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const CallsPanel = ({ onBack, onCall, onOpenChat }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const { calls, isLoadingCalls } = useSelector(s => s.sidebar);
  const [activeFilter, setActiveFilter] = useState('all'); // all | missed

  // Refresh call history on mount & when new call ends via socket
  useEffect(() => { dispatch(fetchCallHistory()); }, [dispatch]);
  useEffect(() => {
    const refresh = () => dispatch(fetchCallHistory());
    socket?.on('call-ended', refresh);
    socket?.on('call-rejected', refresh);
    return () => {
      socket?.off('call-ended', refresh);
      socket?.off('call-rejected', refresh);
    };
  }, [dispatch]);

  // ─── Duration formatter ────────────────────────────
  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return null;
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}m`;
  };

  // ─── Call meta helper (WhatsApp style) ────────────
  const getCallMeta = (call) => {
    const myId = user?._id?.toString();
    const callerId = (call.caller?._id || call.caller)?.toString();
    const isMeCaller = callerId === myId;
    const isVideo = call.type === 'video';
    const isMissed = call.status === 'missed' || call.status === 'rejected';
    const isCancelled = call.status === 'cancelled';

    // Direction arrow
    if (isMissed && !isMeCaller) {
      // Incoming missed — red arrow pointing toward bottom-left
      return {
        dirIcon: (
          <span className="inline-flex items-center justify-center w-5 h-5">
            <FaLongArrowAltDown size={12} style={{ transform: 'rotate(-45deg)' }} />
          </span>
        ),
        typeIcon: isVideo ? <FaVideo size={13} /> : <FaPhone size={13} />,
        dirColor: 'text-red-500',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        label: 'Missed',
        labelColor: 'text-red-500 font-semibold',
      };
    } else if (isCancelled && isMeCaller) {
      // Outgoing cancelled — orange
      return {
        dirIcon: (
          <span className="inline-flex items-center justify-center w-5 h-5">
            <FaLongArrowAltUp size={12} style={{ transform: 'rotate(45deg)' }} />
          </span>
        ),
        typeIcon: isVideo ? <FaVideo size={13} /> : <FaPhone size={13} />,
        dirColor: 'text-orange-500',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        label: 'Cancelled',
        labelColor: 'text-orange-500',
      };
    } else if (isMeCaller) {
      // Outgoing — blue up-right arrow
      return {
        dirIcon: (
          <span className="inline-flex items-center justify-center w-5 h-5">
            <FaLongArrowAltUp size={12} style={{ transform: 'rotate(45deg)' }} />
          </span>
        ),
        typeIcon: isVideo ? <FaVideo size={13} /> : <FaPhone size={13} />,
        dirColor: 'text-blue-500',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        label: 'Outgoing',
        labelColor: 'text-blue-500',
      };
    } else {
      // Incoming — green down-left arrow
      return {
        dirIcon: (
          <span className="inline-flex items-center justify-center w-5 h-5">
            <FaLongArrowAltDown size={12} style={{ transform: 'rotate(-45deg)' }} />
          </span>
        ),
        typeIcon: isVideo ? <FaVideo size={13} /> : <FaPhone size={13} />,
        dirColor: 'text-green-500',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        label: 'Incoming',
        labelColor: 'text-green-500',
      };
    }
  };

  const otherParty = (call) => {
    const myId = user?._id?.toString();
    const callerId = (call.caller?._id || call.caller)?.toString();
    return callerId === myId ? call.receiver : call.caller;
  };

  const filteredCalls = activeFilter === 'missed'
    ? calls.filter(c => c.status === 'missed' || c.status === 'rejected')
    : calls;

  const missedCount = calls.filter(c => {
    const myId = user?._id?.toString();
    const callerId = (c.caller?._id || c.caller)?.toString();
    return callerId !== myId && (c.status === 'missed' || c.status === 'rejected');
  }).length;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#111b21]">
      <PanelHeader title="Calls" onBack={onBack} />

      {/* Filter tabs */}
      <div className="flex border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-[#111b21] flex-shrink-0">
        {['all', 'missed'].map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`flex-1 py-2.5 text-[13px] font-semibold capitalize transition-colors relative ${
              activeFilter === f
                ? 'text-blue-500'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {f === 'missed' && missedCount > 0 ? (
              <span className="flex items-center justify-center gap-1.5">
                Missed
                <span className="bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {missedCount > 9 ? '9+' : missedCount}
                </span>
              </span>
            ) : f === 'all' ? 'All Calls' : 'Missed'}
            {activeFilter === f && (
              <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-blue-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoadingCalls ? <Spinner /> : filteredCalls.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
              {activeFilter === 'missed'
                ? <FaPhoneSlash size={22} className="text-red-400" />
                : <FaPhone size={22} className="text-gray-400" />}
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              {activeFilter === 'missed' ? 'No missed calls' : 'No call history'}
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
              {activeFilter === 'missed' ? 'You have no missed calls' : 'Call someone to get started'}
            </p>
          </div>
        ) : filteredCalls.map((call, idx) => {
          const other = otherParty(call);
          const meta = getCallMeta(call);
          const duration = formatDuration(call.duration);
          return (
            <div
              key={call._id || idx}
              className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-[#202c33] transition-colors group"
            >
              {/* Avatar */}
              <Avatar user={other} size="md" />

              {/* Info */}
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => call.chat && onOpenChat(call.chat._id || call.chat)}
              >
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-[15px] truncate">
                  {getUserName(other)}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {/* Direction arrow icon */}
                  <span className={meta.dirColor}>{meta.dirIcon}</span>
                  {/* Call type icon (phone or video) */}
                  <span className={meta.dirColor}>{meta.typeIcon}</span>
                  {/* Label */}
                  <span className={`text-xs ${meta.labelColor}`}>{meta.label}</span>
                  {/* Dot separator */}
                  <span className="text-gray-300 dark:text-gray-600 text-xs">•</span>
                  {/* Date/time */}
                  <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(call.createdAt)}</span>
                  {/* Duration if available */}
                  {duration && (
                    <>
                      <span className="text-gray-300 dark:text-gray-600 text-xs">•</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{duration}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Action buttons — always visible on hover, call type badge always shown */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onCall(other, 'voice')}
                  title="Voice call"
                  className="p-2 rounded-full text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <FaPhone size={14} />
                </button>
                <button
                  onClick={() => onCall(other, 'video')}
                  title="Video call"
                  className="p-2 rounded-full text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <FaVideo size={14} />
                </button>
              </div>

              {/* Always-visible call type badge */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${meta.bgColor} ${meta.dirColor}`}>
                {meta.typeIcon}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  STARRED PANEL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const StarredPanel = ({ onBack, onOpenChat }) => {
  const dispatch = useDispatch();
  const { starredMessages, isLoadingStarred } = useSelector(s => s.sidebar);
  const [search, setSearch] = useState('');

  useEffect(() => { dispatch(fetchStarredMessages()); }, [dispatch]);

  const filtered = starredMessages.filter(m =>
    m.content?.toLowerCase().includes(search.toLowerCase())
  );

  const handleUnstar = (msgId) => {
    dispatch(toggleStar(msgId));
    // Also update sidebar state
    dispatch({ type: 'sidebar/removeStarredMessage', payload: msgId });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#111b21]">
      <PanelHeader title="Starred Messages" onBack={onBack} />
      <div className="px-4 pt-2 pb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="relative">
          <FaSearch size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="Search starred..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm rounded-lg bg-gray-100 dark:bg-[#202c33] text-gray-700 dark:text-gray-200 border-none outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoadingStarred ? <Spinner /> : filtered.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="text-5xl mb-4">⭐</div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              {search ? 'No results found' : 'No starred messages'}
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
              {!search && 'Star a message to access it quickly here'}
            </p>
          </div>
        ) : filtered.map(msg => {
          const chatName = msg.chat?.isGroupChat ? msg.chat.chatName : getUserName(msg.sender);
          return (
            <div key={msg._id} className="px-4 py-3 border-b border-gray-50 dark:border-gray-800/60 hover:bg-gray-50 dark:hover:bg-[#202c33] transition-colors">
              <div className="flex items-start gap-3">
                <Avatar user={msg.sender} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">{getUserName(msg.sender)}</p>
                    <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">{formatDate(msg.createdAt)}</span>
                  </div>
                  {chatName && <p className="text-[10px] text-blue-500 mb-0.5">{chatName}</p>}
                  {msg.media?.url && (
                    <div className="w-14 h-14 rounded-lg overflow-hidden mb-1 bg-gray-200 dark:bg-gray-700">
                      {msg.media.type === 'image' ? (
                        <img src={msg.media.url} alt="attachment" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FaPlay size={14} className="text-gray-500" />
                        </div>
                      )}
                    </div>
                  )}
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{msg.content || 'Attachment'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2 justify-end">
                <button
                  onClick={() => msg.chat && onOpenChat(msg.chat._id || msg.chat)}
                  className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                  <FaExternalLinkAlt size={10} /> Go to message
                </button>
                <button onClick={() => handleUnstar(msg._id)}
                  className="text-xs text-red-400 hover:text-red-500 flex items-center gap-1">
                  <FaStar size={10} /> Unstar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ARCHIVED PANEL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const ArchivedPanel = ({ onBack, onOpenChat, user }) => {
  const dispatch = useDispatch();
  const { chats } = useSelector(s => s.messaging);
  const archived = chats.filter(c => c.archivedBy?.map(String).includes(user?._id));

  const handleUnarchive = (chatId) => {
    dispatch(archiveChat(chatId)); // Toggle
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#111b21]">
      <PanelHeader title="Archived Chats" onBack={onBack} />
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {archived.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="text-5xl mb-4">📦</div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">No archived chats</p>
          </div>
        ) : archived.map(chat => {
          const isGroup = chat.isGroupChat;
          const other = isGroup ? null : chat.users?.find(u => (u._id || u).toString() !== user?._id);
          const latestMsg = chat.latestMessage;
          return (
            <div key={chat._id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-800/60 hover:bg-gray-50 dark:hover:bg-[#202c33] transition-colors">
              <Avatar user={isGroup ? chat : other} isGroup={isGroup} size="md" />
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onOpenChat(chat._id)}>
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-[15px] truncate">
                  {isGroup ? chat.chatName : getUserName(other)}
                </p>
                <p className="text-xs text-gray-400 truncate">{latestMsg?.content || 'No messages'}</p>
              </div>
              <button
                onClick={() => handleUnarchive(chat._id)}
                className="p-2 rounded-full text-blue-500 hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
                title="Unarchive">
                <FaArchive size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
//  SETTINGS PANEL
// â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
export const SettingsPanel = ({ onBack, onNavigate }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const { blockedUserDetails } = useSelector(s => s.messaging);

  const [activeModal, setActiveModal] = useState(null);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSent, setSupportSent] = useState(false);

  useEffect(() => {
    if (activeModal === 'blockedContacts') dispatch(fetchBlockedUsers());
  }, [activeModal, dispatch]);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      dispatch(logout());
      window.location.href = '/login';
    }
  };

  const handleSendSupport = (e) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;
    setSupportSent(true);
    setTimeout(() => { setSupportSent(false); setSupportMessage(''); }, 3000);
  };

  const settingsItems = [
    { icon: <span className="text-lg">🤖</span>, bg: 'bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30', label: 'SkillLinked AI', sub: 'Ask me anything — career, messages & more', action: () => onNavigate('metaai') },
    { icon: <FaShieldAlt size={15} className="text-teal-500" />, bg: 'bg-teal-100 dark:bg-teal-900/30', label: 'Meta Verified', sub: 'Build trust with a verified badge', modal: 'metaVerified' },
    { icon: <FaUserCircle size={15} className="text-blue-500" />, bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'Account', sub: 'Security notifications, change number', modal: 'account' },
    { icon: <FaLock size={15} className="text-gray-500" />, bg: 'bg-gray-100 dark:bg-gray-700/50', label: 'Privacy', sub: 'Last seen, blocked contacts', modal: 'privacy' },
    { icon: <FaGlobeAmericas size={15} className="text-purple-500" />, bg: 'bg-purple-100 dark:bg-purple-900/30', label: 'Lists', sub: 'Manage your chat lists', modal: 'lists' },
    { icon: <FaCommentDots size={15} className="text-green-500" />, bg: 'bg-green-100 dark:bg-green-900/30', label: 'Chats', sub: 'Theme, wallpapers, chat history', modal: 'chats' },
    { icon: <FaBell size={15} className="text-yellow-500" />, bg: 'bg-yellow-100 dark:bg-yellow-900/30', label: 'Notifications', sub: notifEnabled ? 'Message, group & call tones' : 'Notifications muted', toggle: notifEnabled, action: () => setNotifEnabled(n => !n) },
    { icon: <FaArrowRight size={15} className="text-blue-400" />, bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'Storage and data', sub: 'Network usage, auto-download', modal: 'storage' },
    { icon: <span className="font-extrabold text-sm text-blue-600 dark:text-blue-400">f</span>, bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'Facebook & Instagram', sub: 'Share your SkillLinked status', modal: 'fbig' },
    { icon: <FaUser size={15} className="text-orange-500" />, bg: 'bg-orange-100 dark:bg-orange-900/30', label: 'Accessibility', sub: 'Font size, high contrast', modal: 'accessibility' },
    { icon: <FaGlobeAmericas size={15} className="text-indigo-500" />, bg: 'bg-indigo-100 dark:bg-indigo-900/30', label: 'App language', sub: 'English (device language)', modal: 'appLanguage' },
    { icon: <FaQuestionCircle size={15} className="text-teal-500" />, bg: 'bg-teal-100 dark:bg-teal-900/30', label: 'Help and feedback', sub: 'FAQ, contact us, privacy policy', modal: 'help' },
    {
      icon: <FaUserFriends size={15} className="text-green-500" />, bg: 'bg-green-100 dark:bg-green-900/30',
      label: 'Invite a contact', sub: 'Share SkillLinked with friends',
      action: () => { if (navigator.share) navigator.share({ title: 'Join SkillLinked', text: 'Connect with me on SkillLinked!', url: window.location.origin }); else alert('Share link: ' + window.location.origin); }
    },
  ];

  const renderSubModal = () => {
    switch (activeModal) {
      case 'account': return <AccountPanel onBack={() => setActiveModal(null)} />;
      case 'privacy': return <PrivacyPanel onBack={() => setActiveModal(null)} onOpenBlockedContacts={() => setActiveModal('blockedContacts')} />;
      case 'storage': return <StorageDataPanel onBack={() => setActiveModal(null)} />;
      case 'fbig': return <FacebookInstagramPanel onBack={() => setActiveModal(null)} />;
      case 'accessibility': return <AccessibilityPanel onBack={() => setActiveModal(null)} />;
      case 'appLanguage': return <AppLanguagePanel onBack={() => setActiveModal(null)} />;
      case 'metaVerified': return <MetaVerifiedPanel onBack={() => setActiveModal(null)} />;
      default: return null;
    }
  };

  const COMPONENT_MODALS = ['account', 'privacy', 'storage', 'fbig', 'accessibility', 'appLanguage', 'metaVerified'];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#111b21] relative">
      <PanelHeader title="Settings" onBack={onBack} />

      <div className="px-4 py-3.5 flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#1a2329] cursor-pointer transition-colors"
        onClick={() => onNavigate('profile')}>
        <Avatar user={user} size="md" />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 dark:text-white text-[17px] truncate">{getUserName(user)}</p>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 truncate">{user?.headline || user?.bio || 'Hey there! I am using SkillLinked.'}</p>
        </div>
        <FaChevronRight size={13} className="text-gray-400" />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {settingsItems.map((item, i) => (
          <button key={i}
            onClick={item.action || (() => item.modal && setActiveModal(item.modal))}
            className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-[#202c33] transition-colors text-left border-b border-gray-50 dark:border-gray-800/30">
            <div className={`w-9 h-9 rounded-full ${item.bg} flex items-center justify-center flex-shrink-0`}>
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 dark:text-gray-200 text-[15px]">{item.label}</p>
              <p className="text-[13px] text-gray-400 truncate">{item.sub}</p>
            </div>
            {item.toggle !== undefined ? (
              <div className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${item.toggle ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${item.toggle ? 'left-5' : 'left-0.5'}`} />
              </div>
            ) : (
              <FaChevronRight size={12} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
            )}
          </button>
        ))}

        <button onClick={handleLogout}
          className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-left mt-2 border-t border-gray-100 dark:border-gray-800">
          <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
            <FaSignOutAlt size={15} className="text-red-500" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-red-500 text-[15px]">Logout</p>
            <p className="text-[13px] text-gray-400">Sign out of SkillLinked</p>
          </div>
        </button>
      </div>

      <AnimatePresence>
        {activeModal === 'chats' && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute inset-0 z-30 bg-white dark:bg-[#111b21] flex flex-col">
            <PanelHeader title="Chats" onBack={() => setActiveModal(null)} />
            <div className="flex-1 overflow-y-auto custom-scrollbar"><ChatSettings /></div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeModal === 'lists' && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute inset-0 z-30 bg-white dark:bg-[#111b21] flex flex-col">
            <PanelHeader title="Lists" onBack={() => setActiveModal(null)} />
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-3">
              <FaGlobeAmericas className="text-purple-400 text-5xl" />
              <p className="font-bold text-gray-900 dark:text-gray-100 text-lg">Organize your chats</p>
              <p className="text-gray-500 text-sm">Create custom lists to filter your chats.</p>
              <button className="mt-2 px-6 py-3 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-600 transition-colors">Create a list</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeModal === 'help' && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute inset-0 z-30 bg-white dark:bg-[#111b21] flex flex-col">
            <PanelHeader title="Help and feedback" onBack={() => setActiveModal(null)} />
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {[
                { label: 'Help Centre', sub: 'Get help or contact us' },
                { label: 'Contact us', sub: 'Submit a support request' },
                { label: 'Terms and Privacy Policy', sub: 'Read our terms and policies' },
                { label: 'App info', sub: 'Version 1.0.0' },
              ].map((item, i) => (
                <button key={i} className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 dark:hover:bg-[#202c33] transition-colors text-left border-b border-gray-50 dark:border-gray-800/40">
                  <div>
                    <p className="font-semibold text-[15px] text-gray-800 dark:text-gray-200">{item.label}</p>
                    <p className="text-[13px] text-gray-400">{item.sub}</p>
                  </div>
                  <FaChevronRight size={12} className="text-gray-300" />
                </button>
              ))}
              <div className="p-4 space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase">Frequently Asked Questions</h4>
                {[
                  { q: 'How do I edit or delete a message?', a: 'Hover over your message and click the options dropdown.' },
                  { q: 'How do audio and video calls work?', a: 'Click the Phone or Camera icons at the top right of any chat.' },
                  { q: 'How do 24-hour Status updates work?', a: 'Navigate to Status tab to share updates that expire after 24 hours.' },
                ].map((faq, idx) => (
                  <div key={idx} className="bg-gray-50 dark:bg-[#1a2329] rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                    <button onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                      className="w-full flex justify-between items-center p-3 text-left font-medium text-[13px] text-gray-800 dark:text-gray-200">
                      <span>{faq.q}</span>
                      <FaChevronRight size={10} className={`transform transition-transform ${expandedFaq === idx ? 'rotate-90 text-blue-500' : 'text-gray-400'}`} />
                    </button>
                    {expandedFaq === idx && (
                      <div className="px-3 pb-3 pt-1 text-[13px] text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800/60">{faq.a}</div>
                    )}
                  </div>
                ))}
              </div>
              <form onSubmit={handleSendSupport} className="p-4 space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase">Contact Support</h4>
                {supportSent && <p className="text-xs font-semibold text-teal-500">Thank you! Ticket submitted successfully.</p>}
                <textarea placeholder="Describe your issue or feedback..." value={supportMessage} onChange={e => setSupportMessage(e.target.value)}
                  rows={3} className="w-full p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-[13px] text-gray-800 dark:text-gray-200 outline-none resize-none" />
                <button type="submit" disabled={!supportMessage.trim()}
                  className="w-full py-2.5 rounded-xl bg-teal-500 text-white font-semibold text-sm hover:bg-teal-600 disabled:opacity-50 transition-colors">Submit Ticket</button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeModal === 'blockedContacts' && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute inset-0 z-50 bg-white dark:bg-[#111b21] flex flex-col">
            <PanelHeader title="Blocked contacts" onBack={() => setActiveModal('privacy')} />
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {!blockedUserDetails?.length ? (
                <div className="text-center py-16 px-6">
                  <div className="text-5xl mb-4">&#128683;</div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">No blocked contacts</p>
                </div>
              ) : (
                <div className="py-2">
                  {blockedUserDetails.map(u => (
                    <div key={u._id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#202c33] transition-colors border-b border-gray-50 dark:border-gray-800/40">
                      <Avatar user={u} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-gray-100 text-[15px] truncate">{getUserName(u)}</p>
                        <p className="text-[13px] text-gray-400 truncate">{u.headline || '@' + u.username}</p>
                      </div>
                      <button onClick={() => { if (window.confirm('Unblock ' + getUserName(u) + '?')) dispatch(blockUser(u._id)); }}
                        className="px-3 py-1.5 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
                        Unblock
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {COMPONENT_MODALS.includes(activeModal) && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute inset-0 z-30">
            {renderSubModal()}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  PROFILE PANEL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const ProfilePanel = ({ onBack }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    username: user?.username || '',
    headline: user?.headline || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
  });
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put('/profiles/user-info', form);
      dispatch(updateUser(res));
      setEditing(false);
    } catch (e) {
      alert('Failed to save profile.');
    } finally { setSaving(false); }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.put('/profiles/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      dispatch(updateUser({ profilePicture: res.profilePicture || res.avatar || res.url }));
    } catch (err) { console.error(err); }
    e.target.value = null;
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.put('/profiles/cover-photo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      dispatch(updateUser({ coverPhoto: res.coverPhoto || res.url }));
    } catch (err) { console.error(err); }
    e.target.value = null;
  };

  const Field = ({ label, name, multiline }) => (
    <div className="mb-4">
      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{label}</label>
      {editing ? (
        multiline ? (
          <textarea value={form[name]} onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
            rows={3} className="w-full text-sm px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 outline-none focus:ring-1 focus:ring-blue-400 resize-none" />
        ) : (
          <input value={form[name]} onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
            className="w-full text-sm px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 outline-none focus:ring-1 focus:ring-blue-400" />
        )
      ) : (
        <p className="text-sm text-gray-800 dark:text-gray-200 px-1">{form[name] || <span className="text-gray-400 italic">Not set</span>}</p>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#111b21]">
      <PanelHeader
        title="Profile"
        onBack={onBack}
        action={
          editing ? (
            <div className="flex gap-2">
              <button onClick={() => { setEditing(false); setForm({ fullName: user?.fullName || '', username: user?.username || '', headline: user?.headline || '', bio: user?.bio || '', location: user?.location || '', website: user?.website || '' }); }}
                className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="px-3 py-1.5 bg-blue-500 text-white text-xs font-semibold rounded-full hover:bg-blue-600 transition-colors disabled:opacity-60">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)}
              className="p-2 rounded-full text-blue-500 hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors">
              <FaEdit size={15} />
            </button>
          )
        }
      />

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Cover Photo */}
        <div className="relative h-28 bg-gradient-to-r from-blue-500 to-blue-700 flex-shrink-0">
          {user?.coverPhoto && <img src={user.coverPhoto} alt="cover" className="w-full h-full object-cover" />}
          <button onClick={() => coverInputRef.current?.click()}
            className="absolute top-2 right-2 p-1.5 bg-black/40 rounded-full text-white hover:bg-black/60 transition-colors">
            <FaCamera size={12} />
          </button>
          <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />

          {/* Avatar */}
          <div className="absolute -bottom-8 left-4">
            <div className="relative">
              <Avatar user={user} size="xl" ring />
              <button onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-1.5 bg-blue-500 border-2 border-white dark:border-gray-900 rounded-full text-white hover:bg-blue-600 transition-colors">
                <FaCamera size={10} />
              </button>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="pt-12 px-4 pb-3 flex gap-6 border-b border-gray-100 dark:border-gray-800">
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900 dark:text-white">{user?.followers?.length || 0}</p>
            <p className="text-xs text-gray-400">Followers</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900 dark:text-white">{user?.following?.length || 0}</p>
            <p className="text-xs text-gray-400">Following</p>
          </div>
        </div>

        {/* Editable Fields */}
        <div className="px-4 py-4">
          <Field label="Full Name" name="fullName" />
          <Field label="Username" name="username" />
          <Field label="Professional Headline" name="headline" />
          <Field label="Bio" name="bio" multiline />
          <Field label="Location" name="location" />
          <Field label="Website" name="website" />
        </div>
      </div>
    </div>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  META AI PANEL  (SkillLinked AI — like WhatsApp's Meta AI)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const MetaAIPanel = ({ onBack }) => {
  const { user } = useSelector(s => s.auth);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi ${user?.fullName?.split(' ')[0] || 'there'}! 👋 I'm **SkillLinked AI** — your intelligent assistant.\n\nI can help you with:\n• Career advice & job searching\n• Writing professional messages\n• Resume & profile tips\n• General questions & research\n\nWhat can I help you with today?`,
      time: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const suggestions = [
    'Help me write a cover letter',
    'How to negotiate salary?',
    'Tips for LinkedIn profile',
    'Prepare for an interview',
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || isLoading) return;

    setInput('');
    const userMsg = { role: 'user', content: msg, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const res = await api.post('/ai/chat', { message: msg, history });
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: res.reply || 'Sorry, I could not process that.', time: new Date() },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "I'm having trouble connecting right now. Please try again shortly! 🙏",
          time: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const renderContent = (text) => {
    // Bold: **text**
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, i) =>
      p.startsWith('**') && p.endsWith('**')
        ? <strong key={i} className="font-semibold">{p.slice(2, -2)}</strong>
        : <span key={i}>{p}</span>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#111b21]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-[#0d1f2d] to-[#1a3a5c] flex-shrink-0">
        <button
          onClick={onBack}
          className="p-1.5 rounded-full text-white/70 hover:bg-white/10 transition-colors"
        >
          <FaArrowLeft size={15} />
        </button>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg flex-shrink-0">
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-white">SkillLinked AI</p>
          <p className="text-[11px] text-white/60">Your intelligent assistant</p>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 bg-white/10 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] text-white/80 font-medium">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 bg-[#f0f2f5] dark:bg-[#0b1418]">
        {/* Decorative top banner */}
        <div className="flex flex-col items-center py-4 text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl mb-3">
            <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white">
              <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
            </svg>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[200px] leading-relaxed">
            SkillLinked AI helps you grow professionally. Your chats are private.
          </p>
        </div>

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                  <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
                </svg>
              </div>
            )}
            <div className={`max-w-[78%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
              <div
                className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm shadow-sm'
                    : 'bg-white dark:bg-[#1f2c34] text-gray-900 dark:text-gray-100 rounded-bl-sm shadow-sm border border-gray-100 dark:border-gray-700'
                }`}
              >
                {renderContent(msg.content)}
              </div>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 px-1">
                {msg.time ? new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
              </span>
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center flex-shrink-0 mt-1">
                <FaUser size={12} className="text-white" />
              </div>
            )}
          </div>
        ))}

        {/* Loading bubble */}
        {isLoading && (
          <div className="flex gap-2 justify-start">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-md">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
              </svg>
            </div>
            <div className="bg-white dark:bg-[#1f2c34] border border-gray-100 dark:border-gray-700 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
              <div className="flex gap-1 items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestion Chips */}
      {messages.length <= 1 && (
        <div className="px-3 py-2 flex gap-2 overflow-x-auto bg-[#f0f2f5] dark:bg-[#0b1418] no-scrollbar flex-shrink-0">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => sendMessage(s)}
              className="flex-shrink-0 px-3 py-1.5 bg-white dark:bg-[#1f2c34] border border-gray-200 dark:border-gray-700 rounded-full text-xs text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 transition-all whitespace-nowrap"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-3 py-3 bg-white dark:bg-[#1f2c34] border-t border-gray-100 dark:border-gray-700 flex items-center gap-2 flex-shrink-0">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Ask SkillLinked AI anything..."
          disabled={isLoading}
          className="flex-1 bg-gray-100 dark:bg-[#2a3942] text-gray-900 dark:text-gray-100 text-sm px-4 py-2.5 rounded-full outline-none placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-60"
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || isLoading}
          className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full shadow-md hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          <FaPaperPlane size={13} />
        </button>
      </div>
    </div>
  );
};

