import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { FaEye, FaUserFriends, FaBriefcase, FaEnvelope, FaRobot, FaArrowRight, FaCheckCircle, FaBuilding, FaThumbsUp, FaComment, FaEdit } from 'react-icons/fa';
import { fetchSuggestions, sendConnectionRequest } from '../../redux/slices/connectionSlice';
import { addSkill, updateAvatar, updateBasicInfo, fetchMyProfile } from '../../redux/slices/profileSlice';
import { updateUser } from '../../redux/slices/authSlice';
import { Modal } from '../../components/common/Modal';
import SkillForm from '../../components/profile/SkillForm';
import ProfilePicForm from '../../components/profile/ProfilePicForm';
import BasicInfoForm from '../../components/profile/BasicInfoForm';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);
  const { data: profile } = useSelector((state) => state.profile);
  const { suggestions } = useSelector((state) => state.connections);
  const [dashboardData, setDashboardData] = useState({
    profileViews: 0,
    connections: 0,
    applications: 0,
    unreadMessages: 0,
    profileCompletion: 20,
    recentActivity: []
  });
  
  const [modals, setModals] = useState({
    skill: false,
    profilePic: false,
    basicInfo: false
  });

  const [editItem, setEditItem] = useState(null);

  const openModal = (type, item = null) => {
    // For date inputs, we need to convert ISO strings to YYYY-MM-DD
    if (item && (item.from || item.to || item.issueDate)) {
      const formattedItem = { ...item };
      if (formattedItem.from) formattedItem.from = formattedItem.from.split('T')[0];
      if (formattedItem.to) formattedItem.to = formattedItem.to.split('T')[0];
      if (formattedItem.issueDate) formattedItem.issueDate = formattedItem.issueDate.split('T')[0];
      if (formattedItem.expirationDate) formattedItem.expirationDate = formattedItem.expirationDate.split('T')[0];
      setEditItem(formattedItem);
    } else {
      setEditItem(item);
    }
    setModals(prev => ({ ...prev, [type]: true }));
  };
  const closeModal = (type) => setModals({ ...modals, [type]: false });

  const handleSkillSubmit = async (data) => {
    try {
      await dispatch(addSkill(data.name)).unwrap();
      closeModal('skill');
      // refresh stats optionally
    } catch (err) { console.error(err); }
  };

  // ----- Avatar upload handling for Dashboard -----
  const [isUploading, setIsUploading] = React.useState(false);
  const handleProfilePicSubmit = async (formData) => {
    try {
      console.log('Uploading avatar, file:', formData.get('file'));
      setIsUploading(true);
      const res = await dispatch(updateAvatar(formData)).unwrap();
      console.log('Avatar upload response from thunk:', res);
      if (res && res.profilePicture) {
        dispatch(updateUser({ profilePicture: res.profilePicture, avatar: res.profilePicture }));
        // Refresh profile data so Dashboard avatar updates
        dispatch(fetchMyProfile());
      }
      closeModal('profilePic');
    } catch (err) {
      console.error('Avatar upload error in Dashboard handler:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleBasicInfoSubmit = async (data) => {
    try {
      await dispatch(updateBasicInfo(data)).unwrap();
      closeModal('basicInfo');
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/profiles/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Merge with safe defaults to prevent null crashes
        setDashboardData(prev => ({
          ...prev,
          profileViews: res.data?.profileViews ?? 0,
          connections: res.data?.connections ?? 0,
          applications: res.data?.applications ?? 0,
          unreadMessages: res.data?.unreadMessages ?? 0,
          profileCompletion: res.data?.profileCompletion ?? 20,
          recentActivity: res.data?.recentActivity ?? [],
        }));
      } catch (err) {
        console.error('Failed to fetch dashboard stats', err);
      }
    };
    if (token) {
      fetchDashboard();
      dispatch(fetchSuggestions());
      dispatch(fetchMyProfile());
    }
  }, [token, dispatch]);

  // Dynamic data for widgets — use safe fallbacks to prevent crash on null
  const stats = [
    { id: 1, name: 'Profile Views', stat: (dashboardData.profileViews ?? 0).toLocaleString(), icon: FaEye, color: 'text-blue-500', bg: 'bg-blue-500/10 dark:bg-blue-500/20', change: '+12.5%' },
    { id: 2, name: 'Connections', stat: (dashboardData.connections ?? 0).toLocaleString(), icon: FaUserFriends, color: 'text-green-500', bg: 'bg-green-500/10 dark:bg-green-500/20', change: 'Network' },
    { id: 3, name: 'Applications', stat: (dashboardData.applications ?? 0).toString(), icon: FaBriefcase, color: 'text-purple-500', bg: 'bg-purple-500/10 dark:bg-purple-500/20', change: 'Active' },
    { id: 4, name: 'Unread Messages', stat: (dashboardData.unreadMessages ?? 0).toString(), icon: FaEnvelope, color: 'text-yellow-500', bg: 'bg-yellow-500/10 dark:bg-yellow-500/20', change: 'New' },
  ];

  return (
    <div className="space-y-8">
      <Modal isOpen={modals.skill} onClose={() => closeModal('skill')}>
        <h2 className="text-xl font-bold mb-4 text-text-primary dark:text-white">Add Skill</h2>
        <SkillForm onSubmit={handleSkillSubmit} isSubmitting={false} />
      </Modal>

      <Modal isOpen={modals.profilePic} onClose={() => closeModal('profilePic')}>
        <h2 className="text-xl font-bold mb-4 text-text-primary dark:text-white">Update Profile Picture</h2>
        <ProfilePicForm onSubmit={handleProfilePicSubmit} isSubmitting={isUploading} />
      </Modal>

      <Modal isOpen={modals.basicInfo} onClose={() => closeModal('basicInfo')}>
        <BasicInfoForm defaultValues={profile || {}} onSubmit={handleBasicInfoSubmit} isSubmitting={false} />
      </Modal>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-extrabold text-text-primary dark:text-white"
          >
            Dashboard Overview
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-2 text-text-secondary dark:text-gray-400 font-medium"
          >
            Welcome back! Here's what's happening with your profile today.
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
           <Button className="shadow-glow"><FaRobot className="mr-2" /> AI Daily Insights</Button>
        </motion.div>
      </div>

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <Card className="relative overflow-hidden p-6 group cursor-pointer hover:-translate-y-1 transition-transform">
              <div className="flex justify-between items-start">
                <div className={`p-3 rounded-2xl ${item.bg} group-hover:scale-110 transition-transform duration-300`}>
                  <item.icon className={`h-6 w-6 ${item.color}`} aria-hidden="true" />
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${item.change.startsWith('+') ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                  {item.change}
                </span>
              </div>
              <div className="mt-6">
                <p className="text-sm font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wider">{item.name}</p>
                <p className="mt-2 text-3xl font-black text-text-primary dark:text-white">{item.stat}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (Wider) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* My Profile Summary */}
          {profile && (
            <Card className="relative overflow-hidden p-6 mb-8 border-primary/20 bg-gradient-to-r from-white to-primary/5 dark:from-dark-card dark:to-primary/10">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                <div className="relative w-24 h-24 flex-shrink-0 group cursor-pointer" onClick={() => openModal('profilePic')}>
                  <div className="w-full h-full rounded-full overflow-hidden border-2 border-primary bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                    {(user?.profilePicture && user.profilePicture !== 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg') || 
                     (user?.avatar && user.avatar !== 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg') ? (
                      <img src={user.profilePicture && user.profilePicture !== 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg' ? user.profilePicture : user.avatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold text-gray-500">{(user?.fullName || user?.username || 'U').charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <FaEdit className="text-white text-xl" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold text-text-primary dark:text-white">{user?.fullName}</h2>
                      <p className="text-sm font-medium text-primary mb-2">{profile.headline || 'Add a headline'}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => openModal('basicInfo')}><FaEdit className="mr-2" /> Edit Bio</Button>
                  </div>
                  
                  {profile.bio && (
                    <p className="text-sm text-text-secondary dark:text-gray-300 mt-2 italic border-l-4 border-primary/40 pl-3 py-1">
                      "{profile.bio}"
                    </p>
                  )}
                  
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-bold text-text-primary dark:text-white">Top Skills</h4>
                      <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => openModal('skill')}><FaEdit className="mr-1" /> Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills && profile.skills.length > 0 ? (
                        profile.skills.map((skill, idx) => (
                          <span key={idx} className="px-3 py-1 bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light rounded-full text-xs font-semibold">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <p className="text-xs text-gray-400">No skills added yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Profile Completion */}
          <Card glassHeavy className="relative overflow-hidden p-8 border-primary/30">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="relative w-24 h-24 flex-shrink-0">
                 {/* Radial Progress Ring */}
                 <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-gray-200 dark:text-gray-700 stroke-current"
                      strokeWidth="3"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-primary stroke-current"
                      strokeWidth="3"
                      strokeDasharray="80, 100"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                 </svg>
                 <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-text-primary dark:text-white">
                    {dashboardData.profileCompletion}%
                 </div>
              </div>
              <div className="flex-1 text-center md:text-left z-10">
                <h3 className="text-xl font-bold text-text-primary dark:text-white mb-2">Complete your profile</h3>
                <p className="text-text-secondary dark:text-gray-400 text-sm mb-4">Profiles with skills and a summary receive up to 3x more views from recruiters.</p>
                <div className="flex gap-2 justify-center md:justify-start flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => openModal('skill')}>Add Skills</Button>
                  <Button size="sm" variant="outline" onClick={() => openModal('profilePic')}>Update Photo</Button>
                  <Button size="sm" variant="outline" onClick={() => openModal('basicInfo')}>Edit Info (Bio)</Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Recent Activity */}
          <Card title="Recent Activity" className="min-h-[300px]">
            <div className="space-y-6 mt-4">
              {dashboardData.recentActivity && dashboardData.recentActivity.length > 0 ? (
                dashboardData.recentActivity.map((activity) => {
                  let Icon = FaBuilding;
                  let colorClass = 'text-primary';

                  switch (activity.type) {
                    case 'apply_job':
                      Icon = FaCheckCircle;
                      colorClass = 'text-green-500';
                      break;
                    case 'like_post':
                      Icon = FaThumbsUp;
                      colorClass = 'text-blue-500';
                      break;
                    case 'comment_post':
                      Icon = FaComment;
                      colorClass = 'text-primary';
                      break;
                    case 'new_connection':
                      Icon = FaUserFriends;
                      colorClass = 'text-purple-500';
                      break;
                  }

                  return (
                    <div key={activity._id} className="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-bg/50 transition-colors">
                      <div className={`mt-1 ${colorClass}`}><Icon size={18} /></div>
                      <div>
                        <p className="text-sm font-medium text-text-primary dark:text-gray-200">{activity.text}</p>
                        <p className="text-xs text-text-secondary dark:text-gray-500 mt-1">
                          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500 text-center py-10">No recent activity found.</p>
              )}
              {dashboardData.recentActivity && dashboardData.recentActivity.length > 0 && (
                <Button variant="ghost" className="w-full mt-4 text-primary justify-between">
                  View all activity <FaArrowRight />
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column (Sidebar) */}
        <div className="space-y-8">
          
          <Card title="AI Career Assistant" glassHeavy className="border-accent/30 bg-gradient-to-b from-white/60 to-accent/5 dark:from-dark-card/60 dark:to-accent/10">
            <div className="flex justify-center mb-6 mt-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white shadow-glow">
                <FaRobot size={32} />
              </div>
            </div>
            <p className="text-sm text-center text-text-secondary dark:text-gray-300 mb-6 font-medium">Upload your latest resume for an AI-powered review and personalized job matches.</p>
            <Button className="w-full shadow-glow">Analyze Resume</Button>
          </Card>
          
          <Card title="Suggested Connections">
            <div className="space-y-5 mt-4">
               {suggestions.slice(0, 3).map((suggestion) => (
                 <div key={suggestion._id} className="flex items-center space-x-3 group cursor-pointer">
                   {suggestion.profilePicture && suggestion.profilePicture !== 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg' ? (
                     <img src={suggestion.profilePicture} alt={suggestion.fullName || suggestion.username || 'User'} className="w-12 h-12 rounded-full object-cover border-2 border-transparent group-hover:border-primary transition-colors" />
                   ) : (
                     <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xl border-2 border-transparent group-hover:border-primary transition-colors">
                       {(suggestion.fullName || suggestion.username || 'U').charAt(0).toUpperCase()}
                     </div>
                   )}
                   <div className="flex-1 min-w-0">
                     <p className="text-sm font-bold text-text-primary dark:text-white truncate">{suggestion.fullName || suggestion.username || 'SkillLinked User'}</p>
                     <p className="text-xs text-text-secondary dark:text-gray-400 truncate">{suggestion.headline || 'Member'}</p>
                   </div>
                   <button 
                     onClick={() => dispatch(sendConnectionRequest(suggestion._id))}
                     className="text-primary text-sm font-semibold hover:bg-primary/10 p-2 rounded-full transition-colors"
                   >
                     Connect
                   </button>
                 </div>
               ))}
               {suggestions.length === 0 && (
                 <p className="text-sm text-gray-500 text-center">No suggestions right now.</p>
               )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
