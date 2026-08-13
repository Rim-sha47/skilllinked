import React from 'react';
import { FaPhone, FaVideo, FaPhoneSlash, FaTimesCircle, FaBan, FaSyncAlt } from 'react-icons/fa';

export const CallMessage = ({ message, isMe, onInitiateCall }) => {
  const callInfo = message.callInfo || {};
  const status = callInfo.callStatus || 'ended';
  const isVideo = callInfo.callType === 'video';
  const duration = callInfo.duration || 0;

  const formatDuration = (sec) => {
    if (!sec || sec <= 0) return '';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const formatTime = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (d) => {
    if (!d) return '';
    const date = new Date(d);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) return 'Today';
    const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getCallDisplay = () => {
    if (status === 'started') {
      return {
        icon: isVideo ? <FaVideo className="text-blue-500" size={16} /> : <FaPhone className="text-emerald-500" size={16} />,
        title: isVideo ? (isMe ? 'You started a video call' : 'Video call started') : (isMe ? 'You started a voice call' : 'Voice call started'),
        color: 'text-gray-800 dark:text-gray-200',
        bg: 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50',
      };
    } else if (status === 'ended') {
      const durText = formatDuration(duration);
      return {
        icon: isVideo ? <FaVideo className="text-blue-500" size={16} /> : <FaPhone className="text-emerald-500" size={16} />,
        title: isVideo ? 'Video call ended' : 'Voice call ended',
        sub: durText ? `Duration: ${durText}` : '',
        color: 'text-gray-800 dark:text-gray-200',
        bg: 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/50',
      };
    } else if (status === 'missed') {
      return {
        icon: <FaTimesCircle className="text-red-500" size={16} />,
        title: isVideo ? 'Missed video call' : 'Missed voice call',
        color: 'text-red-600 dark:text-red-400 font-semibold',
        bg: 'bg-red-50/90 dark:bg-red-950/40 border-red-200 dark:border-red-800/50',
      };
    } else if (status === 'declined' || status === 'rejected') {
      return {
        icon: <FaBan className="text-orange-500" size={16} />,
        title: 'Call declined',
        color: 'text-orange-600 dark:text-orange-400 font-semibold',
        bg: 'bg-orange-50/90 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800/50',
      };
    } else if (status === 'cancelled') {
      return {
        icon: <FaPhoneSlash className="text-amber-500" size={16} />,
        title: isVideo ? 'Cancelled video call' : 'Cancelled voice call',
        color: 'text-amber-600 dark:text-amber-400 font-semibold',
        bg: 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50',
      };
    }

    return {
      icon: <FaPhone className="text-emerald-500" size={16} />,
      title: message.content || 'Call record',
      color: 'text-gray-800 dark:text-gray-200',
      bg: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
    };
  };

  const display = getCallDisplay();

  return (
    <div className={`flex flex-col my-1.5 max-w-[280px] md:max-w-xs ${isMe ? 'items-end' : 'items-start'}`}>
      <div className={`p-3 rounded-2xl border shadow-sm backdrop-blur-md flex flex-col gap-2 w-full ${display.bg}`}>
        {/* Call Info Header */}
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-full bg-white/80 dark:bg-gray-900/80 shadow-xs flex-shrink-0">
            {display.icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-xs ${display.color}`}>{display.title}</p>
            {display.sub && <p className="text-[11px] text-gray-600 dark:text-gray-300 font-mono mt-0.5">{display.sub}</p>}
            <p className="text-[10px] text-gray-400 dark:text-gray-400 mt-0.5">
              {formatDate(message.createdAt)} • {formatTime(message.createdAt)}
            </p>
          </div>
        </div>

        {/* 🔁 Call Again Quick Action Buttons Bar */}
        {onInitiateCall && (
          <div className="pt-2 border-t border-gray-200/50 dark:border-gray-700/50 flex items-center justify-around gap-2">
            <button
              onClick={() => onInitiateCall('audio')}
              className="flex-1 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              title="Voice Call Again"
            >
              <FaPhone size={11} /> Voice Call
            </button>
            <button
              onClick={() => onInitiateCall('video')}
              className="flex-1 py-1.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-600 dark:text-blue-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              title="Video Call Again"
            >
              <FaVideo size={11} /> Video Call
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
