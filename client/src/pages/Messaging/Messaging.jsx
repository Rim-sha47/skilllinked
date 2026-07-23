import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaPaperPlane, FaPaperclip, FaEllipsisV, FaSearch, FaCircle,
  FaSmile, FaPhone, FaVideo, FaReply, FaTimes, FaTrash, FaCheck, FaCheckDouble,
  FaMicrophone, FaStop, FaImage, FaFileAlt
} from 'react-icons/fa';
import EmojiPicker from 'emoji-picker-react';
import {
  fetchChats, fetchMessages, sendMessage, deleteMessage, sendMedia,
  setActiveChat, setReplyingTo, clearReplyingTo, receiveMessage, removeMessage
} from '../../redux/slices/messagingSlice';
import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
let socket;

// ─── Helper: time display ────────────────────────────────────
const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Today';
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};

const getUserName = (user) => user?.fullName || user?.name || user?.username || 'User';
const getUserAvatar = (user) => user?.profilePicture || user?.avatar || null;

// ─── Avatar component ────────────────────────────────────────
const Avatar = ({ user, size = 'md', online }) => {
  const sizeClasses = { sm: 'w-8 h-8 text-xs', md: 'w-12 h-12 text-lg', lg: 'w-14 h-14 text-xl' };
  const avatarUrl = getUserAvatar(user);
  const name = getUserName(user);
  const colors = ['from-blue-400 to-blue-600', 'from-purple-400 to-purple-600', 'from-green-400 to-green-600', 'from-orange-400 to-orange-600', 'from-pink-400 to-pink-600', 'from-teal-400 to-teal-600'];
  const colorIdx = name.charCodeAt(0) % colors.length;

  return (
    <div className="relative flex-shrink-0">
      {avatarUrl ? (
        <img src={avatarUrl} alt={name} className={`${sizeClasses[size]} rounded-full object-cover shadow-sm`} />
      ) : (
        <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${colors[colorIdx]} text-white flex items-center justify-center font-bold shadow-sm`}>
          {name.charAt(0).toUpperCase()}
        </div>
      )}
      {online && (
        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-dark-bg rounded-full shadow-sm" />
      )}
    </div>
  );
};

// ─── Reply preview bar ───────────────────────────────────────
const ReplyPreview = ({ message, onCancel }) => (
  <motion.div
    initial={{ height: 0, opacity: 0 }}
    animate={{ height: 'auto', opacity: 1 }}
    exit={{ height: 0, opacity: 0 }}
    className="px-6 py-2 bg-primary/5 dark:bg-primary/10 border-l-4 border-primary flex items-center justify-between"
  >
    <div className="flex items-center gap-2 min-w-0">
      <FaReply className="text-primary flex-shrink-0" size={12} />
      <div className="min-w-0">
        <p className="text-xs font-bold text-primary truncate">
          {getUserName(message.sender)}
        </p>
        <p className="text-xs text-text-secondary dark:text-gray-400 truncate">{message.content}</p>
      </div>
    </div>
    <button onClick={onCancel} className="text-gray-400 hover:text-red-500 transition-colors ml-2 flex-shrink-0">
      <FaTimes size={14} />
    </button>
  </motion.div>
);

// ─── Single message bubble (WhatsApp style) ──────────────────
const MessageBubble = ({ msg, isMe, currentUserId, onReply, onDelete }) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`max-w-[75%] relative ${isMe ? 'ml-12' : 'mr-12'}`}>
        {/* Reply reference */}
        {msg.replyTo && (
          <div className={`mb-1 px-3 py-2 rounded-xl text-xs border-l-2 border-primary/50 ${
            isMe
              ? 'bg-white/20 text-white/80'
              : 'bg-gray-100 dark:bg-gray-800 text-text-secondary dark:text-gray-400'
          }`}>
            <span className="font-bold text-primary text-[10px]">{getUserName(msg.replyTo.sender)}</span>
            <p className="truncate mt-0.5">{msg.replyTo.content}</p>
          </div>
        )}

        {/* Bubble */}
        <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed font-medium shadow-sm relative ${
          isMe
            ? 'bg-gradient-to-r from-primary to-blue-600 text-white rounded-br-md'
            : 'bg-white dark:bg-dark-card text-text-primary dark:text-gray-200 rounded-bl-md border border-gray-100 dark:border-gray-700/50'
        }`}>
          {msg.isDeleted ? (
            <span className="italic opacity-60">This message was deleted</span>
          ) : (
            <>
              {msg.media && msg.media.url && (
                <div className="mb-2">
                  {msg.media.type === 'image' && <img src={msg.media.url} alt="Attachment" className="max-w-[200px] rounded-lg cursor-pointer hover:opacity-90" onClick={() => window.open(msg.media.url)} />}
                  {msg.media.type === 'video' && <video src={msg.media.url} controls className="max-w-[200px] rounded-lg" />}
                  {msg.media.type === 'voice' && <audio src={msg.media.url} controls className="w-48 h-8" />}
                  {msg.media.type === 'file' && <a href={msg.media.url} target="_blank" className="flex items-center gap-2 underline text-blue-200"><FaFileAlt /> Document</a>}
                </div>
              )}
              {msg.content}
            </>
          )}
          {/* Time + ticks */}
          <span className={`text-[10px] ml-3 inline-flex items-center gap-1 whitespace-nowrap ${isMe ? 'text-white/60' : 'text-gray-400'}`}>
            {formatTime(msg.createdAt)}
            {isMe && (
              msg.status === 'seen'
                ? <FaCheckDouble className="text-blue-300" size={10} />
                : <FaCheck size={10} />
            )}
          </span>
        </div>

        {/* Hover actions */}
        <AnimatePresence>
          {showActions && !msg.isDeleted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`absolute top-0 ${isMe ? '-left-16' : '-right-16'} flex gap-1`}
            >
              <button
                onClick={() => onReply(msg)}
                className="p-1.5 rounded-lg bg-white dark:bg-dark-card shadow-md text-gray-400 hover:text-primary transition-colors"
                title="Reply"
              >
                <FaReply size={11} />
              </button>
              {isMe && (
                <button
                  onClick={() => onDelete(msg._id)}
                  className="p-1.5 rounded-lg bg-white dark:bg-dark-card shadow-md text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete"
                >
                  <FaTrash size={11} />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// ─── Main Messaging Component ────────────────────────────────
const Messaging = () => {
  const dispatch = useDispatch();
  const { chats, activeChatId, messages, isLoadingChats, isLoadingMessages, isSending, replyingTo } = useSelector(state => state.messaging);
  const { user } = useSelector(state => state.auth);
  const [text, setText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);

  // Calling state
  const [callState, setCallState] = useState({ active: false, receiving: false, caller: null, type: null, accepted: false });
  
  // Tabs for Inbox vs Requests
  const [activeTab, setActiveTab] = useState('inbox');

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const activeChat = chats.find(c => c._id === activeChatId);
  const activeMsgs = messages[activeChatId] || [];

  // The other user in a 1-on-1 chat
  const otherUser = activeChat?.users?.find(u => (u._id || u) !== user?._id);

  // ─── Socket setup ────────────────────────────────────────
  useEffect(() => {
    if (!user?._id) return;
    socket = io(SOCKET_URL);
    socket.emit('setup', user);

    socket.on('connected', () => console.log('Socket connected for messaging'));
    socket.on('online users', (users) => setOnlineUsers(users));
    socket.on('user online', ({ userId, online }) => {
      setOnlineUsers(prev => online ? [...new Set([...prev, userId])] : prev.filter(id => id !== userId));
    });
    socket.on('message received', (msg) => {
      dispatch(receiveMessage(msg));
    });
    socket.on('typing', ({ room }) => {
      if (room === activeChatId) setIsTyping(true);
    });
    socket.on('stop typing', ({ room }) => {
      if (room === activeChatId) setIsTyping(false);
    });
    socket.on('message deleted', ({ messageId, chatId }) => {
      dispatch(removeMessage({ messageId, chatId }));
    });

    // Calling events
    socket.on('call-user', (data) => {
      setCallState({ active: false, receiving: true, caller: { id: data.from, name: data.name }, type: data.type, accepted: false });
    });
    socket.on('call-accepted', () => {
      setCallState(prev => ({ ...prev, accepted: true }));
    });
    socket.on('call-rejected', () => {
      setCallState({ active: false, receiving: false, caller: null, type: null, accepted: false });
      alert('Call rejected');
    });
    socket.on('call-ended', () => {
      setCallState({ active: false, receiving: false, caller: null, type: null, accepted: false });
    });

    return () => { socket.disconnect(); };
  }, [user?._id]);

  // ─── Load chats on mount ─────────────────────────────────
  useEffect(() => {
    if (user?._id) dispatch(fetchChats());
  }, [dispatch, user?._id]);

  // ─── Load messages when active chat changes ──────────────
  useEffect(() => {
    if (activeChatId) {
      dispatch(fetchMessages(activeChatId));
      socket?.emit('join chat', activeChatId);
    }
  }, [activeChatId, dispatch]);

  // ─── Auto scroll to bottom ───────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMsgs.length, isTyping]);

  // ─── Send handler ────────────────────────────────────────
  const handleSend = useCallback(() => {
    if (!text.trim() || !activeChatId) return;
    const payload = { chatId: activeChatId, content: text.trim(), replyTo: replyingTo?._id || null };
    dispatch(sendMessage(payload)).then((action) => {
      if (sendMessage.fulfilled.match(action)) {
        socket?.emit('new message', action.payload);
      }
    });
    setText('');
    socket?.emit('stop typing', activeChatId);
  }, [text, activeChatId, replyingTo, dispatch]);

  // ─── Typing handler ──────────────────────────────────────
  const handleTyping = (e) => {
    setText(e.target.value);
    if (!activeChatId) return;
    socket?.emit('typing', activeChatId);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit('stop typing', activeChatId);
    }, 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiClick = (emojiObj) => {
    setText((prev) => prev + emojiObj.emoji);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeChatId) return;
    
    let type = 'file';
    if (file.type.startsWith('image/')) type = 'image';
    if (file.type.startsWith('video/')) type = 'video';

    const formData = new FormData();
    formData.append('file', file);
    formData.append('chatId', activeChatId);
    if (replyingTo) formData.append('replyTo', replyingTo._id);
    formData.append('type', type);

    dispatch(sendMedia(formData)).then((action) => {
      if (sendMedia.fulfilled.match(action)) {
        socket?.emit('new message', action.payload);
      }
    });
    e.target.value = null; // reset
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = e => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Mic error:', error);
    }
  };

  const stopRecordingAndSend = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], 'voice-note.webm', { type: 'audio/webm' });
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('chatId', activeChatId);
        if (replyingTo) formData.append('replyTo', replyingTo._id);
        formData.append('type', 'voice');

        dispatch(sendMedia(formData)).then((action) => {
          if (sendMedia.fulfilled.match(action)) {
            socket?.emit('new message', action.payload);
          }
        });
        setIsRecording(false);
      };
      mediaRecorderRef.current.stop();
    }
  };

  const handleReply = (msg) => dispatch(setReplyingTo(msg));
  const handleDelete = (msgId) => {
    dispatch(deleteMessage(msgId));
    socket?.emit('message deleted', { messageId: msgId, chatId: activeChatId });
  };

  // ─── Calling Handlers ────────────────────────────────────
  const initiateCall = (type) => {
    if (!otherUser) return;
    setCallState({ active: true, receiving: false, caller: user, type, accepted: false });
    socket?.emit('call-user', {
      userToCall: otherUser._id || otherUser,
      from: user._id,
      name: user.name,
      type
    });
  };

  const acceptCall = () => {
    setCallState(prev => ({ ...prev, active: true, receiving: false, accepted: true }));
    socket?.emit('answer-call', { to: callState.caller.id });
  };

  const rejectCall = () => {
    socket?.emit('reject-call', { to: callState.caller.id });
    setCallState({ active: false, receiving: false, caller: null, type: null, accepted: false });
  };

  const endCall = () => {
    const toId = callState.receiving ? callState.caller?.id : (otherUser?._id || otherUser);
    socket?.emit('end-call', { to: toId });
    setCallState({ active: false, receiving: false, caller: null, type: null, accepted: false });
  };

  // ─── Group messages by date ──────────────────────────────
  const groupedMessages = [];
  let lastDate = '';
  activeMsgs.forEach((msg) => {
    const date = formatDate(msg.createdAt);
    if (date !== lastDate) {
      groupedMessages.push({ type: 'date', date });
      lastDate = date;
    }
    groupedMessages.push({ type: 'msg', msg });
  });

  const isConnection = (otherUserId) => {
    if (!user || !otherUserId) return false;
    const following = user.following || [];
    const followers = user.followers || [];
    return following.includes(otherUserId) || followers.includes(otherUserId);
  };

  const filteredChats = chats.filter(c => {
    const other = c.users?.find(u => (u._id || u) !== user?._id);
    const otherId = other?._id || other;
    
    // Check search query
    if (searchQuery.trim() && !getUserName(other).toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Check tabs (Inbox = Connections, Requests = Non-Connections)
    if (activeTab === 'inbox') return isConnection(otherId);
    if (activeTab === 'requests') return !isConnection(otherId);
    return true;
  });

  return (
    <div className="flex h-[calc(100vh-6rem)] rounded-3xl overflow-hidden bg-white/60 dark:bg-dark-card/60 backdrop-blur-2xl border border-white/40 dark:border-gray-700/50 shadow-glass dark:shadow-glass-dark">

      {/* ── Left: Contact List ── */}
      <div className="w-80 flex-shrink-0 border-r border-gray-200/50 dark:border-gray-700/50 flex flex-col bg-white/50 dark:bg-dark-bg/40 backdrop-blur-sm">
        <div className="p-5 border-b border-gray-200/50 dark:border-gray-700/50">
          <h2 className="text-2xl font-extrabold text-text-primary dark:text-white mb-4">Messages</h2>
          <div className="relative mb-4">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-100 dark:bg-dark-card border-none text-sm focus:ring-2 focus:ring-primary text-text-primary dark:text-white placeholder-gray-400 font-medium transition-all"
            />
          </div>

          {/* Tabs */}
          <div className="flex bg-gray-100 dark:bg-dark-card p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('inbox')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'inbox' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary' : 'text-gray-500 hover:text-text-primary dark:hover:text-white'}`}
            >
              Inbox
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'requests' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary' : 'text-gray-500 hover:text-text-primary dark:hover:text-white'}`}
            >
              Requests
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoadingChats ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-gray-400 text-sm font-medium">No conversations yet</p>
            </div>
          ) : (
            filteredChats.map((chat) => {
              const other = chat.users?.find(u => (u._id || u) !== user?._id);
              const otherId = other?._id || other;
              const isOnline = onlineUsers.includes(otherId);
              const latestMsg = chat.latestMessage;
              return (
                <motion.div
                  key={chat._id}
                  whileHover={{ x: 4 }}
                  onClick={() => dispatch(setActiveChat(chat._id))}
                  className={`p-4 flex items-center space-x-3 cursor-pointer transition-colors ${
                    activeChatId === chat._id
                      ? 'bg-primary/10 dark:bg-primary/10 border-r-2 border-primary'
                      : 'hover:bg-gray-50 dark:hover:bg-dark-card/60 border-r-2 border-transparent'
                  }`}
                >
                  <Avatar user={other} online={isOnline} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <p className="text-sm font-semibold text-text-primary dark:text-white truncate">
                        {getUserName(other)}
                      </p>
                      {latestMsg?.createdAt && (
                        <p className="text-[11px] text-gray-400 flex-shrink-0 ml-1">{formatTime(latestMsg.createdAt)}</p>
                      )}
                    </div>
                    {latestMsg && (
                      <p className="text-xs text-text-secondary dark:text-gray-500 truncate mt-0.5">
                        {latestMsg.sender?._id === user?._id ? 'You: ' : ''}{latestMsg.content || 'Attachment'}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Center: Chat Window ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {!activeChat ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-bold text-text-primary dark:text-white mb-2">Start a Conversation</h3>
              <p className="text-text-secondary dark:text-gray-400 text-sm">Select a chat or connect with someone to begin messaging</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50 flex justify-between items-center bg-white/70 dark:bg-dark-card/70 backdrop-blur-md">
              <div className="flex items-center space-x-4">
                <Avatar user={otherUser} online={onlineUsers.includes(otherUser?._id)} />
                <div>
                  <h2 className="text-base font-bold text-text-primary dark:text-white">{getUserName(otherUser)}</h2>
                  <p className={`text-xs font-semibold flex items-center ${onlineUsers.includes(otherUser?._id) ? 'text-green-500' : 'text-gray-400'}`}>
                    <FaCircle className="mr-1 w-1.5 h-1.5" />
                    {isTyping ? 'typing...' : onlineUsers.includes(otherUser?._id) ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <button onClick={() => initiateCall('audio')} className="p-2.5 rounded-xl text-gray-400 hover:text-primary hover:bg-primary/10 transition-all"><FaPhone /></button>
                <button onClick={() => initiateCall('video')} className="p-2.5 rounded-xl text-gray-400 hover:text-primary hover:bg-primary/10 transition-all"><FaVideo /></button>
                <button className="p-2.5 rounded-xl text-gray-400 hover:text-primary hover:bg-primary/10 transition-all"><FaEllipsisV /></button>
              </div>
            </div>

            {/* Calling Modals overlay */}
            <AnimatePresence>
              {(callState.active || callState.receiving) && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
                  <div className="bg-dark-card border border-gray-700 p-8 rounded-3xl shadow-2xl flex flex-col items-center min-w-[300px]">
                    <div className="w-24 h-24 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center text-4xl mb-4 relative">
                      {callState.type === 'video' ? <FaVideo className="text-white" /> : <FaPhone className="text-white" />}
                      {!callState.accepted && (
                        <motion.div className="absolute inset-0 rounded-full border-2 border-primary" animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} />
                      )}
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {callState.receiving && !callState.accepted ? 'Incoming Call' : callState.type === 'video' ? 'Video Call' : 'Audio Call'}
                    </h3>
                    <p className="text-gray-400 mb-8">{callState.caller?.name || getUserName(otherUser)}</p>
                    
                    <div className="flex gap-6">
                      {callState.receiving && !callState.accepted ? (
                        <>
                          <button onClick={rejectCall} className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-glow-red"><FaTimes size={20}/></button>
                          <button onClick={acceptCall} className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-white hover:bg-green-600 transition-colors shadow-glow-green"><FaPhone size={20}/></button>
                        </>
                      ) : (
                        <button onClick={endCall} className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-glow-red"><FaTimes size={20}/></button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-3 custom-scrollbar bg-gray-50/50 dark:bg-dark-bg/20">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
                </div>
              ) : (
                <>
                  {groupedMessages.map((item, idx) => {
                    if (item.type === 'date') {
                      return (
                        <div key={`date-${idx}`} className="flex justify-center my-4">
                          <span className="text-xs font-bold text-gray-400 bg-white dark:bg-dark-card px-4 py-1.5 rounded-full shadow-sm border border-gray-200/50 dark:border-gray-700/50">
                            {item.date}
                          </span>
                        </div>
                      );
                    }
                    const msg = item.msg;
                    const isMe = (msg.sender?._id || msg.sender) === user?._id;
                    return (
                      <MessageBubble
                        key={msg._id}
                        msg={msg}
                        isMe={isMe}
                        currentUserId={user?._id}
                        onReply={handleReply}
                        onDelete={handleDelete}
                      />
                    );
                  })}

                  {/* Typing indicator */}
                  {isTyping && (
                    <div className="flex items-center space-x-3">
                      <Avatar user={otherUser} size="sm" />
                      <div className="bg-white dark:bg-dark-card rounded-2xl rounded-bl-md px-5 py-3 shadow-sm border border-gray-200/50 dark:border-gray-700/50">
                        <div className="flex items-center space-x-1.5">
                          {[0, 1, 2].map(i => (
                            <motion.div
                              key={i}
                              className="w-2 h-2 rounded-full bg-gray-400"
                              animate={{ scale: [1, 1.4, 1] }}
                              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                            />
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
              {replyingTo && (
                <ReplyPreview message={replyingTo} onCancel={() => dispatch(clearReplyingTo())} />
              )}
            </AnimatePresence>

            {/* Input Area */}
            <div className="px-6 py-4 bg-white/70 dark:bg-dark-card/70 backdrop-blur-md border-t border-gray-200/50 dark:border-gray-700/50 relative">
              {showEmoji && (
                <div className="absolute bottom-20 left-6 z-50">
                  <EmojiPicker onEmojiClick={handleEmojiClick} theme="auto" />
                </div>
              )}
              <div className="flex items-center bg-gray-100 dark:bg-dark-bg rounded-2xl pl-4 pr-2 py-2 border border-transparent focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                
                <button onClick={() => setShowEmoji(!showEmoji)} className="text-gray-400 hover:text-primary transition-colors mr-3">
                  <FaSmile className="text-xl" />
                </button>
                
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                <button onClick={() => fileInputRef.current?.click()} className="text-gray-400 hover:text-primary transition-colors mr-3">
                  <FaPaperclip className="text-lg" />
                </button>
                
                <input
                  type="text"
                  placeholder={isRecording ? "Recording voice note..." : "Write a message..."}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium text-text-primary dark:text-white placeholder-gray-400 py-1"
                  value={text}
                  onChange={handleTyping}
                  onKeyDown={handleKeyDown}
                  disabled={isRecording}
                />
                
                {!text.trim() && !isRecording ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startRecording}
                    className="p-3 rounded-xl transition-all ml-2 bg-gray-200 dark:bg-gray-700 text-gray-500 hover:text-primary"
                  >
                    <FaMicrophone className="text-sm" />
                  </motion.button>
                ) : isRecording ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={stopRecordingAndSend}
                    className="p-3 rounded-xl transition-all ml-2 bg-red-500 text-white animate-pulse shadow-glow"
                  >
                    <FaStop className="text-sm" />
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSend}
                    className="p-3 rounded-xl transition-all ml-2 bg-gradient-to-r from-primary to-blue-600 text-white shadow-glow"
                    disabled={isSending}
                  >
                    <FaPaperPlane className="text-sm" />
                  </motion.button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Messaging;
