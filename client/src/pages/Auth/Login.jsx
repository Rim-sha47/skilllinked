import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { login } from '../../redux/slices/authSlice';
import api from '../../services/api';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(location.state?.message || '');
  
  const [form, setForm] = useState({ email: '', password: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (!form.email || !form.password) {
      setIsLoading(false);
      return setError('Please enter your email and password.');
    }

    try {
      const data = await api.post('/auth/login/user', {
        email: form.email,
        password: form.password,
      });

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

      // Navigate to dashboard
      navigate('/app/dashboard');
      
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setError('Account not found. Please register first.');
      } else if (err.response && err.response.status === 401) {
        setError('Incorrect password. Please try again.');
      } else {
        setError(err.message || 'Incorrect email or password. Please try again.');
      }
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
      
      // Navigate to dashboard
      navigate('/app/dashboard');
    } catch (err) {
      console.error('Google login error:', err);
      setError(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google login was unsuccessful. Please try again.');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gray-50 dark:bg-dark-bg">
      
      {/* Background orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/15 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="bg-white dark:bg-dark-card border border-gray-100 dark:border-gray-800 shadow-xl rounded-2xl p-8 sm:p-10">
          
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-5 shadow-lg">
              <span className="text-white font-bold text-xl tracking-tighter">SL</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome Back</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Login to your SkillLinked account.</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-sm font-medium text-center"
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 text-green-600 dark:text-green-400 text-sm font-medium text-center"
            >
              {success}
            </motion.div>
          )}

          <form className="space-y-4" onSubmit={handleLogin}>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder-gray-400 sm:text-sm"
                placeholder="Enter email"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Password</label>
                <Link to="#" className="text-xs font-medium text-primary hover:underline">Forgot Password?</Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-2.5 pr-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder-gray-400 sm:text-sm"
                  placeholder="Enter password"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              whileHover={!isLoading ? { y: -1 } : {}}
              whileTap={!isLoading ? { scale: 0.99 } : {}}
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-primary hover:bg-blue-600 text-white rounded-lg font-semibold text-sm transition-all disabled:opacity-70 flex items-center justify-center gap-2 mt-6"
            >
              {isLoading ? (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : 'Login'}
            </motion.button>
          </form>

          <div className="relative flex items-center py-6">
            <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 dark:text-gray-500 text-sm">OR</span>
            <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
          </div>
          
          <div className="flex justify-center mb-6">
            <GoogleLogin 
              onSuccess={handleGoogleSuccess} 
              onError={handleGoogleError} 
              text="continue_with"
              theme="outline"
              size="large"
              prompt="select_account"
            />
          </div>

          <p className="text-center mt-2 text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <Link to="/auth/signup" className="text-primary font-semibold hover:underline">Create Account</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
