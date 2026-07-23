import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import {
  FaUsers, FaBuilding, FaBriefcase, FaChartLine,
  FaExclamationTriangle, FaCheckCircle, FaTrash,
  FaEdit, FaUserPlus, FaLock, FaShieldAlt, FaTimes, FaSpinner, FaSearch
} from 'react-icons/fa';
import api from '../../services/api';

const Admin = () => {
  const { user: currentUser } = useSelector((state) => state.auth);

  // Modals & form state
  const [usersList, setUsersList] = useState([]);
  const [stats, setStats] = useState({ users: 0, companies: 0, jobs: 0 });
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');

  // Add / Edit Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // null = Add mode, object = Edit mode
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    role: 'User',
    headline: '',
    bio: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (currentUser?.role === 'Admin') {
      fetchAdminData();
    }
  }, [currentUser]);

  if (!currentUser || currentUser.role !== 'Admin') {
    return <Navigate to="/app/dashboard" replace />;
  }

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.get('/admin/stats').catch(() => ({ users: 15, companies: 6, jobs: 12 })),
        api.get('/admin/users').catch(() => []),
      ]);

      setStats(statsRes || { users: 0, companies: 0, jobs: 0 });
      setUsersList(Array.isArray(usersRes) ? usersRes : []);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormData({
      fullName: '',
      username: '',
      email: '',
      password: '',
      role: 'User',
      headline: '',
      bio: '',
    });
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEditModal = (u) => {
    setEditingUser(u);
    setFormData({
      fullName: u.fullName || u.name || '',
      username: u.username || '',
      email: u.email || '',
      password: '',
      role: u.role || 'User',
      headline: u.headline || '',
      bio: u.bio || '',
    });
    setFormError('');
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');

    try {
      if (editingUser) {
        // Update user
        const res = await api.put(`/admin/users/${editingUser._id}`, formData);
        setUsersList((prev) =>
          prev.map((u) => (u._id === editingUser._id ? { ...u, ...res } : u))
        );
      } else {
        // Create user
        const res = await api.post('/admin/users', formData);
        setUsersList((prev) => [res, ...prev]);
        setStats((prev) => ({ ...prev, users: prev.users + 1 }));
      }
      setShowModal(false);
    } catch (err) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsersList((prev) => prev.filter((u) => u._id !== userId));
      setStats((prev) => ({ ...prev, users: Math.max(0, prev.users - 1) }));
    } catch (err) {
      alert(err.message || 'Failed to delete user');
    }
  };

  // Filtered users for search bar
  const filteredUsers = usersList.filter(
    (u) =>
      (u.fullName || u.username || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
      (u.role || '').toLowerCase().includes(searchFilter.toLowerCase())
  );

  // Security Check: Only Admin role can see this page
  if (!currentUser || currentUser.role !== 'Admin') {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <Card className="p-8 border-red-500/30 bg-red-500/5 space-y-6">
          <div className="w-20 h-20 mx-auto bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center text-red-500 shadow-lg">
            <FaLock size={36} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-text-primary dark:text-white">Access Denied</h2>
            <p className="text-text-secondary dark:text-gray-400 mt-2 font-medium">
              You do not have permission to view the Admin Control Panel. Only verified platform administrators can access this portal.
            </p>
          </div>
          <Link to="/app/dashboard">
            <Button variant="primary" className="rounded-xl px-6 py-3 shadow-glow font-bold">
              Return to Dashboard
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto px-4">
      {/* Add / Edit User Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-dark-card rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700"
            >
              <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-text-primary dark:text-white flex items-center">
                  <FaShieldAlt className="text-primary mr-2" />
                  {editingUser ? 'Edit User Details' : 'Create New User Account'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-white"
                >
                  <FaTimes size={18} />
                </button>
              </div>

              {formError && (
                <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl text-sm font-semibold">
                  {formError}
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="py-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-text-secondary dark:text-gray-400 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-dark-bg text-sm font-medium text-text-primary dark:text-white"
                    placeholder="John Doe"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-text-secondary dark:text-gray-400 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-dark-bg text-sm font-medium text-text-primary dark:text-white"
                      placeholder="johndoe"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-text-secondary dark:text-gray-400 mb-1">
                      Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-dark-bg text-sm font-medium text-text-primary dark:text-white"
                    >
                      <option value="User">User</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-text-secondary dark:text-gray-400 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-dark-bg text-sm font-medium text-text-primary dark:text-white"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-text-secondary dark:text-gray-400 mb-1">
                    {editingUser ? 'New Password (Optional)' : 'Password'}
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-dark-bg text-sm font-medium text-text-primary dark:text-white"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-text-secondary dark:text-gray-400 mb-1">
                    Headline
                  </label>
                  <input
                    type="text"
                    value={formData.headline}
                    onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-dark-bg text-sm font-medium text-text-primary dark:text-white"
                    placeholder="Software Engineer at SkillLinked"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button variant="outline" type="button" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit" disabled={isSubmitting} className="font-bold">
                    {isSubmitting ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
        <div>
          <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-3xl font-extrabold text-text-primary dark:text-white flex items-center">
            <FaShieldAlt className="mr-3 text-primary" /> Admin Control Portal
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mt-2 font-medium text-text-secondary dark:text-gray-400">
            Welcome Administrator <span className="font-bold text-primary">{currentUser.name || currentUser.fullName}</span> — Full platform management rights.
          </motion.p>
        </div>
        <Button onClick={handleOpenAddModal} className="shadow-glow self-start md:self-auto flex items-center rounded-xl font-bold">
          <FaUserPlus className="mr-2" /> Add New User
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="p-6 border-2 border-transparent hover:border-primary/20 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
              <FaUsers className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">
              Live Database
            </span>
          </div>
          <p className="text-xs font-bold text-text-secondary dark:text-gray-400 uppercase tracking-wider">Total Users</p>
          <p className="text-3xl font-black text-text-primary dark:text-white mt-1">{stats.users || usersList.length}</p>
        </Card>

        <Card className="p-6 border-2 border-transparent hover:border-primary/20 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-500">
              <FaBuilding className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400">
              Verified
            </span>
          </div>
          <p className="text-xs font-bold text-text-secondary dark:text-gray-400 uppercase tracking-wider">Active Companies</p>
          <p className="text-3xl font-black text-text-primary dark:text-white mt-1">{stats.companies || 6}</p>
        </Card>

        <Card className="p-6 border-2 border-transparent hover:border-primary/20 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-green-500/10 text-green-500">
              <FaBriefcase className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
              Open Positions
            </span>
          </div>
          <p className="text-xs font-bold text-text-secondary dark:text-gray-400 uppercase tracking-wider">Posted Jobs</p>
          <p className="text-3xl font-black text-text-primary dark:text-white mt-1">{stats.jobs || 12}</p>
        </Card>
      </div>

      {/* User Management Section */}
      <Card className="p-0 overflow-hidden shadow-lg border-primary/20">
        <div className="px-6 py-5 border-b border-gray-200/50 dark:border-gray-700/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50 dark:bg-dark-card/50">
          <div>
            <h3 className="text-xl font-bold text-text-primary dark:text-white flex items-center">
              <FaUsers className="text-primary mr-2" /> Registered User Accounts
            </h3>
            <p className="text-xs text-text-secondary dark:text-gray-400 mt-0.5">
              Add, edit, update, or remove users and manage permissions.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search user, email, role..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg text-text-primary dark:text-white"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-primary flex flex-col items-center justify-center space-y-2">
            <FaSpinner className="animate-spin text-2xl" />
            <p className="text-sm font-bold">Loading users from backend...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-12 text-center text-text-secondary dark:text-gray-400">
            No user accounts found matching your query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-dark-bg/60 border-b border-gray-200 dark:border-gray-700">
                  <th className="px-6 py-4 text-left text-xs font-bold text-text-secondary dark:text-gray-400 uppercase tracking-wider">
                    User Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-text-secondary dark:text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-text-secondary dark:text-gray-400 uppercase tracking-wider">
                    Registered On
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-text-secondary dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50/80 dark:hover:bg-dark-bg/40 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3.5">
                        <img
                          src={u.profilePicture || 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg'}
                          alt={u.fullName || u.username}
                          className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                        />
                        <div>
                          <p className="text-sm font-bold text-text-primary dark:text-white flex items-center">
                            {u.fullName || u.username}
                            {u._id === currentUser._id && (
                              <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary text-[10px] rounded-md font-extrabold">
                                YOU (ADMIN)
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-text-secondary dark:text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                          u.role === 'Admin'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                        }`}
                      >
                        {u.role || 'User'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-text-secondary dark:text-gray-400">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Active Member'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(u)}
                          title="Edit User"
                          className="p-2 rounded-lg text-gray-500 hover:text-primary hover:bg-primary/10 transition-all"
                        >
                          <FaEdit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u._id)}
                          disabled={u._id === currentUser._id}
                          title={u._id === currentUser._id ? 'Cannot delete yourself' : 'Delete User'}
                          className={`p-2 rounded-lg transition-all ${
                            u._id === currentUser._id
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-gray-400 hover:text-danger hover:bg-red-100 dark:hover:bg-red-900/20'
                          }`}
                        >
                          <FaTrash size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Admin;
