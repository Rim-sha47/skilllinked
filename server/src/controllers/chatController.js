const Chat = require('../models/Chat');
const User = require('../models/User');

// ─── Helper: populate a chat fully ────────────────────────────
const populateChat = (query) =>
  query
    .populate('users', '-password')
    .populate('groupAdmin', '-password')
    .populate({
      path: 'latestMessage',
      populate: { path: 'sender', select: 'fullName name username avatar profilePicture headline' },
    });

// @desc    Access or create a 1-on-1 chat
// @route   POST /api/chats
// @access  Private
exports.accessChat = async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ message: 'UserId param not sent with request' });

  let isChat = await populateChat(
    Chat.find({
      isGroupChat: false,
      $and: [
        { users: { $elemMatch: { $eq: req.user.id } } },
        { users: { $elemMatch: { $eq: userId } } },
      ],
    })
  );

  isChat = await User.populate(isChat, {
    path: 'latestMessage.sender',
    select: 'fullName name avatar profilePicture email headline',
  });

  if (isChat.length > 0) return res.send(isChat[0]);

  try {
    const createdChat = await Chat.create({
      chatName: 'sender',
      isGroupChat: false,
      users: [req.user.id, userId],
    });
    const fullChat = await populateChat(Chat.findById(createdChat._id));
    res.status(200).json(fullChat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Fetch all chats for a user
// @route   GET /api/chats
// @access  Private
exports.fetchChats = async (req, res) => {
  try {
    let results = await populateChat(
      Chat.find({ users: { $elemMatch: { $eq: req.user.id } } }).sort({ updatedAt: -1 })
    );

    results = await User.populate(results, {
      path: 'latestMessage.sender',
      select: 'fullName name avatar profilePicture email headline',
    });

    res.status(200).json(results);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Pin or unpin a chat for current user
// @route   PUT /api/chats/:chatId/pin
// @access  Private
exports.pinChat = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    const isPinned = chat.pinnedBy.map(String).includes(req.user.id);
    if (isPinned) {
      chat.pinnedBy = chat.pinnedBy.filter(id => id.toString() !== req.user.id);
    } else {
      chat.pinnedBy.push(req.user.id);
    }
    await chat.save();
    res.json({ chatId: chat._id, pinnedBy: chat.pinnedBy });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Mute or unmute a chat for current user
// @route   PUT /api/chats/:chatId/mute
// @access  Private
exports.muteChat = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    const isMuted = chat.mutedBy.map(String).includes(req.user.id);
    if (isMuted) {
      chat.mutedBy = chat.mutedBy.filter(id => id.toString() !== req.user.id);
    } else {
      chat.mutedBy.push(req.user.id);
    }
    await chat.save();
    res.json({ chatId: chat._id, mutedBy: chat.mutedBy });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Archive or unarchive a chat for current user
// @route   PUT /api/chats/:chatId/archive
// @access  Private
exports.archiveChat = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    const isArchived = chat.archivedBy.map(String).includes(req.user.id);
    if (isArchived) {
      chat.archivedBy = chat.archivedBy.filter(id => id.toString() !== req.user.id);
    } else {
      chat.archivedBy.push(req.user.id);
    }
    await chat.save();
    res.json({ chatId: chat._id, archivedBy: chat.archivedBy });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Block or unblock a user
// @route   PUT /api/chats/block/:userId
// @access  Private
exports.blockUser = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    const targetId = req.params.userId;
    const isBlocked = currentUser.blockedUsers.map(String).includes(targetId);
    if (isBlocked) {
      currentUser.blockedUsers = currentUser.blockedUsers.filter(id => id.toString() !== targetId);
    } else {
      currentUser.blockedUsers.push(targetId);
    }
    await currentUser.save();
    res.json({ blockedUsers: currentUser.blockedUsers, isBlocked: !isBlocked });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete (hide) a chat for current user
// @route   DELETE /api/chats/:chatId
// @access  Private
exports.deleteChat = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    if (!chat.deletedBy.map(String).includes(req.user.id)) {
      chat.deletedBy.push(req.user.id);
      await chat.save();
    }
    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
//  GROUP CHAT
// ─────────────────────────────────────────────────────────────

// @desc    Create a group chat
// @route   POST /api/chats/group
// @access  Private
exports.createGroupChat = async (req, res) => {
  try {
    const { name, users } = req.body;

    if (!name || !users || users.length < 2) {
      return res.status(400).json({ message: 'Group needs a name and at least 2 other members' });
    }

    // Deduplicate and add creator
    const allUsers = [...new Set([...users, req.user.id.toString()])];

    const groupChat = await Chat.create({
      chatName: name,
      isGroupChat: true,
      users: allUsers,
      groupAdmin: req.user.id,
    });

    const fullGroupChat = await populateChat(Chat.findById(groupChat._id));
    res.status(200).json(fullGroupChat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Rename a group chat
// @route   PUT /api/chats/group/:chatId/rename
// @access  Private
exports.renameGroup = async (req, res) => {
  try {
    const updatedChat = await populateChat(
      Chat.findByIdAndUpdate(req.params.chatId, { chatName: req.body.name }, { new: true })
    );
    if (!updatedChat) return res.status(404).json({ message: 'Chat not found' });
    res.json(updatedChat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Add member to group
// @route   PUT /api/chats/group/:chatId/add
// @access  Private
exports.addToGroup = async (req, res) => {
  try {
    const { userId } = req.body;
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    if (chat.groupAdmin.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only admin can add members' });
    }
    if (chat.users.map(String).includes(userId)) {
      return res.status(400).json({ message: 'User already in group' });
    }

    chat.users.push(userId);
    await chat.save();
    const fullChat = await populateChat(Chat.findById(chat._id));
    res.json(fullChat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Remove member from group
// @route   PUT /api/chats/group/:chatId/remove
// @access  Private
exports.removeFromGroup = async (req, res) => {
  try {
    const { userId } = req.body;
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    if (chat.groupAdmin.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only admin can remove members' });
    }

    chat.users = chat.users.filter(u => u.toString() !== userId);
    await chat.save();
    const fullChat = await populateChat(Chat.findById(chat._id));
    res.json(fullChat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Leave a group chat
// @route   PUT /api/chats/group/:chatId/leave
// @access  Private
exports.leaveGroup = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    chat.users = chat.users.filter(u => u.toString() !== req.user.id);

    // If admin left, assign new admin or delete group if empty
    if (chat.groupAdmin.toString() === req.user.id) {
      if (chat.users.length > 0) {
        chat.groupAdmin = chat.users[0];
      } else {
        await Chat.findByIdAndDelete(chat._id);
        return res.json({ message: 'Group deleted as last member left' });
      }
    }

    await chat.save();
    res.json({ message: 'Left group successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
