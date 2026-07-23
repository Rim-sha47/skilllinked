const Story = require('../models/Story');
const User = require('../models/User');

// @desc    Create a new story
// @route   POST /api/stories
// @access  Private
exports.createStory = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Media file is required' });
    }
    
    let type = 'image';
    if (req.file.mimetype.startsWith('video/')) type = 'video';

    const newStory = await Story.create({
      user: req.user.id,
      media: {
        url: req.file.path, // Cloudinary URL
        type
      }
    });

    const populatedStory = await Story.findById(newStory._id).populate('user', 'name fullName username profilePicture avatar');
    res.status(201).json(populatedStory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get stories from user and following
// @route   GET /api/stories
// @access  Private
exports.getStories = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Get stories from current user + users they follow
    const userIds = [req.user.id, ...user.following];
    
    const stories = await Story.find({ user: { $in: userIds } })
      .populate('user', 'name fullName username profilePicture avatar')
      .sort('-createdAt');
      
    res.status(200).json(stories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark story as viewed
// @route   PUT /api/stories/:id/view
// @access  Private
exports.viewStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });
    
    if (!story.viewers.includes(req.user.id)) {
      story.viewers.push(req.user.id);
      await story.save();
    }
    
    res.status(200).json({ message: 'Story viewed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
