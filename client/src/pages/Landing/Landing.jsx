import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { 
  FaUserTie, FaRobot, FaBriefcase, FaArrowRight, FaChartLine, 
  FaUsers, FaStar, FaShieldAlt, FaBolt, FaTrophy,
  FaChevronDown, FaCommentDots, FaNetworkWired, FaUserCheck,
  FaPlay, FaPause, FaTwitter, FaLinkedin, FaGithub
} from 'react-icons/fa';
import { useSocket } from '../../hooks/useSocket';
import api from '../../services/api';

// --- Shared Components & Utils ---
const AnimatedNumber = ({ value, suffix = '', prefix = '', decimals = 0, duration = 2000 }) => {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    let startValue = 0;
    const endValue = Number(value || 0);
    const startTime = performance.now();
    const step = (currentTime) => {
      const progress = Math.min(1, (currentTime - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 4); // Quartic ease out
      setDisplayValue(startValue + (endValue - startValue) * eased);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value, duration]);
  return <span>{prefix}{Number(displayValue).toFixed(decimals)}{suffix}</span>;
};

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return 'just now';
  const minutes = Math.max(1, Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

// --- Custom Transparent Navbar ---
const CustomNavbar = ({ isAuthenticated }) => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.nav 
      initial={{ y: -100 }} animate={{ y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}
      className={`fixed top-0 z-[100] w-full transition-all duration-500 ${
        scrolled ? 'bg-[#0B1120]/70 backdrop-blur-2xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)] py-3' : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <motion.div 
            whileHover={{ rotate: 90 }} transition={{ duration: 0.4 }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#38BDF8] shadow-[0_0_20px_rgba(59,130,246,0.5)] group-hover:shadow-[0_0_30px_rgba(56,189,248,0.8)]"
          >
            <span className="text-sm font-black text-white">SL</span>
          </motion.div>
          <span className="text-xl font-bold text-white tracking-tight">SkillLinked</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link to="/auth/login" className="hidden md:block text-sm font-semibold text-slate-300 hover:text-white transition-colors">
            Login
          </Link>
          <Link to={isAuthenticated ? '/app/dashboard' : '/auth/signup'}>
            <button className="relative overflow-hidden rounded-full bg-white/5 border border-white/10 px-6 py-2.5 text-sm font-semibold text-white backdrop-blur-md transition-all hover:bg-white/10 hover:border-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] group">
              <span className="relative z-10 flex items-center gap-2">
                {isAuthenticated ? 'Go to Dashboard' : 'Register'} <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#2563EB]/40 to-[#38BDF8]/40 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
            </button>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
};

// --- Main Landing Page Component ---
const Landing = () => {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { socket } = useSocket();
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  // 1. Logic for data fetching
  const [heroMetrics, setHeroMetrics] = useState({
    profileScore: 92, atsScore: 89, profileCompletion: 84, improvement: 27,
    profileViews: 2450, profileGrowth: 245, connections: 320, jobMatchScore: 88, engagementRate: 7.8,
    recentViewers: [
      { id: '1', fullName: 'Maya Chen', headline: 'Senior Product Designer', profilePicture: '', timeAgo: '2 min ago' },
    ],
    connectionRequest: {
      fullName: 'Michael Carter', headline: 'UI Designer', profilePicture: '', message: 'Sent you a connection request',
    },
    recommendation: { label: 'Based on your skills', jobsFound: 12, action: 'View jobs' },
  });

  const loadHeroData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [profileRes, dashboardRes, notificationsRes, jobsRes] = await Promise.all([
        api.get('/profiles/me').catch(() => null),
        api.get('/profiles/dashboard').catch(() => null),
        api.get('/notifications').catch(() => []),
        api.get('/jobs').catch(() => []),
      ]);
      const profile = profileRes?.profile || profileRes?.data || profileRes || {};
      const dashboard = dashboardRes?.dashboard || dashboardRes?.data || dashboardRes || {};
      const notifications = Array.isArray(notificationsRes) ? notificationsRes : notificationsRes?.notifications || notificationsRes?.data || [];
      const jobs = Array.isArray(jobsRes) ? jobsRes : jobsRes?.jobs || jobsRes?.data || [];

      const profileCompletion = Math.min(99, Math.max(60, Number(dashboard?.profileCompletion || profile?.profileCompletion || 84)));
      const profileScore = Math.min(99, Math.round(profileCompletion * 0.92 + 6));
      const profileViews = Math.max(1200, Number(dashboard?.profileViews || profile?.profileViews || 2450));
      const profileGrowth = Math.max(120, Number(dashboard?.followersGrowth || profile?.followersGrowth || 245));
      const connections = Math.max(120, Number(profile?.connectionsCount || dashboard?.connections || 320));
      const jobMatchScore = Math.min(99, Math.round((profileCompletion * 0.6) + (connections / 10) + 5));

      const recentViewers = await Promise.all(
        notifications.filter(i => i.type === 'profile_view').slice(0, 1).map(async (item) => {
          let senderDetails = item.sender;
          if (typeof senderDetails === 'string') {
            try {
              const res = await api.get(`/profiles/user/${item.sender}`).catch(() => null);
              senderDetails = res?.user || res?.profile || res?.data || res || {};
            } catch (e) {}
          }
          return {
            id: item._id || item.id,
            fullName: senderDetails?.fullName || 'A visionary professional',
            headline: senderDetails?.headline || 'Recently viewed your profile',
            profilePicture: senderDetails?.profilePicture || '',
            timeAgo: formatTimeAgo(item.createdAt),
          };
        })
      );

      const connectionRequestItem = notifications.find(i => i.type === 'connection_request');
      const connectionRequest = connectionRequestItem ? {
        fullName: connectionRequestItem.sender?.fullName || 'Michael Carter',
        headline: connectionRequestItem.sender?.headline || 'UI Designer',
        profilePicture: connectionRequestItem.sender?.profilePicture || '',
        message: 'Sent connection request',
      } : heroMetrics.connectionRequest;

      setHeroMetrics(prev => ({
        ...prev, profileScore, profileViews, profileGrowth, connections, jobMatchScore,
        recentViewers: recentViewers.length ? recentViewers : prev.recentViewers,
        connectionRequest,
        recommendation: { label: 'Based on your skills', jobsFound: jobs.length || 12, action: 'View jobs' },
      }));
    } catch (error) {}
  }, [isAuthenticated]);

  useEffect(() => { loadHeroData(); }, [loadHeroData]);
  useEffect(() => {
    if (!socket || !isAuthenticated) return;
    socket.on('notification', loadHeroData);
    socket.on('profile_viewed', loadHeroData);
    return () => { socket.off('notification', loadHeroData); socket.off('profile_viewed', loadHeroData); };
  }, [socket, isAuthenticated, loadHeroData]);

  const handleParallaxMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20; // 20deg max rotation
    const y = ((rect.top + rect.height / 2 - e.clientY) / rect.height) * 20;
    setParallax({ x, y });
  }, []);

  // 3D Card Animation Variants
  const cardFloat = (delay, invert = false) => ({
    animate: {
      y: [0, invert ? 15 : -15, 0],
      x: [0, invert ? -10 : 10, 0],
      rotateZ: [0, invert ? -2 : 2, 0],
      transition: { duration: 6, repeat: Infinity, delay, ease: "easeInOut" }
    }
  });

  return (
    <div className="relative min-h-screen bg-[#0B1120] text-slate-100 font-sans selection:bg-[#3B82F6]/30 overflow-x-hidden">
      <CustomNavbar isAuthenticated={isAuthenticated} />

      {/* --- Animated Background --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#2563EB]/20 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#38BDF8]/15 blur-[150px] animate-pulse" style={{ animationDuration: '10s' }}></div>
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-indigo-500/10 blur-[100px] animate-pulse" style={{ animationDuration: '12s' }}></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')] opacity-20 mix-blend-overlay"></div>
      </div>

      {/* --- Hero Section --- */}
      <section className="relative z-10 pt-20 pb-20 lg:pt-20 lg:pb-32 px-6 lg:px-8 max-w-[1400px] mx-auto flex items-center">
        <div className="grid lg:grid-cols-2 gap-16 items-center w-full mt-4 lg:mt-0">
          
          {/* Left Column */}
          <motion.div style={{ y: heroY, opacity }} className="flex flex-col items-start max-w-2xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1.5 px-4 backdrop-blur-md"
            >
              <div className="w-2 h-2 rounded-full bg-[#38BDF8] animate-pulse shadow-[0_0_10px_#38BDF8]"></div>
              <span className="text-xs font-semibold tracking-wide text-slate-300">Introducing SkillLinked 3.0</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight mb-6"
            >
              Elevate Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38BDF8] via-[#3B82F6] to-[#2563EB] animate-gradient-x">
                Professional Future
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
              className="text-lg text-slate-400 mb-10 leading-relaxed max-w-xl"
            >
              The next-generation AI-powered professional networking platform connecting students, professionals and companies through intelligent networking, career guidance, and job matching.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-wrap gap-4 w-full"
            >
              <Link to="/auth/signup">
                <button className="group relative overflow-hidden rounded-2xl bg-[#2563EB] px-8 py-4 text-base font-semibold text-white shadow-[0_0_40px_rgba(37,99,235,0.4)] transition-all hover:scale-105 hover:shadow-[0_0_60px_rgba(37,99,235,0.6)] active:scale-95">
                  <span className="relative z-10 flex items-center gap-2">
                    Get Started <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#3B82F6] to-[#38BDF8] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              </Link>
              <Link to="/auth/login">
                <button className="group relative rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-base font-semibold text-white backdrop-blur-md transition-all hover:bg-white/10 hover:border-white/20 active:scale-95 flex items-center gap-2">
                  <FaStar className="text-[#38BDF8] group-hover:rotate-12 transition-transform" /> Explore Jobs
                </button>
              </Link>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 1 }}
              className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 w-full border-t border-white/10 pt-8"
            >
              {[
                { label: 'Professionals', value: 50, suffix: 'K+' },
                { label: 'Companies', value: 10, suffix: 'K+' },
                { label: 'Jobs', value: 100, suffix: 'K+' },
                { label: 'AI Accuracy', value: 95, suffix: '%' }
              ].map((stat, i) => (
                <div key={i} className="flex flex-col">
                  <div className="text-2xl font-bold text-white mb-1">
                    <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Column - 3D Hero */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1, delay: 0.2 }}
            className="relative h-[350px] sm:h-[450px] lg:h-[600px] w-full block perspective-1000 mt-12 lg:mt-0"
            onMouseMove={handleParallaxMove}
            onMouseLeave={() => setParallax({ x: 0, y: 0 })}
          >
            {/* Main Image */}
            <motion.div 
              className="absolute inset-0 flex items-center justify-center transform-style-3d transition-transform duration-200 ease-out"
              style={{ transform: `rotateX(${parallax.y}deg) rotateY(${parallax.x}deg)` }}
            >
              <div className="relative w-[85%] h-[85%] rounded-[32px] overflow-hidden border border-white/20 bg-slate-800 shadow-[0_30px_100px_rgba(37,99,235,0.3)]">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#2563EB]/20 to-transparent z-10 pointer-events-none"></div>
                <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80" alt="Professionals Networking" className="w-full h-full object-cover opacity-80" />
              </div>
            </motion.div>

            {/* 3D Floating Cards */}
            <motion.div variants={cardFloat(0)} animate="animate" whileHover={{ scale: 1.05 }} onClick={() => navigate(isAuthenticated ? '/app/dashboard' : '/auth/login')} className="absolute top-2 -left-2 sm:top-10 sm:-left-6 z-20 w-40 sm:w-64 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-3 sm:p-4 shadow-2xl cursor-pointer hover:bg-white/20 transition-colors" style={{ transform: 'translateZ(60px)' }}>
              <div className="flex justify-between items-start mb-2 sm:mb-3">
                <div className="p-1.5 sm:p-2 rounded-xl bg-[#2563EB]/20 text-[#3B82F6]"><FaRobot size={16} className="w-4 h-4 sm:w-5 sm:h-5" /></div>
                <span className="text-[10px] sm:text-xs font-bold text-[#38BDF8] bg-[#38BDF8]/10 px-2 py-1 rounded-full">Score</span>
              </div>
              <h4 className="text-slate-400 text-[10px] sm:text-xs uppercase font-bold tracking-wider mb-1">Resume Score</h4>
              <p className="text-lg sm:text-2xl font-bold text-white">{heroMetrics.profileScore}<span className="text-[10px] sm:text-sm text-slate-500">/100</span></p>
            </motion.div>

            <motion.div variants={cardFloat(1.5, true)} animate="animate" whileHover={{ scale: 1.05 }} onClick={() => navigate(isAuthenticated ? '/app/jobs' : '/auth/login')} className="absolute bottom-6 -left-4 sm:bottom-20 sm:-left-10 z-20 w-44 sm:w-64 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-3 sm:p-4 shadow-2xl cursor-pointer hover:bg-white/20 transition-colors" style={{ transform: 'translateZ(80px)' }}>
              <div className="flex justify-between items-start mb-2 sm:mb-3">
                <div className="p-1.5 sm:p-2 rounded-xl bg-[#38BDF8]/20 text-[#38BDF8]"><FaStar size={16} className="w-4 h-4 sm:w-5 sm:h-5" /></div>
                <span className="text-[10px] sm:text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">Match</span>
              </div>
              <h4 className="text-slate-400 text-[10px] sm:text-xs uppercase font-bold tracking-wider mb-1">AI Job Match</h4>
              <p className="text-lg sm:text-2xl font-bold text-white">{heroMetrics.jobMatchScore}% <span className="text-[9px] sm:text-sm font-normal text-slate-300 block sm:inline">Matching Jobs</span></p>
            </motion.div>

            <motion.div variants={cardFloat(0.5)} animate="animate" whileHover={{ scale: 1.05 }} onClick={() => navigate(isAuthenticated && heroMetrics.recentViewers[0]?.id ? `/profiles/user/${heroMetrics.recentViewers[0].id}` : '/auth/login')} className="absolute top-1/4 -right-2 sm:top-1/3 sm:-right-12 z-20 w-48 sm:w-72 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-3 sm:p-4 shadow-2xl cursor-pointer hover:bg-white/20 transition-colors" style={{ transform: 'translateZ(100px)' }}>
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="w-8 h-8 sm:w-12 sm:h-12 shrink-0 rounded-full bg-gradient-to-br from-[#2563EB] to-[#38BDF8] flex items-center justify-center text-sm sm:text-xl font-bold text-white overflow-hidden border-2 border-white/10">
                  {heroMetrics.recentViewers[0]?.profilePicture ? (
                    <img src={heroMetrics.recentViewers[0].profilePicture} alt="Avatar" className="w-full h-full object-cover" />
                  ) : heroMetrics.recentViewers[0]?.fullName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h4 className="text-white text-[11px] sm:text-sm font-bold truncate">{heroMetrics.recentViewers[0]?.fullName}</h4>
                  <p className="text-slate-400 text-[9px] sm:text-xs truncate">{heroMetrics.recentViewers[0]?.headline}</p>
                </div>
              </div>
              <div className="mt-2 sm:mt-4 pt-2 sm:pt-3 border-t border-white/10 flex justify-between items-center">
                <p className="text-[9px] sm:text-xs text-slate-300">Viewed your profile</p>
                <button onClick={(e) => { e.stopPropagation(); navigate(isAuthenticated ? '/app/network' : '/auth/login'); }} className="text-[10px] sm:text-xs font-bold text-[#3B82F6] hover:text-[#38BDF8] bg-blue-500/10 hover:bg-blue-500/20 px-2 py-1 rounded-md transition-colors">
                  Connect
                </button>
              </div>
            </motion.div>

            <motion.div variants={cardFloat(2.5, true)} animate="animate" whileHover={{ scale: 1.05 }} onClick={() => navigate(isAuthenticated ? '/app/dashboard' : '/auth/login')} className="absolute bottom-2 right-0 sm:bottom-10 sm:right-0 z-20 w-32 sm:w-56 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-3 sm:p-4 shadow-2xl cursor-pointer hover:bg-white/20 transition-colors" style={{ transform: 'translateZ(50px)' }}>
              <div className="flex justify-between items-start mb-2 sm:mb-3">
                <div className="p-1.5 sm:p-2 rounded-xl bg-purple-500/20 text-purple-400"><FaChartLine size={16} className="w-4 h-4 sm:w-5 sm:h-5" /></div>
              </div>
              <h4 className="text-slate-400 text-[10px] sm:text-xs uppercase font-bold tracking-wider mb-1">Growth</h4>
              <p className="text-lg sm:text-2xl font-bold text-white">+{heroMetrics.profileGrowth}%</p>
            </motion.div>

          </motion.div>
        </div>
      </section>

      {/* --- Trusted Companies --- */}
      <section className="relative z-10 py-12 border-y border-white/5 bg-white/[0.02] backdrop-blur-sm overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <p className="text-center text-xs font-bold text-slate-500 uppercase tracking-widest mb-8">Trusted by AI-driven teams at</p>
          <div className="flex flex-wrap justify-center gap-12 lg:gap-24 opacity-60 grayscale hover:grayscale-0 transition-all duration-700">
            {['Google', 'Microsoft', 'Meta', 'Amazon', 'Netflix'].map((company) => (
              <motion.div key={company} whileHover={{ scale: 1.1, opacity: 1 }} className="text-2xl font-black tracking-tighter text-white transition-all cursor-pointer hover:text-[#38BDF8] hover:drop-shadow-[0_0_10px_rgba(56,189,248,0.8)]">
                {company}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Premium Features Section --- */}
      <section className="relative z-10 py-32 px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Designed for the <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38BDF8] to-[#2563EB]">Modern Professional</span></h2>
          <p className="text-lg text-slate-400">Experience a networking platform that leverages artificial intelligence to accelerate your career trajectory.</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { icon: FaRobot, title: 'AI Resume Analysis', desc: 'Get actionable insights and score improvements before you even apply.' },
            { icon: FaBriefcase, title: 'Smart Job Matching', desc: 'Our algorithm finds the roles that perfectly align with your unique skill set.' },
            { icon: FaNetworkWired, title: 'Intelligent Networking', desc: 'Connect with industry leaders and peers that matter to your specific goals.' },
            { icon: FaUserCheck, title: 'Career Coach', desc: '24/7 AI coaching to help you negotiate, prepare for interviews, and grow.' },
            { icon: FaCommentDots, title: 'Meaningful Messaging', desc: 'Cut through the noise with AI-suggested icebreakers and follow-ups.' },
            { icon: FaTrophy, title: 'Portfolio Builder', desc: 'Showcase your best work in a stunning, auto-generated premium portfolio.' }
          ].map((feat, i) => (
            <motion.div 
              key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }}
              className="group relative rounded-3xl bg-white/5 border border-white/10 p-8 hover:bg-white/10 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#2563EB]/0 to-[#38BDF8]/0 group-hover:from-[#2563EB]/10 group-hover:to-[#38BDF8]/10 rounded-3xl transition-all duration-500 pointer-events-none"></div>
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl text-[#38BDF8] mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-[0_0_20px_rgba(56,189,248,0)] group-hover:shadow-[0_0_20px_rgba(56,189,248,0.3)]">
                <feat.icon />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{feat.title}</h3>
              <p className="text-slate-400 leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* --- AI Showcase (Interactive Mock) --- */}
      <section className="relative z-10 py-32 bg-gradient-to-b from-transparent to-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Your Personal <br /><span className="text-[#38BDF8]">AI Career Coach</span></h2>
            <p className="text-lg text-slate-400 mb-8">SkillLinked's advanced AI analyzes your profile, suggests improvements, and even helps you draft cover letters in seconds.</p>
            
            <ul className="space-y-4 mb-10">
              {['Resume Analyzer', 'Interview Assistant', 'Career Roadmap', 'Job Recommendations'].map((item) => (
                <li key={item} className="flex items-center gap-3 text-slate-300 font-medium">
                  <div className="w-6 h-6 rounded-full bg-[#2563EB]/20 text-[#3B82F6] flex items-center justify-center text-xs"><FaShieldAlt /></div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="lg:w-1/2 w-full">
            <div className="rounded-3xl bg-[#0F172A] border border-white/10 overflow-hidden shadow-2xl flex flex-col h-[400px]">
              <div className="bg-white/5 border-b border-white/10 px-6 py-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#2563EB] to-[#38BDF8] flex items-center justify-center text-white"><FaRobot /></div>
                <div>
                  <h4 className="text-white font-bold text-sm">SkillLinked AI</h4>
                  <p className="text-xs text-emerald-400">Online</p>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col gap-4 overflow-y-auto">
                <div className="self-end bg-[#2563EB] text-white px-4 py-2 rounded-2xl rounded-tr-sm text-sm max-w-[80%] shadow-md">
                  Can you review my latest resume?
                </div>
                <div className="self-start bg-white/10 border border-white/5 text-slate-200 px-4 py-3 rounded-2xl rounded-tl-sm text-sm max-w-[85%] shadow-md flex items-start gap-3">
                  <FaRobot className="text-[#38BDF8] mt-1 shrink-0" />
                  <div>
                    <p className="mb-2">I've analyzed your resume! Your ATS score is <strong>89/100</strong>.</p>
                    <p>Recommendation: Add more metrics to your recent role at TechCorp to increase match rate by 15%.</p>
                  </div>
                </div>
                <div className="self-start bg-transparent px-4 py-2 rounded-2xl text-sm flex gap-2 items-center">
                  <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Dashboard Preview & Timeline --- */}
      <section className="relative z-10 py-32 px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-16">The Journey to Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] to-[#38BDF8]">Dream Role</span></h2>
        
        <div className="flex flex-col md:flex-row justify-between items-center relative max-w-4xl mx-auto">
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#2563EB] to-transparent md:hidden"></div>
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-[#2563EB] via-[#38BDF8] to-[#2563EB] hidden md:block"></div>
          
          {['Create Profile', 'Build Network', 'Improve Resume', 'Apply Jobs', 'Get Hired'].map((step, i) => (
            <motion.div 
              key={step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.2 }}
              className="relative z-10 flex flex-col items-center gap-4 my-8 md:my-0 bg-[#0B1120] p-4"
            >
              <div className="w-12 h-12 rounded-full bg-[#0B1120] border-2 border-[#38BDF8] flex items-center justify-center text-[#38BDF8] font-bold text-lg shadow-[0_0_15px_rgba(56,189,248,0.5)]">
                {i + 1}
              </div>
              <span className="font-semibold text-slate-300">{step}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* --- Giant Gradient CTA --- */}
      <section className="relative z-10 py-24 px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
            className="relative rounded-[40px] overflow-hidden p-16 text-center border border-white/20 shadow-[0_40px_100px_rgba(37,99,235,0.4)]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#2563EB] to-[#0F172A] z-0"></div>
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')] opacity-30 mix-blend-overlay z-0"></div>
            
            <div className="relative z-10 flex flex-col items-center">
              <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">Ready to Build Your Career?</h2>
              <p className="text-xl text-blue-100 mb-10 max-w-2xl">Join the elite network of professionals worldwide leveraging AI to unlock their true potential.</p>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                <Link to="/auth/signup">
                  <button className="group w-full sm:w-auto overflow-hidden rounded-full bg-white px-10 py-4 text-lg font-bold text-[#2563EB] shadow-xl transition-all hover:scale-105 active:scale-95">
                    Create Account
                  </button>
                </Link>
                <Link to="/auth/login">
                  <button className="group w-full sm:w-auto rounded-full border border-white/30 bg-white/10 px-10 py-4 text-lg font-bold text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-95">
                    Explore Jobs
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="relative z-10 border-t border-white/10 bg-[#070B14] pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 mb-16">
            <div className="col-span-2">
              <Link to="/" className="flex items-center gap-2 mb-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#2563EB] to-[#38BDF8]">
                  <span className="text-xs font-black text-white">SL</span>
                </div>
                <span className="text-xl font-bold text-white tracking-tight">SkillLinked</span>
              </Link>
              <p className="text-slate-400 text-sm max-w-xs mb-6">The AI-powered professional networking platform designed to accelerate your career growth.</p>
              <div className="flex gap-4">
                {[FaTwitter, FaLinkedin, FaGithub].map((Icon, i) => (
                  <a key={i} href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                    <Icon size={18} />
                  </a>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Platform</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><a href="#" className="hover:text-[#38BDF8] transition-colors">Jobs</a></li>
                <li><a href="#" className="hover:text-[#38BDF8] transition-colors">Companies</a></li>
                <li><a href="#" className="hover:text-[#38BDF8] transition-colors">AI Hub</a></li>
                <li><a href="#" className="hover:text-[#38BDF8] transition-colors">Pricing</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Resources</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><a href="#" className="hover:text-[#38BDF8] transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-[#38BDF8] transition-colors">Career Advice</a></li>
                <li><a href="#" className="hover:text-[#38BDF8] transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-[#38BDF8] transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Company</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><a href="#" className="hover:text-[#38BDF8] transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-[#38BDF8] transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-[#38BDF8] transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-[#38BDF8] transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-500">© 2026 SkillLinked. All rights reserved.</p>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              Designed with <span className="text-[#38BDF8]">AI</span> for the future.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
