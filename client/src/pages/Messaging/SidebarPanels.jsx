import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaPhone, FaVideo, FaPhoneSlash, FaSearch, FaTimes, FaCheck, FaCheckDouble,
  FaStar, FaArchive, FaUsers, FaArrowLeft, FaCog, FaUser, FaSignOutAlt,
  FaBell, FaShieldAlt, FaPalette, FaQuestionCircle, FaLock, FaCamera,
  FaUpload, FaEye, FaEyeSlash, FaReply, FaExternalLinkAlt, FaTrash,
  FaMicrophone, FaPlay, FaPause, FaArrowRight, FaCommentDots, FaEdit,
  FaChevronRight, FaUserCircle, FaPlus, FaGlobeAmericas,
  FaLongArrowAltDown, FaLongArrowAltUp, FaVideoSlash,
} from 'react-icons/fa';
import {
  fetchStories, createStory, viewStory, updateStory, deleteStory,
  fetchCallHistory, createCallRecord,
  fetchStarredMessages,
} from '../../redux/slices/sidebarSlice';
import { setActiveChat, archiveChat, toggleStar } from '../../redux/slices/messagingSlice';
import { updateUser, logout } from '../../redux/slices/authSlice';
import api from '../../services/api';
import { socket } from '../../services/socket';

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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  SETTINGS PANEL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const SettingsPanel = ({ onBack, onNavigate }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const { theme } = useSelector(s => s.theme);

  const [activeModal, setActiveModal] = useState(null); // 'privacy' | 'security' | 'help' | null
  const [notifEnabled, setNotifEnabled] = useState(true);

  // Privacy states
  const [privacySettings, setPrivacySettings] = useState({
    lastSeen: 'Everyone',
    profilePhoto: 'Everyone',
    about: 'Everyone',
    readReceipts: true,
    disappearingMessages: 'Off',
  });

  // Security states
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [securityNotifs, setSecurityNotifs] = useState(true);
  const [passForm, setPassForm] = useState({ current: '', newPass: '', confirm: '' });
  const [passMsg, setPassMsg] = useState('');

  // Help states
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSent, setSupportSent] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      dispatch(logout());
      window.location.href = '/login';
    }
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (!passForm.newPass || passForm.newPass !== passForm.confirm) {
      setPassMsg('New passwords do not match.');
      return;
    }
    setPassMsg('Password updated successfully!');
    setPassForm({ current: '', newPass: '', confirm: '' });
    setTimeout(() => setPassMsg(''), 3000);
  };

  const handleSendSupport = (e) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;
    setSupportSent(true);
    setTimeout(() => {
      setSupportSent(false);
      setSupportMessage('');
    }, 3000);
  };

  const items = [
    {
      icon: <FaUser size={15} className="text-blue-500" />,
      label: 'Profile',
      sub: 'Edit your profile information',
      onClick: () => onNavigate('profile'),
    },
    {
      icon: <FaBell size={15} className="text-purple-500" />,
      label: 'Notifications',
      sub: notifEnabled ? 'Notifications are on' : 'Notifications are off',
      onClick: () => setNotifEnabled(n => !n),
      toggle: notifEnabled,
    },
    {
      icon: <FaPalette size={15} className="text-orange-500" />,
      label: 'Theme',
      sub: theme === 'dark' ? 'Dark mode' : 'Light mode',
      onClick: () => dispatch({ type: 'theme/toggleTheme' }),
    },
    {
      icon: <FaShieldAlt size={15} className="text-green-500" />,
      label: 'Privacy',
      sub: 'Control who can see your info',
      onClick: () => setActiveModal('privacy'),
    },
    {
      icon: <FaLock size={15} className="text-red-500" />,
      label: 'Security',
      sub: 'Two-step verification & password',
      onClick: () => setActiveModal('security'),
    },
    {
      icon: <FaQuestionCircle size={15} className="text-teal-500" />,
      label: 'Help Center',
      sub: 'FAQs & contact support',
      onClick: () => setActiveModal('help'),
    },
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#111b21] relative">
      <PanelHeader title="Settings" onBack={onBack} />

      {/* Profile Quick View */}
      <div className="px-4 py-4 flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 bg-blue-50 dark:bg-[#1a2329] cursor-pointer hover:bg-blue-100 dark:hover:bg-[#202c33] transition-colors"
        onClick={() => onNavigate('profile')}>
        <Avatar user={user} size="md" />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 dark:text-white truncate">{getUserName(user)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{user?.username} {user?.headline ? `• ${user.headline}` : ''}</p>
        </div>
        <FaChevronRight size={13} className="text-gray-400" />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
        {items.map((item, i) => (
          <button key={i} onClick={item.onClick}
            className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-[#202c33] transition-colors text-left border-b border-gray-50 dark:border-gray-800/40">
            <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{item.label}</p>
              <p className="text-xs text-gray-400">{item.sub}</p>
            </div>
            {item.toggle !== undefined ? (
              <div className={`relative w-10 h-5 rounded-full transition-colors ${item.toggle ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${item.toggle ? 'left-5' : 'left-0.5'}`} />
              </div>
            ) : (
              <FaChevronRight size={12} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
            )}
          </button>
        ))}

        {/* Logout */}
        <button onClick={handleLogout}
          className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-left mt-2 border-t border-gray-100 dark:border-gray-800">
          <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
            <FaSignOutAlt size={15} className="text-red-500" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-red-500 text-sm">Logout</p>
            <p className="text-xs text-gray-400">Sign out of SkillLinked</p>
          </div>
        </button>
      </div>

      {/* 🔒 PRIVACY MODAL */}
      <AnimatePresence>
        {activeModal === 'privacy' && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute inset-0 z-30 bg-white dark:bg-[#111b21] flex flex-col">
            <PanelHeader title="Privacy" onBack={() => setActiveModal(null)} />
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
              
              <div className="bg-gray-50 dark:bg-[#1a2329] p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Who can see my personal info</h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Last seen & online</p>
                      <p className="text-xs text-gray-400">Control who sees when you are active</p>
                    </div>
                    <select
                      value={privacySettings.lastSeen}
                      onChange={e => setPrivacySettings({ ...privacySettings, lastSeen: e.target.value })}
                      className="bg-white dark:bg-gray-800 text-xs text-gray-800 dark:text-gray-200 p-2 rounded-lg outline-none border border-gray-200 dark:border-gray-700"
                    >
                      <option>Everyone</option>
                      <option>My Contacts</option>
                      <option>Nobody</option>
                    </select>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Profile photo</p>
                      <p className="text-xs text-gray-400">Choose profile picture visibility</p>
                    </div>
                    <select
                      value={privacySettings.profilePhoto}
                      onChange={e => setPrivacySettings({ ...privacySettings, profilePhoto: e.target.value })}
                      className="bg-white dark:bg-gray-800 text-xs text-gray-800 dark:text-gray-200 p-2 rounded-lg outline-none border border-gray-200 dark:border-gray-700"
                    >
                      <option>Everyone</option>
                      <option>My Contacts</option>
                      <option>Nobody</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-[#1a2329] p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Messaging Privacy</h4>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Read receipts</p>
                    <p className="text-xs text-gray-400">If turned off, you won't send or receive blue double ticks.</p>
                  </div>
                  <button
                    onClick={() => setPrivacySettings(p => ({ ...p, readReceipts: !p.readReceipts }))}
                    className={`relative w-10 h-5 rounded-full transition-colors ${privacySettings.readReceipts ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${privacySettings.readReceipts ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🛡️ SECURITY MODAL */}
      <AnimatePresence>
        {activeModal === 'security' && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute inset-0 z-30 bg-white dark:bg-[#111b21] flex flex-col">
            <PanelHeader title="Security" onBack={() => setActiveModal(null)} />
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800/40 flex items-center gap-3">
                <FaLock className="text-blue-500 text-2xl flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">End-to-End Encryption</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Messages and calls are secured with end-to-end encryption.</p>
                </div>
              </div>

              {/* Two-step Verification */}
              <div className="bg-gray-50 dark:bg-[#1a2329] p-4 rounded-2xl border border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Two-Step Verification</p>
                  <p className="text-xs text-gray-400">Add extra security requiring a PIN when logging in.</p>
                </div>
                <button
                  onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    twoFactorEnabled ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                  }`}
                >
                  {twoFactorEnabled ? 'Enabled' : 'Enable'}
                </button>
              </div>

              {/* Change Password */}
              <form onSubmit={handlePasswordChange} className="bg-gray-50 dark:bg-[#1a2329] p-4 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase">Change Password</h4>
                {passMsg && <p className="text-xs font-semibold text-green-500">{passMsg}</p>}
                <input
                  type="password"
                  placeholder="Current Password"
                  value={passForm.current}
                  onChange={e => setPassForm({ ...passForm, current: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-gray-800 text-xs text-gray-800 dark:text-gray-200 outline-none border border-gray-200 dark:border-gray-700"
                />
                <input
                  type="password"
                  placeholder="New Password"
                  value={passForm.newPass}
                  onChange={e => setPassForm({ ...passForm, newPass: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-gray-800 text-xs text-gray-800 dark:text-gray-200 outline-none border border-gray-200 dark:border-gray-700"
                />
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  value={passForm.confirm}
                  onChange={e => setPassForm({ ...passForm, confirm: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-gray-800 text-xs text-gray-800 dark:text-gray-200 outline-none border border-gray-200 dark:border-gray-700"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-blue-500 text-white font-semibold text-xs hover:bg-blue-600 transition-colors"
                >
                  Update Password
                </button>
              </form>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ❓ HELP CENTER MODAL */}
      <AnimatePresence>
        {activeModal === 'help' && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute inset-0 z-30 bg-white dark:bg-[#111b21] flex flex-col">
            <PanelHeader title="Help Center" onBack={() => setActiveModal(null)} />
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
              
              <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-2xl border border-teal-100 dark:border-teal-800/40 flex items-center gap-3">
                <FaQuestionCircle className="text-teal-500 text-2xl flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">How can we help?</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Search FAQs or reach out to our support team.</p>
                </div>
              </div>

              {/* FAQs */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase px-1">Frequently Asked Questions</h4>
                {[
                  { q: 'How do I edit or delete a message?', a: 'Hover over your message and click the options dropdown to Edit or Delete for Everyone.' },
                  { q: 'How do audio and video calls work?', a: 'Click the Phone or Camera icons at the top right of any chat room to start a 1-on-1 or group call.' },
                  { q: 'How do 24-hour Status updates work?', a: 'Navigate to Status tab to share images, videos or text updates that automatically expire after 24 hours.' },
                ].map((faq, idx) => (
                  <div key={idx} className="bg-gray-50 dark:bg-[#1a2329] rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                      className="w-full flex justify-between items-center p-3 text-left font-medium text-xs text-gray-800 dark:text-gray-200"
                    >
                      <span>{faq.q}</span>
                      <FaChevronRight size={10} className={`transform transition-transform ${expandedFaq === idx ? 'rotate-90 text-blue-500' : 'text-gray-400'}`} />
                    </button>
                    {expandedFaq === idx && (
                      <div className="px-3 pb-3 pt-1 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800/60">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Contact Support Form */}
              <form onSubmit={handleSendSupport} className="bg-gray-50 dark:bg-[#1a2329] p-4 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase">Contact Support</h4>
                {supportSent && <p className="text-xs font-semibold text-teal-500">Thank you! Support ticket submitted successfully.</p>}
                <textarea
                  placeholder="Describe your issue or feedback..."
                  value={supportMessage}
                  onChange={e => setSupportMessage(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-gray-800 text-xs text-gray-800 dark:text-gray-200 outline-none border border-gray-200 dark:border-gray-700 resize-none"
                />
                <button
                  type="submit"
                  disabled={!supportMessage.trim()}
                  className="w-full py-2.5 rounded-xl bg-teal-500 text-white font-semibold text-xs hover:bg-teal-600 disabled:opacity-50 transition-colors"
                >
                  Submit Ticket
                </button>
              </form>

            </div>
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
