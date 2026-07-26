import React, { useState, useEffect } from 'react';
import { Link, useNavigate, NavLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { toggleTheme } from '../../redux/slices/themeSlice';
import { logout } from '../../redux/slices/authSlice';
import { FaSun, FaMoon, FaBell, FaSearch, FaChevronDown, FaUser, FaCrown, FaSignOutAlt, FaHome, FaBriefcase, FaUserFriends, FaComments, FaBuilding, FaRobot, FaBars } from 'react-icons/fa';

const Navbar = ({ onToggleSidebar }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { mode } = useSelector((state) => state.theme);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  // Get user initials for avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    return parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0][0];
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch(logout());
    setProfileOpen(false);
    navigate('/');
  };

  const navLinks = [];

  return (
    <nav className={`sticky top-0 z-50 w-full transition-all duration-300 ${
      scrolled
        ? 'bg-white/80 dark:bg-dark-card/80 backdrop-blur-2xl shadow-glass dark:shadow-glass-dark border-b border-white/40 dark:border-gray-700/50'
        : 'bg-white/50 dark:bg-dark-bg/50 backdrop-blur-md border-b border-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center gap-4">

          {/* Logo */}
          <Link
            to={isAuthenticated ? '/app/dashboard' : '/'}
            className="flex-shrink-0 flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
              <span className="text-white font-black text-sm">SL</span>
            </div>
            <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent hidden sm:block">
              SkillLinked
            </span>
          </Link>

          {/* Mobile hamburger menu */}
          <button onClick={onToggleSidebar} className="lg:hidden p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition">
            <FaBars className="text-xl text-gray-700 dark:text-gray-200" />
          </button>

          {/* Desktop Nav Links */}
          {isAuthenticated && (
            <div className="hidden lg:flex items-center space-x-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.name}
                  to={link.path}
                  className={({ isActive }) =>
                    `flex flex-col items-center px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 gap-1 ${
                      isActive
                        ? 'text-primary bg-primary/10'
                        : 'text-text-secondary dark:text-gray-400 hover:text-primary hover:bg-primary/5 dark:hover:text-primary'
                    }`
                  }
                >
                  <link.icon className="text-lg" />
                  {link.name}
                </NavLink>
              ))}
            </div>
          )}

          {/* Search Bar - Center (Authenticated) */}
          {isAuthenticated && (
            <div className="hidden md:flex flex-1 max-w-xs lg:max-w-sm">
              <div className={`relative w-full transition-all duration-300 ${searchFocused ? 'scale-105' : ''}`}>
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const val = e.target.searchQuery.value;
                  if (val.trim()) navigate(`/app/search?q=${encodeURIComponent(val.trim())}`);
                }}>
                  <input
                    name="searchQuery"
                    type="text"
                    placeholder="Search people, jobs, companies..."
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-100 dark:bg-dark-card border border-transparent focus:border-primary/50 focus:ring-2 focus:ring-primary/20 text-sm font-medium text-text-primary dark:text-white placeholder-gray-400 transition-all"
                  />
                </form>
              </div>
            </div>
          )}

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            
            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => dispatch(toggleTheme())}
              className="p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-dark-card transition-colors"
            >
              {mode === 'dark'
                ? <FaSun className="h-5 w-5 text-yellow-400" />
                : <FaMoon className="h-5 w-5 text-gray-500" />
              }
            </motion.button>

            {isAuthenticated ? (
              <>
                {/* Notifications Bell */}
                <Link to="/app/notifications" className="relative p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-dark-card transition-colors">
                  <FaBell className="h-5 w-5" />
                  <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-danger ring-2 ring-white dark:ring-dark-bg animate-pulse" />
                </Link>

                {/* AI Shortcut */}
                <Link to="/app/ai" className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-all">
                  <FaRobot className="text-sm" />
                  <span>AI</span>
                </Link>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 pl-1 pr-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-card transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm shadow-sm overflow-hidden">
                      {(user?.profilePicture && user.profilePicture !== 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg') || 
                       (user?.avatar && user.avatar !== 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg') ? (
                        <img 
                          src={user.profilePicture && user.profilePicture !== 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg' ? user.profilePicture : user.avatar} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        user ? getInitials(user.name || user.fullName || user.username) : 'U'
                      )}
                    </div>
                    <FaChevronDown className={`text-xs text-gray-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-56 bg-white/90 dark:bg-dark-card/90 backdrop-blur-2xl rounded-2xl shadow-2xl dark:shadow-black/40 ring-1 ring-black/5 dark:ring-white/10 overflow-hidden z-50"
                      >
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                          <p className="text-sm font-bold text-text-primary dark:text-white">{user?.name || 'User'}</p>
                          <p className="text-xs text-text-secondary dark:text-gray-400 font-medium">{user?.email || ''}</p>
                        </div>
                        <div className="py-2">
                          <Link to="/app/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-text-secondary dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-bg hover:text-primary dark:hover:text-primary transition-colors">
                            <FaUser className="text-gray-400" /> Your Profile
                          </Link>
                          <Link to="/app/premium" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-text-secondary dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-bg hover:text-accent dark:hover:text-accent transition-colors">
                            <FaCrown className="text-accent" /> Go Premium
                          </Link>
                          {user?.role === 'Admin' && (
                            <Link to="/app/admin" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-text-secondary dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-bg hover:text-primary transition-colors">
                              <FaBuilding className="text-gray-400" /> Admin Panel
                            </Link>
                          )}
                        </div>
                        <div className="py-2 border-t border-gray-100 dark:border-gray-800">
                          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-semibold text-danger hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                            <FaSignOutAlt /> Sign out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/auth/login" className="text-sm font-bold text-text-secondary dark:text-gray-300 hover:text-primary px-3 py-2 rounded-xl transition-colors">
                  Sign In
                </Link>
                <Link to="/auth/signup">
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className="bg-gradient-to-r from-primary to-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-glow transition-all hover:shadow-[0_0_20px_rgba(37,99,235,0.6)]"
                  >
                    Join Free
                  </motion.button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
