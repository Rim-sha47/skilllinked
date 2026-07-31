import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { login } from '../../redux/slices/authSlice';
import api from '../../services/api';
import { FaEye, FaEyeSlash, FaGithub, FaLinkedin, FaShieldAlt } from 'react-icons/fa';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(location.state?.message || '');
  const [loginType, setLoginType] = useState('user'); // 'user' | 'admin'
  const [form, setForm] = useState({ identifier: '', email: '', password: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      let responseData;

      if (loginType === 'admin') {
        // Admin login — uses separate Admin collection
        responseData = await api.post('/auth/login/admin', {
          identifier: form.identifier,
          password: form.password,
        });
      } else {
        // Regular user login — supports email, username, or phone
        responseData = await api.post('/auth/login/user', {
          identifier: form.identifier,
          password: form.password,
        });
      }

      // api interceptor already unwraps response.data, so responseData IS the data
      const data = responseData;

      // Store tokens in localStorage
      localStorage.setItem('token', data.accessToken);
      if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);

      // Dispatch login action with user data
      dispatch(login({
        user: {
          _id: data._id,
          fullName: data.fullName,
          name: data.fullName,
          username: data.username || '',
          email: data.email,
          role: data.role,
          profilePicture: data.profilePicture || data.avatar || '',
        },
        token: data.accessToken,
      }));

      // Admin goes to admin panel, user goes to dashboard
      if (data.role === 'Admin') {
        navigate('/app/admin');
      } else {
        navigate('/app/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please check your details.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google credential response
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setIsLoading(true);
      const { credential } = credentialResponse; // ID token
      const res = await api.post('/auth/google', { idToken: credential });
      const data = res; // interceptor unwraps
      // Store tokens
      localStorage.setItem('token', data.accessToken);
      if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
      // Dispatch login
      dispatch(
        login({
          user: {
            _id: data._id,
            fullName: data.fullName,
            username: data.username,
            email: data.email,
            role: data.role,
            profilePicture: data.profilePicture || '',
          },
          token: data.accessToken,
        })
      );
      // Navigate to dashboard (Google sign‑in is for users only)
      navigate('/app/dashboard');
    } catch (err) {
      console.error('Google login error:', err);
      setError(err.message || 'Google sign‑in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google login was unsuccessful. Please try again.');
  };



  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/15 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full relative z-10"
      >
        {/* Card */}
        <div className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-2xl border border-white/50 dark:border-gray-700/50 shadow-2xl dark:shadow-black/50 rounded-3xl p-8 md:p-10">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4 shadow-glow">
              <span className="text-white font-black text-xl">SL</span>
            </div>
            <h1 className="text-3xl font-extrabold text-text-primary dark:text-white tracking-tight">Welcome back</h1>
            <p className="text-text-secondary dark:text-gray-400 font-medium mt-2">Sign in to your SkillLinked account</p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium text-center"
            >
              {error}
            </motion.div>
          )}

          {/* Success Message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 text-sm font-medium text-center"
            >
              {success}
            </motion.div>
          )}

          {/* Social Login */}
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            {loginType === 'user' && (
              <div className="flex items-center justify-center w-full mb-2">
                <GoogleLogin 
                  onSuccess={handleGoogleSuccess} 
                  onError={handleGoogleError} 
                  text="continue_with"
                  theme="outline"
                  size="large"
                  prompt="select_account"
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 w-full">
              {[
                { Icon: FaGithub, label: 'GitHub', color: 'hover:text-gray-900 dark:hover:text-white hover:border-gray-400' },
                { Icon: FaLinkedin, label: 'LinkedIn', color: 'hover:text-blue-600 hover:border-blue-400' },
              ].map(({ Icon, label, color }) => (
                <button key={label} className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-dark-bg/50 text-text-secondary dark:text-gray-400 font-semibold text-xs transition-all ${color}`}>
                  <Icon className="text-xl" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-gray-200 dark:border-gray-700" />
            <span className="mx-4 text-xs font-bold text-gray-400 uppercase tracking-widest">or continue with</span>
            <div className="flex-grow border-t border-gray-200 dark:border-gray-700" />
          </div>

          {/* Login Type Toggle */}
          <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 p-1 mb-6 bg-gray-50 dark:bg-dark-bg">
            <button
              type="button"
              onClick={() => { setLoginType('user'); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                loginType === 'user'
                  ? 'bg-white dark:bg-dark-card text-primary shadow-sm'
                  : 'text-text-secondary dark:text-gray-400 hover:text-text-primary'
              }`}
            >
              👤 User Login
            </button>
            <button
              type="button"
              onClick={() => { setLoginType('admin'); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                loginType === 'admin'
                  ? 'bg-gradient-to-r from-purple-600 to-primary text-white shadow-sm'
                  : 'text-text-secondary dark:text-gray-400 hover:text-text-primary'
              }`}
            >
              <FaShieldAlt size={12} /> Admin Login
            </button>
          </div>

          {/* Form */}
          <form className="space-y-5" onSubmit={handleLogin}>
            
            {loginType === 'admin' ? (
              <div>
                <label htmlFor="admin-identifier" className="block text-sm font-bold text-text-primary dark:text-gray-200 mb-2">Admin Email or Full Name</label>
                <input
                  id="admin-identifier"
                  type="text"
                  required
                  value={form.identifier}
                  onChange={e => setForm({ ...form, identifier: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-dark-bg/50 text-text-primary dark:text-white font-medium focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder-gray-400 text-sm"
                  placeholder="Enter admin email or full name"
                />
              </div>
            ) : (
              <div>
                <label htmlFor="identifier" className="block text-sm font-bold text-text-primary dark:text-gray-200 mb-2">Email, Username, Phone or Full Name</label>
                <input
                  id="identifier"
                  type="text"
                  required
                  value={form.identifier}
                  onChange={e => setForm({ ...form, identifier: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-dark-bg/50 text-text-primary dark:text-white font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder-gray-400 text-sm"
                  placeholder="Enter email, username, phone or full name"
                />
              </div>
            )}

            <div>
              <div className="flex justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-bold text-text-primary dark:text-gray-200">Password</label>
                <a href="#" className="text-sm font-semibold text-primary hover:text-blue-700 transition-colors">Forgot password?</a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-3.5 pr-12 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-dark-bg/50 text-text-primary dark:text-white font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder-gray-400 text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {loginType === 'user' && (
              <div className="flex items-center">
                <input id="remember" type="checkbox" className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer" />
                <label htmlFor="remember" className="ml-2 text-sm font-medium text-text-secondary dark:text-gray-400 cursor-pointer">Remember me for 30 days</label>
              </div>
            )}

            <motion.button
              type="submit"
              whileHover={!isLoading ? { scale: 1.02 } : {}}
              whileTap={!isLoading ? { scale: 0.98 } : {}}
              disabled={isLoading}
              className={`w-full py-3.5 px-4 text-white rounded-xl font-bold text-base transition-all disabled:opacity-70 flex items-center justify-center gap-2 ${
                loginType === 'admin'
                  ? 'bg-gradient-to-r from-purple-600 to-primary shadow-[0_0_20px_rgba(147,51,234,0.4)] hover:shadow-[0_0_25px_rgba(147,51,234,0.6)]'
                  : 'bg-gradient-to-r from-primary to-blue-600 shadow-glow hover:shadow-[0_0_25px_rgba(37,99,235,0.5)]'
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </>
              ) : loginType === 'admin' ? (
                <><FaShieldAlt /> Sign In as Admin</>
              ) : 'Sign In'}
            </motion.button>
          </form>

          <p className="text-center mt-6 text-sm font-medium text-text-secondary dark:text-gray-400">
            Don't have an account?{' '}
            <Link to="/auth/signup" className="text-primary font-bold hover:text-blue-700 transition-colors">Create one free</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
