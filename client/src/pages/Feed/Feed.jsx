import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { FaImage, FaVideo, FaFileAlt, FaThumbsUp, FaComment, FaShare, FaPaperPlane, FaEllipsisH, FaBookmark, FaDownload, FaPlus, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { createPost, fetchPosts, toggleLikePost, savePost, sharePost, commentOnPost, replyToComment, editComment, deleteComment } from '../../redux/slices/feedSlice';
import { fetchConnections } from '../../redux/slices/connectionSlice';
import { accessOrCreateChat, sendMessage } from '../../redux/slices/messagingSlice';
import { updateUser } from '../../redux/slices/authSlice';

const Feed = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { posts: fetchedPosts, isPosting } = useSelector(state => state.feed);

  const [postText, setPostText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [feedType, setFeedType] = useState('foryou');
  const [expandedComments, setExpandedComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [replyingToFeed, setReplyingToFeed] = useState({});
  const [editingFeedComment, setEditingFeedComment] = useState({});
  const [editingFeedCommentText, setEditingFeedCommentText] = useState({});
  const [shareModalPost, setShareModalPost] = useState(null);
  const [feedShareConnections, setFeedShareConnections] = useState([]);
  const [isFeedSharing, setIsFeedSharing] = useState(false);
  
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

  useEffect(() => {
    dispatch(fetchPosts(feedType));
  }, [dispatch, feedType]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handlePostSubmit = async () => {
    if (!postText.trim() && !selectedFile) return;

    const formData = new FormData();
    formData.append('text', postText);
    if (selectedFile) {
      formData.append('files', selectedFile);
    }

    try {
      await dispatch(createPost(formData)).unwrap();
      setPostText('');
      removeFile();
    } catch (err) {
      console.error('Failed to create post:', err);
    }
  };

  const toggleLike = (id) => {
    dispatch(toggleLikePost(id));
  };

  const toggleSave = async (id) => {
    try {
      const savedPosts = await dispatch(savePost(id)).unwrap();
      dispatch(updateUser({ savedPosts }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownload = (mediaUrl) => {
    if (!mediaUrl) return;
    const a = document.createElement('a');
    a.href = mediaUrl;
    a.download = 'media';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();
  };

  const handleShare = async (postId, post) => {
    // Open share modal
    setShareModalPost(post);
    try {
      const res = await dispatch(fetchConnections()).unwrap();
      setFeedShareConnections(res);
    } catch (err) { console.error(err); }
  };

  const handleFeedShareToUser = async (userId) => {
    if (!shareModalPost) return;
    setIsFeedSharing(true);
    try {
      const chat = await dispatch(accessOrCreateChat(userId)).unwrap();
      const postUrl = `${window.location.origin}/app/profile/${shareModalPost.user?._id || shareModalPost.user}?post=${shareModalPost._id}`;
      await dispatch(sendMessage({ chatId: chat._id, content: `Check out this post: ${postUrl}` })).unwrap();
      await dispatch(sharePost(shareModalPost._id));
      alert('Post shared in direct messages!');
      setShareModalPost(null);
    } catch (err) { console.error(err); }
    finally { setIsFeedSharing(false); }
  };

  const handleEditFeedComment = async (postId, commentId) => {
    const text = editingFeedCommentText[commentId];
    if (!text?.trim()) return;
    await dispatch(editComment({ postId, commentId, text }));
    setEditingFeedComment(prev => ({ ...prev, [commentId]: false }));
    setEditingFeedCommentText(prev => ({ ...prev, [commentId]: '' }));
  };

  const handleDeleteFeedComment = async (postId, commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    await dispatch(deleteComment({ postId, commentId }));
  };

  const handleCommentToggle = (id) => {
    setExpandedComments(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const submitComment = async (id) => {
    const text = commentInputs[id];
    if (!text || !text.trim()) return;
    
    if (replyingToFeed[id]) {
      await dispatch(replyToComment({ postId: id, commentId: replyingToFeed[id].commentId, text }));
      setReplyingToFeed(prev => ({ ...prev, [id]: null }));
    } else {
      await dispatch(commentOnPost({ postId: id, text }));
    }
    setCommentInputs(prev => ({ ...prev, [id]: '' }));
  };

  // Mock Stories Data
  const stories = [
    { id: 1, user: 'You', avatar: 'bg-gray-300', isMe: true },
    { id: 2, user: 'Jane', avatar: 'bg-blue-500', active: true },
    { id: 3, user: 'Alex', avatar: 'bg-purple-500', active: true },
    { id: 4, user: 'Sam', avatar: 'bg-green-500', active: false },
    { id: 5, user: 'Chris', avatar: 'bg-orange-500', active: false },
  ];

  const posts = [
    {
      id: 1,
      author: 'Jane Developer',
      role: 'Senior React Engineer at TechCorp',
      time: '2h',
      content: 'Just launched our new platform built entirely with React and Tailwind CSS! The developer experience has been incredible. The new glassmorphism UI system is yielding a 40% higher conversion rate. What is everyone else working on this weekend?',
      likes: 124,
      comments: 18,
      shares: 5,
      avatar: 'bg-blue-500'
    },
    {
      id: 2,
      author: 'Alex Designer',
      role: 'UI/UX Lead at CreativeFlow',
      time: '5h',
      content: 'Glassmorphism is making a huge comeback in enterprise software. Clean, accessible, and premium. Here are some thoughts on how to implement it correctly using modern CSS features like backdrop-filter and pseudo-elements.',
      likes: 89,
      comments: 12,
      shares: 2,
      avatar: 'bg-purple-500',
      video: true
    }
  ];

  return (
    <>
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      
      {/* ─── Stories Bar ─── */}
      <div className="w-full bg-white/60 dark:bg-dark-card/60 backdrop-blur-md rounded-2xl p-4 shadow-glass border border-white/40 dark:border-gray-700/50 flex space-x-4 overflow-x-auto custom-scrollbar">
        {stories.map(story => (
          <div key={story.id} className="flex flex-col items-center space-y-1 cursor-pointer flex-shrink-0">
            <div className={`relative p-[3px] rounded-full ${story.active ? 'bg-gradient-to-tr from-yellow-400 to-pink-600' : 'bg-gray-200 dark:bg-gray-700'}`}>
              <div className={`w-16 h-16 rounded-full border-2 border-white dark:border-dark-card ${story.avatar} flex items-center justify-center text-white font-bold text-xl`}>
                {story.user.charAt(0)}
              </div>
              {story.isMe && (
                <div className="absolute bottom-0 right-0 bg-primary w-6 h-6 rounded-full border-2 border-white dark:border-dark-card flex items-center justify-center text-white">
                  <FaPlus size={10} />
                </div>
              )}
            </div>
            <span className="text-xs font-semibold text-text-primary dark:text-gray-300">{story.user}</span>
          </div>
        ))}
      </div>

      {/* Create Post Section */}
      <Card glassHeavy className="p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="flex space-x-4 relative z-10">
          <div className="flex-shrink-0 mt-1">
            <div className="w-12 h-12 rounded-full border-2 border-primary/20 bg-gray-200 dark:bg-gray-700 overflow-hidden">
              {(user?.profilePicture && user.profilePicture !== 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg') || (user?.avatar && user.avatar !== 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg') ? (
                <img src={user.profilePicture && user.profilePicture !== 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg' ? user.profilePicture : user.avatar} alt="User" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">
                  {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 space-y-3">
            <textarea
              rows="3"
              className="block w-full rounded-2xl border-none bg-gray-100/50 dark:bg-dark-bg/50 text-text-primary dark:text-gray-100 focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-dark-card sm:text-base p-4 resize-none transition-all shadow-inner"
              placeholder="Share your thoughts, ideas, or updates..."
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
            />
            
            {/* Media Preview */}
            {previewUrl && (
              <div className="relative inline-block w-full max-w-sm rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                <button 
                  onClick={removeFile}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full z-10 transition-colors"
                >
                  <FaTimes size={12} />
                </button>
                {selectedFile?.type.startsWith('video/') ? (
                  <video src={previewUrl} className="w-full max-h-64 object-contain bg-black" controls />
                ) : (
                  <img src={previewUrl} alt="Preview" className="w-full max-h-64 object-cover" />
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Hidden File Inputs */}
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
        <input type="file" ref={videoInputRef} onChange={handleFileChange} accept="video/*" className="hidden" />

        <div className="mt-4 flex items-center justify-between border-t border-gray-200/50 dark:border-gray-700/50 pt-4 relative z-10">
          <div className="flex space-x-2 sm:space-x-4">
            <motion.button 
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} 
              onClick={() => fileInputRef.current.click()}
              className="flex items-center text-sm font-semibold text-text-secondary hover:text-blue-500 dark:text-gray-400 transition-colors px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              <FaImage className="mr-2 text-lg" />
              <span className="hidden sm:inline">Photo</span>
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} 
              onClick={() => videoInputRef.current.click()}
              className="flex items-center text-sm font-semibold text-text-secondary hover:text-green-500 dark:text-gray-400 transition-colors px-3 py-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20"
            >
              <FaVideo className="mr-2 text-lg" />
              <span className="hidden sm:inline">Video</span>
            </motion.button>
          </div>
          <Button 
            size="md" 
            className="rounded-full shadow-glow px-6" 
            disabled={(!postText.trim() && !selectedFile) || isPosting}
            onClick={handlePostSubmit}
          >
            {isPosting ? 'Posting...' : 'Post'} <FaPaperPlane className="ml-2 text-sm" />
          </Button>
        </div>
      </Card>

      {/* Feed Divider & Tabs */}
      <div className="flex items-center my-6">
        <div className="flex-grow border-t border-gray-200 dark:border-gray-800"></div>
        <div className="flex space-x-2 sm:space-x-4 mx-4">
          <button 
            onClick={() => setFeedType('foryou')}
            className={`text-xs font-bold uppercase tracking-widest px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition-colors ${feedType === 'foryou' ? 'bg-primary text-white shadow-glow' : 'bg-gray-200 dark:bg-gray-800 text-text-secondary hover:bg-gray-300 dark:hover:bg-gray-700'}`}
          >
            For You
          </button>
          <button 
            onClick={() => setFeedType('following')}
            className={`text-xs font-bold uppercase tracking-widest px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition-colors ${feedType === 'following' ? 'bg-primary text-white shadow-glow' : 'bg-gray-200 dark:bg-gray-800 text-text-secondary hover:bg-gray-300 dark:hover:bg-gray-700'}`}
          >
            Following
          </button>
        </div>
        <div className="flex-grow border-t border-gray-200 dark:border-gray-800"></div>
      </div>

      {/* Posts List */}
      <div className="space-y-8">
        {[...(fetchedPosts?.length ? fetchedPosts : posts)].map((post) => {
          const isRealPost = !!post._id;
          const postId = post._id || post.id;
          const isLiked = isRealPost ? post.reactions?.some(r => r.user === user?._id) : false;
          const isSaved = isRealPost ? user?.savedPosts?.includes(postId) : false;
          const authorName = post.user?.fullName || post.user?.name || post.author || 'User';
          const authorAvatar = post.user?.profilePicture;
          const authorRole = post.user?.headline || post.user?.role || post.role || 'Member';
          const postTime = post.createdAt ? new Date(post.createdAt).toLocaleDateString() : post.time;
          const likesCount = isRealPost ? (post.reactions?.length || 0) : (post.likes || 0);
          const commentsCount = isRealPost ? (post.comments?.length || 0) : (post.comments || 0);
          
          return (
            <motion.div 
              key={postId}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4 }}
            >
              <Card className="p-0 overflow-hidden hover:border-primary/30 transition-colors border-2 border-transparent">
                {/* Post Header */}
                <div className="flex items-start justify-between p-5">
                  <div className="flex space-x-3">
                    <div className="flex-shrink-0">
                      {(authorAvatar && authorAvatar !== 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg') ? (
                        <img src={authorAvatar} alt="Avatar" className="w-12 h-12 rounded-full object-cover shadow-sm border border-white/20" />
                      ) : (
                        <div className={`w-12 h-12 rounded-full ${post.avatar || 'bg-blue-500'} text-white flex items-center justify-center font-bold text-lg shadow-sm border border-white/20`}>
                          {authorName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-bold text-text-primary dark:text-white hover:text-primary cursor-pointer transition-colors">
                        {authorName}
                      </p>
                      <p className="text-xs text-text-secondary dark:text-gray-400 mt-0.5 truncate max-w-[200px] sm:max-w-md">
                        {authorRole}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 flex items-center">
                        {postTime}
                      </p>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-text-primary dark:hover:text-white p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-bg transition-colors">
                    <FaEllipsisH />
                  </button>
                </div>

                {/* Post Content */}
                <div className="px-5 pb-4">
                  <p className="text-sm md:text-base text-text-primary dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                    {post.text || post.content}
                  </p>
                </div>

                {/* Media Preview */}
                {post.media && post.media.length > 0 && post.media[0].type === 'image' ? (
                  <div className="w-full h-auto bg-gray-100 dark:bg-gray-800 mb-2 flex items-center justify-center overflow-hidden">
                    <img src={post.media[0].url} alt="Post media" className="w-full h-auto object-cover max-h-96" />
                  </div>
                ) : post.media && post.media.length > 0 && post.media[0].type === 'video' ? (
                  <div className="w-full mb-2 bg-black">
                    <video controls className="w-full max-h-96 object-contain">
                      <source src={post.media[0].url} type="video/mp4" />
                    </video>
                  </div>
                ) : post.image ? (
                  <div className="w-full h-64 bg-gray-100 dark:bg-gray-800 mb-2 flex items-center justify-center overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Post media" className="w-full h-full object-cover" />
                  </div>
                ) : post.video ? (
                  <div className="w-full mb-2 bg-black">
                    <video controls className="w-full max-h-96 object-contain">
                      <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
                    </video>
                  </div>
                ) : null}

                {/* Post Stats */}
                <div className="px-5 py-3 flex justify-between text-xs text-text-secondary dark:text-gray-400 border-t border-gray-100 dark:border-gray-800/50">
                  <div className="flex items-center">
                    <span className="flex items-center justify-center bg-blue-500 rounded-full w-5 h-5 mr-1.5 shadow-sm">
                      <FaThumbsUp className="text-[10px] text-white" />
                    </span>
                    <span className="font-medium hover:text-primary cursor-pointer">{likesCount}</span>
                  </div>
                  <div className="flex space-x-4">
                    <span className="hover:text-primary cursor-pointer font-medium">{commentsCount} comments</span>
                    <span className="hover:text-primary cursor-pointer font-medium">{post.shares || 0} shares</span>
                  </div>
                </div>

                {/* Post Actions */}
                <div className="px-3 py-2 flex flex-wrap justify-between sm:justify-start sm:space-x-2 bg-gray-50/50 dark:bg-dark-bg/30">
                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={() => toggleLike(postId)}
                    className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-3 py-3 rounded-xl font-bold text-sm transition-all ${
                      isLiked ? 'text-primary bg-primary/10' : 'text-text-secondary hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-dark-card hover:text-text-primary dark:hover:text-white'
                    }`}
                  >
                    <FaThumbsUp className={`text-lg ${isLiked ? 'text-primary' : ''}`} />
                    <span className="hidden sm:inline">Like</span>
                  </motion.button>
                  <button onClick={() => handleCommentToggle(postId)} className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-3 py-3 rounded-xl hover:bg-gray-200 dark:hover:bg-dark-card text-text-secondary dark:text-gray-400 dark:hover:text-white font-bold text-sm transition-all">
                    <FaComment className="text-lg" />
                    <span className="hidden sm:inline">Comment</span>
                  </button>
                  <button onClick={() => handleShare(postId, post)} className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-3 py-3 rounded-xl hover:bg-gray-200 dark:hover:bg-dark-card text-text-secondary dark:text-gray-400 dark:hover:text-white font-bold text-sm transition-all">
                    <FaShare className="text-lg" />
                    <span className="hidden sm:inline">Share</span>
                  </button>
                  
                  <div className="flex-1 sm:flex-none flex justify-end space-x-2 ml-auto">
                    <motion.button 
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toggleSave(postId)}
                      className={`flex-none flex items-center justify-center space-x-2 px-3 py-3 rounded-xl font-bold text-sm transition-all ${
                        isSaved ? 'text-yellow-500 bg-yellow-500/10' : 'text-text-secondary hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-dark-card hover:text-text-primary dark:hover:text-white'
                      }`}
                    >
                      <FaBookmark className="text-lg" />
                    </motion.button>
                    {post.media && post.media.length > 0 && (
                      <button onClick={() => handleDownload(post.media[0].url)} className="flex-none flex items-center justify-center space-x-2 px-3 py-3 rounded-xl hover:bg-gray-200 dark:hover:bg-dark-card text-text-secondary dark:text-gray-400 dark:hover:text-white font-bold text-sm transition-all">
                        <FaDownload className="text-lg" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Comments Section */}
                {expandedComments[postId] && (
                  <div className="px-5 py-3 bg-gray-50/30 dark:bg-dark-bg/10 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex gap-2 mb-3">
                      <input
                        className="flex-1 text-sm p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-text-primary dark:text-white placeholder-gray-400 outline-none focus:ring-1 focus:ring-primary"
                        placeholder={replyingToFeed[postId] ? `Reply to ${replyingToFeed[postId].username}...` : "Add a comment..."}
                        value={commentInputs[postId] || ''}
                        onChange={e => setCommentInputs(prev => ({ ...prev, [postId]: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter') submitComment(postId); }}
                      />
                      {replyingToFeed[postId] && (
                        <button onClick={() => setReplyingToFeed(prev => ({ ...prev, [postId]: null }))} className="text-xs text-gray-500 hover:text-red-500 font-bold px-2">Cancel</button>
                      )}
                      <Button size="sm" onClick={() => submitComment(postId)} disabled={!commentInputs[postId]?.trim()}>Post</Button>
                    </div>
                    {post.comments?.length > 0 && (
                      <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                        {post.comments.map((c, i) => {
                          const cUser = typeof c.user === 'object' ? (c.user?.fullName || c.user?.username) : 'User';
                          const cAvatar = typeof c.user === 'object' ? c.user?.profilePicture : null;
                          const isMyComment = typeof c.user === 'object' ? c.user?._id === user?._id : false;
                          return (
                            <div key={c._id || i} className="flex flex-col gap-1 text-sm">
                              <div className="flex gap-2 group items-start">
                                {cAvatar ? (
                                  <img src={cAvatar} alt={cUser} className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5" />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-primary/80 flex items-center justify-center text-white text-[9px] font-bold shrink-0 mt-0.5">{cUser.charAt(0).toUpperCase()}</div>
                                )}
                                <div className="flex-1 min-w-0">
                                  {editingFeedComment[c._id] ? (
                                    <div className="flex gap-1 items-center">
                                      <input
                                        className="flex-1 text-xs border border-gray-200 dark:border-gray-700 rounded px-2 py-0.5 bg-white dark:bg-gray-800 text-text-primary dark:text-white outline-none"
                                        value={editingFeedCommentText[c._id] || ''}
                                        onChange={e => setEditingFeedCommentText(prev => ({ ...prev, [c._id]: e.target.value }))}
                                        onKeyDown={e => { if (e.key === 'Enter') handleEditFeedComment(postId, c._id); if (e.key === 'Escape') setEditingFeedComment(prev => ({ ...prev, [c._id]: false })); }}
                                        autoFocus
                                      />
                                      <button onClick={() => handleEditFeedComment(postId, c._id)} className="text-[10px] font-bold text-primary">Save</button>
                                      <button onClick={() => setEditingFeedComment(prev => ({ ...prev, [c._id]: false }))} className="text-[10px] font-bold text-gray-400">✕</button>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-text-secondary dark:text-gray-300"><span className="font-bold text-text-primary dark:text-white mr-1">{cUser}</span>{c.text}</p>
                                  )}
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                  <button onClick={() => setReplyingToFeed(prev => ({ ...prev, [postId]: { commentId: c._id, username: cUser } }))} className="text-xs font-bold text-gray-400 hover:text-primary">Reply</button>
                                  {isMyComment && (
                                    <>
                                      <button onClick={() => { setEditingFeedComment(prev => ({ ...prev, [c._id]: true })); setEditingFeedCommentText(prev => ({ ...prev, [c._id]: c.text })); }} className="text-xs font-bold text-gray-400 hover:text-blue-500">Edit</button>
                                      <button onClick={() => handleDeleteFeedComment(postId, c._id)} className="text-xs font-bold text-gray-400 hover:text-red-500">Del</button>
                                    </>
                                  )}
                                </div>
                              </div>
                              {c.replies && c.replies.length > 0 && (
                                <div className="pl-8 space-y-2 mt-1 border-l-2 border-gray-200 dark:border-gray-700/50">
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
                    )}
                  </div>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>

    {/* Feed Share to Connections Modal */}
    <AnimatePresence>
      {shareModalPost && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70" onClick={() => setShareModalPost(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={e => e.stopPropagation()}
            className="bg-white dark:bg-dark-card rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-bold text-base text-text-primary dark:text-white">Share Post</h3>
              <button onClick={() => setShareModalPost(null)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-full"><FaTimes /></button>
            </div>
            <div className="p-4 space-y-2 max-h-72 overflow-y-auto">
              {feedShareConnections.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No connections to share with.</p>
              ) : (
                feedShareConnections.map(conn => {
                  const otherUser = conn.sender?._id === user?._id ? conn.receiver : conn.sender;
                  if (!otherUser) return null;
                  return (
                    <button
                      key={conn._id}
                      disabled={isFeedSharing}
                      onClick={() => handleFeedShareToUser(otherUser._id)}
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

export default Feed;

