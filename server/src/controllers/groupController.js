const Group = require('../models/Group');
const Post = require('../models/Post');
const User = require('../models/User');

// @desc    Get all public groups & groups user is part of
// @route   GET /api/groups
// @access  Private
exports.getGroups = async (req, res) => {
  try {
    const { category, search } = req.query;
    
    let query = {
      $or: [
        { isPrivate: false },
        { members: req.user._id }
      ]
    };

    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const groups = await Group.find(query)
      .populate('creator', 'firstName lastName profilePicture headline')
      .populate('members', 'firstName lastName profilePicture headline')
      .sort({ createdAt: -1 });

    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new group
// @route   POST /api/groups
// @access  Private
exports.createGroup = async (req, res) => {
  try {
    const { name, description, isPrivate, category, rules } = req.body;
    
    const group = await Group.create({
      name,
      description,
      isPrivate,
      category,
      rules,
      creator: req.user._id,
      admins: [req.user._id],
      members: [req.user._id], // Creator is automatically a member
    });

    const populatedGroup = await Group.findById(group._id)
      .populate('creator', 'firstName lastName profilePicture headline')
      .populate('members', 'firstName lastName profilePicture headline');
      
    res.status(201).json(populatedGroup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a specific group by ID
// @route   GET /api/groups/:id
// @access  Private
exports.getGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('creator', 'firstName lastName profilePicture headline')
      .populate('admins', 'firstName lastName profilePicture headline')
      .populate('moderators', 'firstName lastName profilePicture headline')
      .populate('members', 'firstName lastName profilePicture headline')
      .populate('pendingRequests', 'firstName lastName profilePicture headline');
      
    if (!group) return res.status(404).json({ message: 'Group not found' });
    
    // Privacy check
    if (group.isPrivate && !group.members.some(m => m._id.toString() === req.user._id.toString()) && group.creator._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'This group is private. You must join to view details.' });
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Join or leave a group
// @route   PUT /api/groups/:id/join
// @access  Private
exports.toggleJoin = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const isMember = group.members.includes(req.user._id);

    if (isMember) {
      // Leave group
      group.members = group.members.filter(m => m.toString() !== req.user._id.toString());
      group.admins = group.admins.filter(m => m.toString() !== req.user._id.toString());
      group.moderators = group.moderators.filter(m => m.toString() !== req.user._id.toString());
    } else {
      if (group.isPrivate) {
        // Send request instead of joining directly
        if (!group.pendingRequests.includes(req.user._id)) {
           group.pendingRequests.push(req.user._id);
        }
        await group.save();
        return res.json({ message: 'Join request sent', group });
      } else {
        // Join public group directly
        group.members.push(req.user._id);
      }
    }

    await group.save();
    
    const populatedGroup = await Group.findById(group._id)
      .populate('creator', 'firstName lastName profilePicture headline')
      .populate('members', 'firstName lastName profilePicture headline');
      
    res.json({ message: isMember ? 'Left group' : 'Joined group', group: populatedGroup });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get posts in a specific group
// @route   GET /api/groups/:id/posts
// @access  Private
exports.getGroupPosts = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    
    if (group.isPrivate && !group.members.includes(req.user._id)) {
       return res.status(403).json({ message: 'Not authorized to view posts in this private group' });
    }

    const posts = await Post.find({ group: req.params.id })
      .populate('user', 'firstName lastName profilePicture headline')
      .populate({
        path: 'comments.user',
        select: 'firstName lastName profilePicture headline',
      })
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
