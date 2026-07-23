import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
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
  
  // Filter nav items based on role
  const visibleNavItems = navItems.filter(item => 
    item.name !== 'Admin' || currentUser?.role === 'Admin'
  );

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
          {/* User Mini Profile */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 dark:border-primary/10 text-center"
          >
            {currentUser?.profilePicture && !currentUser.profilePicture.includes('anonymous') ? (
              <img 
                src={currentUser.profilePicture} 
                alt="Profile" 
                className="w-16 h-16 rounded-2xl mx-auto mb-3 object-cover shadow-glow border border-primary/30"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent mx-auto mb-3 flex items-center justify-center text-white font-black text-2xl shadow-glow">
                {currentUser?.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            
            <h2 className="text-base font-bold text-text-primary dark:text-white truncate" title={currentUser?.fullName || currentUser?.username}>
              {currentUser?.fullName || currentUser?.username || 'User'}
            </h2>
            <p className="text-xs font-medium text-text-secondary dark:text-gray-400 mt-1 truncate" title={currentUser?.headline || currentUser?.role}>
              {currentUser?.headline || currentUser?.role || 'Member'}
            </p>
            <div className="flex justify-center gap-4 mt-3 text-xs font-bold">
              <div className="text-center cursor-pointer hover:text-primary transition-colors">
                <p className="text-text-primary dark:text-white">{currentUser?.following?.length || 0}</p>
                <p className="text-text-secondary dark:text-gray-500">Connections</p>
              </div>
              <div className="w-px bg-gray-200 dark:bg-gray-700" />
              <div className="text-center cursor-pointer hover:text-primary transition-colors">
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
                      {item.name === 'Notifications' && (
                        <span className="ml-auto inline-flex items-center justify-center h-5 w-5 rounded-full bg-danger text-white text-[10px] font-black">3</span>
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
    </>
  );
};

export default Sidebar;
