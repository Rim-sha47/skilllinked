import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card } from '../../components/common/Card';
import { FaUserPlus, FaThumbsUp, FaComment, FaBriefcase, FaCircle, FaEnvelope, FaBell, FaTrash, FaCheckDouble } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '../../redux/slices/notificationSlice';

// Map notification types to icons & colors
const TYPE_META = {
  connection:   { icon: FaUserPlus,  color: 'text-blue-500',   bg: 'bg-blue-100 dark:bg-blue-900/30' },
  post_like:    { icon: FaThumbsUp,  color: 'text-primary',    bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
  post_comment: { icon: FaComment,   color: 'text-green-500',  bg: 'bg-green-100 dark:bg-green-900/30' },
  job_alert:    { icon: FaBriefcase, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  message:      { icon: FaEnvelope,  color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30' },
};

const FILTERS = ['all', 'connection', 'post_like', 'post_comment', 'job_alert', 'message'];
const FILTER_LABELS = {
  all: 'All', connection: 'Connections', post_like: 'Likes', post_comment: 'Comments', job_alert: 'Jobs', message: 'Messages'
};

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const Notifications = () => {
  const dispatch = useDispatch();
  const { items, isLoading } = useSelector(state => state.notifications);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const filtered = filter === 'all' ? items : items.filter(n => n.type === filter);
  const unreadCount = items.filter(n => !n.isRead).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-extrabold text-text-primary dark:text-white">Notifications</h1>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => dispatch(markAllNotificationsRead())}
            className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-blue-700 transition-colors bg-primary/10 hover:bg-primary/20 px-4 py-2 rounded-xl"
          >
            <FaCheckDouble size={14} /> Mark all read
          </button>
        )}
      </motion.div>

      <Card className="p-0 overflow-hidden border-2 border-transparent">
        {/* Filter Tabs */}
        <div className="border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex space-x-2 overflow-x-auto">
          {FILTERS.map((f) => {
            const count = f === 'all' ? unreadCount : items.filter(n => n.type === f && !n.isRead).length;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`relative px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                  filter === f
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {FILTER_LABELS[f]}
                {count > 0 && (
                  <span className={`ml-1.5 text-xs font-bold px-1.5 py-0.5 rounded-full ${filter === f ? 'bg-white/30 text-white' : 'bg-red-500 text-white'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Notifications List */}
        <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : filtered.length > 0 ? (
            <AnimatePresence initial={false}>
              {filtered.map((notif, index) => {
                const meta = TYPE_META[notif.type] || TYPE_META.message;
                const Icon = meta.icon;
                return (
                  <motion.div
                    key={notif._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    className={`flex items-start gap-4 p-5 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer group relative ${!notif.isRead ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
                    onClick={() => !notif.isRead && dispatch(markNotificationRead(notif._id))}
                  >
                    {/* Icon badge */}
                    <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-sm ${meta.bg}`}>
                      <Icon className={`text-xl ${meta.color}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary dark:text-gray-200 leading-relaxed">
                        {notif.content}
                      </p>
                      <p className="text-xs text-gray-400 mt-1.5 font-medium">{timeAgo(notif.createdAt)}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!notif.isRead && <FaCircle className="text-primary h-2.5 w-2.5" />}
                      <button
                        onClick={(e) => { e.stopPropagation(); dispatch(deleteNotification(notif._id)); }}
                        className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1 rounded-lg"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <FaBell className="text-4xl text-gray-300 dark:text-gray-600" />
              </div>
              <h3 className="text-lg font-bold text-text-primary dark:text-white mb-1">All clear!</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">No notifications here.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Notifications;


