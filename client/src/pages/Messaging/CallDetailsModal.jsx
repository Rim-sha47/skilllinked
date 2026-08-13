import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaPhone, FaVideo, FaComment, FaUser, FaTimes, FaTrash,
  FaThumbtack, FaArchive, FaSignal, FaShieldAlt, FaCalendarAlt,
  FaClock, FaHistory, FaCheckCircle,
} from 'react-icons/fa';

const getUserName = (u) => u?.fullName || u?.name || u?.username || 'User';
const getAvatar = (u) => {
  const p = u?.profilePicture || u?.avatar || null;
  return p === 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg' ? null : p;
};

export const CallDetailsModal = ({ call, currentUserId, onClose, onCall, onOpenChat, onDelete, onTogglePin, onToggleArchive }) => {
  if (!call) return null;

  const isMeCaller = (call.caller?._id || call.caller)?.toString() === currentUserId;
  const other = isMeCaller ? call.receiver : call.caller;
  const isVideo = call.type === 'video';
  const name = getUserName(other);
  const avatarUrl = getAvatar(other);

  const formatDuration = (sec) => {
    if (!sec || sec === 0) return '0s (Missed / Declined)';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm bg-white dark:bg-[#111b21] rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800"
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white flex flex-col items-center relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
            >
              <FaTimes size={14} />
            </button>

            {/* Profile Avatar */}
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="w-20 h-20 rounded-full object-cover ring-4 ring-white/30 shadow-lg mb-2" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center font-bold text-2xl ring-4 ring-white/30 shadow-lg mb-2">
                {name.charAt(0).toUpperCase()}
              </div>
            )}

            <h3 className="text-lg font-bold truncate max-w-[240px] text-center">{name}</h3>
            {other?.username && <p className="text-emerald-100 text-xs">@{other.username}</p>}
            {other?.headline && <p className="text-emerald-200 text-xs mt-1 text-center line-clamp-1">{other.headline}</p>}
          </div>

          {/* Quick Action Bar */}
          <div className="flex items-center justify-around py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#1f2c34]">
            <button
              onClick={() => { onClose(); onCall(other, 'voice'); }}
              className="flex flex-col items-center gap-1 text-green-500 hover:text-green-600 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <FaPhone size={15} />
              </div>
              <span className="text-[11px] font-semibold">Voice</span>
            </button>

            <button
              onClick={() => { onClose(); onCall(other, 'video'); }}
              className="flex flex-col items-center gap-1 text-blue-500 hover:text-blue-600 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <FaVideo size={15} />
              </div>
              <span className="text-[11px] font-semibold">Video</span>
            </button>

            <button
              onClick={() => { onClose(); if (call.chat) onOpenChat(call.chat._id || call.chat); }}
              className="flex flex-col items-center gap-1 text-teal-500 hover:text-teal-600 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                <FaComment size={15} />
              </div>
              <span className="text-[11px] font-semibold">Message</span>
            </button>
          </div>

          {/* Details List */}
          <div className="p-4 space-y-3 text-xs text-gray-700 dark:text-gray-200">
            <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-gray-800/40">
              <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <FaCalendarAlt className="text-emerald-500" /> Call Date
              </span>
              <span className="font-semibold">{new Date(call.createdAt).toLocaleDateString()}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-gray-800/40">
              <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <FaClock className="text-emerald-500" /> Call Time
              </span>
              <span className="font-semibold">{new Date(call.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-gray-800/40">
              <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <FaHistory className="text-emerald-500" /> Duration
              </span>
              <span className="font-semibold">{formatDuration(call.duration)}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-gray-800/40">
              <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <FaSignal className="text-emerald-500" /> Network Status
              </span>
              <span className="font-semibold">{call.networkStatus || 'Wi-Fi / 4G'}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-gray-800/40">
              <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <FaCheckCircle className="text-emerald-500" /> Call Quality
              </span>
              <span className="font-semibold text-emerald-500">{call.quality || 'Excellent'}</span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <button
              onClick={() => onDelete(call._id)}
              className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 font-semibold px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <FaTrash size={12} /> Delete Call Log
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
