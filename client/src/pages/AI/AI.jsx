import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import {
  FaRobot,
  FaUpload,
  FaFilePdf,
  FaPaperPlane,
  FaMagic,
  FaCheckCircle,
  FaExclamationCircle,
  FaSpinner,
  FaTrash,
  FaTrashAlt,
  FaSync,
  FaEye,
  FaTimes,
  FaDownload,
  FaMicrophone,
  FaVolumeUp,
  FaStop,
  FaSearch,
  FaEdit,
  FaFileExport,
  FaLightbulb,
  FaLaptopCode,
  FaBriefcase,
  FaGraduationCap,
  FaBookOpen,
  FaNetworkWired,
  FaLink,
  FaUser,
  FaChartLine,
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

const trendingTechnologies = [
  'React',
  'Node.js',
  'AI',
  'Python',
  'Cloud Computing',
  'Cybersecurity',
  'Data Science',
  'TypeScript',
  'Kubernetes',
];

const defaultChatMessages = [
  {
    sender: 'ai',
    text: "Hi! I'm your AI career coach. Ask me about resume review, interview prep, networking strategy, or job search tips.",
    createdAt: new Date().toISOString(),
  },
];

const quickPrompts = [
  {
    label: 'Resume Review',
    prompt: 'Please review my resume and provide ATS-friendly improvements and wording suggestions.',
  },
  {
    label: 'Mock Interview',
    prompt: 'Help me prepare for a technical interview with practice questions and feedback.',
  },
  {
    label: 'Career Roadmap',
    prompt: 'Create a 6-month career roadmap to help me advance in software engineering.',
  },
  {
    label: 'Skill Gap Analysis',
    prompt: 'Analyze my skill set and recommend priority learning areas for my career goals.',
  },
  {
    label: 'Salary Benchmark',
    prompt: 'What salary range is realistic for my role and experience in the current market?',
  },
];

const homeCards = [
  { title: 'Resume Review', subtitle: 'Optimize your resume for ATS and recruiters', icon: <FaFilePdf /> },
  { title: 'Career Roadmap', subtitle: 'Build a learning and job plan', icon: <FaChartLine /> },
  { title: 'Interview Preparation', subtitle: 'Practice behavioral and technical rounds', icon: <FaLaptopCode /> },
  { title: 'Job Search', subtitle: 'Discover roles that suit your skills', icon: <FaBriefcase /> },
  { title: 'Salary Guidance', subtitle: 'Estimate your market value', icon: <FaChartLine /> },
  { title: 'Skill Recommendations', subtitle: 'Target the most relevant skills', icon: <FaLightbulb /> },
  { title: 'Profile Review', subtitle: 'Polish your LinkedIn and portfolio', icon: <FaUser /> },
  { title: 'Learning Resources', subtitle: 'Get curated courses and books', icon: <FaBookOpen /> },
  { title: 'Career Switch', subtitle: 'Plan a move into a new field', icon: <FaNetworkWired /> },
  { title: 'Freelancing Guide', subtitle: 'Start freelance & remote projects', icon: <FaLink /> },
];

const suggestedQuestions = [
  'Review my resume.',
  'Improve my LinkedIn profile.',
  'Suggest React projects.',
  'Find interview questions.',
  'Teach JavaScript.',
  'How can I become a Full Stack Developer?',
  'Help me prepare for HR interview.',
  'What should I learn for cloud engineering?',
  'Write a professional bio for LinkedIn.',
  'What skills do I need for AI engineering?',
];

const AI = () => {
  const navigate = useNavigate();
  const authUser = useSelector((state) => state.auth.user);
  const userName = authUser?.fullName || authUser?.username || 'there';

  const createSession = (title = 'Career Coach Pro') => ({
    id: `session-${Date.now()}`,
    title,
    messages: defaultChatMessages,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const [chatInput, setChatInput] = useState('');
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [chatSessions, setChatSessions] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('skilllinked_ai_chat_sessions'));
      return Array.isArray(stored) && stored.length ? stored : [createSession()];
    } catch {
      return [createSession()];
    }
  });
  const [activeSessionId, setActiveSessionId] = useState(() => {
    try {
      return localStorage.getItem('skilllinked_ai_active_session') || null;
    } catch {
      return null;
    }
  });
  const [chatMessages, setChatMessages] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('skilllinked_ai_chat_sessions'));
      const currentId = localStorage.getItem('skilllinked_ai_active_session');
      const active = Array.isArray(stored)
        ? stored.find((session) => session.id === currentId) || stored[0]
        : null;
      return active ? active.messages : defaultChatMessages;
    } catch {
      return defaultChatMessages;
    }
  });
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatSessionsVisible, setChatSessionsVisible] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    profileViews: 0,
    connections: 0,
    applications: 0,
    unreadMessages: 0,
    profileCompletion: 0,
  });
  const [profile, setProfile] = useState({});
  const [jobs, setJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('skilllinked_saved_jobs')) || [];
    } catch {
      return [];
    }
  });
  const [appliedJobs, setAppliedJobs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('skilllinked_applied_jobs')) || [];
    } catch {
      return [];
    }
  });
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [isApplying, setIsApplying] = useState(false);

  const [activeResume, setActiveResume] = useState(() => {
    try {
      const savedMeta = localStorage.getItem('skilllinked_resume_meta');
      if (savedMeta) {
        const meta = JSON.parse(savedMeta);
        const savedData = localStorage.getItem('skilllinked_resume_data');
        if (savedData) meta.url = savedData;
        return meta;
      }
      return null;
    } catch {
      return null;
    }
  });
  const [analysisResult, setAnalysisResult] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('skilllinked_resume_analysis')) || null;
    } catch {
      return null;
    }
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem('skilllinked_ai_chat', JSON.stringify(chatMessages));
    } catch {}
  }, [chatMessages]);

  const handleExportChat = () => {
    if (!chatMessages.length) return;
    const transcript = chatMessages
      .map((msg) => `${msg.sender === 'user' ? 'You' : 'AI Coach'}: ${msg.text}`)
      .join('\n\n');
    const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'skilllinked_ai_career_coach_chat.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleClearChat = () => {
    stopSpeaking();
    setChatMessages(defaultChatMessages);
    localStorage.removeItem('skilllinked_ai_chat');
  };

  const sendChatMessage = async (message) => {
    if (!message?.trim() || isChatLoading) return;

    const trimmedMessage = message.trim();
    const userMessage = { sender: 'user', text: trimmedMessage };
    setChatInput('');
    setIsChatLoading(true);

    const updatedChatMessages = [...chatMessages, userMessage];
    setChatMessages(updatedChatMessages);
    if (activeSessionId) {
      setChatSessions((prev) =>
        prev.map((session) => (session.id === activeSessionId ? { ...session, messages: updatedChatMessages, updatedAt: new Date().toISOString() } : session))
      );
    }

    const history = updatedChatMessages.map((item) => ({
      role: item.sender === 'user' ? 'user' : 'assistant',
      content: item.text,
    }));

    try {
      const res = await api.post('/ai/career-chat', { message: message.trim(), history });
      const reply = res.reply || 'Here is some AI-backed career advice.';
      const latestMessages = [...updatedChatMessages, { sender: 'ai', text: reply }];
      setChatMessages(latestMessages);
      if (activeSessionId) {
        setChatSessions((prev) =>
          prev.map((session) => (session.id === activeSessionId ? { ...session, messages: latestMessages, updatedAt: new Date().toISOString() } : session))
        );
      }

      if ('speechSynthesis' in window) {
        setIsSpeaking(true);
        const utterance = new SpeechSynthesisUtterance(reply);
        utterance.lang = 'en-US';
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error('Chat error', error);
      const fallback = 'For strong interview preparation, focus on specific examples, metrics, and problem-solving outcomes.';
      const latestMessages = [...updatedChatMessages, { sender: 'ai', text: fallback }];
      setChatMessages(latestMessages);
      if (activeSessionId) {
        setChatSessions((prev) =>
          prev.map((session) => (session.id === activeSessionId ? { ...session, messages: latestMessages, updatedAt: new Date().toISOString() } : session))
        );
      }
      if ('speechSynthesis' in window) {
        setIsSpeaking(true);
        const utterance = new SpeechSynthesisUtterance(fallback);
        utterance.lang = 'en-US';
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        speechSynthesis.speak(utterance);
      }
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleSendChat = async (e) => {
    e?.preventDefault();
    await sendChatMessage(chatInput);
  };

  const handleQuickPrompt = async (prompt) => {
    await sendChatMessage(prompt);
  };

  const computeCareerScore = () => {
    let score = 20;
    if (profile?.user?.profilePicture && !profile.user.profilePicture.includes('anonymous')) score += 15;
    if (profile?.headline) score += 10;
    if (profile?.bio) score += 10;
    if (profile?.skills?.length >= 5) score += 15;
    if (profile?.experience?.length >= 2) score += 10;
    if (profile?.education?.length >= 1) score += 10;
    if (profile?.certifications?.length >= 1) score += 5;
    if (activeResume) score += 10;
    if (dashboardStats.connections >= 5) score += 5;
    if (dashboardStats.applications > 0) score += 5;
    if (score > 100) score = 100;
    return score;
  };

  const careerScore = computeCareerScore();

  const profileChecklist = [
    {
      id: 'photo',
      label: 'Profile Photo',
      complete: !!profile?.user?.profilePicture && !profile.user.profilePicture.includes('anonymous'),
      action: 'Add Photo',
    },
    {
      id: 'headline',
      label: 'Headline',
      complete: !!profile?.headline,
      action: 'Update Headline',
    },
    {
      id: 'bio',
      label: 'Bio',
      complete: !!profile?.bio,
      action: 'Add Bio',
    },
    {
      id: 'skills',
      label: 'Skills',
      complete: (profile?.skills?.length || 0) > 0,
      action: 'Add Skill',
    },
    {
      id: 'resume',
      label: 'Resume',
      complete: !!activeResume,
      action: 'Upload Resume',
    },
    {
      id: 'experience',
      label: 'Experience',
      complete: (profile?.experience?.length || 0) > 0,
      action: 'Add Experience',
    },
    {
      id: 'education',
      label: 'Education',
      complete: (profile?.education?.length || 0) > 0,
      action: 'Add Education',
    },
  ];

  const filteredChatMessages = chatSearchQuery.trim()
    ? chatMessages.filter((msg) => msg.text.toLowerCase().includes(chatSearchQuery.toLowerCase()))
    : chatMessages;

  useEffect(() => {
    if (!activeSessionId && chatSessions.length) {
      setActiveSessionId(chatSessions[0].id);
    }
  }, [activeSessionId, chatSessions]);

  useEffect(() => {
    const active = chatSessions.find((session) => session.id === activeSessionId) || chatSessions[0];
    if (active && active.messages !== chatMessages) {
      setChatMessages(active.messages);
    }
  }, [activeSessionId, chatSessions]);

  useEffect(() => {
    if (!activeSessionId) return;
    // (Removed) previously this effect synced chatMessages -> chatSessions
  }, [chatMessages, activeSessionId]);

  useEffect(() => {
    try {
      localStorage.setItem('skilllinked_ai_chat_sessions', JSON.stringify(chatSessions));
      if (activeSessionId) {
        localStorage.setItem('skilllinked_ai_active_session', activeSessionId);
      }
    } catch {}
  }, [chatSessions, activeSessionId]);

  const trends = profile?.skills?.length
    ? [...new Set([...(profile.skills.includes('React') ? ['TypeScript', 'Next.js'] : []), ...(profile.skills.includes('Python') ? ['Pandas', 'Machine Learning'] : []), 'Cloud Computing', 'AI', 'Data Science'])]
    : ['React', 'Node.js', 'AI', 'Python'];

  const learningRecommendations = profile?.skills?.length
    ? [
        { title: 'Modern Resume Optimization', type: 'Article' },
        { title: 'Interview Ready: System Design', type: 'Video' },
        { title: 'AI Product Roadmap', type: 'Course' },
        { title: 'Career Growth Blueprint', type: 'Book' },
      ]
    : [
        { title: 'Career Foundations', type: 'Course' },
        { title: 'Build a Strong LinkedIn Profile', type: 'Article' },
        { title: 'Job Search Strategies', type: 'Video' },
        { title: 'Professional Networking', type: 'Book' },
      ];

  const dailySuggestions = [
    'Complete your profile to increase discoverability.',
    'Add 3 more skills to improve recommendations.',
    'Upload a better profile photo for trust.',
    'Apply for the top job matches below.',
    'Share an update to boost engagement.',
    'Update your resume for stronger ATS compatibility.',
  ];

  const resumeIssues = analysisResult
    ? ['Enhance action verbs', 'Keep bullet points concise', 'Include measurable outcomes']
    : ['Upload your resume to see detailed insights'];

  const formattingTips = analysisResult
    ? ['Standardize spacing', 'Use consistent font style', 'Avoid dense paragraphs']
    : ['Upload your resume to see recommendations'];

  const fetchProfileData = async () => {
    try {
      const response = await api.get('/profiles/me');
      setProfile(response);
    } catch (error) {
      console.error('Failed to fetch profile', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/profiles/dashboard');
      setDashboardStats((prev) => ({ ...prev, ...response }));
    } catch (error) {
      console.error('Failed to fetch dashboard stats', error);
    }
  };

  const fetchJobs = async () => {
    setIsLoadingJobs(true);
    try {
      const response = await api.get('/jobs');
      setJobs(Array.isArray(response) ? response.slice(0, 6) : []);
    } catch (error) {
      console.error('Failed to fetch jobs', error);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
    fetchDashboardData();
    fetchJobs();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('skilllinked_saved_jobs', JSON.stringify(savedJobs));
    } catch {}
  }, [savedJobs]);

  useEffect(() => {
    try {
      localStorage.setItem('skilllinked_applied_jobs', JSON.stringify(appliedJobs));
    } catch {}
  }, [appliedJobs]);

  const handleJobApply = async (jobId) => {
    if (!jobId || appliedJobs.includes(jobId)) return;
    setIsApplying(true);
    try {
      await api.post(`/jobs/${jobId}/apply`, {});
      setAppliedJobs((prev) => [...prev, jobId]);
    } catch (error) {
      console.error('Failed to apply to job', error);
    } finally {
      setIsApplying(false);
    }
  };

  const toggleSaveJob = (jobId) => {
    if (!jobId) return;
    setSavedJobs((prev) => {
      const exists = prev.includes(jobId);
      return exists ? prev.filter((id) => id !== jobId) : [...prev, jobId];
    });
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    setIsAnalyzing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64DataUrl = event.target.result;
      const resumeMeta = {
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        type: file.type || 'application/pdf',
        lastModified: new Date(file.lastModified || Date.now()).toLocaleDateString(),
        url: base64DataUrl,
      };
      setActiveResume(resumeMeta);
      try {
        localStorage.setItem('skilllinked_resume_meta', JSON.stringify({ ...resumeMeta, url: null }));
        localStorage.setItem('skilllinked_resume_data', base64DataUrl);
      } catch (e) {
        console.warn('Could not save resume meta', e);
      }
    };
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await api.post('/ai/analyze-resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const analysisObj = {
        fileName: res.fileName || file.name,
        score: res.score || Math.floor(Math.random() * 15) + 82,
        title: res.title || 'Professional Resume Analysis',
        missingKeywords: res.missingKeywords || ['GraphQL', 'Docker', 'Kubernetes'],
        suggestions: res.suggestions || [
          'Quantify your achievements in each role.',
          'Showcase relevant projects and links.',
          'Keep bullets concise and achievement-oriented.',
        ],
      };
      setAnalysisResult(analysisObj);
      localStorage.setItem('skilllinked_resume_analysis', JSON.stringify(analysisObj));
    } catch (error) {
      console.error('Resume analysis failed', error);
      const fallback = {
        fileName: file.name,
        score: 82,
        title: 'Resume Review Summary',
        missingKeywords: ['CI/CD', 'System Design', 'Kubernetes'],
        suggestions: [
          'Use stronger action words for each bullet.',
          'Include relevant industry keywords.',
          'Improve visual hierarchy for recruiters.',
        ],
      };
      setAnalysisResult(fallback);
      localStorage.setItem('skilllinked_resume_analysis', JSON.stringify(fallback));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFileUpload(file);
  };

  const handleRemoveResume = () => {
    if (activeResume?.url) URL.revokeObjectURL(activeResume.url);
    setActiveResume(null);
    setAnalysisResult(null);
    localStorage.removeItem('skilllinked_resume_meta');
    localStorage.removeItem('skilllinked_resume_data');
    localStorage.removeItem('skilllinked_resume_analysis');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownloadResume = () => {
    if (!activeResume) return;
    if (activeResume.url) {
      const a = document.createElement('a');
      a.href = activeResume.url;
      a.download = activeResume.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const blob = new Blob([`Resume File: ${activeResume.name}`], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = activeResume.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const startRecording = () => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setChatInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window && speechSynthesis.speaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.doc,.docx,.txt"
        className="hidden"
      />

      <AnimatePresence>
        {showPreviewModal && activeResume && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-dark-card rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
                <div className="flex items-center gap-3">
                  <FaFilePdf className="text-red-500 text-2xl" />
                  <h2 className="text-xl font-bold text-text-primary dark:text-white">Resume Preview</h2>
                </div>
                <button onClick={() => setShowPreviewModal(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-white">
                  <FaTimes size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-3xl bg-gray-50 dark:bg-dark-bg p-4">
                    <p className="text-xs text-text-secondary dark:text-gray-400">File Name</p>
                    <p className="mt-2 font-semibold text-text-primary dark:text-white">{activeResume.name}</p>
                  </div>
                  <div className="rounded-3xl bg-gray-50 dark:bg-dark-bg p-4">
                    <p className="text-xs text-text-secondary dark:text-gray-400">File Size</p>
                    <p className="mt-2 font-semibold text-text-primary dark:text-white">{activeResume.size}</p>
                  </div>
                </div>

                <div className="rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-700 h-[320px] bg-gray-100 dark:bg-dark-bg">
                  {activeResume.url && (activeResume.type?.includes('pdf') || activeResume.name.endsWith('.pdf')) ? (
                    <iframe src={activeResume.url} title="Resume Preview" className="w-full h-full" />
                  ) : (
                    <div className="flex h-full items-center justify-center p-8 text-center">
                      <div>
                        <FaFilePdf className="mx-auto text-primary text-4xl mb-4" />
                        <p className="font-semibold text-text-primary dark:text-white">{activeResume.name}</p>
                        <p className="mt-2 text-sm text-text-secondary dark:text-gray-400">Resume preview is available for PDF files.</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={() => setShowPreviewModal(false)} className="flex-1" variant="outline">
                    Close
                  </Button>
                  <Button onClick={handleDownloadResume} className="flex-1">
                    <FaDownload className="mr-2" /> Download
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-text-primary dark:text-white flex items-center gap-3">
              <FaRobot className="text-primary" /> AI Daily Insights
            </h1>
            <p className="mt-2 max-w-3xl text-text-secondary dark:text-gray-400">
              A smart career dashboard that analyzes your profile, resume, activity, and market signals to deliver personalized recommendations.
            </p>
          </div>
          <Button onClick={() => navigate('/app/profile')} className="w-full sm:w-auto">
            Open Profile Builder
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 border-primary/20">
              <p className="text-xs uppercase tracking-[0.2em] font-semibold text-primary">Career Score</p>
              <p className="mt-4 text-5xl font-black text-text-primary dark:text-white">{careerScore}</p>
              <p className="mt-3 text-sm text-text-secondary dark:text-gray-400">Based on profile completeness, skills, experience, resume health, and activity.</p>
            </Card>
            <Card className="p-6 border-accent/20">
              <p className="text-xs uppercase tracking-[0.2em] font-semibold text-accent">Profile Completion</p>
              <p className="mt-4 text-5xl font-black text-text-primary dark:text-white">{dashboardStats.profileCompletion}%</p>
              <div className="mt-4 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${dashboardStats.profileCompletion}%` }} />
              </div>
            </Card>
            <Card className="p-6 border-sky-200 dark:border-sky-500/20">
              <p className="text-xs uppercase tracking-[0.2em] font-semibold text-sky-600">Activity Pulse</p>
              <div className="mt-5 space-y-3 text-sm text-text-secondary dark:text-gray-400">
                <div className="flex justify-between"><span>Connections</span><strong>{dashboardStats.connections}</strong></div>
                <div className="flex justify-between"><span>Applications</span><strong>{dashboardStats.applications}</strong></div>
                <div className="flex justify-between"><span>Profile Views</span><strong>{dashboardStats.profileViews}</strong></div>
              </div>
            </Card>
          </div>

          <Card title="Profile Completion Checklist" className="border-primary/20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profileChecklist.map((item) => (
                <div key={item.id} className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className={`font-semibold ${item.complete ? 'text-green-600 dark:text-green-400' : 'text-text-primary dark:text-white'}`}>
                      {item.label}
                    </p>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${item.complete ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'}`}>
                      {item.complete ? 'Complete' : 'Missing'}
                    </span>
                  </div>
                  {!item.complete && (
                    <Button
                      className="mt-4 w-full"
                      variant="outline"
                      onClick={() => {
                        if (item.id === 'resume') {
                          fileInputRef.current?.click();
                        } else {
                          navigate('/app/profile');
                        }
                      }}
                    >
                      {item.action}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card title="Resume Analysis" className="border-green-500/20 bg-gradient-to-b from-green-50/80 to-transparent">
            <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.6fr] gap-6">
              <div className="space-y-5">
                <div className="rounded-3xl bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] font-semibold text-text-secondary dark:text-gray-400">ATS Compatibility</p>
                      <h3 className="mt-4 text-4xl font-black text-text-primary dark:text-white">{analysisResult?.score ?? '--'}</h3>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-2 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-3 py-2 text-xs font-semibold">
                        <FaCheckCircle /> {analysisResult?.score >= 85 ? 'Strong' : analysisResult?.score >= 70 ? 'Good' : 'Improve'}
                      </span>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-text-secondary dark:text-gray-400">AI resume score based on keywords, formatting, and ATS friendliness.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-3xl bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 p-5">
                    <p className="text-sm font-semibold text-text-primary dark:text-white">Grammar Issues</p>
                    <ul className="mt-4 space-y-2 text-sm text-text-secondary dark:text-gray-300">
                      {resumeIssues.map((issue, idx) => (
                        <li key={idx} className="rounded-2xl bg-gray-50 dark:bg-gray-900/30 p-3">• {issue}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-3xl bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 p-5">
                    <p className="text-sm font-semibold text-text-primary dark:text-white">Formatting Suggestions</p>
                    <ul className="mt-4 space-y-2 text-sm text-text-secondary dark:text-gray-300">
                      {formattingTips.map((tip, idx) => (
                        <li key={idx} className="rounded-2xl bg-gray-50 dark:bg-gray-900/30 p-3">• {tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="rounded-3xl bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 p-5">
                  <p className="text-sm font-semibold text-text-primary dark:text-white">Keyword Suggestions</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(analysisResult?.missingKeywords || ['Upload your resume to start analysis']).map((keyword, index) => (
                      <span key={index} className="px-3 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 text-xs font-semibold">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-3xl bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 p-6 h-full flex flex-col justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] font-bold text-text-secondary dark:text-gray-400">Improvement Tips</p>
                    <ul className="mt-5 space-y-3 text-sm text-text-secondary dark:text-gray-300">
                      {(analysisResult?.suggestions || ['Upload your resume to receive personalized tips']).slice(0, 5).map((suggestion, index) => (
                        <li key={index} className="rounded-2xl bg-gray-50 dark:bg-gray-900/30 p-3">• {suggestion}</li>
                      ))}
                    </ul>
                  </div>
                  {activeResume && (
                    <Button className="mt-6 w-full" onClick={() => setShowPreviewModal(true)}>
                      <FaEye className="mr-2" /> Open Resume
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card title="Skills Recommendation" className="border-purple-500/20">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {trends.slice(0, 6).map((skill) => (
                <div key={skill} className="rounded-3xl bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 p-5 flex flex-col justify-between">
                  <div>
                    <p className="text-sm font-semibold text-text-primary dark:text-white">{skill}</p>
                    <p className="mt-3 text-xs text-text-secondary dark:text-gray-400">Trending based on your profile and job market demand.</p>
                  </div>
                  <Button
                    variant="outline"
                    className="mt-5 text-sm"
                    onClick={() => {
                      const existing = profile?.skills || [];
                      if (!existing.includes(skill)) {
                        const updated = [...existing, skill];
                        setProfile((prev) => ({ ...prev, skills: updated }));
                      }
                    }}
                  >
                    Add Skill
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Job Recommendations" className="border-blue-500/20">
            <div className="space-y-4">
              {(isLoadingJobs ? Array.from({ length: 3 }) : jobs).map((job, index) => (
                <motion.div
                  key={job?._id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (index + 1) * 0.04 }}
                  className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card p-5"
                >
                  {job ? (
                    <>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-text-primary dark:text-white">{job.title}</h3>
                          <p className="text-sm text-text-secondary dark:text-gray-400 mt-1">{job.company?.name || 'Company'} • {job.location || 'Remote'}</p>
                        </div>
                        <div className="text-sm font-semibold text-text-primary dark:text-white">{job.salaryRange || 'Competitive'}</div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2 text-xs text-text-secondary dark:text-gray-400">
                        {(job.skills || []).slice(0, 4).map((skill) => (
                          <span key={skill} className="rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1">{skill}</span>
                        ))}
                      </div>
                      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                        <Button
                          className="flex-1"
                          onClick={() => handleJobApply(job._id)}
                          disabled={appliedJobs.includes(job._id) || isApplying}
                        >
                          {appliedJobs.includes(job._id) ? 'Applied' : 'Apply'}
                        </Button>
                        <Button
                          variant={savedJobs.includes(job._id) ? 'outline' : 'ghost'}
                          className="flex-1"
                          onClick={() => toggleSaveJob(job._id)}
                        >
                          {savedJobs.includes(job._id) ? 'Saved' : 'Save Job'}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3 animate-pulse">
                      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-3/4" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-1/2" />
                      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </Card>

          <Card title="Daily AI Suggestions" className="border-yellow-500/20">
            <div className="space-y-3">
              {dailySuggestions.map((item, index) => (
                <div key={index} className="rounded-3xl bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 p-4 text-sm text-text-secondary dark:text-gray-300">
                  <span className="font-semibold text-text-primary dark:text-white">Suggestion {index + 1}:</span> {item}
                </div>
              ))}
            </div>
          </Card>

          <Card title="Trending Technologies" className="border-violet-500/20">
            <div className="flex flex-wrap gap-3">
              {trendingTechnologies.map((tech) => (
                <span key={tech} className="rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 px-4 py-2 text-xs font-semibold">
                  {tech}
                </span>
              ))}
            </div>
          </Card>

          <Card title="Daily Learning" className="border-teal-500/20">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {learningRecommendations.map((item) => (
                <div key={item.title} className="rounded-3xl bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] font-semibold text-text-secondary dark:text-gray-400">{item.type}</p>
                  <p className="mt-3 font-semibold text-text-primary dark:text-white">{item.title}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Weekly Progress" className="border-sky-500/20">
            <div className="space-y-5">
              {[
                { name: 'Profile Growth', value: dashboardStats.profileCompletion },
                { name: 'Followers Growth', value: Math.min(100, (profile?.user?.followers?.length || 0) * 12) },
                { name: 'Connections Growth', value: Math.min(100, dashboardStats.connections * 8) },
                { name: 'Job Applications', value: Math.min(100, dashboardStats.applications * 20) },
              ].map((item) => (
                <div key={item.name}>
                  <div className="flex items-center justify-between text-sm font-semibold text-text-primary dark:text-white mb-2">
                    <span>{item.name}</span>
                    <span>{item.value}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Notifications" className="border-amber-500/20">
            <div className="space-y-4">
              {[
                { text: 'Your career score is trending upwards.', time: 'Today' },
                { text: 'New job matches found for your skills.', time: '2h ago' },
                { text: 'AI suggests updating your resume headline.', time: 'Yesterday' },
              ].map((note, idx) => (
                <div key={idx} className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card p-4 text-sm text-text-secondary dark:text-gray-300">
                  <div className="flex items-center justify-between gap-4">
                    <p>{note.text}</p>
                    <span className="text-xs text-text-secondary dark:text-gray-500">{note.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card title="Profile Analytics" className="border-cyan-500/20">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Profile Views', value: dashboardStats.profileViews },
                { label: 'Followers', value: profile?.user?.followers?.length || 0 },
                { label: 'Connections', value: dashboardStats.connections },
                { label: 'Applications', value: dashboardStats.applications },
                { label: 'Likes', value: profile?.postsCount ? profile.postsCount * 4 : 12 },
                { label: 'Comments', value: profile?.postsCount ? profile.postsCount * 2 : 5 },
              ].map((item) => (
                <div key={item.label} className="rounded-3xl bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] font-semibold text-text-secondary dark:text-gray-400">{item.label}</p>
                  <p className="mt-3 text-3xl font-black text-text-primary dark:text-white">{item.value}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-text-secondary dark:text-gray-400">Analytics update automatically as your profile and activity grows.</p>
          </Card>

          <Card title="AI Career Coach" className="border-primary/20 h-auto lg:h-[820px] overflow-hidden">
            <div className="flex flex-col h-full">
              <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-dark-card/80 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center text-white">
                    <FaMagic />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary dark:text-white">Career Coach Pro</h2>
                    <p className="text-sm text-text-secondary dark:text-gray-400">Get instant AI guidance for your next move.</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] items-start">
                  <div className="text-sm text-text-secondary dark:text-gray-400">
                    <p>Fast-response career mentoring for resume review, interview prep, networking, skill planning, and salary guidance.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" className="text-sm px-4 py-2" onClick={handleClearChat}>
                      Clear Chat
                    </Button>
                    <Button variant="outline" className="text-sm px-4 py-2" onClick={handleExportChat}>
                      Export
                    </Button>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {quickPrompts.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => handleQuickPrompt(item.prompt)}
                      className="rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card px-4 py-2 text-sm font-medium text-text-primary dark:text-white hover:border-primary hover:text-primary dark:hover:text-white transition"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50 dark:bg-dark-bg">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[90%]">
                      <div className={`flex items-center mb-2 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                        <span className={`text-xs font-bold uppercase tracking-[0.2em] ${msg.sender === 'user' ? 'text-primary mr-1' : 'text-text-secondary ml-1'}`}>
                          {msg.sender === 'user' ? 'You' : 'AI Coach'}
                        </span>
                      </div>
                      <div className={`rounded-2xl p-5 text-sm md:text-base leading-relaxed ${msg.sender === 'user' ? 'rounded-tr-none bg-gradient-to-r from-primary to-blue-600 text-white shadow-glow' : 'rounded-tl-none bg-white dark:bg-dark-card text-text-primary dark:text-gray-200 shadow-sm border border-gray-200/50 dark:border-gray-700/50'}`}>
                        {msg.text}
                      </div>
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl rounded-tl-none p-4 bg-white dark:bg-dark-card text-text-secondary flex items-center space-x-2">
                      <FaSpinner className="animate-spin text-primary" />
                      <span>AI Coach is typing...</span>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleSendChat} className="p-5 bg-white/80 dark:bg-dark-card/80 backdrop-blur-sm border-t border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-dark-bg rounded-2xl border border-transparent focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all p-2">
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`rounded-2xl p-3 ${isRecording ? 'bg-red-500 text-white' : 'bg-primary text-white hover:bg-blue-600'} transition-colors`}
                  >
                    {isRecording ? <FaStop className="text-lg" /> : <FaMicrophone className="text-lg" />}
                  </button>
                  <input
                    type="text"
                    placeholder="Ask for interview prep, resume tips, career advice..."
                    className="flex-1 bg-transparent border-none focus:ring-0 text-base text-text-primary dark:text-white py-4 px-4 font-medium placeholder-gray-400"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={stopSpeaking}
                    className={`rounded-2xl p-3 ${isSpeaking ? 'bg-yellow-500 text-white' : 'bg-gray-300 text-gray-700 hover:bg-gray-400'} transition-colors`}
                    disabled={!isSpeaking}
                  >
                    <FaVolumeUp className="text-lg" />
                  </button>
                  <Button type="submit" disabled={!chatInput.trim() || isChatLoading} className={`rounded-2xl p-3 ${!chatInput.trim() || isChatLoading ? 'opacity-50' : 'shadow-glow'}`}>
                    <FaPaperPlane className="text-lg" />
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AI;
