const Story = require('../models/Story');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Create a new story
// @route   POST /api/stories
// @access  Private
exports.createStory = async (req, res) => {
  try {
    const getFileUrl = require('../utils/getFileUrl');
    let fileUrl = req.file ? getFileUrl(req) : '';
    const { caption, mentions } = req.body;

    let parsedMentions = [];
    if (mentions) {
      try {
        parsedMentions = typeof mentions === 'string' ? JSON.parse(mentions) : mentions;
      } catch (e) {
        parsedMentions = Array.isArray(mentions) ? mentions : [];
      }
    }

    let type = 'text';
    if (req.file) {
      type = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
    }

    if (!fileUrl && (!caption || !caption.trim())) {
      return res.status(400).json({ message: 'Media file or caption is required' });
    }

    const newStory = await Story.create({
      user: req.user.id,
      caption: caption || '',
      media: {
        url: fileUrl,
        type
      },
      mentions: parsedMentions
    });

    // Notify mentioned users
    if (parsedMentions && parsedMentions.length > 0) {
      const senderUser = await User.findById(req.user.id);
      const senderName = senderUser?.fullName || senderUser?.name || 'Someone';
      for (const mId of parsedMentions) {
        if (mId.toString() !== req.user.id.toString()) {
          await Notification.create({
            user: mId,
            sender: req.user.id,
            type: 'post_mention',
            content: `${senderName} mentioned you in their status update.`,
            relatedData: { storyId: newStory._id }
          }).catch(() => {});
        }
      }
    }

    const populatedStory = await Story.findById(newStory._id)
      .populate('user', 'name fullName username profilePicture avatar')
      .populate('viewers', 'name fullName username profilePicture avatar')
      .populate('mentions', 'name fullName username profilePicture avatar');
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
    const userIds = [req.user.id, ...(user.following || [])];

    const stories = await Story.find({
      $or: [
        { user: { $in: userIds } },
        { mentions: req.user.id } // also include stories where current user is mentioned!
      ]
    })
      .populate('user', 'name fullName username profilePicture avatar')
      .populate('viewers', 'name fullName username profilePicture avatar')
      .populate('mentions', 'name fullName username profilePicture avatar')
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

    const updated = await Story.findById(story._id)
      .populate('user', 'name fullName username profilePicture avatar')
      .populate('viewers', 'name fullName username profilePicture avatar')
      .populate('mentions', 'name fullName username profilePicture avatar');

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update story caption & mentions
// @route   PUT /api/stories/:id
// @access  Private
exports.updateStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });

    if (story.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to edit this status' });
    }

    if (req.body.caption !== undefined) {
      story.caption = req.body.caption;
    }

    if (req.body.mentions !== undefined) {
      story.mentions = req.body.mentions;
    }

    await story.save();

    const updated = await Story.findById(story._id)
      .populate('user', 'name fullName username profilePicture avatar')
      .populate('viewers', 'name fullName username profilePicture avatar')
      .populate('mentions', 'name fullName username profilePicture avatar');

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete story
// @route   DELETE /api/stories/:id
// @access  Private
exports.deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });

    if (story.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this status' });
    }

    await story.deleteOne();
    res.status(200).json({ id: req.params.id, message: 'Status deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

