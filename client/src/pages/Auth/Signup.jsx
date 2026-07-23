import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { login } from '../../redux/slices/authSlice';
import api from '../../services/api';
import { FaEye, FaEyeSlash, FaGoogle, FaGithub, FaLinkedin, FaCheck } from 'react-icons/fa';

const Signup = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ fullName: '', username: '', email: '', phoneNumber: '', password: '' });

  const passwordStrength = () => {
    const p = form.password;
    if (p.length === 0) return 0;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  };

  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['', 'bg-red-500', 'bg-warning', 'bg-yellow-400', 'bg-success'];
  const strength = passwordStrength();

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // api interceptor already unwraps response.data
      const data = await api.post('/auth/register/user', {
        fullName: form.fullName,
        username: form.username,
        email: form.email,
        phoneNumber: form.phoneNumber,
        password: form.password,
      });

      // Store tokens
      localStorage.setItem('token', data.accessToken);
      if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);

      dispatch(login({
        user: {
          _id: data._id,
          fullName: data.fullName,
          name: data.fullName,
          username: data.username,
          email: data.email,
          role: data.role,
          profilePicture: data.profilePicture || '',
        },
        token: data.accessToken,
      }));

      navigate('/app/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[40%] rounded-full bg-accent/15 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-2xl border border-white/50 dark:border-gray-700/50 shadow-2xl dark:shadow-black/50 rounded-3xl p-8 md:p-10">
          
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4 shadow-glow">
              <span className="text-white font-black text-xl">SL</span>
            </div>
            <h1 className="text-3xl font-extrabold text-text-primary dark:text-white tracking-tight">Create your account</h1>
            <p className="text-text-secondary dark:text-gray-400 font-medium mt-2">Join 50,000+ professionals on SkillLinked</p>
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

          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-gray-200 dark:border-gray-700" />
            <span className="mx-4 text-xs font-bold text-gray-400 uppercase tracking-widest">sign up below</span>
            <div className="flex-grow border-t border-gray-200 dark:border-gray-700" />
          </div>

          <form className="space-y-4" onSubmit={handleSignup}>
            
            <div>
              <label className="block text-sm font-bold text-text-primary dark:text-gray-200 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={form.fullName}
                onChange={e => setForm({ ...form, fullName: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-dark-bg/50 text-text-primary dark:text-white font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder-gray-400 text-sm"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-text-primary dark:text-gray-200 mb-1">Username</label>
              <input
                type="text"
                required
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-dark-bg/50 text-text-primary dark:text-white font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder-gray-400 text-sm"
                placeholder="johndoe123"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-text-primary dark:text-gray-200 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-dark-bg/50 text-text-primary dark:text-white font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder-gray-400 text-sm"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-text-primary dark:text-gray-200 mb-1">Phone Number</label>
              <input
                type="text"
                required
                value={form.phoneNumber}
                onChange={e => setForm({ ...form, phoneNumber: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-dark-bg/50 text-text-primary dark:text-white font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder-gray-400 text-sm"
                placeholder="+1 234 567 8900"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-text-primary dark:text-gray-200 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-dark-bg/50 text-text-primary dark:text-white font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder-gray-400 text-sm"
                  placeholder="Min. 6 characters"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors">
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {/* Strength Meter */}
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1.5">
                    {[1,2,3,4].map(i => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= strength ? strengthColors[strength] : 'bg-gray-200 dark:bg-gray-700'}`} />
                    ))}
                  </div>
                  <p className={`text-xs font-bold mt-1.5 ${strength >= 3 ? 'text-success' : strength === 2 ? 'text-warning' : 'text-danger'}`}>
                    {strengthLabels[strength]}
                  </p>
                </div>
              )}
            </div>

            <motion.button
              type="submit"
              whileHover={!isLoading ? { scale: 1.02 } : {}}
              whileTap={!isLoading ? { scale: 0.98 } : {}}
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl font-bold text-base shadow-glow hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] transition-all disabled:opacity-70 flex items-center justify-center gap-2 mt-4"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating Account...
                </>
              ) : 'Create Free Account'}
            </motion.button>

            <p className="text-center text-xs font-medium text-text-secondary dark:text-gray-500">
              By signing up, you agree to our{' '}
              <a href="#" className="text-primary hover:underline">Terms of Service</a>{' '}
              and{' '}
              <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
            </p>
          </form>



          <p className="text-center mt-4 text-sm font-medium text-text-secondary dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/auth/login" className="text-primary font-bold hover:text-blue-700 transition-colors">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
