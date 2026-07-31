import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import Modal from '../common/Modal';
import ProfilePicForm from '../profile/ProfilePicForm';
import { updateUserInfo, updateAvatar, removeAvatar } from '../../redux/slices/profileSlice';
import { updateUser } from '../../redux/slices/authSlice';
import { Button } from '../common/Button';
import { toast } from 'react-hot-toast';
import {
  FaHome,
  FaUserFriends,
  FaBriefcase,
  FaComments,
  FaBell,
  FaRobot,
  FaBuilding,
  FaSearch,
  FaCrown,
  FaChartBar,
  FaEdit,
} from 'react-icons/fa';

const navItems = [
  { name: 'Dashboard', path: '/app/dashboard', icon: FaHome },
  { name: 'My Network', path: '/app/networking', icon: FaUserFriends },
  { name: 'Jobs', path: '/app/jobs', icon: FaBriefcase },
  { name: 'Messages', path: '/app/messaging', icon: FaComments },
  { name: 'Notifications', path: '/app/notifications', icon: FaBell },
  { name: 'Companies', path: '/app/companies', icon: FaBuilding },
  { name: 'AI Career Hub', path: '/app/ai', icon: FaRobot },
  { name: 'Search', path: '/app/search', icon: FaSearch },
  { name: 'Admin', path: '/app/admin', icon: FaChartBar },
];

const Sidebar = ({ isOpen = false, onClose }) => {
  const { user: currentUser } = useSelector((state) => state.auth);
  const { items: notifications } = useSelector((state) => state.notifications);
  const navigate = useNavigate();
  
  const unreadNotificationsCount = notifications?.filter(n => !n.isRead)?.length || 0;
  
  // Filter nav items based on role
  const visibleNavItems = navItems.filter(item => 
    item.name !== 'Admin' || currentUser?.role === 'Admin'
  );

  const dispatch = useDispatch();
  
  const [isAvatarDropdownOpen, setIsAvatarDropdownOpen] = useState(false);
  const [modals, setModals] = useState({
    profilePic: false,
    editName: false,
    editHeadline: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    headline: ''
  });

  const openModal = (type) => {
    setFormData({
      fullName: currentUser?.fullName || '',
      username: currentUser?.username || '',
      headline: currentUser?.headline || ''
    });
    setModals(prev => ({ ...prev, [type]: true }));
    setIsAvatarDropdownOpen(false);
  };

  const closeModal = (type) => {
    setModals(prev => ({ ...prev, [type]: false }));
  };

  const handleProfilePicSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      const res = await dispatch(updateAvatar(data)).unwrap();
      if (res && res.profilePicture !== undefined) {
        dispatch(updateUser({ profilePicture: res.profilePicture, avatar: res.profilePicture }));
        toast.success('Profile picture updated successfully!');
      }
      closeModal('profilePic');
    } catch (err) { 
      console.error('Avatar upload error:', err);
      toast.error(err || 'Failed to update profile picture');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveProfilePic = async () => {
    try {
      setIsSubmitting(true);
      const res = await dispatch(removeAvatar()).unwrap();
      if (res && res.profilePicture !== undefined) {
        dispatch(updateUser({ profilePicture: res.profilePicture, avatar: res.profilePicture }));
        toast.success('Profile picture removed');
      }
      setIsAvatarDropdownOpen(false);
    } catch (err) { 
      console.error('Avatar remove error:', err);
      toast.error('Failed to remove profile picture');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateInfo = async (e, type) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const payload = type === 'name' 
        ? { fullName: formData.fullName, username: formData.username }
        : { headline: formData.headline };
      
      const res = await dispatch(updateUserInfo(payload)).unwrap();
      if (res) {
        toast.success('Profile updated successfully!');
        closeModal(type === 'name' ? 'editName' : 'editHeadline');
      }
    } catch (err) {
      console.error('Update info error:', err);
      toast.error(err || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Overlay for mobile when open */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      )}
      <aside
        className={`${
          isOpen
            ? "fixed inset-y-0 left-0 z-50 w-64 flex-shrink-0 flex flex-col bg-white dark:bg-dark-bg overflow-y-auto custom-scrollbar border-r border-gray-200/50 dark:border-gray-800/50 backdrop-blur-md transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}"
            : "hidden md:flex flex-col sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar border-r border-gray-200/50 dark:border-gray-800/50 bg-white/40 dark:bg-dark-bg/40 backdrop-blur-md"
        }`}
      >
        <div className="py-6 px-4 flex flex-col flex-1">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 dark:border-primary/10 text-center relative"
          >
            {/* Avatar Section */}
            <div className="relative inline-block group mb-3 cursor-pointer" onClick={() => setIsAvatarDropdownOpen(!isAvatarDropdownOpen)}>
              {(currentUser?.profilePicture && currentUser.profilePicture !== 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg') || 
               (currentUser?.avatar && currentUser.avatar !== 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg') ? (
                <img 
                  src={currentUser.profilePicture && currentUser.profilePicture !== 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg' ? currentUser.profilePicture : currentUser.avatar} 
                  alt="Profile" 
                  className="w-16 h-16 rounded-2xl object-cover shadow-glow border border-primary/30"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-black text-2xl shadow-glow">
                  {currentUser?.fullName ? currentUser.fullName.charAt(0).toUpperCase() : (currentUser?.username ? currentUser.username.charAt(0).toUpperCase() : 'U')}
                </div>
              )}
              
              <div className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <FaEdit className="text-white text-xl" />
              </div>
              
              {isAvatarDropdownOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-xl z-50 overflow-hidden border border-gray-200 dark:border-gray-700">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsAvatarDropdownOpen(false); openModal('profilePic'); }} 
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-200"
                  >
                    Upload New Photo
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsAvatarDropdownOpen(false); openModal('profilePic'); }} 
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-200"
                  >
                    Change Photo
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleRemoveProfilePic(); }} 
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-red-600 dark:text-red-400 font-medium"
                  >
                    Remove Photo
                  </button>
                </div>
              )}
            </div>
            
            {/* Name Section */}
            <div className="flex items-center justify-center gap-2 relative">
              <h2 className="text-base font-bold text-text-primary dark:text-white truncate" title={currentUser?.fullName || currentUser?.username}>
                {currentUser?.fullName || currentUser?.username || 'User'}
              </h2>
              <button onClick={() => openModal('editName')} className="text-gray-400 hover:text-primary transition-colors flex-shrink-0">
                <FaEdit size={12} />
              </button>
            </div>

            {/* Headline Section */}
            <div className="flex items-center justify-center gap-2 mt-1 relative">
              <p className="text-xs font-medium text-text-secondary dark:text-gray-400 truncate max-w-[150px]" title={currentUser?.headline || currentUser?.role}>
                {currentUser?.headline || currentUser?.role || 'Member'}
              </p>
              <button onClick={() => openModal('editHeadline')} className="text-gray-400 hover:text-primary transition-colors flex-shrink-0">
                <FaEdit size={10} />
              </button>
            </div>
            <div className="flex justify-center gap-4 mt-3 text-xs font-bold">
              <div className="text-center cursor-pointer hover:text-primary transition-colors" onClick={() => navigate('/app/profile?modal=following')}>
                <p className="text-text-primary dark:text-white">{currentUser?.following?.length || 0}</p>
                <p className="text-text-secondary dark:text-gray-500">Following</p>
              </div>
              <div className="w-px bg-gray-200 dark:bg-gray-700" />
              <div className="text-center cursor-pointer hover:text-primary transition-colors" onClick={() => navigate('/app/profile?modal=followers')}>
                <p className="text-text-primary dark:text-white">{currentUser?.followers?.length || 0}</p>
                <p className="text-text-secondary dark:text-gray-500">Followers</p>
              </div>
            </div>
          </motion.div>

          {/* Navigation */}
          <nav className="space-y-1 flex-1">
            {visibleNavItems.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.04 }}
              >
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 group ${
                      isActive
                        ? 'bg-gradient-to-r from-primary to-blue-600 text-white shadow-glow'
                        : 'text-text-secondary dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-card hover:text-text-primary dark:hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className={`mr-3 flex-shrink-0 h-5 w-5 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
                      {item.name}
                      {item.name === 'Notifications' && unreadNotificationsCount > 0 && (
                        <span className="ml-auto inline-flex items-center justify-center h-5 w-5 rounded-full bg-danger text-white text-[10px] font-black">{unreadNotificationsCount}</span>
                      )}
                      {item.name === 'Messages' && (
                        <span className="ml-auto inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-white text-[10px] font-black">2</span>
                      )}
                    </>
                  )}
                </NavLink>
              </motion.div>
            ))}
          </nav>

          {/* Premium Banner */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-6">
            <NavLink to="/app/premium" className="block">
              <div className="p-4 bg-gradient-to-br from-primary to-accent rounded-2xl text-white shadow-glow relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
                <FaCrown className="text-2xl mb-3 relative z-10" />
                <p className="text-sm font-bold mb-1 relative z-10">Upgrade to Premium</p>
                <p className="text-xs text-white/80 font-medium relative z-10">Get AI resume analysis, InMail & more.</p>
                <div className="mt-3 flex items-center text-xs font-black uppercase tracking-widest relative z-10 group-hover:gap-2 transition-all">
                  Try Free <span className="ml-1">→</span>
                </div>
              </div>
            </NavLink>
          </motion.div>
        </div>
      </aside>

      {/* Modals */}
      <Modal isOpen={modals.profilePic} onClose={() => closeModal('profilePic')}>
        <ProfilePicForm 
          currentPic={currentUser?.profilePicture && currentUser.profilePicture !== 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg' ? currentUser.profilePicture : currentUser?.avatar} 
          onSubmit={handleProfilePicSubmit} 
          isSubmitting={isSubmitting} 
        />
      </Modal>

      <Modal isOpen={modals.editName} onClose={() => closeModal('editName')}>
        <form onSubmit={(e) => handleUpdateInfo(e, 'name')} className="space-y-4">
          <h2 className="text-xl font-bold text-text-primary dark:text-white mb-4">Edit Name</h2>
          <div>
            <label className="block text-sm font-medium text-text-secondary dark:text-gray-300 mb-1">Full Name</label>
            <input 
              type="text" 
              value={formData.fullName}
              onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-text-primary dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary dark:text-gray-300 mb-1">Username</label>
            <input 
              type="text" 
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-text-primary dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              required
            />
          </div>
          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto shadow-glow">
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={modals.editHeadline} onClose={() => closeModal('editHeadline')}>
        <form onSubmit={(e) => handleUpdateInfo(e, 'headline')} className="space-y-4">
          <h2 className="text-xl font-bold text-text-primary dark:text-white mb-4">Edit Professional Title</h2>
          <div>
            <label className="block text-sm font-medium text-text-secondary dark:text-gray-300 mb-1">Professional Title</label>
            <input 
              type="text" 
              value={formData.headline}
              onChange={(e) => setFormData(prev => ({ ...prev, headline: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-text-primary dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              placeholder="e.g. MERN Stack Developer"
              required
            />
          </div>
          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto shadow-glow">
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default Sidebar;
