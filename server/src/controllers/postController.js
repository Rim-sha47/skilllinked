const Post = require('../models/Post');
const Activity = require('../models/Activity');

// @desc    Create a post
// @route   POST /api/posts
// @access  Private
exports.createPost = async (req, res) => {
  try {
    const { text } = req.body;
    let media = [];
    
    // If using multer for multiple files
    if (req.files && req.files.length > 0) {
      const getFileUrl = require('../utils/getFileUrl');
      media = req.files.map(file => {
        let type = 'document';
        if (file.mimetype.startsWith('image/')) type = 'image';
        if (file.mimetype.startsWith('video/')) type = 'video';
        return { url: getFileUrl(req, file), type };
      });
    }

    const newPost = new Post({
      text: text || '',
      media: media,
      user: req.user.id,
    });

    const savedPost = await newPost.save();
    const post = await Post.findById(savedPost._id)
      .populate('user', 'fullName username profilePicture headline role')
      .populate('comments.user', 'fullName username profilePicture')
      .populate('comments.replies.user', 'fullName username profilePicture');
    
    // Notify via socket (if connected users are online)
    // req.io.emit('new_post', post); // Example usage

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all posts
// @route   GET /api/posts
// @access  Private
exports.getPosts = async (req, res) => {
  try {
    const type = req.query.type || 'foryou';
    const userId = req.query.userId;
    let filter = {};

    // If requesting posts for a specific user
    if (userId) {
      filter = { user: userId };
    } else if (type === 'following') {
      const User = require('../models/User');
      const Connection = require('../models/Connection');
      
      const currentUser = await User.findById(req.user.id);
      
      // Get connections
      const connections = await Connection.find({
        $or: [{ sender: req.user.id }, { receiver: req.user.id }],
        status: 'accepted',
      });
      
      const connectionIds = connections.map(c => 
        c.sender.toString() === req.user.id ? c.receiver.toString() : c.sender.toString()
      );

      // Combine following and connections
      const followingAndConnections = [...new Set([...(currentUser.following || []), ...connectionIds])];
      
      // Add companies user follows (if company posts are stored with user=companyId)
      // For now we filter by Users only, but we include current user's posts
      followingAndConnections.push(req.user.id);

      filter = { user: { $in: followingAndConnections } };
    }

    const posts = await Post.find(filter).sort({ createdAt: -1 })
      .populate('user', 'fullName username profilePicture headline role')
      .populate('comments.user', 'fullName username profilePicture')
      .populate('comments.replies.user', 'fullName username profilePicture');
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Like a post
// @route   PUT /api/posts/like/:id
// @access  Private
exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const reactionIndex = post.reactions.findIndex(r => r.user.toString() === req.user.id);
    
    if (reactionIndex > -1) {
      post.reactions.splice(reactionIndex, 1); // Unlike
    } else {
      post.reactions.unshift({ user: req.user.id, type: 'like' }); // Like
      
      // Don't notify if user liked their own post
      if (post.user.toString() !== req.user.id) {
        const User = require('../models/User');
        const sender = await User.findById(req.user.id);
        const Notification = require('../models/Notification');
        const notif = await Notification.create({
          user: post.user,
          sender: req.user.id,
          type: 'post_like',
          content: `${sender.fullName || sender.username} liked your post.`,
          relatedData: { postId: post._id }
        });
        if (req.io) {
          req.io.to(post.user.toString()).emit('notification', notif);
        }
      }
    }

    await post.save();
    res.json(post.reactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Comment on a post
// @route   POST /api/posts/comment/:id
// @access  Private
exports.commentOnPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const newComment = {
      text: req.body.text,
      user: req.user.id,
    };

    post.comments.unshift(newComment);
    await post.save();
    
    if (post.user.toString() !== req.user.id) {
      const User = require('../models/User');
      const sender = await User.findById(req.user.id);
      const Notification = require('../models/Notification');
      const notif = await Notification.create({
        user: post.user,
        sender: req.user.id,
        type: 'post_comment',
        content: `${sender.fullName || sender.username} commented on your post.`,
        relatedData: { postId: post._id, commentText: req.body.text }
      });
      if (req.io) {
        req.io.to(post.user.toString()).emit('notification', notif);
      }
    }
    
    const updatedPost = await Post.findById(post._id)
      .populate('comments.user', 'fullName username profilePicture')
      .populate('comments.replies.user', 'fullName username profilePicture');
    res.status(201).json(updatedPost.comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Save/Unsave a post
// @route   PUT /api/posts/save/:id
// @access  Private
exports.savePost = async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    const postId = req.params.id;

    if (!user.savedPosts) user.savedPosts = [];

    const isSaved = user.savedPosts.includes(postId);
    if (isSaved) {
      user.savedPosts = user.savedPosts.filter(id => id.toString() !== postId);
    } else {
      user.savedPosts.push(postId);
    }

    await user.save();
    res.json({ savedPosts: user.savedPosts, message: isSaved ? 'Post unsaved' : 'Post saved' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }
    await post.deleteOne();
    res.json({ message: 'Post removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a comment
// @route   DELETE /api/posts/comment/:id/:commentId
// @access  Private
exports.deleteComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    const comment = post.comments.find(c => c._id.toString() === req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    if (comment.user.toString() !== req.user.id && post.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }
    post.comments = post.comments.filter(c => c._id.toString() !== req.params.commentId);
    await post.save();
    const updatedPost = await Post.findById(post._id)
      .populate('comments.user', 'fullName username profilePicture')
      .populate('comments.replies.user', 'fullName username profilePicture');
    res.json(updatedPost.comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reply to a comment
// @route   POST /api/posts/comment/reply/:id/:commentId
// @access  Private
exports.replyToComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const comment = post.comments.find(c => c._id.toString() === req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const newReply = {
      text: req.body.text,
      user: req.user.id
    };

    if (!comment.replies) comment.replies = [];
    comment.replies.push(newReply);
    await post.save();

    // Notify comment owner
    if (comment.user.toString() !== req.user.id) {
      const User = require('../models/User');
      const sender = await User.findById(req.user.id);
      const Notification = require('../models/Notification');
      const notif = await Notification.create({
        user: comment.user,
        sender: req.user.id,
        type: 'comment_reply',
        content: `${sender.fullName || sender.username} replied to your comment.`,
        relatedData: { postId: post._id, commentId: comment._id }
      });
      if (req.io) req.io.to(comment.user.toString()).emit('notification', notif);
    }

    const updatedPost = await Post.findById(post._id)
      .populate('comments.user', 'fullName username profilePicture')
      .populate('comments.replies.user', 'fullName username profilePicture');
    res.status(201).json(updatedPost.comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Edit a comment
// @route   PUT /api/posts/comment/:id/:commentId
// @access  Private
exports.editComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    
    const comment = post.comments.find(c => c._id.toString() === req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized to edit this comment' });
    }
    
    comment.text = req.body.text;
    await post.save();
    
    const updatedPost = await Post.findById(post._id)
      .populate('comments.user', 'fullName username profilePicture')
      .populate('comments.replies.user', 'fullName username profilePicture');
      
    res.json(updatedPost.comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Share a post
// @route   POST /api/posts/share/:id
// @access  Private
exports.sharePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (!post.shares.includes(req.user.id)) {
      post.shares.push(req.user.id);
      await post.save();
      
      if (post.user.toString() !== req.user.id) {
        const User = require('../models/User');
        const sender = await User.findById(req.user.id);
        const Notification = require('../models/Notification');
        const notif = await Notification.create({
          user: post.user,
          sender: req.user.id,
          type: 'post_share',
          content: `${sender.fullName || sender.username} shared your post.`,
          relatedData: { postId: post._id }
        });
        if (req.io) req.io.to(post.user.toString()).emit('notification', notif);
      }
    }
    res.json({ shares: post.shares });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a post
// @route   PUT /api/posts/:id
// @access  Private
exports.updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }
    post.text = req.body.text !== undefined ? req.body.text : post.text;
    await post.save();
    const updated = await Post.findById(post._id).populate('user', 'fullName username profilePicture headline role');
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
