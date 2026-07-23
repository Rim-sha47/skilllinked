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
    const messages = await Message.find({ chat: req.params.chatId })
      .populate('sender', 'name fullName username avatar profilePicture email')
      .populate('chat')
      .populate({
        path: 'replyTo',
        select: 'sender content media',
        populate: { path: 'sender', select: 'name fullName username avatar profilePicture' }
      })
      .sort({ createdAt: 1 });

    // Mark all messages as read by this user
    await Message.updateMany(
      { chat: req.params.chatId, sender: { $ne: req.user.id }, readBy: { $ne: req.user.id } },
      { $addToSet: { readBy: req.user.id }, $set: { status: 'seen' } }
    );

    res.json(messages);
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
  
  if (!req.file || !chatId) {
    return res.status(400).json({ message: 'File and chatId are required' });
  }

  var newMessage = {
    sender: req.user.id,
    content: '',
    media: {
      url: req.file.path,
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
