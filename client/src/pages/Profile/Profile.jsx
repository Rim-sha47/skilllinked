import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import {
  FaMapMarkerAlt, FaLink, FaEdit, FaPlus, FaGraduationCap, FaBriefcase,
  FaCertificate, FaCode, FaTrash, FaHeart, FaRegHeart, FaComment, FaShare,
  FaDownload, FaTimes, FaCamera, FaVideo, FaImage, FaPaperPlane, FaUserFriends,
  FaThumbsUp, FaCheckCircle, FaEllipsisH
} from 'react-icons/fa';
import {
  fetchMyProfile,
  fetchProfileById,
  updateBasicInfo,
  addExperience, removeExperience,
  addEducation, removeEducation,
  addSkill, removeSkill,
  addCertification, removeCertification,
  updateAvatar, removeAvatar,
  updateCoverPhoto, removeCoverPhoto,
  recordProfileView
} from '../../redux/slices/profileSlice';
import { updateUser } from '../../redux/slices/authSlice';
import { followUser, unfollowUser, removeFollower, fetchConnections } from '../../redux/slices/connectionSlice';
import {
  fetchUserPosts, createPost, updatePost, deletePost,
  toggleLikePost, commentOnPost, sharePost, replyToComment, editComment, deleteComment
} from '../../redux/slices/feedSlice';
import { accessOrCreateChat, sendMessage } from '../../redux/slices/messagingSlice';
import api from '../../services/api';

import BasicInfoForm from '../../components/profile/BasicInfoForm';
import ExperienceForm from '../../components/profile/ExperienceForm';
import EducationForm from '../../components/profile/EducationForm';
import SkillForm from '../../components/profile/SkillForm';
import CertificationForm from '../../components/profile/CertificationForm';
import ProfilePicForm from '../../components/profile/ProfilePicForm';
import CoverPhotoForm from '../../components/profile/CoverPhotoForm';

// ─── Sub-components ──────────────────────────────────────────────────────────

const UserListItem = ({ user, onNavigate, renderActions }) => {
  const fObj = typeof user === 'object' ? user : null;
  if (!fObj) return null;
  const fid = fObj._id;
  return (
    <div className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg group">
      <div className="flex items-center space-x-3 cursor-pointer flex-1" onClick={() => onNavigate(fid)}>
        {fObj.profilePicture && fObj.profilePicture !== 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg' ? (
          <img src={fObj.profilePicture} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm">
            {(fObj.fullName || fObj.username || 'U').charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <p className="font-bold text-text-primary dark:text-white text-sm">{fObj.fullName || fObj.username}</p>
          <p className="text-xs text-text-secondary dark:text-gray-400">{fObj.headline || ''}</p>
        </div>
      </div>
      {renderActions && (
        <div className="flex items-center gap-2 ml-2">
          {renderActions(fid, fObj)}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user: authUser } = useSelector(state => state.auth);
  const { data: profile, isLoading } = useSelector(state => state.profile);
  const { userPosts, isPosting } = useSelector(state => state.feed);

  const isMe = !id || id === authUser?._id;
  const displayUser = isMe ? (profile?.user?._id === authUser?._id ? profile.user : authUser) : profile?.user;
  const profileUserId = isMe ? authUser?._id : id;

  // Tabs
  const [activeTab, setActiveTab] = useState('posts');

  // Modals
  const [modals, setModals] = useState({
    basicInfo: false, experience: false, education: false,
    skill: false, certification: false, profilePic: false,
    coverPhoto: false, followersList: false, followingList: false,
    connectionsList: false, newPost: false, postDetail: false, editPost: false,
  });
  const [editItem, setEditItem] = useState(null);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const selectedPost = userPosts.find(p => p._id === selectedPostId) || null;
  const [isAvatarDropdownOpen, setIsAvatarDropdownOpen] = useState(false);
  const [isCoverDropdownOpen, setIsCoverDropdownOpen] = useState(false);

  // New post state
  const [newPostText, setNewPostText] = useState('');
  const [newPostFiles, setNewPostFiles] = useState([]);
  const [newPostPreviews, setNewPostPreviews] = useState([]);
  const fileInputRef = useRef(null);

  // Edit post state
  const [editPostText, setEditPostText] = useState('');

  // Comment state
  const [commentText, setCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  // Share state
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [postToShare, setPostToShare] = useState(null);
  const [shareConnections, setShareConnections] = useState([]);
  const [isSharing, setIsSharing] = useState(false);

  // Connections list for modal
  const [connectionsList, setConnectionsList] = useState([]);

  // Edit post open
  const openEditPost = (post) => {
    setSelectedPostId(post._id);
    setEditPostText(post.text || '');
    setModals(prev => ({ ...prev, editPost: true }));
  };

  const openModal = (type, item = null) => {
    if (item && (item.from || item.to || item.issueDate)) {
      const formattedItem = { ...item };
      if (formattedItem.from) formattedItem.from = formattedItem.from.split('T')[0];
      if (formattedItem.to) formattedItem.to = formattedItem.to.split('T')[0];
      if (formattedItem.issueDate) formattedItem.issueDate = formattedItem.issueDate.split('T')[0];
      if (formattedItem.expirationDate) formattedItem.expirationDate = formattedItem.expirationDate.split('T')[0];
      setEditItem(formattedItem);
    } else {
      setEditItem(item);
    }
    setModals(prev => ({ ...prev, [type]: true }));
  };

  const closeModal = (type) => {
    setEditItem(null);
    setModals(prev => ({ ...prev, [type]: false }));
  };

  // Fetch data
  useEffect(() => {
    if (id) {
      dispatch(fetchProfileById(id));
      if (authUser && id !== authUser._id) dispatch(recordProfileView(id));
    } else {
      dispatch(fetchMyProfile());
    }
  }, [dispatch, id, authUser]);

  useEffect(() => {
    if (profileUserId) {
      dispatch(fetchUserPosts(profileUserId));
    }
  }, [dispatch, profileUserId]);

  // Auto-open modal from URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const modalType = params.get('modal');
    if (modalType === 'followers') setModals(prev => ({ ...prev, followersList: true }));
    else if (modalType === 'following') setModals(prev => ({ ...prev, followingList: true }));
  }, [location.search]);

  // Load connections for modal
  const openConnectionsModal = async () => {
    try {
      const uid = profileUserId;
      if (!uid) return;
      const res = await api.get(`/connections/user/${uid}`);
      setConnectionsList(res || []);
      setModals(prev => ({ ...prev, connectionsList: true }));
    } catch (e) {
      console.error(e);
    }
  };

  // Follow / Unfollow
  const handleFollowToggle = () => {
    if (!profile?.user?._id) return;
    const isFollowing = authUser?.following?.includes(profile.user._id);
    if (isFollowing) {
      dispatch(unfollowUser(profile.user._id)).then(() => dispatch(fetchProfileById(id)));
    } else {
      dispatch(followUser(profile.user._id)).then(() => dispatch(fetchProfileById(id)));
    }
  };

  // Submit handlers
  const handleBasicInfoSubmit = async (data) => {
    try { await dispatch(updateBasicInfo(data)).unwrap(); closeModal('basicInfo'); }
    catch (err) { console.error(err); }
  };
  const handleExperienceSubmit = async (data) => {
    try { await dispatch(addExperience(data)).unwrap(); closeModal('experience'); }
    catch (err) { console.error(err); }
  };
  const handleEducationSubmit = async (data) => {
    try { await dispatch(addEducation(data)).unwrap(); closeModal('education'); }
    catch (err) { console.error(err); }
  };
  const handleSkillSubmit = async (data) => {
    try { await dispatch(addSkill(data.name)).unwrap(); closeModal('skill'); }
    catch (err) { console.error(err); }
  };
  const handleCertificationSubmit = async (data) => {
    try { await dispatch(addCertification(data)).unwrap(); closeModal('certification'); }
    catch (err) { console.error(err); }
  };
  const handleProfilePicSubmit = async (formData) => {
    try {
      const res = await dispatch(updateAvatar(formData)).unwrap();
      if (res && res.profilePicture !== undefined) {
        dispatch(updateUser({ profilePicture: res.profilePicture, avatar: res.profilePicture }));
        dispatch(fetchMyProfile());
      }
      closeModal('profilePic');
    } catch (err) { console.error('Avatar upload error:', err); }
  };
  const handleRemoveProfilePic = async () => {
    try {
      const res = await dispatch(removeAvatar()).unwrap();
      if (res) { dispatch(updateUser({ profilePicture: res.profilePicture })); dispatch(fetchMyProfile()); }
      setIsAvatarDropdownOpen(false);
    } catch (err) { console.error(err); }
  };
  const handleCoverPhotoSubmit = async (formData) => {
    try {
      const res = await dispatch(updateCoverPhoto(formData)).unwrap();
      if (res) { dispatch(updateUser({ coverPhoto: res.coverPhoto })); dispatch(fetchMyProfile()); }
      closeModal('coverPhoto');
    } catch (err) { console.error(err); }
  };
  const handleRemoveCoverPhoto = async () => {
    try {
      const res = await dispatch(removeCoverPhoto()).unwrap();
      if (res) { dispatch(updateUser({ coverPhoto: res.coverPhoto })); dispatch(fetchMyProfile()); }
      setIsCoverDropdownOpen(false);
    } catch (err) { console.error(err); }
  };

  // New Post handlers
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setNewPostFiles(files);
    const previews = files.map(f => ({ url: URL.createObjectURL(f), type: f.type.startsWith('video') ? 'video' : 'image' }));
    setNewPostPreviews(previews);
  };

  const handleCreatePost = async () => {
    if (!newPostText.trim() && newPostFiles.length === 0) return;
    const fd = new FormData();
    fd.append('text', newPostText);
    newPostFiles.forEach(f => fd.append('files', f));
    try {
      await dispatch(createPost(fd)).unwrap();
      setNewPostText('');
      setNewPostFiles([]);
      setNewPostPreviews([]);
      closeModal('newPost');
    } catch (err) { console.error(err); }
  };

  // Edit Post handler
  const handleEditPost = async () => {
    if (!selectedPost) return;
    try {
      await dispatch(updatePost({ postId: selectedPost._id, text: editPostText })).unwrap();
      closeModal('editPost');
      setSelectedPostId(null);
    } catch (err) { console.error(err); }
  };

  // Delete Post handler
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    await dispatch(deletePost(postId)).unwrap();
    if (selectedPost?._id === postId) { closeModal('postDetail'); setSelectedPostId(null); }
  };

  // Like handler
  const handleLike = async (postId) => {
    await dispatch(toggleLikePost(postId));
  };

  // Comment handler
  const handleComment = async (postId) => {
    if (!commentText.trim()) return;
    setIsCommenting(true);
    try {
      if (replyingTo) {
        await dispatch(replyToComment({ postId, commentId: replyingTo.commentId, text: commentText }));
        setReplyingTo(null);
      } else {
        await dispatch(commentOnPost({ postId, text: commentText }));
      }
      setCommentText('');
      // Auto-updated via selectedPostId
    } catch (err) { console.error(err); }
    finally { setIsCommenting(false); }
  };

  const handleEditCommentSubmit = async (postId) => {
    if (!editingCommentText.trim() || !editingComment) return;
    try {
      await dispatch(editComment({ postId, commentId: editingComment, text: editingCommentText }));
      setEditingComment(null);
      setEditingCommentText('');
    } catch (err) { console.error(err); }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await dispatch(deleteComment({ postId, commentId }));
    } catch (err) { console.error(err); }
  };

  const openShareModal = async (post) => {
    setPostToShare(post);
    setShareModalOpen(true);
    try {
      const res = await dispatch(fetchConnections()).unwrap();
      setShareConnections(res);
    } catch (err) { console.error(err); }
  };

  const handleShareToUser = async (userId) => {
    if (!postToShare) return;
    setIsSharing(true);
    try {
      const chat = await dispatch(accessOrCreateChat(userId)).unwrap();
      const postUrl = `${window.location.origin}/app/profile/${postToShare.user._id || postToShare.user}?post=${postToShare._id}`;
      await dispatch(sendMessage({ chatId: chat._id, content: `Check out this post: ${postUrl}` })).unwrap();
      await dispatch(sharePost(postToShare._id));
      alert('Post shared in direct messages!');
      setShareModalOpen(false);
    } catch (err) { console.error(err); }
    finally { setIsSharing(false); }
  };

  // Share handler
  const handleShare = async (postId) => {
    await dispatch(sharePost(postId));
    alert('Post shared!');
  };

  // Download handler
  const handleDownload = (url, filename = 'media') => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();
  };

  // Check if current user liked a post
  const isLiked = (post) => post?.reactions?.some(r => r.user === authUser?._id || r.user?._id === authUser?._id);

  if (isLoading && !profile) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const initials = displayUser?.fullName
    ? displayUser.fullName.split(' ').map(n => n[0]).join('').toUpperCase()
    : displayUser?.username?.[0]?.toUpperCase() || 'U';

  // Get first media of post for thumbnail
  const getPostThumbnail = (post) => {
    if (post.media && post.media.length > 0) return post.media[0];
    return null;
  };

  return (
    <>
    <div className="max-w-5xl mx-auto space-y-0 pb-12">

      {/* ── MODALS ── */}
      <Modal isOpen={modals.basicInfo} onClose={() => closeModal('basicInfo')}>
        <BasicInfoForm defaultValues={profile} onSubmit={handleBasicInfoSubmit} isSubmitting={isLoading} />
      </Modal>
      <Modal isOpen={modals.experience} onClose={() => closeModal('experience')}>
        <ExperienceForm defaultValues={editItem} onSubmit={handleExperienceSubmit} isSubmitting={isLoading} />
      </Modal>
      <Modal isOpen={modals.education} onClose={() => closeModal('education')}>
        <EducationForm defaultValues={editItem} onSubmit={handleEducationSubmit} isSubmitting={isLoading} />
      </Modal>
      <Modal isOpen={modals.skill} onClose={() => closeModal('skill')}>
        <SkillForm onSubmit={handleSkillSubmit} isSubmitting={isLoading} />
      </Modal>
      <Modal isOpen={modals.certification} onClose={() => closeModal('certification')}>
        <CertificationForm defaultValues={editItem} onSubmit={handleCertificationSubmit} isSubmitting={isLoading} />
      </Modal>
      <Modal isOpen={modals.profilePic} onClose={() => closeModal('profilePic')}>
        <h2 className="text-xl font-bold mb-4 text-text-primary dark:text-white">Update Profile Picture</h2>
        <ProfilePicForm onSubmit={handleProfilePicSubmit} isSubmitting={isLoading} />
      </Modal>
      <Modal isOpen={modals.coverPhoto} onClose={() => closeModal('coverPhoto')}>
        <h2 className="text-xl font-bold mb-4 text-text-primary dark:text-white">Update Cover Photo</h2>
        <CoverPhotoForm onSubmit={handleCoverPhotoSubmit} isSubmitting={isLoading} />
      </Modal>

      {/* Followers Modal */}
      <Modal isOpen={modals.followersList} onClose={() => closeModal('followersList')}>
        <h2 className="text-xl font-bold mb-4 text-text-primary dark:text-white">Followers ({displayUser?.followers?.length || 0})</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
          {displayUser?.followers?.length > 0 ? displayUser.followers.map(f => (
            <UserListItem
              key={typeof f === 'object' ? f._id : f}
              user={f}
              onNavigate={(fid) => { closeModal('followersList'); navigate(`/app/profile/${fid}`); }}
              renderActions={(fid, fObj) => (
                <>
                  {isMe && (
                    <button
                      onClick={(e) => { e.stopPropagation(); if (window.confirm('Remove this follower?')) dispatch(removeFollower(fid)); }}
                      className="text-sm font-semibold px-4 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-text-primary dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                  {isMe && !authUser?.following?.includes(fid) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); dispatch(followUser(fid)); }}
                      className="text-sm font-semibold px-4 py-1.5 rounded-lg bg-primary text-white hover:bg-blue-600 transition-colors"
                    >
                      Follow
                    </button>
                  )}
                    <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      closeModal('followersList');
                      try {
                        await dispatch(accessOrCreateChat(fid)).unwrap();
                        navigate('/app/messaging');
                      } catch (err) { console.error('Failed to open chat:', err); }
                    }}
                    className="text-sm font-semibold px-4 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-text-primary dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    Message
                  </button>
                </>
              )}
            />
          )) : <p className="text-sm text-gray-500">No followers yet.</p>}
        </div>
      </Modal>

      {/* Following Modal */}
      <Modal isOpen={modals.followingList} onClose={() => closeModal('followingList')}>
        <h2 className="text-xl font-bold mb-4 text-text-primary dark:text-white">Following ({displayUser?.following?.length || 0})</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
          {displayUser?.following?.length > 0 ? displayUser.following.map(f => (
            <UserListItem
              key={typeof f === 'object' ? f._id : f}
              user={f}
              onNavigate={(fid) => { closeModal('followingList'); navigate(`/app/profile/${fid}`); }}
              renderActions={(fid, fObj) => (
                <>
                  {isMe && (
                    <button
                      onClick={(e) => { e.stopPropagation(); if (window.confirm('Unfollow this user?')) dispatch(unfollowUser(fid)); }}
                      className="text-sm font-semibold px-4 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-text-primary dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      Following
                    </button>
                  )}
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      closeModal('followingList');
                      try {
                        await dispatch(accessOrCreateChat(fid)).unwrap();
                        navigate('/app/messaging');
                      } catch (err) { console.error('Failed to open chat:', err); }
                    }}
                    className="text-sm font-semibold px-4 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-text-primary dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    Message
                  </button>
                </>
              )}
            />
          )) : <p className="text-sm text-gray-500">Not following anyone.</p>}
        </div>
      </Modal>

      {/* Connections Modal */}
      <Modal isOpen={modals.connectionsList} onClose={() => closeModal('connectionsList')}>
        <h2 className="text-xl font-bold mb-4 text-text-primary dark:text-white">Connections ({connectionsList.length})</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
          {connectionsList.length > 0 ? connectionsList.map(u => (
            <UserListItem
              key={u._id}
              user={u}
              onNavigate={(uid) => { closeModal('connectionsList'); navigate(`/app/profile/${uid}`); }}
            />
          )) : <p className="text-sm text-gray-500">No connections yet.</p>}
        </div>
      </Modal>

      {/* New Post Modal */}
      <Modal isOpen={modals.newPost} onClose={() => { closeModal('newPost'); setNewPostText(''); setNewPostFiles([]); setNewPostPreviews([]); }}>
        <h2 className="text-xl font-bold mb-4 text-text-primary dark:text-white">Create Post</h2>
        <div className="flex items-start gap-3 mb-4">
          {displayUser?.profilePicture && displayUser.profilePicture !== 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg' ? (
            <img src={displayUser.profilePicture} alt="me" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold flex-shrink-0">{initials}</div>
          )}
          <textarea
            className="flex-1 min-h-[100px] p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-text-primary dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            placeholder="What's on your mind?"
            value={newPostText}
            onChange={e => setNewPostText(e.target.value)}
          />
        </div>
        {newPostPreviews.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {newPostPreviews.map((p, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
                {p.type === 'video' ? (
                  <video src={p.url} className="w-full h-full object-cover" />
                ) : (
                  <img src={p.url} alt="" className="w-full h-full object-cover" />
                )}
                <button
                  onClick={() => { const f = newPostFiles.filter((_, fi) => fi !== i); const pv = newPostPreviews.filter((_, pi) => pi !== i); setNewPostFiles(f); setNewPostPreviews(pv); }}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                ><FaTimes /></button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors px-3 py-2 rounded-lg hover:bg-primary/10">
              <FaImage /> Photo/Video
            </button>
            <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
          </div>
          <Button onClick={handleCreatePost} disabled={isPosting || (!newPostText.trim() && newPostFiles.length === 0)} className="px-6">
            {isPosting ? 'Posting...' : 'Post'}
          </Button>
        </div>
      </Modal>

      {/* Edit Post Modal */}
      <Modal isOpen={modals.editPost} onClose={() => closeModal('editPost')}>
        <h2 className="text-xl font-bold mb-4 text-text-primary dark:text-white">Edit Post</h2>
        <textarea
          className="w-full min-h-[100px] p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-text-primary dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          value={editPostText}
          onChange={e => setEditPostText(e.target.value)}
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => closeModal('editPost')}>Cancel</Button>
          <Button onClick={handleEditPost}>Save Changes</Button>
        </div>
      </Modal>

      {/* Post Detail Modal — Instagram Style */}
      <AnimatePresence>
        {modals.postDetail && selectedPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => { closeModal('postDetail'); setSelectedPostId(null); setReplyingTo(null); }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Media Side */}
              <div className="flex-1 bg-black flex items-center justify-center min-h-[300px] md:min-h-0">
                {selectedPost.media && selectedPost.media.length > 0 ? (
                  selectedPost.media[0].type === 'video' ? (
                    <video src={selectedPost.media[0].url} controls className="max-h-[70vh] max-w-full object-contain" />
                  ) : (
                    <img src={selectedPost.media[0].url} alt="Post" className="max-h-[70vh] max-w-full object-contain" />
                  )
                ) : (
                  <div className="p-8 text-white text-center">
                    <p className="text-lg font-medium whitespace-pre-wrap">{selectedPost.text}</p>
                  </div>
                )}
              </div>

              {/* Info Side */}
              <div className="w-full md:w-80 flex flex-col border-l border-gray-100 dark:border-gray-800">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    {selectedPost.user?.profilePicture && selectedPost.user.profilePicture !== 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg' ? (
                      <img src={selectedPost.user.profilePicture} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                        {(selectedPost.user?.fullName || 'U').charAt(0)}
                      </div>
                    )}
                    <span className="font-bold text-sm text-text-primary dark:text-white">{selectedPost.user?.fullName || selectedPost.user?.username}</span>
                  </div>
                  <div className="flex gap-1">
                    {isMe && (
                      <>
                        <button onClick={() => openEditPost(selectedPost)} className="p-1.5 text-gray-400 hover:text-primary rounded"><FaEdit size={13} /></button>
                        <button onClick={() => handleDeletePost(selectedPost._id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded"><FaTrash size={13} /></button>
                      </>
                    )}
                    <button onClick={() => { closeModal('postDetail'); setSelectedPostId(null); setReplyingTo(null); }} className="p-1.5 text-gray-400 hover:text-text-primary dark:hover:text-white rounded"><FaTimes /></button>
                  </div>
                </div>

                {/* Caption + Comments */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {selectedPost.text && (
                    <div className="flex gap-2">
                      <span className="font-bold text-xs text-text-primary dark:text-white">{selectedPost.user?.username}</span>
                      <p className="text-xs text-text-secondary dark:text-gray-300 flex-1 whitespace-pre-wrap">{selectedPost.text}</p>
                    </div>
                  )}
                  {selectedPost.comments?.map((c, i) => {
                    const cUser = typeof c.user === 'object' ? (c.user?.fullName || c.user?.username) : 'User';
                    const cAvatar = typeof c.user === 'object' ? c.user?.profilePicture : null;
                    const isMyComment = typeof c.user === 'object' ? c.user?._id === authUser?._id : false;
                    return (
                      <div key={c._id || i} className="flex flex-col gap-1">
                        <div className="flex gap-2 group items-start">
                          {/* Avatar */}
                          {cAvatar ? (
                            <img src={cAvatar} alt={cUser} className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-primary/80 flex items-center justify-center text-white text-[9px] font-bold shrink-0 mt-0.5">{cUser.charAt(0).toUpperCase()}</div>
                          )}
                          <div className="flex-1 min-w-0">
                            {editingComment === c._id ? (
                              <div className="flex gap-1 items-center">
                                <input
                                  className="flex-1 text-xs border border-gray-200 dark:border-gray-700 rounded px-2 py-0.5 bg-white dark:bg-gray-800 text-text-primary dark:text-white outline-none"
                                  value={editingCommentText}
                                  onChange={e => setEditingCommentText(e.target.value)}
                                  onKeyDown={e => { if (e.key === 'Enter') handleEditCommentSubmit(selectedPost._id); if (e.key === 'Escape') setEditingComment(null); }}
                                  autoFocus
                                />
                                <button onClick={() => handleEditCommentSubmit(selectedPost._id)} className="text-[10px] font-bold text-primary">Save</button>
                                <button onClick={() => setEditingComment(null)} className="text-[10px] font-bold text-gray-400">✕</button>
                              </div>
                            ) : (
                              <p className="text-xs text-text-secondary dark:text-gray-300"><span className="font-bold text-text-primary dark:text-white mr-1">{cUser}</span>{c.text}</p>
                            )}
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button onClick={() => setReplyingTo({ commentId: c._id, username: cUser })} className="text-[10px] font-bold text-gray-400 hover:text-primary">Reply</button>
                            {isMyComment && (
                              <>
                                <button onClick={() => { setEditingComment(c._id); setEditingCommentText(c.text); }} className="text-[10px] font-bold text-gray-400 hover:text-blue-500">Edit</button>
                                <button onClick={() => handleDeleteComment(selectedPost._id, c._id)} className="text-[10px] font-bold text-gray-400 hover:text-red-500">Del</button>
                              </>
                            )}
                          </div>
                        </div>
                        {c.replies && c.replies.length > 0 && (
                          <div className="pl-8 space-y-2 mt-1 border-l-2 border-gray-100 dark:border-gray-800">
                            {c.replies.map((r, ri) => {
                              const rUser = typeof r.user === 'object' ? (r.user?.fullName || r.user?.username) : 'User';
                              const rAvatar = typeof r.user === 'object' ? r.user?.profilePicture : null;
                              return (
                                <div key={r._id || ri} className="flex gap-2 text-xs items-start">
                                  {rAvatar ? (
                                    <img src={rAvatar} alt={rUser} className="w-5 h-5 rounded-full object-cover shrink-0 mt-0.5" />
                                  ) : (
                                    <div className="w-5 h-5 rounded-full bg-primary/60 flex items-center justify-center text-white text-[8px] font-bold shrink-0 mt-0.5">{rUser.charAt(0).toUpperCase()}</div>
                                  )}
                                  <p className="text-text-secondary dark:text-gray-400 flex-1"><span className="font-bold text-text-primary dark:text-white mr-1">{rUser}</span>{r.text}</p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Actions */}
                <div className="border-t border-gray-100 dark:border-gray-800 p-4">
                  <div className="flex items-center gap-4 mb-3">
                    <button
                      onClick={() => handleLike(selectedPost._id)}
                      className={`transition-transform hover:scale-110 ${isLiked(selectedPost) ? 'text-red-500' : 'text-gray-500 dark:text-gray-400 hover:text-red-400'}`}
                    >
                      {isLiked(selectedPost) ? <FaHeart size={22} /> : <FaRegHeart size={22} />}
                    </button>
                    <button className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors">
                      <FaComment size={20} />
                    </button>
                    <button onClick={() => openShareModal(selectedPost)} className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors">
                      <FaShare size={20} />
                    </button>
                    {selectedPost.media?.length > 0 && (
                      <button onClick={() => handleDownload(selectedPost.media[0].url)} className="ml-auto text-gray-500 dark:text-gray-400 hover:text-primary transition-colors">
                        <FaDownload size={18} />
                      </button>
                    )}
                  </div>
                  <p className="text-xs font-bold text-text-primary dark:text-white mb-3">
                    {selectedPost.reactions?.length || 0} likes · {selectedPost.comments?.length || 0} comments
                  </p>
                  {/* Comment input */}
                  <div className="flex gap-2 items-center">
                    <input
                      className="flex-1 text-xs border-0 bg-transparent text-text-primary dark:text-white placeholder-gray-400 outline-none"
                      placeholder={replyingTo ? `Reply to ${replyingTo.username}...` : "Add a comment..."}
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleComment(selectedPost._id); }}
                    />
                    {replyingTo && (
                      <button onClick={() => setReplyingTo(null)} className="text-[10px] font-bold text-gray-500 hover:text-red-500">Cancel</button>
                    )}
                    <button
                      onClick={() => handleComment(selectedPost._id)}
                      disabled={!commentText.trim() || isCommenting}
                      className="text-primary text-xs font-bold disabled:opacity-40"
                    >Post</button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── PROFILE HEADER ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        {/* Cover Photo */}
        <div className="w-full h-32 md:h-52 bg-gray-300 dark:bg-gray-700 rounded-t-2xl overflow-hidden relative group">
          {displayUser?.coverPhoto ? (
            <img src={displayUser.coverPhoto} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600" />
          )}
          {isMe && (
            <>
              <div
                className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => setIsCoverDropdownOpen(!isCoverDropdownOpen)}
              ><FaCamera /></div>
              {isCoverDropdownOpen && (
                <div className="absolute top-14 right-4 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl z-50 overflow-hidden border border-gray-200 dark:border-gray-700">
                  <button onClick={() => { setIsCoverDropdownOpen(false); openModal('coverPhoto'); }} className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">Upload Photo</button>
                  <button onClick={handleRemoveCoverPhoto} className="w-full text-left px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm text-red-600">Remove Photo</button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Avatar + Info Row */}
        <div className="bg-white dark:bg-[#1a1f2c] rounded-b-2xl px-6 md:px-10 pb-6 -mt-1 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-end gap-4 -translate-y-10 md:-translate-y-12">
            {/* Avatar */}
            <div className="relative group flex-shrink-0">
              <div
                className={`w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white dark:border-[#1a1f2c] overflow-hidden bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-3xl font-bold text-gray-500 shadow-lg ${isMe ? 'cursor-pointer' : ''}`}
                onClick={() => isMe && setIsAvatarDropdownOpen(!isAvatarDropdownOpen)}
              >
                {displayUser?.profilePicture && displayUser.profilePicture !== 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg' ? (
                  <img src={displayUser.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : displayUser?.avatar && displayUser.avatar !== 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg' ? (
                  <img src={displayUser.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : initials}
              </div>
              {isMe && (
                <div
                  className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                  onClick={() => setIsAvatarDropdownOpen(!isAvatarDropdownOpen)}
                ><FaCamera className="text-white text-xl" /></div>
              )}
              {isMe && isAvatarDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl z-50 overflow-hidden border border-gray-200 dark:border-gray-700">
                  <button onClick={() => { setIsAvatarDropdownOpen(false); openModal('profilePic'); }} className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">Upload New Photo</button>
                  <button onClick={() => { setIsAvatarDropdownOpen(false); openModal('profilePic'); }} className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">Change Photo</button>
                  <button onClick={handleRemoveProfilePic} className="w-full text-left px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm text-red-600">Remove Photo</button>
                </div>
              )}
            </div>

            {/* Name + Actions */}
            <div className="flex-1 mt-10 md:mt-0 md:pb-1">
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <h1 className="text-xl md:text-2xl font-bold text-text-primary dark:text-white">
                  {displayUser?.fullName || displayUser?.username || 'Member'}
                </h1>
                <div className="flex gap-2 flex-wrap">
                  {isMe ? (
                    <>
                      <Button variant="outline" size="sm" onClick={() => openModal('basicInfo')}>
                        <FaEdit className="mr-1.5" size={12} />Edit Profile
                      </Button>
                      <Button size="sm" onClick={() => openModal('newPost')}>
                        <FaPlus className="mr-1.5" size={12} />New Post
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" onClick={handleFollowToggle}>
                        {authUser?.following?.includes(displayUser?._id) ? 'Following' : 'Follow'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          if (!displayUser?._id) return;
                          try {
                            await dispatch(accessOrCreateChat(displayUser._id)).unwrap();
                            navigate('/app/messaging');
                          } catch (err) {
                            console.error('Failed to open chat:', err);
                          }
                        }}
                      >
                        <FaPaperPlane className="mr-1.5" size={11} />
                        Message
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex flex-wrap gap-6 mb-4 -mt-6">
            <div className="cursor-pointer hover:opacity-70 transition-opacity">
              <strong className="text-text-primary dark:text-white">{userPosts.length}</strong>
              <span className="text-text-secondary dark:text-gray-400 ml-1.5 text-sm">posts</span>
            </div>
            <div className="cursor-pointer hover:opacity-70 transition-opacity" onClick={() => openModal('followersList')}>
              <strong className="text-text-primary dark:text-white">{profile?.followersCount || displayUser?.followers?.length || 0}</strong>
              <span className="text-text-secondary dark:text-gray-400 ml-1.5 text-sm">followers</span>
            </div>
            <div className="cursor-pointer hover:opacity-70 transition-opacity" onClick={() => openModal('followingList')}>
              <strong className="text-text-primary dark:text-white">{profile?.followingCount || displayUser?.following?.length || 0}</strong>
              <span className="text-text-secondary dark:text-gray-400 ml-1.5 text-sm">following</span>
            </div>
            <div className="cursor-pointer hover:opacity-70 transition-opacity" onClick={openConnectionsModal}>
              <strong className="text-text-primary dark:text-white">{profile?.connectionsCount || 0}</strong>
              <span className="text-text-secondary dark:text-gray-400 ml-1.5 text-sm">connections</span>
            </div>
          </div>

          {/* Bio */}
          <div className="text-sm space-y-1">
            {(profile?.headline || displayUser?.headline) && (
              <p className="font-semibold text-primary">{profile?.headline || displayUser?.headline}</p>
            )}
            <p className="text-text-primary dark:text-gray-300 whitespace-pre-line leading-relaxed">
              {profile?.bio || (isMe ? <span className="text-gray-400 italic cursor-pointer hover:text-primary" onClick={() => openModal('basicInfo')}>Add a bio to your profile.</span> : '')}
            </p>
            {profile?.website && (
              <a href={profile.website} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 font-semibold flex items-center hover:underline">
                <FaLink className="mr-1.5" size={12} />{profile.website}
              </a>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── TABS ── */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1f2c] sticky top-16 z-30">
        {[
          { key: 'posts', label: 'POSTS', icon: FaImage },
          { key: 'experience', label: 'EXPERIENCE', icon: FaBriefcase },
          { key: 'education', label: 'EDUCATION', icon: FaGraduationCap },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-6 py-4 text-xs font-bold tracking-widest uppercase transition-colors border-t-2 ${
              activeTab === tab.key
                ? 'border-primary text-text-primary dark:text-white'
                : 'border-transparent text-gray-400 hover:text-text-primary dark:hover:text-white'
            }`}
          >
            <tab.icon size={13} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT ── */}
      <AnimatePresence mode="wait">

        {/* POSTS TAB */}
        {activeTab === 'posts' && (
          <motion.div key="posts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-1">
            {isMe && (
              <div className="flex justify-end px-4 py-3">
                <Button size="sm" onClick={() => openModal('newPost')}>
                  <FaPlus className="mr-1.5" size={12} />Create Post
                </Button>
              </div>
            )}
            {userPosts.length > 0 ? (
              <div className="grid grid-cols-3 gap-0.5 md:gap-1">
                {userPosts.map(post => {
                  const thumb = getPostThumbnail(post);
                  return (
                    <motion.div
                      key={post._id}
                      whileHover={{ opacity: 0.85 }}
                      className="aspect-square bg-gray-200 dark:bg-gray-800 relative cursor-pointer overflow-hidden group"
                      onClick={() => { setSelectedPostId(post._id); setCommentText(''); setReplyingTo(null); openModal('postDetail'); }}
                    >
                      {thumb ? (
                        thumb.type === 'video' ? (
                          <video src={thumb.url} className="w-full h-full object-cover" />
                        ) : (
                          <img src={thumb.url} alt="Post" className="w-full h-full object-cover" />
                        )
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 to-accent/10">
                          <p className="text-xs text-text-secondary dark:text-gray-400 text-center line-clamp-4">{post.text}</p>
                        </div>
                      )}
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white font-bold text-sm">
                        <span className="flex items-center gap-1"><FaHeart size={14} />{post.reactions?.length || 0}</span>
                        <span className="flex items-center gap-1"><FaComment size={14} />{post.comments?.length || 0}</span>
                      </div>
                      {/* Video indicator */}
                      {thumb?.type === 'video' && (
                        <div className="absolute top-2 right-2 text-white"><FaVideo size={14} /></div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <FaCamera size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 font-medium mb-2">No posts yet</p>
                {isMe && (
                  <Button size="sm" className="mt-2" onClick={() => openModal('newPost')}>
                    <FaPlus className="mr-1.5" size={12} />Share your first post
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* EXPERIENCE TAB */}
        {activeTab === 'experience' && (
          <motion.div key="experience" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card className="mt-4 hover:border-primary/20 transition-colors border-2 border-transparent">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-text-primary dark:text-white">Experience</h2>
                {isMe && (
                  <button onClick={() => openModal('experience')} className="text-gray-400 hover:text-primary transition-colors p-2 rounded-full hover:bg-primary/10">
                    <FaPlus />
                  </button>
                )}
              </div>
              <div className="relative border-l-2 border-gray-200 dark:border-gray-700 ml-6 space-y-10 pb-4">
                {profile?.experience && profile.experience.length > 0 ? (
                  profile.experience.map((exp, index) => (
                    <div key={exp._id || index} className="relative group">
                      <div className="absolute -left-10 mt-1 w-8 h-8 flex items-center justify-center bg-blue-100 dark:bg-blue-900/40 text-primary rounded-full shadow-sm ring-4 ring-white dark:ring-dark-card z-10">
                        <FaBriefcase size={14} />
                      </div>
                      <div className="pl-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-bold text-text-primary dark:text-white">{exp.title}</h3>
                            <p className="text-base font-semibold text-text-secondary dark:text-gray-300 mt-1">{exp.company} {exp.location ? `• ${exp.location}` : ''}</p>
                            <p className="text-sm font-medium text-gray-500 mt-1.5">
                              {new Date(exp.from).toLocaleDateString()} - {exp.current ? 'Present' : new Date(exp.to).toLocaleDateString()}
                            </p>
                          </div>
                          {isMe && (
                            <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openModal('experience', exp)} className="text-gray-400 hover:text-primary p-2 rounded-full"><FaEdit /></button>
                              <button onClick={() => dispatch(removeExperience(exp._id))} className="text-gray-400 hover:text-red-500 p-2 rounded-full"><FaTrash /></button>
                            </div>
                          )}
                        </div>
                        {exp.description && <p className="text-sm text-text-secondary dark:text-gray-400 mt-4 leading-relaxed">{exp.description}</p>}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 pl-6 text-sm">No experience added yet. {isMe && <span className="text-primary cursor-pointer" onClick={() => openModal('experience')}>Add one!</span>}</p>
                )}
              </div>
            </Card>
          </motion.div>
        )}

        {/* EDUCATION TAB */}
        {activeTab === 'education' && (
          <motion.div key="education" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 mt-4">
            {/* Education */}
            <Card className="hover:border-primary/20 transition-colors border-2 border-transparent">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-text-primary dark:text-white">Education</h2>
                {isMe && <button onClick={() => openModal('education')} className="text-gray-400 hover:text-primary transition-colors p-2 rounded-full hover:bg-primary/10"><FaPlus /></button>}
              </div>
              <div className="space-y-4">
                {profile?.education && profile.education.length > 0 ? (
                  profile.education.map((edu, index) => (
                    <div key={edu._id || index} className="flex space-x-4 items-start group relative">
                      <div className="p-3 bg-gray-100 dark:bg-dark-bg rounded-xl text-gray-600 dark:text-gray-400 shadow-sm flex-shrink-0">
                        <FaGraduationCap size={24} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h3 className="text-base font-bold text-text-primary dark:text-white">{edu.school}</h3>
                          {isMe && (
                            <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openModal('education', edu)} className="text-gray-400 hover:text-primary px-1"><FaEdit size={12} /></button>
                              <button onClick={() => dispatch(removeEducation(edu._id))} className="text-gray-400 hover:text-red-500 px-1"><FaTrash size={12} /></button>
                            </div>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-text-secondary dark:text-gray-400 mt-1">{edu.degree} in {edu.fieldOfStudy}</p>
                        <p className="text-xs font-medium text-gray-500 mt-1">{new Date(edu.from).getFullYear()} - {edu.current ? 'Present' : new Date(edu.to).getFullYear()}</p>
                      </div>
                    </div>
                  ))
                ) : <p className="text-gray-500 text-sm">No education added.</p>}
              </div>
            </Card>

            {/* Skills */}
            <Card className="hover:border-primary/20 transition-colors border-2 border-transparent">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-text-primary dark:text-white">Top Skills</h2>
                {isMe && <button onClick={() => openModal('skill')} className="text-gray-400 hover:text-primary transition-colors p-2 rounded-full hover:bg-primary/10"><FaPlus /></button>}
              </div>
              <div className="flex flex-wrap gap-3">
                {profile?.skills && profile.skills.length > 0 ? (
                  profile.skills.map((skill, index) => (
                    <span key={index} className="group flex items-center bg-gray-100 dark:bg-dark-bg text-text-primary dark:text-gray-200 px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:border-primary/50 transition-all">
                      {skill}
                      {isMe && <button onClick={() => dispatch(removeSkill(skill))} className="ml-2 text-gray-400 hover:text-red-500 hidden group-hover:block"><FaTrash size={11} /></button>}
                    </span>
                  ))
                ) : <p className="text-gray-500 text-sm">No skills added.</p>}
              </div>
            </Card>

            {/* Certifications */}
            <Card className="hover:border-primary/20 transition-colors border-2 border-transparent">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-text-primary dark:text-white">Licenses & Certifications</h2>
                {isMe && <button onClick={() => openModal('certification')} className="text-gray-400 hover:text-primary transition-colors p-2 rounded-full hover:bg-primary/10"><FaPlus /></button>}
              </div>
              <div className="space-y-4">
                {profile?.certifications && profile.certifications.length > 0 ? (
                  profile.certifications.map((cert, index) => (
                    <div key={cert._id || index} className="flex space-x-4 items-start group relative">
                      <div className="p-3 bg-accent/10 dark:bg-accent/20 rounded-xl text-accent shadow-sm flex-shrink-0">
                        <FaCertificate size={24} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h3 className="text-base font-bold text-text-primary dark:text-white">{cert.name}</h3>
                          {isMe && (
                            <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openModal('certification', cert)} className="text-gray-400 hover:text-primary px-1"><FaEdit size={12} /></button>
                              <button onClick={() => dispatch(removeCertification(cert._id))} className="text-gray-400 hover:text-red-500 px-1"><FaTrash size={12} /></button>
                            </div>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-text-secondary dark:text-gray-400 mt-1">{cert.issuingOrganization}</p>
                        <p className="text-xs font-medium text-gray-500 mt-1">
                          Issued {new Date(cert.issueDate).toLocaleDateString()} {cert.expirationDate ? ` · Expires ${new Date(cert.expirationDate).toLocaleDateString()}` : ' · No Expiration'}
                        </p>
                        {cert.credentialUrl && (
                          <Button variant="outline" size="sm" className="mt-3 text-xs rounded-lg py-1.5 px-3" onClick={() => window.open(cert.credentialUrl, '_blank')}>
                            Show Credential
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                ) : <p className="text-gray-500 text-sm">No certifications added.</p>}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>

      {/* Share to Connections Modal */}
      <AnimatePresence>
        {shareModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70" onClick={() => setShareModalOpen(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-dark-card rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-bold text-base text-text-primary dark:text-white">Share Post</h3>
                <button onClick={() => setShareModalOpen(false)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-full"><FaTimes size={13} /></button>
              </div>
              <div className="p-4 space-y-2 max-h-72 overflow-y-auto">
                {shareConnections.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No connections to share with.</p>
                ) : (
                  shareConnections.map(conn => {
                    const otherUser = conn.sender?._id === authUser?._id ? conn.receiver : conn.sender;
                    if (!otherUser) return null;
                    return (
                      <button
                        key={conn._id}
                        disabled={isSharing}
                        onClick={() => handleShareToUser(otherUser._id)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors text-left disabled:opacity-50"
                      >
                        {otherUser.profilePicture ? (
                          <img src={otherUser.profilePicture} alt={otherUser.fullName} className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">{(otherUser.fullName || 'U').charAt(0)}</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-text-primary dark:text-white truncate">{otherUser.fullName}</p>
                          <p className="text-xs text-gray-400 truncate">@{otherUser.username}</p>
                        </div>
                        <FaPaperPlane className="text-primary shrink-0" size={13} />
                      </button>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Profile;
