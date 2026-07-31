const Message = require('../models/Message');
const User = require('../models/User');
const Chat = require('../models/Chat');

// @desc    Send a new message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  const { content, chatId, replyTo } = req.body;

  if (!content || !chatId) {
    return res.status(400).json({ message: 'Invalid data passed into request' });
  }

  var newMessage = {
    sender: req.user.id,
    content: content,
    chat: chatId,
    replyTo: replyTo || null,
  };

  try {
    var message = await Message.create(newMessage);

    message = await message.populate('sender', 'name fullName username avatar profilePicture headline');
    message = await message.populate('chat');
    message = await message.populate({
      path: 'replyTo',
      select: 'sender content media attachments',
      populate: { path: 'sender', select: 'name fullName username avatar profilePicture headline' }
    });
    message = await User.populate(message, {
      path: 'chat.users',
      select: 'name fullName username avatar profilePicture email headline',
    });

    await Chat.findByIdAndUpdate(req.body.chatId, {
      latestMessage: message,
    });

    res.json(message);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all messages for a chat
// @route   GET /api/messages/:chatId
// @access  Private
exports.allMessages = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const query = { chat: req.params.chatId, deletedFor: { $ne: req.user.id } };

    const total = await Message.countDocuments(query);
    
    // Sort descending to get the newest messages first, then reverse after fetch
    let messages = await Message.find(query)
      .populate('sender', 'name fullName username avatar profilePicture email headline')
      .populate('chat')
      .populate({
        path: 'replyTo',
        select: 'sender content media attachments',
        populate: { path: 'sender', select: 'name fullName username avatar profilePicture headline' }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Reverse to chronological order
    messages = messages.reverse();

    // Mark all messages as read by this user
    await Message.updateMany(
      { chat: req.params.chatId, sender: { $ne: req.user.id }, readBy: { $ne: req.user.id } },
      { $addToSet: { readBy: req.user.id }, $set: { status: 'seen' } }
    );

    res.json({
      messages,
      page,
      pages: Math.ceil(total / limit),
      total,
      hasMore: page * limit < total
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a message (soft)
// @route   DELETE /api/messages/:messageId
// @access  Private
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    message.isDeleted = true;
    message.content = 'This message was deleted';
    if (message.media) message.media.url = null; // Remove media link if deleted
    message.attachments = [];
    await message.save();
    res.json(message);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Upload media and send message
// @route   POST /api/messages/upload
// @access  Private
exports.uploadMedia = async (req, res) => {
  const { chatId, replyTo, type } = req.body;
  const getFileUrl = require('../utils/getFileUrl');
  const fileUrl = getFileUrl(req);
  
  if (!fileUrl || !chatId) {
    return res.status(400).json({ message: 'File and chatId are required' });
  }

  var newMessage = {
    sender: req.user.id,
    content: '',
    media: {
      url: fileUrl,
      type: type || 'file'
    },
    chat: chatId,
    replyTo: replyTo || null,
  };

  try {
    var message = await Message.create(newMessage);

    message = await message.populate('sender', 'name avatar');
    message = await message.populate('chat');
    message = await message.populate({
      path: 'replyTo',
      select: 'sender content media',
      populate: { path: 'sender', select: 'name avatar' }
    });
    message = await User.populate(message, {
      path: 'chat.users',
      select: 'name avatar email',
    });

    await Chat.findByIdAndUpdate(chatId, {
      latestMessage: message,
    });

    res.json(message);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Add or remove reaction to a message
// @route   PUT /api/messages/:messageId/react
// @access  Private
exports.reactToMessage = async (req, res) => {
  const { emoji } = req.body;
  const { messageId } = req.params;

  try {
    let message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    // Check if user already reacted with this emoji
    const existingReactionIndex = message.reactions.findIndex(
      (r) => r.user.toString() === req.user.id && r.emoji === emoji
    );

    if (existingReactionIndex !== -1) {
      // Remove reaction if it exists (toggle off)
      message.reactions.splice(existingReactionIndex, 1);
    } else {
      // Add new reaction
      message.reactions.push({ user: req.user.id, emoji });
    }

    await message.save();
    
    message = await message.populate('sender', 'name fullName username avatar profilePicture');
    message = await message.populate('chat');
    
    res.json(message);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Mark all messages in a chat as seen
// @route   PUT /api/messages/seen/:chatId
// @access  Private
exports.markMessagesSeen = async (req, res) => {
  try {
    await Message.updateMany(
      { chat: req.params.chatId, sender: { $ne: req.user.id }, readBy: { $ne: req.user.id } },
      { $addToSet: { readBy: req.user.id }, $set: { status: 'seen' } }
    );
    res.json({ message: 'Messages marked as seen' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Edit a message
// @route   PUT /api/messages/:messageId
// @access  Private
exports.editMessage = async (req, res) => {
  const { content } = req.body;
  try {
    let message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    message.content = content;
    message.isEdited = true;
    await message.save();
    
    message = await message.populate('sender', 'name fullName username avatar profilePicture headline');
    message = await message.populate('chat');
    res.json(message);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete message for me
// @route   PUT /api/messages/:messageId/deleteForMe
// @access  Private
exports.deleteForMe = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    
    if (!message.deletedFor.map(String).includes(req.user.id)) {
      message.deletedFor.push(req.user.id);
      await message.save();
    }
    res.json(message);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Toggle star on message
// @route   PUT /api/messages/:messageId/star
// @access  Private
exports.toggleStar = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    
    const isStarred = message.starredBy.map(String).includes(req.user.id);
    if (isStarred) {
      message.starredBy = message.starredBy.filter(id => id.toString() !== req.user.id);
    } else {
      message.starredBy.push(req.user.id);
    }
    await message.save();
    res.json(message);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Toggle pin on message
// @route   PUT /api/messages/:messageId/pin
// @access  Private
exports.togglePin = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    
    message.isPinned = !message.isPinned;
    await message.save();
    
    const updatedMessage = await Message.findById(message._id)
      .populate('sender', 'name fullName username avatar profilePicture headline')
      .populate('chat');
      
    res.json(updatedMessage);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all starred messages for current user
// @route   GET /api/messages/starred
// @access  Private
exports.starredMessages = async (req, res) => {
  try {
    const messages = await Message.find({ starredBy: req.user.id, deletedFor: { $ne: req.user.id } })
      .populate('sender', 'name fullName username avatar profilePicture headline')
      .populate('chat')
      .sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
