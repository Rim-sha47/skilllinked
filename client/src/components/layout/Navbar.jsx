import React, { useState, useEffect } from 'react';
import { Link, useNavigate, NavLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { toggleTheme } from '../../redux/slices/themeSlice';
import { logout } from '../../redux/slices/authSlice';
import { FaSun, FaMoon, FaBell, FaChevronDown, FaUser, FaCrown, FaSignOutAlt, FaBuilding, FaRobot, FaBars } from 'react-icons/fa';

const Navbar = ({ onToggleSidebar }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { mode } = useSelector((state) => state.theme);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

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
    <nav className={`sticky top-0 z-50 w-full border-b transition-all duration-300 ${
      scrolled
        ? 'border-white/40 bg-white/80 shadow-[0_10px_40px_rgba(15,23,42,0.08)] backdrop-blur-2xl dark:border-gray-700/50 dark:bg-dark-card/80'
        : 'border-transparent bg-white/60 backdrop-blur-md dark:bg-dark-bg/50'
    }`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link to={isAuthenticated ? '/app/dashboard' : '/'} className="flex flex-shrink-0 items-center gap-2">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 2 }}
              whileTap={{ scale: 0.96 }}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-[0_10px_30px_rgba(37,99,235,0.25)]"
            >
              <span className="text-sm font-black text-white">SL</span>
            </motion.div>
            <span className="hidden bg-gradient-to-r from-primary to-accent bg-clip-text text-xl font-black text-transparent sm:block">
              SkillLinked
            </span>
          </Link>

          <button onClick={onToggleSidebar} className="rounded-md p-2 transition hover:bg-gray-200 dark:hover:bg-gray-700 lg:hidden">
            <FaBars className="text-xl text-gray-700 dark:text-gray-200" />
          </button>

          {isAuthenticated && (
            <div className="hidden items-center space-x-1 lg:flex">
              {navLinks.map((link) => (
                <NavLink
                  key={link.name}
                  to={link.path}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-1 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-text-secondary hover:bg-primary/5 hover:text-primary dark:text-gray-400 dark:hover:text-primary'
                    }`
                  }
                >
                  <link.icon className="text-lg" />
                  {link.name}
                </NavLink>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => dispatch(toggleTheme())}
              className="rounded-xl p-2.5 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-dark-card"
            >
              {mode === 'dark' ? <FaSun className="h-5 w-5 text-yellow-400" /> : <FaMoon className="h-5 w-5 text-gray-500" />}
            </motion.button>

            {isAuthenticated ? (
              <>
                <Link to="/app/notifications" className="relative rounded-xl p-2.5 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-dark-card">
                  <FaBell className="h-5 w-5" />
                  <span className="absolute right-1.5 top-1.5 block h-2 w-2 rounded-full bg-danger ring-2 ring-white animate-pulse dark:ring-dark-bg" />
                </Link>

                <Link to="/app/ai" className="hidden items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-2 text-xs font-bold text-primary transition-all hover:bg-primary/20 sm:flex">
                  <FaRobot className="text-sm" />
                  <span>AI</span>
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 rounded-xl py-1.5 pl-1 pr-3 transition-colors hover:bg-gray-100 dark:hover:bg-dark-card"
                  >
                    <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-primary to-accent text-sm font-bold text-white shadow-sm">
                      {(user?.profilePicture && user.profilePicture !== 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg') ||
                      (user?.avatar && user.avatar !== 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg') ? (
                        <img src={user.profilePicture && user.profilePicture !== 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg' ? user.profilePicture : user.avatar} alt="Profile" className="h-full w-full object-cover" />
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
                        className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl bg-white/90 shadow-2xl ring-1 ring-black/5 backdrop-blur-2xl dark:bg-dark-card/90 dark:shadow-black/40 dark:ring-white/10"
                      >
                        <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                          <p className="text-sm font-bold text-text-primary dark:text-white">{user?.name || 'User'}</p>
                          <p className="text-xs font-medium text-text-secondary dark:text-gray-400">{user?.email || ''}</p>
                        </div>
                        <div className="py-2">
                          <Link to="/app/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-gray-100 hover:text-primary dark:text-gray-300 dark:hover:bg-dark-bg dark:hover:text-primary">
                            <FaUser className="text-gray-400" /> Your Profile
                          </Link>
                          <Link to="/app/premium" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-gray-100 hover:text-accent dark:text-gray-300 dark:hover:bg-dark-bg dark:hover:text-accent">
                            <FaCrown className="text-accent" /> Go Premium
                          </Link>
                          {user?.role === 'Admin' && (
                            <Link to="/app/admin" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-gray-100 hover:text-primary dark:text-gray-300 dark:hover:bg-dark-bg">
                              <FaBuilding className="text-gray-400" /> Admin Panel
                            </Link>
                          )}
                        </div>
                        <div className="border-t border-gray-100 py-2 dark:border-gray-800">
                          <button onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-semibold text-danger transition-colors hover:bg-red-50 dark:hover:bg-red-900/20">
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
                <Link to="/auth/login" className="rounded-xl px-3 py-2 text-sm font-bold text-text-secondary transition-colors hover:text-primary dark:text-gray-300">
                  Sign In
                </Link>
                <Link to="/auth/signup">
                  <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="rounded-xl bg-gradient-to-r from-primary to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-glow transition-all hover:shadow-[0_0_20px_rgba(37,99,235,0.6)]">
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
