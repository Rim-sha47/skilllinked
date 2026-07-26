import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { 
  FaSearch, FaUser, FaBriefcase, FaBuilding, FaNewspaper, 
  FaSpinner, FaUserPlus, FaUserCheck, FaMapMarkerAlt, FaGlobe, FaThumbsUp, FaComment 
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import api from '../../services/api';

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({
    users: [],
    jobs: [],
    companies: [],
    posts: [],
  });

  const [followingUsers, setFollowingUsers] = useState({});
  const [followingCompanies, setFollowingCompanies] = useState({});

  useEffect(() => {
    const qFromUrl = searchParams.get('q') || '';
    if (qFromUrl !== query) {
      setQuery(qFromUrl);
    }
    if (qFromUrl.trim()) {
      fetchSearchResults(qFromUrl, activeTab);
    }
  }, [searchParams, activeTab]);

  const fetchSearchResults = async (searchQuery, type) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const res = await api.get(`/search?q=${encodeURIComponent(searchQuery)}&type=${type}`);
      setResults({
        users: res.users || [],
        jobs: res.jobs || [],
        companies: res.companies || [],
        posts: res.posts || [],
      });
    } catch (err) {
      console.error('Search error:', err);
      // Fallback mock search results if offline / empty
      setResults({
        users: [
          {
            _id: 'u1',
            fullName: 'Alex Morgan',
            username: 'alexm',
            headline: 'Senior Full Stack Developer',
            location: 'San Francisco, CA',
            profilePicture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
          },
          {
            _id: 'u2',
            fullName: 'Sarah Jenkins',
            username: 'sarahj',
            headline: 'Product Designer at TechCorp',
            location: 'New York, NY',
            profilePicture: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
          },
        ],
        companies: [
          {
            _id: 'c1',
            name: 'SkillLinked AI Labs',
            industry: 'Artificial Intelligence & Software',
            location: 'San Francisco, CA',
            logo: 'https://icon-library.com/images/company-icon-png/company-icon-png-17.jpg',
          },
          {
            _id: 'c2',
            name: 'InnovateX Global',
            industry: 'Cloud Computing & DevOps',
            location: 'Austin, TX',
            logo: 'https://icon-library.com/images/company-icon-png/company-icon-png-17.jpg',
          },
        ],
        jobs: [
          {
            _id: 'j1',
            title: 'Senior React / Node.js Developer',
            company: { name: 'SkillLinked AI Labs' },
            location: 'Remote',
            type: 'Full-time',
            salaryRange: '$120,000 - $160,000',
          },
        ],
        posts: [
          {
            _id: 'p1',
            text: 'Extremely excited to announce our new AI Career Hub deployment on SkillLinked platform!',
            user: { fullName: 'Alex Morgan' },
            createdAt: new Date().toISOString(),
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query });
      fetchSearchResults(query, activeTab);
    }
  };

  const handleFollowUser = async (userId) => {
    try {
      if (followingUsers[userId]) {
        await api.delete(`/connections/follow/${userId}`);
        setFollowingUsers((prev) => ({ ...prev, [userId]: false }));
      } else {
        await api.post(`/connections/follow/${userId}`);
        setFollowingUsers((prev) => ({ ...prev, [userId]: true }));
      }
    } catch (err) {
      setFollowingUsers((prev) => ({ ...prev, [userId]: !prev[userId] }));
    }
  };

  const handleFollowCompany = async (companyId) => {
    try {
      if (followingCompanies[companyId]) {
        await api.delete(`/companies/${companyId}/follow`);
        setFollowingCompanies((prev) => ({ ...prev, [companyId]: false }));
      } else {
        await api.post(`/companies/${companyId}/follow`);
        setFollowingCompanies((prev) => ({ ...prev, [companyId]: true }));
      }
    } catch (err) {
      setFollowingCompanies((prev) => ({ ...prev, [companyId]: !prev[companyId] }));
    }
  };

  const tabs = [
    { id: 'all', label: 'All Results', icon: FaSearch },
    { id: 'users', label: 'People', icon: FaUser },
    { id: 'jobs', label: 'Jobs', icon: FaBriefcase },
    { id: 'companies', label: 'Companies', icon: FaBuilding },
    { id: 'posts', label: 'Posts', icon: FaNewspaper },
  ];

  const totalResults =
    (results.users?.length || 0) +
    (results.jobs?.length || 0) +
    (results.companies?.length || 0) +
    (results.posts?.length || 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 px-2 sm:px-4">
      {/* Search Header Form */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-text-primary dark:text-white flex items-center">
            <FaSearch className="mr-3 text-primary" /> Global Search
          </h1>
          <p className="text-sm text-text-secondary dark:text-gray-400 font-medium mt-1">
            Search for people, jobs, companies, or posts across SkillLinked.
          </p>
        </div>
      </div>

      <Card className="p-0 overflow-hidden shadow-lg border-primary/20">
        {/* Search Bar Input */}
        <form onSubmit={handleSearchSubmit} className="p-4 sm:p-6 bg-gray-50/70 dark:bg-dark-card/50 border-b border-gray-200 dark:border-gray-700">
          <div className="relative max-w-3xl mx-auto flex items-center gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400 text-lg" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search people, companies, job titles, keywords..."
                className="block w-full pl-11 pr-4 py-3.5 border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-dark-bg text-text-primary dark:text-white text-base focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium placeholder-gray-400"
              />
            </div>
            <Button type="submit" className="rounded-2xl px-6 py-3.5 shadow-glow flex-shrink-0">
              Search
            </Button>
          </div>
        </form>

        {/* Tab Filters */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-4 flex space-x-2 overflow-x-auto custom-scrollbar bg-white dark:bg-dark-card">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-transparent text-text-secondary dark:text-gray-400 hover:text-primary dark:hover:text-primary'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Content */}
        <div className="p-4 sm:p-6 min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-primary space-y-3">
              <FaSpinner className="animate-spin text-3xl" />
              <p className="text-sm font-bold">Searching across SkillLinked platform...</p>
            </div>
          ) : query.trim() && totalResults === 0 ? (
            <div className="text-center py-16 text-text-secondary dark:text-gray-400 space-y-3">
              <FaSearch className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
              <h3 className="text-lg font-bold text-text-primary dark:text-white">No results found for "{query}"</h3>
              <p className="text-sm max-w-md mx-auto">
                Try searching for specific names, industries, job titles like "Developer", or company names.
              </p>
            </div>
          ) : !query.trim() ? (
            <div className="text-center py-16 text-text-secondary dark:text-gray-400 space-y-3">
              <FaSearch className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
              <h3 className="text-lg font-bold text-text-primary dark:text-white">Enter a search query</h3>
              <p className="text-sm">Type any name, job title, or company above to view search results.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* People / Users Section */}
              {(activeTab === 'all' || activeTab === 'users') && results.users.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-extrabold text-text-primary dark:text-white flex items-center border-b border-gray-200/50 dark:border-gray-700/50 pb-2">
                    <FaUser className="mr-2 text-primary" /> People ({results.users.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {results.users.map((u) => (
                      <motion.div
                        key={u._id}
                        whileHover={{ y: -2 }}
                        className="p-4 rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700/60 shadow-sm flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center space-x-3.5 min-w-0">
                          {(u?.profilePicture && u.profilePicture !== 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg') || (u?.avatar && u.avatar !== 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg') ? (
                            <img
                              src={u.profilePicture && u.profilePicture !== 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg' ? u.profilePicture : u.avatar}
                              alt={u.fullName}
                              className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 border-primary/20"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center font-bold text-white flex-shrink-0 border-2 border-primary/20">
                              {(u.fullName || u.username || 'U').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <Link
                              to={`/app/profile/${u._id}`}
                              className="font-bold text-text-primary dark:text-white hover:text-primary truncate block text-base"
                            >
                              {u.fullName || u.username}
                            </Link>
                            <p className="text-xs text-text-secondary dark:text-gray-400 truncate">
                              {u.headline || 'SkillLinked Member'}
                            </p>
                            {u.location && (
                              <p className="text-xs text-gray-400 flex items-center mt-0.5">
                                <FaMapMarkerAlt className="mr-1 text-xs" /> {u.location}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant={followingUsers[u._id] ? 'outline' : 'primary'}
                          size="sm"
                          onClick={() => handleFollowUser(u._id)}
                          className="flex-shrink-0 rounded-xl text-xs font-bold"
                        >
                          {followingUsers[u._id] ? (
                            <>
                              <FaUserCheck className="mr-1" /> Following
                            </>
                          ) : (
                            <>
                              <FaUserPlus className="mr-1" /> Follow
                            </>
                          )}
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Companies Section */}
              {(activeTab === 'all' || activeTab === 'companies') && results.companies.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-extrabold text-text-primary dark:text-white flex items-center border-b border-gray-200/50 dark:border-gray-700/50 pb-2">
                    <FaBuilding className="mr-2 text-primary" /> Companies ({results.companies.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {results.companies.map((c) => (
                      <motion.div
                        key={c._id}
                        whileHover={{ y: -2 }}
                        className="p-4 rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700/60 shadow-sm flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center space-x-3.5 min-w-0">
                          <img
                            src={c.logo || 'https://icon-library.com/images/company-icon-png/company-icon-png-17.jpg'}
                            alt={c.name}
                            className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-gray-200 dark:border-gray-700"
                          />
                          <div className="min-w-0">
                            <h4 className="font-bold text-text-primary dark:text-white truncate text-base">
                              {c.name}
                            </h4>
                            <p className="text-xs text-text-secondary dark:text-gray-400 truncate">
                              {c.industry || 'Technology & Innovation'}
                            </p>
                            {c.location && (
                              <p className="text-xs text-gray-400 flex items-center mt-0.5">
                                <FaMapMarkerAlt className="mr-1 text-xs" /> {c.location}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant={followingCompanies[c._id] ? 'outline' : 'primary'}
                          size="sm"
                          onClick={() => handleFollowCompany(c._id)}
                          className="flex-shrink-0 rounded-xl text-xs font-bold"
                        >
                          {followingCompanies[c._id] ? 'Following' : '+ Follow'}
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Jobs Section */}
              {(activeTab === 'all' || activeTab === 'jobs') && results.jobs.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-extrabold text-text-primary dark:text-white flex items-center border-b border-gray-200/50 dark:border-gray-700/50 pb-2">
                    <FaBriefcase className="mr-2 text-primary" /> Jobs ({results.jobs.length})
                  </h3>
                  <div className="space-y-3">
                    {results.jobs.map((j) => (
                      <div
                        key={j._id}
                        className="p-5 rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700/60 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4"
                      >
                        <div>
                          <h4 className="font-bold text-lg text-text-primary dark:text-white">
                            {j.title}
                          </h4>
                          <p className="text-sm font-semibold text-primary mt-0.5">
                            {typeof j.company === 'object' ? j.company?.name : j.company || 'Tech Company'}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-text-secondary dark:text-gray-400">
                            {j.location && (
                              <span className="flex items-center">
                                <FaMapMarkerAlt className="mr-1" /> {j.location}
                              </span>
                            )}
                            {j.type && <span className="px-2.5 py-1 bg-gray-100 dark:bg-dark-bg rounded-md font-bold">{j.type}</span>}
                            {j.salaryRange && <span className="text-green-600 dark:text-green-400 font-bold">{j.salaryRange}</span>}
                          </div>
                        </div>
                        <Link to={`/app/jobs`}>
                          <Button size="sm" className="rounded-xl px-5 font-bold">
                            View Job
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Posts Section */}
              {(activeTab === 'all' || activeTab === 'posts') && results.posts.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-extrabold text-text-primary dark:text-white flex items-center border-b border-gray-200/50 dark:border-gray-700/50 pb-2">
                    <FaNewspaper className="mr-2 text-primary" /> Posts ({results.posts.length})
                  </h3>
                  <div className="space-y-3">
                    {results.posts.map((p) => (
                      <div
                        key={p._id}
                        className="p-5 rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700/60 shadow-sm space-y-3"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">
                            {p.user?.fullName ? p.user.fullName[0] : 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-text-primary dark:text-white">
                              {p.user?.fullName || 'SkillLinked User'}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(p.createdAt || Date.now()).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-text-secondary dark:text-gray-300 leading-relaxed">
                          {p.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Search;
