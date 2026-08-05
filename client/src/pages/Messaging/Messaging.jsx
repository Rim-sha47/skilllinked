import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaPaperPlane, FaPaperclip, FaEllipsisV, FaSearch, FaCircle,
  FaSmile, FaPhone, FaVideo, FaReply, FaTimes, FaTrash, FaCheck,
  FaCheckDouble, FaMicrophone, FaStop, FaFileAlt, FaUsers,
  FaUserPlus, FaSignOutAlt, FaEdit, FaBan, FaVolumeMute,
  FaVolumeUp, FaArchive, FaThumbtack, FaChevronDown, FaArrowLeft,
  FaCamera, FaUserMinus, FaCrown, FaCommentDots, FaRegCircle, FaCog, FaStar, FaBullhorn,
  FaCopy, FaShare, FaUser,
} from 'react-icons/fa';
import EmojiPicker from 'emoji-picker-react';
import {
  fetchChats, fetchMessages, sendMessage, deleteMessage, sendMedia,
  setActiveChat, setReplyingTo, clearReplyingTo, receiveMessage,
  removeMessage, updateMessageStatus, markChatSeen, updateGroupChat,
  pinChat, muteChat, archiveChat, blockUser, hideChat,
  createGroupChat, renameGroup, addGroupMember, removeGroupMember, leaveGroup,
  markMessagesSeen, setCurrentUserId,
  editMessage, deleteForMe, toggleStar, togglePin,
} from '../../redux/slices/messagingSlice';
import { setActiveTab as setSidebarTab, createCallRecord, fetchCallHistory } from '../../redux/slices/sidebarSlice';
import {
  StatusPanel, CommunitiesPanel, CallsPanel, StarredPanel, ArchivedPanel, SettingsPanel, ProfilePanel, MetaAIPanel,
} from './SidebarPanels';
import { CallModal } from './CallModal';
import { socket } from '../../services/socket';
import ChatSettings from '../../components/chat/ChatSettings';
import { LinkedDevicesModal, AdvertiseModal, BroadcastModal, CommunitiesModal, ListsModal } from '../../components/chat/MessagingActionModals';
import SkillLinkedAIChat from '../../components/chat/SkillLinkedAIChat';

// ─── Helpers ─────────────────────────────────────────────────
const formatTime = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
const formatDate = (d) => {
  if (!d) return '';
  const date = new Date(d);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return 'Today';
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};
const getUserName = (u) => u?.fullName || u?.name || u?.username || 'User';
const getUserAvatar = (u) => {
  const p = u?.profilePicture || u?.avatar || null;
  return p === 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg' ? null : p;
};

// ─── Avatar ──────────────────────────────────────────────────
const Avatar = ({ user, size = 'md', online, isGroup }) => {
  const sizes = { xs: 'w-7 h-7 text-[10px]', sm: 'w-8 h-8 text-xs', md: 'w-11 h-11 text-base', lg: 'w-14 h-14 text-xl' };
  const colors = ['from-blue-400 to-blue-600', 'from-purple-400 to-purple-600', 'from-emerald-400 to-emerald-600', 'from-orange-400 to-orange-600', 'from-pink-400 to-pink-600', 'from-teal-400 to-teal-600', 'from-rose-400 to-rose-600', 'from-indigo-400 to-indigo-600'];
  const name = isGroup ? (user?.chatName || 'G') : getUserName(user);
  const avatarUrl = isGroup ? null : getUserAvatar(user);
  const colorIdx = (name?.charCodeAt(0) || 0) % colors.length;

  return (
    <div className="relative flex-shrink-0">
      {avatarUrl ? (
        <img src={avatarUrl} alt={name} className={`${sizes[size]} rounded-full object-cover ring-2 ring-white/20`} />
      ) : (
        <div className={`${sizes[size]} rounded-full bg-gradient-to-br ${colors[colorIdx]} text-white flex items-center justify-center font-bold`}>
          {isGroup ? <FaUsers size={size === 'lg' ? 20 : size === 'md' ? 14 : 11} /> : name.charAt(0).toUpperCase()}
        </div>
      )}
      {online && !isGroup && (
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
      )}
    </div>
  );
};

// ─── Message Ticks ────────────────────────────────────────────
const MessageTicks = ({ status, isOnline }) => {
  if (status === 'seen') {
    return <FaCheckDouble className="text-blue-400" size={11} />;
  }
  if (status === 'delivered') {
    return <FaCheckDouble className="text-white/50" size={11} />;
  }
  // sent: single tick — gray if offline, lighter if sent
  return <FaCheck className={isOnline ? 'text-white/50' : 'text-white/30'} size={10} />;
};

// ─── Reply Preview ────────────────────────────────────────────
const ReplyPreview = ({ message, onCancel }) => (
  <motion.div
    initial={{ height: 0, opacity: 0 }}
    animate={{ height: 'auto', opacity: 1 }}
    exit={{ height: 0, opacity: 0 }}
    className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 flex items-center justify-between"
  >
    <div className="flex items-center gap-2 min-w-0">
      <FaReply className="text-blue-500 flex-shrink-0" size={11} />
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 truncate">{getUserName(message.sender)}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{message.content || 'Attachment'}</p>
      </div>
    </div>
    <button onClick={onCancel} className="text-gray-400 hover:text-red-500 transition-colors ml-2 flex-shrink-0 p-1">
      <FaTimes size={13} />
    </button>
  </motion.div>
);

// ─── Message Context Menu ─────────────────────────────────────
const MessageContextMenu = ({ msg, isMe, position, onClose, onReply, onEdit, onDeleteForMe, onDeleteForEveryone, onStar, onPin, onForward, onCopy, currentUserId }) => {
  const isStarred = msg.starredBy?.map(String).includes(currentUserId);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const items = [
    { icon: <FaReply size={12} />, label: 'Reply', action: () => { onReply(msg); onClose(); } },
    { icon: <FaShare size={12} />, label: 'Forward', action: () => { onForward(msg); onClose(); } },
    { icon: <FaCopy size={12} />, label: 'Copy', action: () => { onCopy(msg); onClose(); } },
    ...(isMe && !msg.isDeleted ? [{ icon: <FaEdit size={12} />, label: 'Edit', action: () => { onEdit(msg); onClose(); } }] : []),
    { icon: <FaStar size={12} className={isStarred ? 'text-yellow-500' : ''} />, label: isStarred ? 'Unstar' : 'Star', action: () => { onStar(msg._id); onClose(); } },
    { icon: <FaThumbtack size={12} className={msg.isPinned ? 'text-blue-500' : ''} />, label: msg.isPinned ? 'Unpin' : 'Pin', action: () => { onPin(msg._id); onClose(); } },
    { divider: true },
    { icon: <FaTrash size={12} />, label: 'Delete for me', action: () => { onDeleteForMe(msg._id); onClose(); }, danger: true },
    ...(isMe && !msg.isDeleted ? [{ icon: <FaTrash size={12} />, label: 'Delete for everyone', action: () => { onDeleteForEveryone(msg._id); onClose(); }, danger: true }] : []),
  ];

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.1 }}
      style={{ top: position.y, left: position.x }}
      className="fixed bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 py-1.5 z-[100] min-w-[180px] overflow-hidden"
    >
      {items.map((item, i) =>
        item.divider ? (
          <div key={`div-${i}`} className="h-px bg-gray-100 dark:bg-gray-700 my-1" />
        ) : (
          <button
            key={i}
            onClick={item.action}
            className={`w-full px-4 py-2 flex items-center gap-3 text-[13px] font-medium transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${item.danger ? 'text-red-500' : 'text-gray-700 dark:text-gray-200'}`}
          >
            {item.icon}
            {item.label}
          </button>
        )
      )}
    </motion.div>
  );
};

// ─── Highlight helper ─────────────────────────────────────────
const HighlightedText = ({ text, query }) => {
  if (!query || !text) return <span>{text}</span>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} style={{ background: '#fbbf24', color: '#111', borderRadius: '3px', padding: '0 2px' }}>{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

// ─── Message Bubble ───────────────────────────────────────────
const MessageBubble = ({ msg, isMe, onReply, onDelete, onDeleteForMe, onEdit, onStar, onPin, onForward, onCopy, isOnline, isGroup, currentUserId, searchHighlight }) => {
  const [showActions, setShowActions] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const deleted = msg.isDeleted;
  const isStarred = msg.starredBy?.map(String).includes(currentUserId);

  const handleContextMenu = (e) => {
    e.preventDefault();
    if (deleted) return;
    setContextMenu({ x: Math.min(e.clientX, window.innerWidth - 200), y: Math.min(e.clientY, window.innerHeight - 300) });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={`flex ${isMe ? 'justify-end' : 'justify-start'} group mb-1`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); }}
      onContextMenu={handleContextMenu}
    >
      {!isMe && isGroup && (
        <Avatar user={msg.sender} size="xs" className="mr-1 mt-1 flex-shrink-0" />
      )}
      <div className={`max-w-[72%] relative ${isMe ? 'ml-8' : 'mr-8'}`}>
        {/* Sender name in group chat */}
        {!isMe && isGroup && (
          <p className="text-[10px] font-bold text-blue-500 mb-0.5 ml-1">{getUserName(msg.sender)}</p>
        )}

        {/* Reply reference */}
        {msg.replyTo && (
          <div className={`mb-1 px-3 py-1.5 rounded-xl text-[11px] border-l-2 border-blue-400 ${
            isMe ? 'bg-white/20 text-white/80' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
          }`}>
            <span className="font-bold text-blue-400 text-[10px] block">{getUserName(msg.replyTo.sender)}</span>
            <span className="truncate block">{msg.replyTo.content || 'Attachment'}</span>
          </div>
        )}

        {/* Bubble */}
        <div className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm relative ${
          isMe
            ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-br-sm'
            : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-sm border border-gray-100 dark:border-gray-700'
        }`}>
          {deleted ? (
            <span className="italic opacity-50 text-[13px]">🚫 This message was deleted</span>
          ) : (
            <>
              {/* Media */}
              {msg.media?.url && (
                <div className="mb-1.5">
                  {msg.media.type === 'image' && (
                    <img src={msg.media.url} alt="img" className="max-w-[220px] rounded-xl cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(msg.media.url)} />
                  )}
                  {msg.media.type === 'video' && <video src={msg.media.url} controls className="max-w-[220px] rounded-xl" />}
                  {msg.media.type === 'voice' && <audio src={msg.media.url} controls className="w-52 h-8" />}
                  {msg.media.type === 'file' && (
                    <a href={msg.media.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-200 hover:underline text-[13px]">
                      <FaFileAlt /> Document
                    </a>
                  )}
                </div>
              )}
              {/* Attachments array */}
              {msg.attachments?.length > 0 && (
                <div className="mb-1.5 space-y-1.5">
                  {msg.attachments.map((att, i) => (
                    <div key={i}>
                      {att.type === 'image' && <img src={att.url} alt="" className="max-w-[220px] rounded-xl cursor-pointer hover:opacity-90" onClick={() => window.open(att.url)} />}
                      {att.type === 'video' && <video src={att.url} controls className="max-w-[220px] rounded-xl" />}
                      {att.type === 'audio' && <audio src={att.url} controls className="w-52 h-8" />}
                      {att.type === 'document' && (
                        <a href={att.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-200 hover:underline text-[13px]">
                          <FaFileAlt /> {att.name || 'Document'}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {msg.content && (
                searchHighlight ? (
                  <HighlightedText text={msg.content} query={searchHighlight} />
                ) : (
                  <span>{msg.content}</span>
                )
              )}
            </>
          )}

          {/* Time + ticks + indicators */}
          <span className={`text-[10px] ml-2 inline-flex items-center gap-1 whitespace-nowrap float-right mt-1 ${isMe ? 'text-white/60' : 'text-gray-400'}`}>
            {isStarred && <FaStar className="text-yellow-400" size={8} />}
            {msg.isEdited && <span className="italic">edited</span>}
            {formatTime(msg.createdAt)}
            {isMe && !deleted && <MessageTicks status={msg.status} isOnline={isOnline} />}
          </span>
          <div className="clear-both" />
        </div>

        {/* Hover actions */}
        <AnimatePresence>
          {showActions && !deleted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.1 }}
              className={`absolute -top-1 ${isMe ? '-left-20' : '-right-20'} flex gap-1 z-10`}
            >
              <button onClick={() => onReply(msg)} className="p-1.5 rounded-lg bg-white dark:bg-gray-800 shadow text-gray-400 hover:text-blue-500 transition-colors" title="Reply">
                <FaReply size={10} />
              </button>
              <button onClick={() => onStar(msg._id)} className={`p-1.5 rounded-lg bg-white dark:bg-gray-800 shadow transition-colors ${isStarred ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`} title="Star">
                <FaStar size={10} />
              </button>
              <button onClick={(e) => handleContextMenu(e)} className="p-1.5 rounded-lg bg-white dark:bg-gray-800 shadow text-gray-400 hover:text-gray-600 transition-colors" title="More">
                <FaChevronDown size={10} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Context Menu */}
        <AnimatePresence>
          {contextMenu && (
            <MessageContextMenu
              msg={msg}
              isMe={isMe}
              position={contextMenu}
              onClose={() => setContextMenu(null)}
              onReply={onReply}
              onEdit={onEdit}
              onDeleteForMe={onDeleteForMe}
              onDeleteForEveryone={onDelete}
              onStar={onStar}
              onPin={onPin}
              onForward={onForward}
              onCopy={onCopy}
              currentUserId={currentUserId}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// ─── Chat Options Dropdown ────────────────────────────────────
const ChatOptionsMenu = ({ chat, currentUserId, onClose, dispatch }) => {
  const isPinned = chat.pinnedBy?.map(String).includes(currentUserId);
  const isMuted = chat.mutedBy?.map(String).includes(currentUserId);
  const isArchived = chat.archivedBy?.map(String).includes(currentUserId);
  const otherUser = chat.users?.find(u => (u._id || u).toString() !== currentUserId);
  const otherUserId = otherUser?._id || otherUser;

  const handle = (thunk) => { dispatch(thunk); onClose(); };

  const menuItems = [
    {
      icon: <FaThumbtack className={isPinned ? 'text-blue-500' : ''} size={13} />,
      label: isPinned ? 'Unpin Chat' : 'Pin Chat',
      action: () => handle(pinChat(chat._id)),
    },
    {
      icon: isMuted ? <FaVolumeUp size={13} /> : <FaVolumeMute size={13} />,
      label: isMuted ? 'Unmute' : 'Mute',
      action: () => handle(muteChat(chat._id)),
    },
    {
      icon: <FaArchive size={13} />,
      label: isArchived ? 'Unarchive' : 'Archive',
      action: () => handle(archiveChat(chat._id)),
    },
    ...(!chat.isGroupChat && otherUserId ? [{
      icon: <FaBan size={13} className="text-red-500" />,
      label: 'Block User',
      action: () => { if (window.confirm('Block this user?')) handle(blockUser(otherUserId)); },
      danger: true,
    }] : []),
    {
      icon: <FaTrash size={13} className="text-red-500" />,
      label: 'Delete Chat',
      action: () => { if (window.confirm('Delete this chat?')) handle(hideChat(chat._id)); },
      danger: true,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -8 }}
      transition={{ duration: 0.12 }}
      className="absolute right-0 top-8 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 py-2 z-50 w-48 overflow-hidden"
    >
      {menuItems.map((item, i) => (
        <button
          key={i}
          onClick={item.action}
          className={`w-full px-4 py-2.5 flex items-center gap-3 text-sm font-medium transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${item.danger ? 'text-red-500' : 'text-gray-700 dark:text-gray-200'}`}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </motion.div>
  );
};

// ─── Create Group Modal ───────────────────────────────────────
const CreateGroupModal = ({ allUsers, currentUserId, onClose, dispatch }) => {
  const [groupName, setGroupName] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  const filtered = allUsers.filter(u => {
    const uid = u._id?.toString() || u.toString();
    return uid !== currentUserId && getUserName(u).toLowerCase().includes(search.toLowerCase());
  });

  const toggleUser = (u) => {
    const uid = u._id?.toString();
    setSelected(prev => prev.find(x => x._id?.toString() === uid) ? prev.filter(x => x._id?.toString() !== uid) : [...prev, u]);
  };

  const handleCreate = async () => {
    if (!groupName.trim() || selected.length < 2) return;
    setLoading(true);
    await dispatch(createGroupChat({ name: groupName.trim(), users: selected.map(u => u._id) }));
    setLoading(false);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-700 px-6 py-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-white text-lg font-bold flex items-center gap-2"><FaUsers /> New Group</h2>
            <button onClick={onClose} className="text-white/70 hover:text-white p-1"><FaTimes /></button>
          </div>
          <p className="text-blue-100 text-xs">Add at least 2 members to create a group</p>
        </div>

        <div className="p-5 space-y-4">
          {/* Group name */}
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Group Name</label>
            <input
              type="text"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              placeholder="Enter group name..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm font-medium text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Search users */}
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Add Members</label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search people..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Selected chips */}
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selected.map(u => (
                <div key={u._id} className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-medium px-2.5 py-1 rounded-full">
                  {getUserName(u)}
                  <button onClick={() => toggleUser(u)} className="ml-1 hover:text-red-500"><FaTimes size={9} /></button>
                </div>
              ))}
            </div>
          )}

          {/* User list */}
          <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1">
            {filtered.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-4">No users found</p>
            ) : filtered.map(u => {
              const isSelected = selected.find(x => x._id?.toString() === u._id?.toString());
              return (
                <button
                  key={u._id}
                  onClick={() => toggleUser(u)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                  <Avatar user={u} size="sm" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200 flex-1 text-left">{getUserName(u)}</span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-600'}`}>
                    {isSelected && <FaCheck size={9} className="text-white" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Create button */}
          <button
            onClick={handleCreate}
            disabled={!groupName.trim() || selected.length < 2 || loading}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-blue-500/30"
          >
            {loading ? 'Creating...' : `Create Group (${selected.length} members)`}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Group Info Panel ─────────────────────────────────────────
const GroupInfoPanel = ({ chat, currentUserId, onClose, dispatch }) => {
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(chat.chatName || '');
  const isAdmin = chat.groupAdmin?._id?.toString() === currentUserId || chat.groupAdmin?.toString() === currentUserId;

  const handleRename = () => {
    if (newName.trim()) dispatch(renameGroup({ chatId: chat._id, name: newName.trim() }));
    setRenaming(false);
  };

  const handleRemove = (userId) => {
    if (window.confirm('Remove this member?')) dispatch(removeGroupMember({ chatId: chat._id, userId }));
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="absolute right-0 top-0 h-full w-full sm:w-72 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 z-40 shadow-2xl flex flex-col"
    >
      <div className="bg-gradient-to-r from-blue-500 to-blue-700 px-4 py-5">
        <div className="flex items-center justify-between mb-3">
          <button onClick={onClose} className="text-white/70 hover:text-white"><FaArrowLeft /></button>
          <h3 className="text-white font-bold">Group Info</h3>
          <div />
        </div>
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-2">
            <FaUsers className="text-white" size={24} />
          </div>
          {renaming ? (
            <div className="flex items-center gap-2">
              <input value={newName} onChange={e => setNewName(e.target.value)} className="px-2 py-1 rounded-lg text-sm text-gray-800 outline-none" />
              <button onClick={handleRename} className="text-white"><FaCheck size={12} /></button>
              <button onClick={() => setRenaming(false)} className="text-white/70"><FaTimes size={12} /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-white font-bold text-base">{chat.chatName}</p>
              {isAdmin && <button onClick={() => setRenaming(true)} className="text-white/70 hover:text-white"><FaEdit size={12} /></button>}
            </div>
          )}
          <p className="text-blue-100 text-xs mt-1">{chat.users?.length} members</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 px-2 mb-2">{chat.users?.length} MEMBERS</p>
        {chat.users?.map(u => {
          const uid = u._id?.toString() || u.toString();
          const isGroupAdmin = (chat.groupAdmin?._id || chat.groupAdmin)?.toString() === uid;
          const isCurrentUser = uid === currentUserId;
          return (
            <div key={uid} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 group">
              <Avatar user={u} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                  {isCurrentUser ? 'You' : getUserName(u)}
                </p>
                {isGroupAdmin && <p className="text-[10px] text-blue-500 font-bold flex items-center gap-1"><FaCrown size={8} /> Admin</p>}
              </div>
              {isAdmin && !isCurrentUser && !isGroupAdmin && (
                <button onClick={() => handleRemove(uid)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-1 transition-all">
                  <FaUserMinus size={12} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-3 border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={() => { if (window.confirm('Leave this group?')) { dispatch(leaveGroup(chat._id)); onClose(); } }}
          className="w-full py-2.5 flex items-center justify-center gap-2 text-red-500 font-semibold text-sm hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
        >
          <FaSignOutAlt size={13} /> Leave Group
        </button>
      </div>
    </motion.div>
  );
};

// ─── Main Messaging Component ─────────────────────────────────
const Messaging = () => {
  const dispatch = useDispatch();
  const { chats, activeChatId, messages, isLoadingChats, isLoadingMessages, isSending, replyingTo, currentUserId, pagination } = useSelector(s => s.messaging);
  const { user } = useSelector(s => s.auth);
  const { activeTab: sidebarTab } = useSelector(s => s.sidebar);

  const chatSettings = useSelector(s => s.chatSettings);
  const globalSettings = chatSettings?.global || {};
  const perChatSettings = chatSettings?.perChat?.find(pc => pc.chatId === activeChatId) || {};
  const currentSettings = { ...globalSettings, ...perChatSettings };

  const [text, setText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [activeTab, setActiveTab] = useState('inbox');   // inbox | archived (for sub-filter inside chats)
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [chatMenuOpen, setChatMenuOpen] = useState(null);  // chatId of open menu
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [sidebarMenuOpen, setSidebarMenuOpen] = useState(false);
  const [callState, setCallState] = useState({ active: false, receiving: false, caller: null, type: null, accepted: false });
  const [editingMessage, setEditingMessage] = useState(null); // message being edited
  const [showUserProfile, setShowUserProfile] = useState(false); // profile panel
  const [activeActionModal, setActiveActionModal] = useState(null); // 'advertise' | 'broadcast' | 'communities' | 'lists' | 'devices'
  const [forwardingMessage, setForwardingMessage] = useState(null); // for forward modal
  const [selectedFiles, setSelectedFiles] = useState([]); // multiple attachments
  const [inChatSearch, setInChatSearch] = useState(false); // in-chat message search toggle
  const [inChatQuery, setInChatQuery] = useState(''); // in-chat search query
  const inChatSearchRef = useRef(null);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const activeChat = chats.find(c => c._id === activeChatId);
  const activeMsgs = messages[activeChatId] || [];
  const pinnedMessages = activeMsgs.filter(m => m.isPinned && !m.isDeleted);
  const isGroupChat = activeChat?.isGroupChat;
  const otherUser = isGroupChat ? null : activeChat?.users?.find(u => (u._id || u).toString() !== user?._id);
  const isOtherOnline = otherUser ? onlineUsers.includes(otherUser?._id?.toString() || otherUser?.toString()) : false;

  // All unique users from chats (for group creation)
  const allUsersFromChats = [...new Map(
    chats.flatMap(c => c.users || []).filter(u => {
      const uid = u._id?.toString() || u.toString();
      return uid !== user?._id;
    }).map(u => [u._id?.toString() || u.toString(), u])
  ).values()];

  // ─── Sync currentUserId to Redux ────────────────────────
  useEffect(() => {
    if (user?._id && currentUserId !== user._id) {
      dispatch(setCurrentUserId(user._id));
    }
  }, [user?._id]);

  // ─── Socket events ───────────────────────────────────────
  useEffect(() => {
    if (!socket.connected) return;

    socket.on('online users', (users) => setOnlineUsers(users.map(String)));
    socket.on('user online', ({ userId, online }) => {
      setOnlineUsers(prev => online ? [...new Set([...prev, userId.toString()])] : prev.filter(id => id !== userId.toString()));
    });
    socket.on('typing', ({ room }) => { if (room === activeChatId) setIsTyping(true); });
    socket.on('stop typing', ({ room }) => { if (room === activeChatId) setIsTyping(false); });

    // Real-time tick: delivered
    socket.on('message status update', ({ messageId, chatId, status }) => {
      dispatch(updateMessageStatus({ messageId, chatId, status }));
    });

    // Real-time tick: seen (blue ticks for sender)
    socket.on('messages seen', ({ chatId }) => {
      dispatch(markChatSeen(chatId));
    });

    // Message deleted (for everyone)
    socket.on('message deleted', ({ messageId, chatId }) => {
      // Create a dummy payload to use existing reducer logic or we can add a specific action.
      // Wait, let's dispatch fetchMessages or specific action if we had one.
      // Easiest is to dispatch a local action or just re-fetch. But re-fetching jumps pagination.
      // Actually, updating the state in redux directly would be better.
      dispatch({ type: 'messaging/messageDeleted', payload: { messageId, chatId } });
    });

    // Message updated
    socket.on('message updated', (message) => {
      dispatch({ type: 'messaging/editMessage/fulfilled', payload: message });
    });

    // Message pinned
    socket.on('message pinned', (message) => {
      dispatch({ type: 'messaging/togglePin/fulfilled', payload: message });
    });

    // Group updated
    socket.on('group updated', (updatedChat) => {
      dispatch(updateGroupChat(updatedChat));
    });

    // Calling (1-on-1 & Group)
    socket.on('call-user', (data) => {
      setCallState({ active: false, receiving: true, caller: { _id: data.from, fullName: data.name }, type: data.type, accepted: false, isGroup: false });
    });
    socket.on('call-accepted', () => setCallState(prev => ({ ...prev, accepted: true })));
    socket.on('call-rejected', () => { setCallState({ active: false, receiving: false, caller: null, type: null, accepted: false }); alert('Call rejected'); });
    socket.on('call-ended', () => setCallState({ active: false, receiving: false, caller: null, type: null, accepted: false }));

    socket.on('group-call-incoming', (data) => {
      setCallState({ active: false, receiving: true, caller: data.caller, type: data.type, accepted: false, isGroup: true, chatName: data.chatName });
    });

    return () => {
      socket.off('online users');
      socket.off('user online');
      socket.off('typing');
      socket.off('stop typing');
      socket.off('message status update');
      socket.off('messages seen');
      socket.off('group updated');
      socket.off('call-user');
      socket.off('call-accepted');
      socket.off('call-rejected');
      socket.off('call-ended');
      socket.off('group-call-incoming');
    };
  }, [activeChatId]);

  // ─── Load chats ─────────────────────────────────────────
  useEffect(() => {
    if (user?._id) {
      // Always fetch chats — if activeChatId was pre-set from profile nav, it will auto-open
      dispatch(fetchChats());
    }
  }, [user?._id]);

  // ─── When chats load and activeChatId is set, fetch messages ──
  useEffect(() => {
    if (activeChatId && chats.length > 0) {
      // Verify the active chat exists in the loaded list
      const chatExists = chats.find(c => c._id === activeChatId);
      if (chatExists) {
        dispatch(fetchMessages({ chatId: activeChatId, page: 1, limit: 50 }));
        socket?.emit('join chat', activeChatId);
      }
    }
  }, [activeChatId, chats.length]);

  // ─── Mark seen when chat is opened ──────────────────────
  useEffect(() => {
    if (!activeChatId || !activeMsgs.length) return;
    const hasUnread = activeMsgs.some(m => (m.sender?._id || m.sender)?.toString() !== user?._id && m.status !== 'seen');
    if (hasUnread) {
      dispatch(markMessagesSeen(activeChatId));
      // Notify sender of blue ticks for each unique sender
      const senders = [...new Set(activeMsgs.filter(m => (m.sender?._id || m.sender)?.toString() !== user?._id).map(m => (m.sender?._id || m.sender)?.toString()))];
      senders.forEach(senderId => {
        socket?.emit('mark seen', { chatId: activeChatId, senderId });
      });
      socket?.emit('messages read', { chatId: activeChatId, userId: user?._id });
    }
  }, [activeChatId, activeMsgs.length]);

  // ─── Auto scroll ────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMsgs.length, isTyping]);

  const handleEditSubmit = useCallback(() => {
    if (!editingMessage || !text.trim()) return;
    dispatch(editMessage({ messageId: editingMessage._id, content: text.trim() }))
      .then(action => {
        if (editMessage.fulfilled.match(action)) socket?.emit('message updated', action.payload);
      });
    setEditingMessage(null);
    setText('');
  }, [editingMessage, text, dispatch, socket]);

  // ─── Send message ────────────────────────────────────────
  const handleSend = useCallback(async () => {
    if (!text.trim() && selectedFiles.length === 0) return;
    if (!activeChatId) return;

    if (editingMessage) {
      handleEditSubmit();
      return;
    }

    // Send files if any
    if (selectedFiles.length > 0) {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        let type = 'file';
        if (file.type.startsWith('image/')) type = 'image';
        if (file.type.startsWith('video/')) type = 'video';
        const formData = new FormData();
        formData.append('file', file);
        formData.append('chatId', activeChatId);
        if (replyingTo && i === 0) formData.append('replyTo', replyingTo._id);
        formData.append('type', type);
        // Only attach caption to the first file if provided
        if (text.trim() && i === selectedFiles.length - 1) {
          // Send text as a separate message or wait, maybe just let the text send afterwards.
          // In this simple loop we just send the file.
        }
        await dispatch(sendMedia(formData)).then(action => {
          if (sendMedia.fulfilled.match(action)) socket?.emit('new message', action.payload);
        });
      }
      setSelectedFiles([]);
      if (!text.trim()) {
        dispatch(clearReplyingTo());
        return;
      }
    }

    if (text.trim()) {
      dispatch(sendMessage({ chatId: activeChatId, content: text.trim(), replyTo: replyingTo?._id || null }))
        .then(action => { if (sendMessage.fulfilled.match(action)) socket?.emit('new message', action.payload); });
      setText('');
      socket?.emit('stop typing', activeChatId);
      dispatch(clearReplyingTo());
    }
  }, [text, activeChatId, replyingTo, editingMessage, handleEditSubmit, selectedFiles, dispatch, socket]);

  const handleTyping = (e) => {
    setText(e.target.value);
    if (!activeChatId) return;
    socket?.emit('typing', activeChatId);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => socket?.emit('stop typing', activeChatId), 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    if (e.key === 'Escape' && editingMessage) { setEditingMessage(null); setText(''); }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0 || !activeChatId) return;
    setSelectedFiles(prev => [...prev, ...files]);
    e.target.value = null; // Reset input so same file can be selected again
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) { console.error('Mic error:', err); }
  };

  const stopRecordingAndSend = () => {
    if (!mediaRecorderRef.current || !isRecording) return;
    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const file = new File([blob], 'voice-note.webm', { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('file', file);
      formData.append('chatId', activeChatId);
      if (replyingTo) formData.append('replyTo', replyingTo._id);
      formData.append('type', 'voice');
      dispatch(sendMedia(formData)).then(action => {
        if (sendMedia.fulfilled.match(action)) socket?.emit('new message', action.payload);
      });
      setIsRecording(false);
    };
    mediaRecorderRef.current.stop();
  };

  const handleReply = (msg) => dispatch(setReplyingTo(msg));
  const handleDelete = (msgId) => {
    dispatch(deleteMessage(msgId));
    socket?.emit('message deleted', { messageId: msgId, chatId: activeChatId });
  };
  const handleDeleteForMe = (msgId) => {
    dispatch(deleteForMe(msgId));
  };
  const handleEdit = (msg) => {
    setEditingMessage(msg);
    setText(msg.content || '');
  };
  const handleStar = (msgId) => dispatch(toggleStar(msgId));
  const handlePin = (msgId) => {
    dispatch(togglePin(msgId)).then(action => {
      if (togglePin.fulfilled.match(action)) socket?.emit('message pinned', action.payload);
    });
  };
  const handleForward = (msg) => setForwardingMessage(msg);
  const handleForwardTo = (chatId) => {
    if (!forwardingMessage) return;
    dispatch(sendMessage({ chatId, content: forwardingMessage.content, replyTo: null }))
      .then(action => { if (sendMessage.fulfilled.match(action)) socket?.emit('new message', action.payload); });
    setForwardingMessage(null);
  };
  const handleCopy = (msg) => {
    if (msg.content) navigator.clipboard?.writeText(msg.content);
  };
  const loadMoreMessages = () => {
    const pag = pagination[activeChatId];
    if (pag?.hasMore && !isLoadingMessages) {
      dispatch(fetchMessages({ chatId: activeChatId, page: pag.page + 1, limit: 50 }));
    }
  };
  const handleMessagesScroll = (e) => {
    if (e.target.scrollTop === 0) loadMoreMessages();
  };

  // ─── Calling ─────────────────────────────────────────────
  const initiateCall = (type) => {
    if (isGroupChat) {
      initiateGroupCall(type);
      return;
    }
    if (!otherUser) return;
    const otherUserId = otherUser._id || otherUser;
    setCallState({ active: true, receiving: false, caller: otherUser, type, accepted: false, isGroup: false });
    socket?.emit('call-user', { userToCall: otherUserId, from: user._id, name: getUserName(user), type });
    // Log call record so it appears in calls panel
    dispatch(createCallRecord({ receiverId: otherUserId, type, chatId: activeChatId }));
    setTimeout(() => dispatch(fetchCallHistory()), 1500);
  };


  const initiateGroupCall = (type) => {
    if (!activeChat) return;
    setCallState({ active: true, receiving: false, caller: user, type, accepted: true, isGroup: true, chatName: activeChat.chatName });
    socket?.emit('group-call-initiate', { chatId: activeChat._id, caller: user, chatName: activeChat.chatName, type });
  };

  const acceptCall = () => {
    setCallState(prev => ({ ...prev, active: true, receiving: false, accepted: true }));
    if (callState.isGroup) {
      socket?.emit('group-call-join', { chatId: activeChatId, user });
    } else if (callState.caller) {
      socket?.emit('answer-call', { to: callState.caller._id || callState.caller.id });
    }
  };

  const rejectCall = () => {
    if (!callState.isGroup && callState.caller) {
      socket?.emit('reject-call', { to: callState.caller._id || callState.caller.id });
    }
    setCallState({ active: false, receiving: false, caller: null, type: null, accepted: false });
  };

  const endCall = () => {
    if (callState.isGroup) {
      socket?.emit('group-call-leave', { chatId: activeChatId, userId: user?._id });
    } else {
      const toId = callState.receiving ? (callState.caller?._id || callState.caller?.id) : (otherUser?._id || otherUser);
      socket?.emit('end-call', { to: toId });
    }
    setCallState({ active: false, receiving: false, caller: null, type: null, accepted: false });
  };

  // ─── Group by date (with in-chat search filter) ──────────
  const inChatQueryLower = inChatQuery.trim().toLowerCase();
  const filteredActiveMsgs = inChatQueryLower
    ? activeMsgs.filter(msg => msg.content && msg.content.toLowerCase().includes(inChatQueryLower))
    : activeMsgs;

  const groupedMessages = [];
  let lastDate = '';
  filteredActiveMsgs.forEach(msg => {
    const date = formatDate(msg.createdAt);
    if (date !== lastDate) { groupedMessages.push({ type: 'date', date }); lastDate = date; }
    groupedMessages.push({ type: 'msg', msg });
  });


  // ─── Filter chats by tab ─────────────────────────────────
  let filteredChats = chats.filter(c => {
    if (c.deletedBy?.map(String).includes(user?._id)) return false;
    const isArchived = c.archivedBy?.map(String).includes(user?._id);
    if (activeTab === 'archived') return isArchived;
    if (isArchived) return false;
    if (searchQuery.trim()) {
      const name = c.isGroupChat ? c.chatName : getUserName(c.users?.find(u => (u._id || u).toString() !== user?._id));
      if (!name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    }
    return true;
  });

  if (activeTab === 'inbox') {
    filteredChats = [
      {
        _id: 'skilllinked-ai',
        isGroupChat: false,
        isAIChat: true,
        users: [{ _id: 'ai', fullName: 'SkillLinked AI', headline: 'AI Assistant', profilePicture: null }],
        latestMessage: { content: 'How can I help you today?', createdAt: new Date().toISOString() },
        pinnedBy: [user?._id], // Always pinned
      },
      ...filteredChats
    ];
  }

  const archivedCount = chats.filter(c => c.archivedBy?.map(String).includes(user?._id)).length;

  // ─── Mobile view state ────────────────────────────────────
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);

  const handleSelectChat = (chatId) => {
    dispatch(setActiveChat(chatId));
    setChatMenuOpen(null);
    setShowChatOnMobile(true);
  };

  const handleBackToList = () => {
    setShowChatOnMobile(false);
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] overflow-hidden bg-white dark:bg-gray-900 md:rounded-2xl md:border md:border-gray-200/60 dark:md:border-gray-700/50 md:shadow-xl">

      {/* ── APP SIDEBAR (Bottom on Mobile, Left on Desktop) ── */}
      <div className={`
        flex md:flex-col w-full md:w-[64px] h-[60px] md:h-auto bg-gray-100 dark:bg-[#202c33] border-t md:border-t-0 md:border-r border-gray-200 dark:border-gray-700/60 py-2 md:py-4 px-4 md:px-0 items-center justify-between flex-shrink-0 z-20 order-last md:order-first
        ${showChatOnMobile ? 'hidden md:flex' : 'flex'}
      `}>
        {/* Top icons */}
        <div className="flex md:flex-col gap-1 md:gap-2 items-center w-full justify-around md:justify-start flex-1">
          {[
            { key: 'chats', icon: <FaCommentDots size={20} />, title: 'Chats' },
            { key: 'status', icon: <FaRegCircle size={20} />, title: 'Status' },
            { key: 'communities', icon: <FaUsers size={20} />, title: 'Communities' },
            { key: 'calls', icon: <FaPhone size={18} />, title: 'Calls', desktopOnly: true },
          ].map(item => (
            <button
              key={item.key}
              onClick={() => dispatch(setSidebarTab(item.key))}
              title={item.title}
              className={`p-2.5 rounded-xl transition-all ${item.desktopOnly ? 'hidden md:flex' : 'flex'} justify-center items-center ${
                sidebarTab === item.key
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
              }`}
            >
              {item.icon}
            </button>
          ))}
        </div>
        {/* Bottom icons */}
        <div className="hidden md:flex flex-col gap-2 items-center w-full pb-2">
          {[
            { key: 'starred', icon: <FaStar size={18} />, title: 'Starred Messages' },
            { key: 'archived', icon: <FaArchive size={17} />, title: 'Archived' },
            { key: 'settings', icon: <FaCog size={19} />, title: 'Settings' },
          ].map(item => (
            <button
              key={item.key}
              onClick={() => dispatch(setSidebarTab(item.key))}
              title={item.title}
              className={`p-2.5 rounded-xl transition-all w-full flex justify-center ${
                sidebarTab === item.key
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
              }`}
            >
              {item.icon}
            </button>
          ))}
          <div
            onClick={() => dispatch(setSidebarTab('profile'))}
            className={`cursor-pointer hover:opacity-80 transition-opacity mt-1 rounded-full p-0.5 ${
              sidebarTab === 'profile' ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <Avatar user={user} size="sm" />
          </div>
        </div>
      </div>

      {/* ── LEFT PANEL ── */}
      <div className={`
        w-full md:w-[320px] lg:w-[360px] flex-shrink-0 border-r border-gray-200 dark:border-gray-700/60 flex flex-col bg-white dark:bg-[#111b21] overflow-hidden relative
        ${showChatOnMobile ? 'hidden md:flex' : 'flex'}
      `}>
        {/* Non-chats panels */}
        <AnimatePresence mode="wait">
          {sidebarTab === 'status' && (
            <motion.div key="status" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex flex-col h-full">
              <StatusPanel onBack={() => dispatch(setSidebarTab('chats'))} />
            </motion.div>
          )}
          {sidebarTab === 'communities' && (
            <motion.div key="communities" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex flex-col h-full">
              <CommunitiesPanel
                onBack={() => dispatch(setSidebarTab('chats'))}
                onOpenChat={(chatId) => { handleSelectChat(chatId); dispatch(setSidebarTab('chats')); }}
                onCreateGroup={() => { setShowCreateGroup(true); }}
              />
            </motion.div>
          )}
          {sidebarTab === 'calls' && (
            <motion.div key="calls" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex flex-col h-full">
              <CallsPanel
                onBack={() => dispatch(setSidebarTab('chats'))}
                onCall={(otherUser, type) => {
                  const otherUserId = otherUser?._id || otherUser;
                  setCallState({ active: true, receiving: false, caller: null, type, accepted: false });
                  socket?.emit('call-user', { userToCall: otherUserId, signalData: null, from: user._id, name: getUserName(user), type });
                  // Log call record for the calls panel
                  dispatch(createCallRecord({ receiverId: otherUserId, type }));
                  setTimeout(() => dispatch(fetchCallHistory()), 1000);
                }}
                onOpenChat={(chatId) => { handleSelectChat(chatId); dispatch(setSidebarTab('chats')); }}
              />
            </motion.div>
          )}
          {sidebarTab === 'starred' && (
            <motion.div key="starred" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex flex-col h-full">
              <StarredPanel
                onBack={() => dispatch(setSidebarTab('chats'))}
                onOpenChat={(chatId) => { handleSelectChat(chatId); dispatch(setSidebarTab('chats')); }}
              />
            </motion.div>
          )}
          {sidebarTab === 'archived' && (
            <motion.div key="archived" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex flex-col h-full">
              <ArchivedPanel
                onBack={() => dispatch(setSidebarTab('chats'))}
                onOpenChat={(chatId) => { handleSelectChat(chatId); dispatch(setSidebarTab('chats')); }}
                user={user}
              />
            </motion.div>
          )}
          {sidebarTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex flex-col h-full">
              <SettingsPanel
                onBack={() => dispatch(setSidebarTab('chats'))}
                onNavigate={(tab) => dispatch(setSidebarTab(tab))}
              />
            </motion.div>
          )}
          {sidebarTab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex flex-col h-full">
              <ProfilePanel onBack={() => dispatch(setSidebarTab('chats'))} />
            </motion.div>
          )}
          {sidebarTab === 'metaai' && (
            <motion.div key="metaai" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex flex-col h-full">
              <MetaAIPanel onBack={() => dispatch(setSidebarTab('chats'))} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* CHATS tab (default) */}
        {sidebarTab === 'chats' && (
          <>
        {/* Header */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Chats</h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowCreateGroup(true)}
                className="p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="New Group"
              >
                <FaUsers size={16} />
              </button>
              <div className="relative">
                <button onClick={() => setSidebarMenuOpen(!sidebarMenuOpen)} className="p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="More">
                  <FaEllipsisV size={16} />
                </button>
                <AnimatePresence>
                  {sidebarMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: -8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -8 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 top-10 bg-white dark:bg-[#202c33] rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 py-2 z-50 w-48 overflow-hidden"
                    >
                      {[
                        { label: 'Advertise', onClick: () => { setSidebarMenuOpen(false); setActiveActionModal('advertise'); } },
                        { label: 'New group', onClick: () => { setSidebarMenuOpen(false); setShowCreateGroup(true); } },
                        { label: 'Business broadcasts', onClick: () => { setSidebarMenuOpen(false); setActiveActionModal('broadcast'); } },
                        { label: 'Communities', onClick: () => { setSidebarMenuOpen(false); setActiveActionModal('communities'); } },
                        { label: 'Lists', onClick: () => { setSidebarMenuOpen(false); setActiveActionModal('lists'); } },
                        { label: 'Linked devices', onClick: () => { setSidebarMenuOpen(false); setActiveActionModal('devices'); } },
                        { label: 'Starred messages', onClick: () => { setSidebarMenuOpen(false); dispatch(setSidebarTab('starred')); } },
                        { label: '🤖 SkillLinked AI', onClick: () => { setSidebarMenuOpen(false); dispatch(setSidebarTab('metaai')); } },
                        { label: 'Settings', onClick: () => { setSidebarMenuOpen(false); dispatch(setSidebarTab('settings')); } },
                      ].map((item, i) => (
                        <button
                          key={i}
                          onClick={item.onClick}
                          className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          {item.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
            <input
              type="text"
              placeholder="Search or start a new chat"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-100 dark:bg-[#202c33] text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 border-none focus:ring-1 focus:ring-blue-400 outline-none"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 pb-1">
            {[
              { key: 'inbox', label: 'All' },
              { key: 'archived', label: `Archived${archivedCount > 0 ? ` ${archivedCount}` : ''}` },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all ${
                  activeTab === tab.key
                    ? 'bg-blue-500 dark:bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-[#202c33] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar md:flex-auto">
          {isLoadingChats ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="text-5xl mb-4">{activeTab === 'archived' ? '📦' : '💬'}</div>
              <p className="text-gray-400 dark:text-gray-500 text-sm font-medium">
                {activeTab === 'archived' ? 'No archived chats' : 'No conversations yet'}
              </p>
            </div>
          ) : filteredChats.map(chat => {
            const isGroup = chat.isGroupChat;
            const other = isGroup ? null : chat.users?.find(u => (u._id || u).toString() !== user?._id);
            const otherId = other?._id?.toString() || other?.toString();
            const isOnline = !isGroup && onlineUsers.includes(otherId);
            const isPinned = chat.pinnedBy?.map(String).includes(user?._id);
            const isMuted = chat.mutedBy?.map(String).includes(user?._id);
            const latestMsg = chat.latestMessage;
            const isActive = activeChatId === chat._id;
            const latestTime = latestMsg?.createdAt;

            const timeLabel = (() => {
              if (!latestTime) return '';
              const d = new Date(latestTime);
              const now = new Date();
              if (d.toDateString() === now.toDateString()) return formatTime(latestTime);
              const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
              if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
              return d.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' });
            })();

            const showTicks = latestMsg && (latestMsg.sender?._id === user?._id || latestMsg.sender?.toString() === user?._id);

            return (
              <div key={chat._id} className="relative group">
                <div
                  onClick={() => handleSelectChat(chat._id)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-gray-50 dark:border-gray-800/60 hover:bg-gray-50 dark:hover:bg-[#202c33] ${
                    isActive ? 'bg-blue-50/70 dark:bg-[#2a3942]' : ''
                  }`}
                >
                  <Avatar user={isGroup ? chat : other} online={isOnline} isGroup={isGroup} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-[15px] font-medium text-gray-900 dark:text-gray-100 truncate flex-1 min-w-0">
                        {isGroup ? chat.chatName : getUserName(other)}
                      </p>
                      <span className="text-[11px] text-gray-400 dark:text-gray-500 ml-2 flex-shrink-0 whitespace-nowrap">
                        {timeLabel}
                      </span>
                    </div>
                    {!isGroup && other?.headline && (
                      <p className="text-[12px] text-gray-500/80 dark:text-gray-400/80 truncate mb-0.5">
                        {other.headline}
                      </p>
                    )}
                    <div className="flex items-center gap-1 mt-0.5">
                      {showTicks && !latestMsg?.isDeleted && (
                        <span className="flex-shrink-0">
                          {latestMsg.status === 'seen' ? (
                            <FaCheckDouble className="text-blue-500" size={12} />
                          ) : latestMsg.status === 'delivered' ? (
                            <FaCheckDouble className="text-gray-400" size={12} />
                          ) : (
                            <FaCheck className="text-gray-400" size={11} />
                          )}
                        </span>
                      )}
                      {isPinned && <FaThumbtack className="text-gray-400 dark:text-gray-500 flex-shrink-0" size={10} />}
                      {isMuted && <FaVolumeMute className="text-gray-400 dark:text-gray-500 flex-shrink-0" size={10} />}
                      <p className="text-[13px] text-gray-500 dark:text-gray-400 truncate flex-1">
                        {latestMsg ? (latestMsg.isDeleted ? '🚫 Deleted' : (latestMsg.content || '📎 Attachment')) : (
                          <span className="italic text-gray-400">No messages yet</span>
                        )}
                      </p>
                      {/* Unread indicator (simplified for visual representation) */}
                      {!showTicks && latestMsg && latestMsg.status !== 'seen' && (
                        <div className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0 ml-1"></div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={e => { e.stopPropagation(); setChatMenuOpen(chatMenuOpen === chat._id ? null : chat._id); }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all md:opacity-0 md:group-hover:opacity-100 flex-shrink-0"
                    title="Options"
                  >
                    <FaChevronDown size={11} />
                  </button>
                </div>

                <AnimatePresence>
                  {chatMenuOpen === chat._id && (
                    <div className="absolute right-3 top-12 z-50">
                      <ChatOptionsMenu chat={chat} currentUserId={user?._id} onClose={() => setChatMenuOpen(null)} dispatch={dispatch} />
                    </div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* WhatsApp style AI Button */}
        <button
          onClick={() => dispatch(setSidebarTab('metaai'))}
          className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-[0_4px_20px_rgba(168,85,247,0.4)] hover:shadow-[0_6px_25px_rgba(168,85,247,0.6)] hover:scale-105 transition-all z-40 border-2 border-white dark:border-gray-900"
          title="SkillLinked AI"
        >
          <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
          </svg>
        </button>
        </>
        )}
      </div>

      {/* ── RIGHT PANEL: Chat Window ── */}
      <div className={`
        flex-1 flex flex-col min-w-0 relative bg-[#efeae2] dark:bg-[#0b141a]
        ${showChatOnMobile ? 'flex' : 'hidden md:flex'}
      `}
      style={currentSettings.wallpaper ? {
        backgroundImage: `url(${currentSettings.wallpaper})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      } : {}}
      >
        {currentSettings.wallpaper && currentSettings.blur > 0 && (
          <div className="absolute inset-0 bg-white/20 dark:bg-black/20 pointer-events-none z-0" style={{ backdropFilter: `blur(${currentSettings.blur}px)` }}></div>
        )}
        {activeChatId === 'skilllinked-ai' ? (
          <SkillLinkedAIChat onBack={handleBackToList} />
        ) : !activeChat ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center px-6">
              <div className="w-[180px] h-[180px] mx-auto mb-6 flex items-center justify-center">
                <div className="text-8xl opacity-30">💬</div>
              </div>
              <h3 className="text-2xl font-light text-gray-600 dark:text-gray-300 mb-3">SkillLinked Messaging</h3>
              <p className="text-gray-400 dark:text-gray-500 text-sm max-w-sm mx-auto leading-relaxed">
                Send and receive messages. Start a conversation or create a group.
              </p>
              <button
                onClick={() => setShowCreateGroup(true)}
                className="mt-5 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl text-sm transition-all flex items-center gap-2 mx-auto"
              >
                <FaUsers size={13} /> Create Group
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="px-3 md:px-5 py-2.5 flex justify-between items-center bg-white dark:bg-[#202c33] border-b border-gray-200/60 dark:border-gray-700/40 flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <button
                  onClick={handleBackToList}
                  className="md:hidden p-1.5 -ml-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors flex-shrink-0"
                >
                  <FaArrowLeft size={16} />
                </button>
                <div
                  className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity min-w-0 flex-1"
                  onClick={() => isGroupChat ? setShowGroupInfo(true) : setShowUserProfile(true)}
                >
                  <Avatar user={isGroupChat ? activeChat : otherUser} online={isOtherOnline} isGroup={isGroupChat} />
                  <div className="min-w-0">
                    <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white truncate">
                      {isGroupChat ? activeChat.chatName : getUserName(otherUser)}
                    </h2>
                    <p className={`text-xs font-medium flex items-center gap-1 ${
                      isGroupChat ? 'text-gray-400 dark:text-gray-500' :
                      isTyping ? 'text-green-500' :
                      isOtherOnline ? 'text-green-500' : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      {isGroupChat ? (
                        `${activeChat.users?.length} members`
                      ) : isTyping ? (
                        'typing...'
                      ) : isOtherOnline ? (
                        <><FaCircle className="w-1.5 h-1.5" /> online</>
                      ) : (
                        'offline'
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-0.5 flex-shrink-0">
                <button
                  onClick={() => initiateCall('video')}
                  className="p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                  title={isGroupChat ? "Group Video Call" : "Video Call"}
                >
                  <FaVideo size={16} />
                </button>
                <button
                  onClick={() => initiateCall('audio')}
                  className="p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                  title={isGroupChat ? "Group Voice Call" : "Voice Call"}
                >
                  <FaPhone size={15} />
                </button>
                {isGroupChat && (
                  <button onClick={() => setShowGroupInfo(true)} className="p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all" title="Group Details">
                    <FaUsers size={16} />
                  </button>
                )}
                <button
                  onClick={() => {
                    setInChatSearch(prev => !prev);
                    setInChatQuery('');
                    if (!inChatSearch) setTimeout(() => inChatSearchRef.current?.focus(), 150);
                  }}
                  className={`p-2.5 rounded-xl transition-all ${
                    inChatSearch
                      ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  title="Search messages"
                >
                  <FaSearch size={15} />
                </button>
                <div className="relative">
                  <button
                    onClick={() => setHeaderMenuOpen(!headerMenuOpen)}
                    className="p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                  >
                    <FaEllipsisV size={15} />
                  </button>
                  <AnimatePresence>
                    {headerMenuOpen && (
                      <div className="absolute right-0 top-10 z-50">
                        <ChatOptionsMenu chat={activeChat} currentUserId={user?._id} onClose={() => setHeaderMenuOpen(false)} dispatch={dispatch} />
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Incoming Call Overlay */}
            <AnimatePresence>
              {(callState.active || callState.receiving) && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center backdrop-blur-sm">
                  <div className="bg-gray-900 border border-gray-700 p-8 rounded-3xl shadow-2xl flex flex-col items-center min-w-[260px] mx-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-3xl mb-4 relative">
                      {callState.type === 'video' ? <FaVideo className="text-white" /> : <FaPhone className="text-white" />}
                      {!callState.accepted && (
                        <motion.div className="absolute inset-0 rounded-full border-2 border-blue-400"
                          animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                          transition={{ repeat: Infinity, duration: 1.5 }} />
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      {callState.receiving && !callState.accepted ? 'Incoming Call' : callState.type === 'video' ? 'Video Call' : 'Audio Call'}
                    </h3>
                    <p className="text-gray-400 mb-6 text-sm">{callState.caller?.name || getUserName(otherUser)}</p>
                    <div className="flex gap-5">
                      {callState.receiving && !callState.accepted ? (
                        <>
                          <button onClick={rejectCall} className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"><FaTimes size={18} /></button>
                          <button onClick={acceptCall} className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-white hover:bg-green-600 transition-colors"><FaPhone size={18} /></button>
                        </>
                      ) : (
                        <button onClick={endCall} className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"><FaTimes size={18} /></button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pinned Messages Bar */}
            {pinnedMessages.length > 0 && (
              <div className="px-3 md:px-5 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-700/40 flex-shrink-0">
                <div className="flex items-center gap-2 text-[13px] text-yellow-700 dark:text-yellow-400">
                  <FaThumbtack size={11} />
                  <span className="font-semibold">{pinnedMessages.length} Pinned Message{pinnedMessages.length > 1 ? 's' : ''}</span>
                  <span className="text-yellow-600/60 dark:text-yellow-500/60 truncate ml-1">
                    — {pinnedMessages[pinnedMessages.length - 1]?.content || 'Attachment'}
                  </span>
                </div>
              </div>
            )}

            {/* In-Chat Search Bar */}
            <AnimatePresence>
              {inChatSearch && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: 'easeInOut' }}
                  className="overflow-hidden flex-shrink-0"
                >
                  <div className="px-3 md:px-5 py-2.5 bg-white dark:bg-[#1e2a35] border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
                    <FaSearch className="text-blue-500 flex-shrink-0" size={13} />
                    <input
                      ref={inChatSearchRef}
                      type="text"
                      value={inChatQuery}
                      onChange={e => setInChatQuery(e.target.value)}
                      placeholder="Search messages in this chat…"
                      className="flex-1 bg-transparent text-[13px] text-gray-800 dark:text-gray-100 placeholder-gray-400 outline-none"
                    />
                    {inChatQuery && (
                      <span className="text-[11px] text-gray-400 flex-shrink-0">
                        {filteredActiveMsgs.length} result{filteredActiveMsgs.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    {inChatQuery && (
                      <button
                        onClick={() => setInChatQuery('')}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors flex-shrink-0"
                      >
                        <FaTimes size={12} />
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto px-3 md:px-5 py-4 space-y-0.5 custom-scrollbar z-10"
              onClick={() => { setChatMenuOpen(null); setHeaderMenuOpen(false); setShowEmoji(false); setSidebarMenuOpen(false); }}
              onScroll={handleMessagesScroll}
            >
              {isLoadingMessages && activeMsgs.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
                </div>
              ) : (
                <>
                  {/* Load more indicator */}
                  {pagination[activeChatId]?.hasMore && (
                    <div className="flex justify-center py-2">
                      {isLoadingMessages ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500" />
                      ) : (
                        <button onClick={loadMoreMessages} className="text-xs text-blue-500 hover:text-blue-600 font-medium">
                          Load older messages
                        </button>
                      )}
                    </div>
                  )}

                  {groupedMessages.map((item, idx) => {
                    if (item.type === 'date') {
                      return (
                        <div key={`date-${idx}`} className="flex justify-center my-4">
                          <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 bg-white dark:bg-[#202c33] px-3 py-1 rounded-lg shadow-sm">
                            {item.date}
                          </span>
                        </div>
                      );
                    }
                    const msg = item.msg;
                    const isMe = (msg.sender?._id || msg.sender)?.toString() === user?._id;
                    return (
                      <MessageBubble
                        key={msg._id}
                        msg={msg}
                        isMe={isMe}
                        onReply={handleReply}
                        onDelete={handleDelete}
                        onDeleteForMe={handleDeleteForMe}
                        onEdit={handleEdit}
                        onStar={handleStar}
                        onPin={handlePin}
                        onForward={handleForward}
                        onCopy={handleCopy}
                        isOnline={isOtherOnline}
                        isGroup={isGroupChat}
                        currentUserId={user?._id}
                        searchHighlight={inChatQueryLower || ''}
                      />
                    );
                  })}

                  {isTyping && (
                    <div className="flex items-end gap-2 mt-2">
                      {!isGroupChat && <Avatar user={otherUser} size="xs" />}
                      <div className="bg-white dark:bg-[#202c33] rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
                        <div className="flex items-center gap-1">
                          {[0, 1, 2].map(i => (
                            <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400"
                              animate={{ scale: [1, 1.4, 1] }}
                              transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Reply Preview */}
            <AnimatePresence>
              {replyingTo && <ReplyPreview message={replyingTo} onCancel={() => dispatch(clearReplyingTo())} />}
            </AnimatePresence>

            {/* Edit Banner */}
            <AnimatePresence>
              {editingMessage && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FaEdit className="text-yellow-500 flex-shrink-0" size={11} />
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-yellow-600 dark:text-yellow-400">Editing message</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{editingMessage.content}</p>
                    </div>
                  </div>
                  <button onClick={() => { setEditingMessage(null); setText(''); }} className="text-gray-400 hover:text-red-500 transition-colors ml-2 flex-shrink-0 p-1">
                    <FaTimes size={13} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* File Previews */}
            <AnimatePresence>
              {selectedFiles.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 py-3 bg-gray-50 dark:bg-[#1a2329] border-t border-gray-200/50 dark:border-gray-700/40 flex gap-3 overflow-x-auto custom-scrollbar"
                >
                  {selectedFiles.map((file, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-800 flex-shrink-0 border border-gray-300 dark:border-gray-700">
                      {file.type.startsWith('image/') ? (
                        <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-1 text-gray-500">
                          <FaPaperclip size={18} />
                          <span className="text-[9px] truncate w-full text-center mt-1 font-medium">{file.name.split('.').pop()?.toUpperCase()}</span>
                        </div>
                      )}
                      <button
                        onClick={() => removeFile(i)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] hover:bg-red-600 transition-colors shadow-sm"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Area */}
            <div className="px-2 md:px-4 py-2 bg-white dark:bg-[#202c33] border-t border-gray-200/50 dark:border-gray-700/40 relative flex-shrink-0">
              {showEmoji && (
                <div className="absolute bottom-16 left-2 md:left-4 z-50">
                  <EmojiPicker onEmojiClick={(e) => setText(prev => prev + e.emoji)} theme="auto" height={320} width={300} />
                </div>
              )}
              <div className="flex items-center gap-1.5 md:gap-2">
                <button onClick={() => setShowEmoji(!showEmoji)} className="p-2 md:p-2.5 rounded-full text-gray-500 dark:text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0">
                  <FaSmile size={20} />
                </button>
                {!editingMessage && (
                  <>
                    <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileChange} />
                    <button onClick={() => fileInputRef.current?.click()} className="p-2 md:p-2.5 rounded-full text-gray-500 dark:text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0">
                      <FaPaperclip size={18} />
                    </button>
                  </>
                )}
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    placeholder={isRecording ? '🎙 Recording...' : editingMessage ? 'Edit message...' : selectedFiles.length > 0 ? 'Add a caption...' : 'Type a message'}
                    className={`w-full border-none rounded-lg px-4 py-2.5 text-sm text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-1 focus:ring-blue-400 outline-none ${
                      editingMessage ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-gray-100 dark:bg-[#2a3942]'
                    }`}
                    value={text}
                    onChange={handleTyping}
                    onKeyDown={handleKeyDown}
                    disabled={isRecording}
                  />
                </div>
                {!text.trim() && selectedFiles.length === 0 && !isRecording && !editingMessage ? (
                  <button onClick={startRecording} className="p-2.5 rounded-full text-gray-500 dark:text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0">
                    <FaMicrophone size={18} />
                  </button>
                ) : isRecording ? (
                  <motion.button
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    onClick={stopRecordingAndSend}
                    className="p-2.5 rounded-full bg-red-500 text-white flex-shrink-0"
                  >
                    <FaStop size={16} />
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.93 }}
                    onClick={handleSend}
                    disabled={isSending}
                    className={`p-2.5 rounded-full text-white transition-all flex-shrink-0 disabled:opacity-60 ${
                      editingMessage ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                  >
                    {editingMessage ? <FaCheck size={16} /> : <FaPaperPlane size={16} />}
                  </motion.button>
                )}
              </div>
            </div>
          </>
        )}

        {/* Group Info Side Panel */}
        <AnimatePresence>
          {showGroupInfo && isGroupChat && (
            <GroupInfoPanel chat={activeChat} currentUserId={user?._id} onClose={() => setShowGroupInfo(false)} dispatch={dispatch} />
          )}
        </AnimatePresence>

        {/* User Profile Side Panel */}
        <AnimatePresence>
          {showUserProfile && !isGroupChat && otherUser && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute right-0 top-0 h-full w-full sm:w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 z-40 shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-500 to-blue-700 px-4 py-5">
                <div className="flex items-center justify-between mb-4">
                  <button onClick={() => setShowUserProfile(false)} className="text-white/70 hover:text-white"><FaArrowLeft /></button>
                  <h3 className="text-white font-bold">Contact Info</h3>
                  <div />
                </div>
                <div className="flex flex-col items-center">
                  <Avatar user={otherUser} size="lg" online={isOtherOnline} />
                  <p className="text-white font-bold text-lg mt-3">{getUserName(otherUser)}</p>
                  {otherUser?.username && <p className="text-blue-100 text-xs">@{otherUser.username}</p>}
                  {otherUser?.headline && <p className="text-blue-200 text-xs mt-1 text-center">{otherUser.headline}</p>}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                {otherUser?.bio && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">About</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{otherUser.bio}</p>
                  </div>
                )}
                {otherUser?.email && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Email</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{otherUser.email}</p>
                  </div>
                )}
                {otherUser?.skills?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {otherUser.skills.slice(0, 10).map((skill, i) => (
                        <span key={i} className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">{typeof skill === 'string' ? skill : skill.name}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Create Group Modal */}
      <AnimatePresence>
        {showCreateGroup && (
          <CreateGroupModal allUsers={allUsersFromChats} currentUserId={user?._id} onClose={() => setShowCreateGroup(false)} dispatch={dispatch} />
        )}
      </AnimatePresence>

      {/* Action Modals */}
      <AdvertiseModal isOpen={activeActionModal === 'advertise'} onClose={() => setActiveActionModal(null)} />
      <BroadcastModal isOpen={activeActionModal === 'broadcast'} onClose={() => setActiveActionModal(null)} />
      <CommunitiesModal isOpen={activeActionModal === 'communities'} onClose={() => setActiveActionModal(null)} />
      <ListsModal isOpen={activeActionModal === 'lists'} onClose={() => setActiveActionModal(null)} />
      <LinkedDevicesModal isOpen={activeActionModal === 'devices'} onClose={() => setActiveActionModal(null)} />

      {/* Forward Message Modal */}
      <AnimatePresence>
        {forwardingMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setForwardingMessage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-500 to-blue-700 px-5 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-white font-bold flex items-center gap-2"><FaShare /> Forward Message</h2>
                  <button onClick={() => setForwardingMessage(null)} className="text-white/70 hover:text-white p-1"><FaTimes /></button>
                </div>
              </div>
              <div className="p-3 max-h-72 overflow-y-auto custom-scrollbar">
                {chats.filter(c => c._id !== activeChatId).map(chat => {
                  const isGroup = chat.isGroupChat;
                  const other = isGroup ? null : chat.users?.find(u => (u._id || u).toString() !== user?._id);
                  return (
                    <button
                      key={chat._id}
                      onClick={() => handleForwardTo(chat._id)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Avatar user={isGroup ? chat : other} isGroup={isGroup} size="sm" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{isGroup ? chat.chatName : getUserName(other)}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen WebRTC Call Modal (1-on-1 & Group Audio/Video) */}
      <CallModal
        callState={callState}
        onAccept={acceptCall}
        onReject={rejectCall}
        onEnd={endCall}
        socket={socket}
        currentUserId={user?._id}
      />
    </div>
  );
};

export default Messaging;
