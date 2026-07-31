import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { FaUserPlus, FaUserCheck, FaUserTimes, FaUsers, FaCheck, FaTimes } from 'react-icons/fa';
import {
  fetchConnections,
  fetchPendingRequests,
  fetchSuggestions,
  sendConnectionRequest,
  acceptConnectionRequest,
  removeConnection,
  followUser,
  unfollowUser
} from '../../redux/slices/connectionSlice';

// ── Helper: Avatar with initials fallback ────────────────────────────────────
const UserAvatar = ({ user, size = 'md' }) => {
  const sizeClass = size === 'lg' ? 'w-16 h-16 text-xl' : 'w-12 h-12 text-base';
  const displayName = user?.fullName || user?.name || user?.username || '';
  const initials = displayName ? displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
  const pic = user?.profilePicture || user?.avatar || null;
  const hasAvatar = pic && pic !== 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg';
  
  return hasAvatar ? (
    <img src={pic} alt={displayName || 'User'} className={`${sizeClass} rounded-full object-cover ring-2 ring-primary/30`} />
  ) : (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center font-bold text-white ring-2 ring-primary/30`}>
      {initials}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const Networking = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { connections, pendingRequests, suggestions, isLoading } = useSelector(state => state.connections);
  const { user: currentUser } = useSelector(state => state.auth);

  useEffect(() => {
    dispatch(fetchConnections());
    dispatch(fetchPendingRequests());
    dispatch(fetchSuggestions());
  }, [dispatch]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-text-primary dark:text-white">My Network</h1>
            <p className="text-text-secondary dark:text-gray-400 mt-1">
              {connections.length} connection{connections.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Pending Invitations */}
      {pendingRequests.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-white to-blue-50/30 dark:from-dark-card dark:to-blue-900/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <FaUserPlus className="text-primary" />
              </div>
              <h2 className="text-xl font-bold text-text-primary dark:text-white">
                Pending Invitations
                <span className="ml-2 bg-primary text-white text-xs px-2 py-0.5 rounded-full font-bold">{pendingRequests.length}</span>
              </h2>
            </div>
            <div className="space-y-4">
              {pendingRequests.map((req) => (
                <motion.div key={req._id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center justify-between gap-4 p-4 bg-white dark:bg-dark-bg rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate(`/app/profile/${req.sender?._id}`)}>
                    <UserAvatar user={req.sender} size="lg" />
                    <div>
                      <h3 className="font-bold text-text-primary dark:text-white">{req.sender?.fullName || req.sender?.name}</h3>
                      {req.sender?.username && (
                        <p className="text-xs text-gray-500 dark:text-gray-500">@{req.sender.username}</p>
                      )}
                      <p className="text-sm text-text-secondary dark:text-gray-400 line-clamp-1">{req.sender?.headline || 'SkillLinked Member'}</p>
                      {req.sender?.location && (
                        <p className="text-xs text-gray-500 mt-0.5">{req.sender.location}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                    <button
                      onClick={() => navigate(`/app/profile/${req.sender?._id}`)}
                      className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm font-semibold px-3 py-2 rounded-xl transition-colors"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => dispatch(acceptConnectionRequest(req._id))}
                      className="flex items-center gap-1.5 bg-primary hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm hover:shadow-glow"
                    >
                      <FaCheck size={12} /> Accept
                    </button>
                    <button
                      onClick={() => dispatch(removeConnection(req._id))}
                      className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-600 dark:text-gray-300 hover:text-red-500 text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                    >
                      <FaTimes size={12} /> Ignore
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* No pending requests message */}
      {pendingRequests.length === 0 && !isLoading && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-2 border-transparent">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <FaUserCheck className="text-gray-400" />
              </div>
              <h2 className="text-xl font-bold text-text-primary dark:text-white">Pending Invitations</h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 ml-12">No pending invitations right now.</p>
          </Card>
        </motion.div>
      )}

      {/* People You May Know */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-text-primary dark:text-white">People you may know</h2>
          <p className="text-text-secondary dark:text-gray-400 text-sm mt-1">Grow your professional network</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
                <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 mx-auto mb-4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-2 w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto w-1/2" />
              </div>
            ))}
          </div>
        ) : suggestions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {suggestions.map((user, index) => (
              <motion.div
                key={user._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                layout
              >
                <Card className="flex flex-col items-center text-center p-6 border-2 border-transparent hover:border-primary/20 transition-all hover:shadow-lg group">
                  <div className="mb-4 relative cursor-pointer" onClick={() => navigate(`/app/profile/${user._id}`)}>
                    <UserAvatar user={user} size="lg" />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white dark:border-dark-card"></div>
                  </div>
                  <h3 className="text-base font-bold text-text-primary dark:text-white truncate w-full cursor-pointer hover:text-primary transition-colors" onClick={() => navigate(`/app/profile/${user._id}`)}>{user.fullName || user.username}</h3>
                  {user.username && (
                    <p className="text-xs text-gray-500 dark:text-gray-500">@{user.username}</p>
                  )}
                  <p className="text-xs text-text-secondary dark:text-gray-400 mt-1 h-8 line-clamp-2 leading-relaxed">{user.headline || 'SkillLinked Member'}</p>
                  <p className="text-xs text-gray-400 mt-1">{user.mutualConnectionsCount || 0} mutual connections</p>
                  
                  <div className="mt-4 flex flex-col gap-2 w-full">
                    <button
                      onClick={() => {
                        if (user.connectionStatus !== 'pending') {
                          dispatch(sendConnectionRequest(user._id));
                        }
                      }}
                      className={`w-full flex items-center justify-center gap-2 border-2 ${user.connectionStatus === 'pending' ? 'border-gray-400 text-gray-500 cursor-not-allowed' : 'border-primary text-primary hover:bg-primary hover:text-white'} font-semibold text-sm py-1.5 px-4 rounded-xl transition-all duration-200`}
                      disabled={isLoading || user.connectionStatus === 'pending'}
                    >
                      <FaUserPlus size={14} /> {user.connectionStatus === 'pending' ? 'Pending' : 'Connect'}
                    </button>
                    <div className="flex gap-2 w-full">
                      {currentUser?.following?.includes(user._id) ? (
                        <button
                           onClick={() => dispatch(unfollowUser(user._id))}
                           className="flex-1 flex items-center justify-center border-2 border-gray-400 text-gray-700 bg-gray-100 hover:bg-gray-200 dark:border-gray-500 dark:bg-gray-700 dark:text-gray-200 font-semibold text-xs py-1.5 rounded-xl transition-all"
                        >
                           Following
                        </button>
                      ) : (
                        <button
                           onClick={() => dispatch(followUser(user._id))}
                           className="flex-1 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold text-xs py-1.5 rounded-xl transition-all"
                        >
                           Follow
                        </button>
                      )}
                      <button
                         onClick={() => navigate(`/app/profile/${user._id}`)}
                         className="flex-1 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold text-xs py-1.5 rounded-xl transition-all"
                      >
                         View
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <FaUsers className="text-5xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-text-primary dark:text-white mb-2">You're all connected!</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">No new suggestions at this time. Check back later.</p>
          </Card>
        )}
      </motion.div>

      {/* My Connections */}
      {connections.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="mb-5">
            <h2 className="text-2xl font-bold text-text-primary dark:text-white">My Connections</h2>
            <p className="text-text-secondary dark:text-gray-400 text-sm mt-1">{connections.length} connection{connections.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {connections.map((user, index) => (
              <motion.div key={user._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <Card className="flex items-center gap-4 border-2 border-transparent hover:border-primary/20 transition-all hover:shadow-md">
                  <div className="cursor-pointer" onClick={() => navigate(`/app/profile/${user._id}`)}>
                    <UserAvatar user={user} size="lg" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-text-primary dark:text-white truncate cursor-pointer hover:text-primary transition-colors" onClick={() => navigate(`/app/profile/${user._id}`)}>{user.fullName || user.name || user.username}</h3>
                    {user.username && (
                      <p className="text-xs text-gray-500">@{user.username}</p>
                    )}
                    <p className="text-xs text-text-secondary dark:text-gray-400 truncate">{user.headline || 'SkillLinked Member'}</p>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs shrink-0 rounded-xl" onClick={() => navigate(`/app/messaging`)}>Message</Button>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Networking;

