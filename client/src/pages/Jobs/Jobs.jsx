import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import {
  FaMapMarkerAlt, FaBriefcase, FaMoneyBillWave, FaClock, FaBookmark,
  FaSearch, FaCheckCircle, FaBuilding, FaTimes, FaExternalLinkAlt,
  FaGraduationCap, FaLaptopCode, FaWifi, FaStar, FaExclamationTriangle,
  FaRedo, FaFilter, FaChevronDown, FaRegBookmark, FaRegStar
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import {
  fetchJobs,
  fetchRecommendedJobs,
  fetchMyApplications,
  fetchSavedJobs,
  applyToJob,
  saveJob,
  unsaveJob,
} from '../../redux/slices/jobSlice';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LOGO_GRADIENTS = [
  'from-blue-500 to-blue-700',
  'from-purple-500 to-purple-700',
  'from-green-500 to-green-700',
  'from-orange-500 to-orange-700',
  'from-pink-500 to-pink-700',
  'from-cyan-500 to-cyan-700',
  'from-indigo-500 to-indigo-700',
  'from-rose-500 to-rose-700',
];
const logoGradient = (name) => LOGO_GRADIENTS[(name?.charCodeAt(0) || 65) % LOGO_GRADIENTS.length];

const timeAgo = (dateStr) => {
  if (!dateStr) return 'Recently';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const workplaceBadgeClass = (type) => {
  if (type === 'Remote') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
  if (type === 'Hybrid') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
  return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300';
};

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship'];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const JobSkeleton = () => (
  <div className="rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
    <div className="flex gap-5">
      <div className="w-16 h-16 rounded-2xl bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
      <div className="flex-1 space-y-3">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-2/3" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-1/3" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-1/2" />
        <div className="flex gap-2 mt-2">
          <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="h-6 w-14 bg-gray-200 dark:bg-gray-700 rounded-full" />
        </div>
      </div>
    </div>
  </div>
);

// ─── Job Details Drawer ───────────────────────────────────────────────────────

const JobDetailsDrawer = ({ job, isOpen, onClose, isApplied, isApplying, onApply, isSaved, onSave }) => {
  const companyName = job?.company?.name || 'Company';

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!job) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-xl bg-white dark:bg-dark-card shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-text-primary dark:text-white">Job Details</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500"
              >
                <FaTimes />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Company + Title */}
              <div className="flex items-start gap-4">
                <div className={`w-16 h-16 rounded-2xl flex-shrink-0 bg-gradient-to-br ${logoGradient(companyName)} flex items-center justify-center text-white font-black text-2xl shadow-lg`}>
                  {companyName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-2xl font-extrabold text-text-primary dark:text-white leading-tight">{job.title}</h3>
                  <p className="text-base font-semibold text-primary mt-1 flex items-center gap-1.5">
                    <FaBuilding size={13} /> {companyName}
                  </p>
                  {job.company?.industry && (
                    <p className="text-sm text-text-secondary dark:text-gray-400 mt-0.5">{job.company.industry}</p>
                  )}
                </div>
              </div>

              {/* Key Details */}
              <div className="grid grid-cols-2 gap-3">
                {job.location && (
                  <div className="bg-gray-50 dark:bg-dark-bg rounded-xl p-3 flex items-center gap-2">
                    <FaMapMarkerAlt className="text-primary text-sm" />
                    <span className="text-sm font-medium text-text-primary dark:text-white">{job.location}</span>
                  </div>
                )}
                {job.type && (
                  <div className="bg-gray-50 dark:bg-dark-bg rounded-xl p-3 flex items-center gap-2">
                    <FaBriefcase className="text-primary text-sm" />
                    <span className="text-sm font-medium text-text-primary dark:text-white">{job.type}</span>
                  </div>
                )}
                {job.workplaceType && (
                  <div className="bg-gray-50 dark:bg-dark-bg rounded-xl p-3 flex items-center gap-2">
                    <FaWifi className="text-primary text-sm" />
                    <span className="text-sm font-medium text-text-primary dark:text-white">{job.workplaceType}</span>
                  </div>
                )}
                {job.experienceLevel && (
                  <div className="bg-gray-50 dark:bg-dark-bg rounded-xl p-3 flex items-center gap-2">
                    <FaGraduationCap className="text-primary text-sm" />
                    <span className="text-sm font-medium text-text-primary dark:text-white">{job.experienceLevel}</span>
                  </div>
                )}
                {job.salaryRange && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 flex items-center gap-2 col-span-2">
                    <FaMoneyBillWave className="text-green-500 text-sm" />
                    <span className="text-sm font-bold text-green-700 dark:text-green-400">{job.salaryRange}</span>
                  </div>
                )}
              </div>

              {/* Posted date */}
              <div className="flex items-center gap-2 text-sm text-text-secondary dark:text-gray-400">
                <FaClock size={13} />
                <span>Posted {timeAgo(job.createdAt)}</span>
              </div>

              {/* Skills */}
              {job.skills?.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-text-primary dark:text-white mb-2 flex items-center gap-2">
                    <FaLaptopCode className="text-primary" /> Required Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill, i) => (
                      <span key={i} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {job.description && (
                <div>
                  <h4 className="text-sm font-bold text-text-primary dark:text-white mb-2">About the Role</h4>
                  <p className="text-sm text-text-secondary dark:text-gray-300 leading-relaxed whitespace-pre-line">{job.description}</p>
                </div>
              )}

              {/* Requirements */}
              {job.requirements?.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-text-primary dark:text-white mb-2">Requirements</h4>
                  <ul className="space-y-2">
                    {job.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-text-secondary dark:text-gray-300">
                        <FaCheckCircle className="text-primary mt-0.5 flex-shrink-0" size={12} />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-5 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <button
                onClick={onSave}
                className={`p-3 rounded-xl border transition-all ${
                  isSaved
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:border-primary hover:text-primary'
                }`}
                title={isSaved ? 'Unsave' : 'Save Job'}
              >
                {isSaved ? <FaBookmark /> : <FaRegBookmark />}
              </button>
              <Button
                onClick={onApply}
                disabled={isApplied || isApplying}
                className={`flex-1 font-bold tracking-wide ${isApplied ? 'bg-green-500 hover:bg-green-500 opacity-80' : 'shadow-glow'}`}
              >
                {isApplied ? '✓ Applied' : isApplying ? 'Applying...' : 'Easy Apply'}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ─── Job Card ─────────────────────────────────────────────────────────────────

const JobCard = ({ job, index, isApplied, isApplying, isSaved, onApply, onSave, onView, matchScore }) => {
  const companyName = job.company?.name || 'Company';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card
        className={`p-5 sm:p-6 group cursor-pointer border-2 transition-all hover:-translate-y-0.5 hover:shadow-lg ${
          isApplied
            ? 'border-green-500/30 bg-green-50/30 dark:bg-green-900/5'
            : 'border-transparent hover:border-primary/30'
        }`}
        onClick={() => onView(job)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            {/* Logo */}
            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex-shrink-0 bg-gradient-to-br ${logoGradient(companyName)} flex items-center justify-center text-white font-black text-xl sm:text-2xl shadow-md`}>
              {companyName.charAt(0)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base sm:text-lg font-bold text-text-primary dark:text-white group-hover:text-primary transition-colors truncate">
                  {job.title}
                </h3>
              </div>

              <p className="text-sm font-semibold text-text-secondary dark:text-gray-300 mt-0.5 flex items-center gap-1.5">
                <FaBuilding size={12} className="text-gray-400 flex-shrink-0" />
                <span className="truncate">{companyName}</span>
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-medium text-text-secondary dark:text-gray-400">
                {job.location && (
                  <span className="flex items-center gap-1">
                    <FaMapMarkerAlt className="text-gray-400 flex-shrink-0" />{job.location}
                  </span>
                )}
                {job.type && (
                  <span className="flex items-center gap-1">
                    <FaBriefcase className="text-gray-400 flex-shrink-0" />{job.type}
                  </span>
                )}
                {job.salaryRange && (
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
                    <FaMoneyBillWave className="flex-shrink-0" />{job.salaryRange}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <FaClock className="text-gray-400 flex-shrink-0" />{timeAgo(job.createdAt)}
                </span>
              </div>

              {/* Tags */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {job.workplaceType && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${workplaceBadgeClass(job.workplaceType)}`}>
                    {job.workplaceType}
                  </span>
                )}
                {matchScore > 0 && (
                  <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                    <FaStar size={9} />{matchScore}% match
                  </span>
                )}
                {job.skills?.slice(0, 3).map((skill, i) => (
                  <span key={i} className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                    {skill}
                  </span>
                ))}
                {job.skills?.length > 3 && (
                  <span className="text-xs text-gray-400 font-medium">+{job.skills.length - 3}</span>
                )}
                {isApplied && (
                  <span className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                    <FaCheckCircle size={9} /> Applied
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right-side actions */}
          <div className="flex flex-col items-end gap-3 flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onSave(job._id); }}
              className={`p-2 rounded-lg transition-all ${
                isSaved
                  ? 'text-primary'
                  : 'text-gray-300 dark:text-gray-600 hover:text-primary'
              }`}
              title={isSaved ? 'Unsave' : 'Save'}
            >
              {isSaved ? <FaBookmark className="h-4 w-4" /> : <FaRegBookmark className="h-4 w-4" />}
            </button>
            <Button
              onClick={(e) => { e.stopPropagation(); onApply(job._id); }}
              disabled={isApplied || isApplying}
              className={`text-xs sm:text-sm px-4 sm:px-5 font-bold whitespace-nowrap ${
                isApplied ? 'bg-green-500 hover:bg-green-500 opacity-80' : 'shadow-glow'
              }`}
            >
              {isApplied ? '✓ Applied' : isApplying ? '...' : 'Easy Apply'}
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

const Jobs = () => {
  const dispatch = useDispatch();
  const {
    jobs,
    recommendedJobs,
    myApplications,
    savedJobIds,
    isLoading,
    isApplying,
    isSaving,
    hasFetched,
    error,
  } = useSelector(state => state.jobs);

  const authUser = useSelector(state => state.auth.user);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [activeTypes, setActiveTypes] = useState([]);
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const appliedJobIds = new Set(
    myApplications
      .map(a => a.job?._id || a.job)
      .filter(Boolean)
      .map(String)
  );

  // Initial load
  useEffect(() => {
    dispatch(fetchMyApplications());
    dispatch(fetchSavedJobs());
    if (authUser) dispatch(fetchRecommendedJobs());
  }, [dispatch, authUser]);

  // Load jobs when filters change (but not on initial mount — handled by the initial fetch)
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      dispatch(fetchJobs({ search: undefined, types: [], remote: false }));
      return;
    }
    dispatch(fetchJobs({ search: searchTerm || undefined, types: activeTypes, remote: remoteOnly }));
  }, [activeTypes, remoteOnly]);

  const handleSearch = (e) => {
    e?.preventDefault();
    const term = searchInput.trim();
    setSearchTerm(term);
    dispatch(fetchJobs({ search: term || undefined, types: activeTypes, remote: remoteOnly }));
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const toggleType = (type) => {
    setActiveTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSearchInput('');
    setActiveTypes([]);
    setRemoteOnly(false);
    dispatch(fetchJobs({ search: undefined, types: [], remote: false }));
  };

  const handleApply = (jobId) => {
    if (!appliedJobIds.has(String(jobId))) {
      dispatch(applyToJob({ jobId }));
    }
  };

  const handleSave = (jobId) => {
    const id = String(jobId);
    if (savedJobIds.includes(id)) {
      dispatch(unsaveJob(id));
    } else {
      dispatch(saveJob(id));
    }
  };

  const openJobDetails = (job) => {
    setSelectedJob(job);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => setSelectedJob(null), 350);
  };

  const hasActiveFilters = activeTypes.length > 0 || remoteOnly || searchTerm;

  // ─── Filter Panel (reused for sidebar + mobile drawer) ──────────────────────
  const FilterPanel = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-bold text-text-primary dark:text-gray-200 mb-3">Job Type</label>
        <div className="space-y-2.5">
          {JOB_TYPES.map((type) => (
            <label key={type} className="flex items-center group cursor-pointer">
              <input
                type="checkbox"
                checked={activeTypes.includes(type)}
                onChange={() => toggleType(type)}
                className="rounded-md border-gray-300 dark:border-gray-600 text-primary focus:ring-primary h-4 w-4 bg-gray-50 dark:bg-dark-bg transition-all cursor-pointer"
              />
              <span className="ml-3 text-sm font-medium text-text-secondary dark:text-gray-400 group-hover:text-primary transition-colors">
                {type}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
        <label className="block text-sm font-bold text-text-primary dark:text-gray-200 mb-3">Workplace</label>
        <label className="flex items-center group cursor-pointer">
          <input
            type="checkbox"
            checked={remoteOnly}
            onChange={() => setRemoteOnly(v => !v)}
            className="rounded-md border-gray-300 dark:border-gray-600 text-primary focus:ring-primary h-4 w-4 bg-gray-50 dark:bg-dark-bg transition-all cursor-pointer"
          />
          <span className="ml-3 text-sm font-medium text-text-secondary dark:text-gray-400 group-hover:text-primary transition-colors">
            Remote only
          </span>
        </label>
      </div>

      <button
        onClick={() => { handleClearFilters(); setMobileFilterOpen(false); }}
        className="w-full py-2.5 text-sm font-semibold border border-gray-200 dark:border-gray-700 text-text-secondary dark:text-gray-400 hover:border-primary hover:text-primary rounded-xl transition-all"
      >
        Clear Filters
      </button>
    </div>
  );

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Job Details Drawer */}
      <JobDetailsDrawer
        job={selectedJob}
        isOpen={drawerOpen}
        onClose={closeDrawer}
        isApplied={selectedJob ? appliedJobIds.has(String(selectedJob._id)) : false}
        isApplying={isApplying}
        onApply={() => selectedJob && handleApply(selectedJob._id)}
        isSaved={selectedJob ? savedJobIds.includes(String(selectedJob._id)) : false}
        onSave={() => selectedJob && handleSave(selectedJob._id)}
      />

      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {mobileFilterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileFilterOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-white dark:bg-dark-card shadow-2xl p-6 overflow-y-auto md:hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-text-primary dark:text-white">Filters</h3>
                <button onClick={() => setMobileFilterOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                  <FaTimes />
                </button>
              </div>
              <FilterPanel />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row gap-6 max-w-7xl mx-auto pb-12">

        {/* ─── Left Sidebar (desktop) ─────────────────────────── */}
        <div className="hidden md:block w-72 flex-shrink-0">
          <Card className="sticky top-24 border-2 border-transparent">
            <h3 className="text-lg font-bold text-text-primary dark:text-white mb-6">Filters</h3>
            <FilterPanel />
          </Card>
        </div>

        {/* ─── Main Content ────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* Search Bar */}
          <div className="flex gap-3">
            <div className="flex-1">
              <Card className="p-2 pl-4 pr-2 flex items-center gap-3 rounded-full border-primary/20">
                <FaSearch className="text-primary text-base flex-shrink-0" />
                <input
                  type="text"
                  className="flex-1 border-none bg-transparent text-text-primary dark:text-white placeholder-gray-400 focus:outline-none focus:ring-0 text-sm sm:text-base font-medium min-w-0"
                  placeholder="Search jobs, skills or companies..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                />
                {searchInput && (
                  <button
                    onClick={() => { setSearchInput(''); if (searchTerm) { setSearchTerm(''); dispatch(fetchJobs({ types: activeTypes, remote: remoteOnly })); } }}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <FaTimes size={12} />
                  </button>
                )}
                <Button type="button" onClick={handleSearch} className="rounded-full px-5 sm:px-8 shadow-glow whitespace-nowrap text-sm">
                  Search
                </Button>
              </Card>
            </div>
            {/* Mobile filter toggle */}
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="md:hidden flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 text-sm font-medium text-text-primary dark:text-white shadow-sm"
            >
              <FaFilter size={13} />
              Filters
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
              )}
            </button>
          </div>

          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2">
              {searchTerm && (
                <span className="flex items-center gap-1.5 text-xs font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full">
                  "{searchTerm}"
                  <button onClick={() => { setSearchTerm(''); setSearchInput(''); dispatch(fetchJobs({ types: activeTypes, remote: remoteOnly })); }}>
                    <FaTimes size={10} />
                  </button>
                </span>
              )}
              {activeTypes.map(t => (
                <span key={t} className="flex items-center gap-1.5 text-xs font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full">
                  {t}
                  <button onClick={() => toggleType(t)}><FaTimes size={10} /></button>
                </span>
              ))}
              {remoteOnly && (
                <span className="flex items-center gap-1.5 text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-3 py-1 rounded-full">
                  Remote only
                  <button onClick={() => setRemoteOnly(false)}><FaTimes size={10} /></button>
                </span>
              )}
              <button onClick={handleClearFilters} className="text-xs font-medium text-gray-500 hover:text-primary underline ml-1">
                Clear all
              </button>
            </div>
          )}

          {/* ─── Recommended Jobs (only when no search/filter active) ─── */}
          {!hasActiveFilters && !isLoading && recommendedJobs.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="text-xl font-extrabold text-text-primary dark:text-white flex items-center gap-2">
                  <FaStar className="text-amber-400" size={18} />
                  Recommended for You
                </h2>
                <span className="text-xs font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 px-2.5 py-1 rounded-full">
                  Based on your skills
                </span>
              </div>
              <div className="space-y-4">
                {recommendedJobs.slice(0, 3).map((job, index) => (
                  <JobCard
                    key={`rec-${job._id}`}
                    job={job}
                    index={index}
                    isApplied={appliedJobIds.has(String(job._id))}
                    isApplying={isApplying}
                    isSaved={savedJobIds.includes(String(job._id))}
                    onApply={handleApply}
                    onSave={handleSave}
                    onView={openJobDetails}
                    matchScore={job.matchScore}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ─── Results Header ──────────────────────────────────── */}
          <div className="flex justify-between items-center px-1">
            <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary dark:text-white">
              {searchTerm ? `Results for "${searchTerm}"` : hasActiveFilters ? 'Filtered Jobs' : 'All Jobs'}
            </h2>
            <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full whitespace-nowrap">
              {isLoading ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-primary/50 animate-pulse inline-block" />
                  Loading...
                </span>
              ) : !hasFetched ? '' : `${jobs.length} Result${jobs.length !== 1 ? 's' : ''}`}
            </span>
          </div>

          {/* ─── States ──────────────────────────────────────────── */}

          {/* LOADING */}
          {isLoading && (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => <JobSkeleton key={i} />)}
            </div>
          )}

          {/* ERROR */}
          {!isLoading && hasFetched && error && (
            <Card className="text-center py-14">
              <FaExclamationTriangle className="text-4xl text-amber-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-text-primary dark:text-white mb-2">Unable to load jobs</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Something went wrong while fetching jobs. Please try again.
              </p>
              <Button onClick={() => dispatch(fetchJobs({ search: searchTerm || undefined, types: activeTypes, remote: remoteOnly }))} className="gap-2">
                <FaRedo size={13} /> Try Again
              </Button>
            </Card>
          )}

          {/* SUCCESS — Jobs List */}
          {!isLoading && !error && hasFetched && jobs.length > 0 && (
            <AnimatePresence>
              <div className="space-y-4">
                {jobs.map((job, index) => (
                  <JobCard
                    key={job._id}
                    job={job}
                    index={index}
                    isApplied={appliedJobIds.has(String(job._id))}
                    isApplying={isApplying}
                    isSaved={savedJobIds.includes(String(job._id))}
                    onApply={handleApply}
                    onSave={handleSave}
                    onView={openJobDetails}
                    matchScore={job.matchScore}
                  />
                ))}
              </div>
            </AnimatePresence>
          )}

          {/* EMPTY */}
          {!isLoading && !error && hasFetched && jobs.length === 0 && (
            <Card className="text-center py-16">
              <FaBriefcase className="text-5xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-text-primary dark:text-white mb-2">
                {hasActiveFilters ? 'No jobs match your filters' : 'No jobs available'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                {hasActiveFilters
                  ? 'Try adjusting your search or clearing the filters.'
                  : 'Check back later — new jobs are posted regularly.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {hasActiveFilters && (
                  <Button onClick={handleClearFilters} variant="outline" className="gap-2">
                    <FaTimes size={13} /> Clear Filters
                  </Button>
                )}
                <Button onClick={() => dispatch(fetchJobs({}))} className="gap-2">
                  <FaRedo size={13} /> Browse All Jobs
                </Button>
              </div>
            </Card>
          )}

          {/* Pre-fetch placeholder (before any request completes) */}
          {!hasFetched && !isLoading && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => <JobSkeleton key={i} />)}
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default Jobs;
