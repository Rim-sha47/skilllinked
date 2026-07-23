const Post = require('../models/Post');
const Activity = require('../models/Activity');

// @desc    Create a post
// @route   POST /api/posts
// @access  Private
exports.createPost = async (req, res) => {
  try {
    const { text, mediaFiles } = req.body;
    let media = [];
    
    // If using multer for multiple files
    if (req.files && req.files.length > 0) {
      media = req.files.map(file => {
        let type = 'document';
        if (file.mimetype.startsWith('image/')) type = 'image';
        if (file.mimetype.startsWith('video/')) type = 'video';
        return { url: file.path, type };
      });
    }

    const newPost = new Post({
      text: text || '',
      media: media,
      user: req.user.id,
    });

    const post = await newPost.save();
    
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
    const posts = await Post.find().sort({ createdAt: -1 }).populate('user', 'name avatar');
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
      // Log Activity
      const activity = new Activity({
        user: req.user.id,
        type: 'like_post',
        text: `You liked a post.`,
        relatedId: post._id
      });
      await activity.save();
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
    
    // Log Activity
    const activity = new Activity({
      user: req.user.id,
      type: 'comment_post',
      text: `You commented on a post.`,
      relatedId: post._id
    });
    await activity.save();
    
    res.status(201).json(post.comments);
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
