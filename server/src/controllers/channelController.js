const Channel = require('../models/Channel');

// @desc    Get all channels (explore + search)
// @route   GET /api/channels?search=term
exports.getChannels = async (req, res) => {
  try {
    const { search, category } = req.query;
    const query = {};
    if (search) query.name = { $regex: search, $options: 'i' };
    if (category) query.category = category;

    const channels = await Channel.find(query)
      .populate('owner', 'fullName name username avatar profilePicture')
      .sort({ followers: -1, createdAt: -1 })
      .limit(50);

    // Add followerCount and isFollowing flag
    const userId = req.user.id;
    const result = channels.map(c => ({
      ...c.toObject(),
      followerCount: c.followers.length,
      isFollowing: c.followers.map(String).includes(userId),
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get followed channels for current user
// @route   GET /api/channels/following
exports.getFollowingChannels = async (req, res) => {
  try {
    const channels = await Channel.find({ followers: req.user.id })
      .populate('owner', 'fullName name username avatar profilePicture')
      .sort({ updatedAt: -1 });

    const result = channels.map(c => ({
      ...c.toObject(),
      followerCount: c.followers.length,
      isFollowing: true,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Follow or unfollow a channel
// @route   PUT /api/channels/:channelId/follow
exports.toggleFollow = async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.channelId);
    if (!channel) return res.status(404).json({ message: 'Channel not found' });

    const userId = req.user.id;
    const isFollowing = channel.followers.map(String).includes(userId);

    if (isFollowing) {
      channel.followers = channel.followers.filter(id => id.toString() !== userId);
    } else {
      channel.followers.push(userId);
    }

    await channel.save();

    res.json({
      channelId: channel._id,
      isFollowing: !isFollowing,
      followerCount: channel.followers.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Create a channel
// @route   POST /api/channels
exports.createChannel = async (req, res) => {
  try {
    const { name, description, category } = req.body;
    if (!name) return res.status(400).json({ message: 'Channel name is required' });

    const channel = await Channel.create({
      name,
      description: description || '',
      category: category || 'General',
      owner: req.user.id,
      followers: [req.user.id],
    });

    const populated = await channel.populate('owner', 'fullName name username avatar profilePicture');
    res.status(201).json({ ...populated.toObject(), followerCount: 1, isFollowing: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get single channel by ID
// @route   GET /api/channels/:channelId
exports.getChannel = async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.channelId)
      .populate('owner', 'fullName name username avatar profilePicture');
    if (!channel) return res.status(404).json({ message: 'Channel not found' });

    res.json({
      ...channel.toObject(),
      followerCount: channel.followers.length,
      isFollowing: channel.followers.map(String).includes(req.user.id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get posts in a specific channel
// @route   GET /api/channels/:channelId/posts
exports.getChannelPosts = async (req, res) => {
  try {
    const Post = require('../models/Post');
    const posts = await Post.find({ channel: req.params.channelId })
      .populate('user', 'firstName lastName profilePicture headline')
      .populate('company', 'name logo')
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
