import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { FaMapMarkerAlt, FaBriefcase, FaMoneyBillWave, FaClock, FaBookmark, FaSearch, FaBolt, FaCheckCircle, FaBuilding } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchJobs, fetchMyApplications, applyToJob } from '../../redux/slices/jobSlice';

// Gradient palette per company initial letter
const LOGO_GRADIENTS = [
  'from-blue-500 to-blue-700',
  'from-purple-500 to-purple-700',
  'from-green-500 to-green-700',
  'from-orange-500 to-orange-700',
  'from-pink-500 to-pink-700',
  'from-cyan-500 to-cyan-700',
];
const logoGradient = (name) => LOGO_GRADIENTS[(name?.charCodeAt(0) || 0) % LOGO_GRADIENTS.length];

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship'];

const Jobs = () => {
  const dispatch = useDispatch();
  const { jobs, myApplications, isLoading, isApplying } = useSelector(state => state.jobs);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTypes, setActiveTypes] = useState([]);
  const [remoteOnly, setRemoteOnly] = useState(false);

  const appliedJobIds = new Set(myApplications.map(a => a.job?._id));

  const loadJobs = useCallback(() => {
    dispatch(fetchJobs({
      search: searchTerm || undefined,
      type: activeTypes.length === 1 ? activeTypes[0] : undefined,
      remote: remoteOnly ? true : undefined,
    }));
  }, [dispatch, searchTerm, activeTypes, remoteOnly]);

  useEffect(() => {
    dispatch(fetchMyApplications());
  }, [dispatch]);

  useEffect(() => {
    loadJobs();
  }, [activeTypes, remoteOnly]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadJobs();
  };

  const toggleType = (type) => {
    setActiveTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleApply = (jobId) => {
    if (!appliedJobIds.has(jobId)) {
      dispatch(applyToJob({ jobId }));
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 max-w-7xl mx-auto pb-12">

      {/* Left Sidebar - Filters */}
      <div className="w-full md:w-72 flex-shrink-0 space-y-6">
        <Card className="sticky top-24 border-2 border-transparent">
          <h3 className="text-lg font-bold text-text-primary dark:text-white mb-6">Filters</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-text-primary dark:text-gray-200 mb-3">Job Type</label>
              <div className="space-y-3">
                {JOB_TYPES.map((type) => (
                  <label key={type} className="flex items-center group cursor-pointer">
                    <input
                      type="checkbox"
                      checked={activeTypes.includes(type)}
                      onChange={() => toggleType(type)}
                      className="rounded-md border-gray-300 dark:border-gray-600 text-primary focus:ring-primary h-4 w-4 bg-gray-50 dark:bg-dark-bg transition-all cursor-pointer"
                    />
                    <span className="ml-3 text-sm font-medium text-text-secondary dark:text-gray-400 group-hover:text-primary transition-colors">{type}</span>
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
                <span className="ml-3 text-sm font-medium text-text-secondary dark:text-gray-400 group-hover:text-primary transition-colors">Remote only</span>
              </label>
            </div>

            <button
              onClick={() => { setActiveTypes([]); setRemoteOnly(false); }}
              className="w-full mt-2 py-2.5 text-sm font-semibold border border-gray-200 dark:border-gray-700 text-text-secondary dark:text-gray-400 hover:border-primary hover:text-primary rounded-xl transition-all"
            >
              Clear Filters
            </button>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-6">

        {/* Search Bar */}
        <form onSubmit={handleSearch}>
          <Card className="p-2 pl-4 pr-2 flex items-center gap-4 rounded-full border-primary/20">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <FaSearch className="text-primary text-lg" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-3 border-none bg-transparent text-text-primary dark:text-white placeholder-gray-400 focus:outline-none focus:ring-0 sm:text-base font-medium"
                placeholder="Search jobs by title, skill, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button type="submit" className="rounded-full px-8 shadow-glow">Search</Button>
          </Card>
        </form>

        {/* Results Header */}
        <div className="flex justify-between items-end px-1">
          <div>
            <h2 className="text-2xl font-extrabold text-text-primary dark:text-white">
              {searchTerm ? `Results for "${searchTerm}"` : 'Recommended Jobs'}
            </h2>
            <p className="text-sm font-medium text-text-secondary dark:text-gray-400 mt-1">
              {jobs.length > 0 ? 'Latest open positions' : 'No jobs found with current filters'}
            </p>
          </div>
          <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
            {isLoading ? '...' : `${jobs.length} Results`}
          </span>
        </div>

        {/* Job Cards */}
        {isLoading ? (
          <div className="space-y-5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
                <div className="flex gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-2/3" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-1/3" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : jobs.length > 0 ? (
          <AnimatePresence>
            <div className="space-y-5">
              {jobs.map((job, index) => {
                const companyName = job.company?.name || 'Company';
                const isApplied = appliedJobIds.has(job._id);
                return (
                  <motion.div
                    key={job._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.06 }}
                  >
                    <Card className={`p-6 group cursor-pointer border-2 transition-all hover:-translate-y-1 ${isApplied ? 'border-green-500/30 bg-green-50/30 dark:bg-green-900/5' : 'border-transparent hover:border-primary/40 hover:shadow-lg'}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-5">
                          {/* Company logo */}
                          <div className={`w-16 h-16 rounded-2xl flex-shrink-0 bg-gradient-to-br ${logoGradient(companyName)} flex items-center justify-center text-white font-black text-2xl shadow-lg`}>
                            {companyName.charAt(0)}
                          </div>

                          <div>
                            <h3 className="text-xl font-bold text-text-primary dark:text-white group-hover:text-primary transition-colors">
                              {job.title}
                            </h3>
                            <p className="text-base font-semibold text-text-secondary dark:text-gray-300 mt-1 flex items-center gap-1.5">
                              <FaBuilding size={13} className="text-gray-400" /> {companyName}
                            </p>

                            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-text-secondary dark:text-gray-400">
                              {job.location && <span className="flex items-center"><FaMapMarkerAlt className="mr-1.5 text-gray-400" />{job.location}</span>}
                              {job.type && <span className="flex items-center"><FaBriefcase className="mr-1.5 text-gray-400" />{job.type}</span>}
                              {job.salaryRange && <span className="flex items-center"><FaMoneyBillWave className="mr-1.5 text-green-500" />{job.salaryRange}</span>}
                              <span className="flex items-center"><FaClock className="mr-1.5 text-gray-400" />{timeAgo(job.createdAt)}</span>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              {job.workplaceType === 'Remote' && (
                                <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Remote</span>
                              )}
                              {job.skills?.slice(0, 5).map((skill, i) => (
                                <span key={i} className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 px-3 py-1 rounded-full text-xs font-semibold">{skill}</span>
                              ))}
                              {isApplied && (
                                <span className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                  <FaCheckCircle /> Applied
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end justify-between gap-6">
                          <button className="text-gray-300 dark:text-gray-600 hover:text-primary dark:hover:text-primary transition-colors p-2">
                            <FaBookmark className="h-5 w-5" />
                          </button>
                          <Button
                            onClick={() => handleApply(job._id)}
                            disabled={isApplied || isApplying}
                            className={`px-6 font-bold tracking-wide ${isApplied ? 'bg-green-500 hover:bg-green-500 opacity-75' : 'shadow-glow'}`}
                          >
                            {isApplied ? 'Applied ✓' : (isApplying ? 'Applying...' : 'Easy Apply')}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        ) : (
          <Card className="text-center py-16">
            <FaBriefcase className="text-5xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-text-primary dark:text-white mb-2">No jobs found</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Try adjusting your search or clearing the filters.</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Jobs;
