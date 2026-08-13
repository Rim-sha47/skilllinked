const Call = require('../models/Call');
const User = require('../models/User');
const Message = require('../models/Message');
const Chat = require('../models/Chat');
const Notification = require('../models/Notification');

// Helper to format call duration into text (e.g. 08:42)
const formatDurationText = (seconds) => {
  if (!seconds || seconds <= 0) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

// Helper to find or create a 1-on-1 chat between two users
const findOrCreateChat = async (userId1, userId2) => {
  let chat = await Chat.findOne({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: userId1 } } },
      { users: { $elemMatch: { $eq: userId2 } } },
    ],
  });

  if (!chat) {
    chat = await Chat.create({
      chatName: 'sender',
      isGroupChat: false,
      users: [userId1, userId2],
    });
  }

  return chat;
};

// @desc    Get call history for current user
// @route   GET /api/calls
// @access  Private
exports.getCallHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, filter, search } = req.query;

    const query = {
      $or: [{ caller: userId }, { receiver: userId }],
      deletedFor: { $ne: userId },
    };

    if (type && type !== 'all') {
      query.type = type;
    }

    if (filter === 'missed') {
      query.status = { $in: ['missed', 'rejected', 'declined'] };
    } else if (filter === 'incoming') {
      query.receiver = userId;
    } else if (filter === 'outgoing') {
      query.caller = userId;
    }

    const calls = await Call.find(query)
      .populate('caller', 'name fullName username profilePicture avatar headline')
      .populate('receiver', 'name fullName username profilePicture avatar headline')
      .populate('chat')
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(150);

    let result = calls;
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      result = calls.filter((c) => {
        const other = c.caller?._id?.toString() === userId ? c.receiver : c.caller;
        const name = (other?.fullName || other?.name || '').toLowerCase();
        const username = (other?.username || '').toLowerCase();
        const dateStr = new Date(c.createdAt).toLocaleDateString().toLowerCase();
        const callType = c.type.toLowerCase();
        const status = c.status.toLowerCase();
        return (
          name.includes(q) ||
          username.includes(q) ||
          dateStr.includes(q) ||
          callType.includes(q) ||
          status.includes(q)
        );
      });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a call record & insert start system message in chat
// @route   POST /api/calls
// @access  Private
exports.createCall = async (req, res) => {
  const { receiverId, type, chatId } = req.body;
  try {
    const callerId = req.user.id;

    // Privacy & Block Check
    const callerUser = await User.findById(callerId).select('blockedUsers fullName name username');
    const receiverUser = await User.findById(receiverId).select('blockedUsers fullName name username');

    if (
      callerUser?.blockedUsers?.map(String).includes(receiverId) ||
      receiverUser?.blockedUsers?.map(String).includes(callerId)
    ) {
      return res.status(403).json({ message: 'Cannot place call to this user due to privacy settings.' });
    }

    // Resolve 1-on-1 Chat
    let targetChatId = chatId;
    if (!targetChatId) {
      const targetChat = await findOrCreateChat(callerId, receiverId);
      targetChatId = targetChat._id;
    }

    const call = await Call.create({
      caller: callerId,
      receiver: receiverId,
      type: type || 'voice',
      chat: targetChatId,
      status: 'ongoing',
    });

    const populated = await Call.findById(call._id)
      .populate('caller', 'name fullName username profilePicture avatar headline')
      .populate('receiver', 'name fullName username profilePicture avatar headline');

    // Create system message in chat history
    const isVideo = type === 'video';
    const callText = isVideo ? '📹 You started a video call.' : '📞 You started a voice call.';
    const systemMsg = await Message.create({
      sender: callerId,
      chat: targetChatId,
      content: callText,
      media: { url: '', type: 'call' },
      callInfo: {
        callId: call._id,
        callType: type || 'voice',
        callStatus: 'started',
        duration: 0,
      },
    });

    // Update latest message in chat
    await Chat.findByIdAndUpdate(targetChatId, { latestMessage: systemMsg._id });

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update call status & duration, insert chat system record, and handle notifications
// @route   PUT /api/calls/:callId
// @access  Private
exports.updateCall = async (req, res) => {
  try {
    const { status, duration, quality, networkStatus } = req.body;

    const call = await Call.findById(req.params.callId);
    if (!call) return res.status(404).json({ message: 'Call not found' });

    if (status) call.status = status;
    if (duration !== undefined) call.duration = duration;
    if (quality) call.quality = quality;
    if (networkStatus) call.networkStatus = networkStatus;

    await call.save();

    const populated = await Call.findById(call._id)
      .populate('caller', 'name fullName username profilePicture avatar headline')
      .populate('receiver', 'name fullName username profilePicture avatar headline');

    // Ensure chat is resolved
    let targetChatId = call.chat;
    if (!targetChatId) {
      const targetChat = await findOrCreateChat(call.caller, call.receiver);
      targetChatId = targetChat._id;
      call.chat = targetChatId;
      await call.save();
    }

    let callText = '';
    const isVideo = call.type === 'video';
    const durText = formatDurationText(call.duration);

    if (status === 'answered' || status === 'ended') {
      callText = isVideo
        ? `📹 Video call ended.${durText ? ' Duration: ' + durText : ''}`
        : `📞 Voice call ended.${durText ? ' Duration: ' + durText : ''}`;
    } else if (status === 'missed') {
      callText = isVideo ? '❌ Missed video call' : '❌ Missed voice call';
    } else if (status === 'rejected' || status === 'declined') {
      callText = '📵 Call declined';
    } else if (status === 'cancelled') {
      callText = isVideo ? '🔄 Cancelled video call' : '🔄 Cancelled voice call';
    }

    if (callText && targetChatId) {
      const systemMsg = await Message.create({
        sender: req.user.id,
        chat: targetChatId,
        content: callText,
        media: { url: '', type: 'call' },
        callInfo: {
          callId: call._id,
          callType: call.type,
          callStatus: status === 'answered' ? 'ended' : status,
          duration: call.duration || 0,
        },
      });

      await Chat.findByIdAndUpdate(targetChatId, { latestMessage: systemMsg._id });
    }

    // Create Notification for Missed / Declined call
    if (status === 'missed') {
      const callerName = populated.caller?.fullName || populated.caller?.name || 'Someone';
      await Notification.create({
        user: call.receiver,
        sender: call.caller,
        type: 'missed_call',
        content: `You missed a ${call.type} call from ${callerName}.`,
        relatedData: { chatId: targetChatId, callId: call._id },
      });
    }

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete single call log for current user (does NOT delete chat message)
// @route   DELETE /api/calls/:callId
// @access  Private
exports.deleteCall = async (req, res) => {
  try {
    const call = await Call.findById(req.params.callId);
    if (!call) return res.status(404).json({ message: 'Call record not found' });

    if (!call.deletedFor.includes(req.user.id)) {
      call.deletedFor.push(req.user.id);
      await call.save();
    }
    res.json({ message: 'Call log deleted successfully', callId: req.params.callId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete multiple calls for current user
// @route   POST /api/calls/bulk-delete
// @access  Private
exports.deleteMultipleCalls = async (req, res) => {
  try {
    const { callIds } = req.body;
    if (!Array.isArray(callIds) || callIds.length === 0) {
      return res.status(400).json({ message: 'No call IDs provided' });
    }

    await Call.updateMany(
      { _id: { $in: callIds } },
      { $addToSet: { deletedFor: req.user.id } }
    );

    res.json({ message: 'Calls deleted successfully', callIds });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Clear all call history for current user (does NOT delete chat messages)
// @route   DELETE /api/calls/clear/all
// @access  Private
exports.clearCallHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    await Call.updateMany(
      { $or: [{ caller: userId }, { receiver: userId }] },
      { $addToSet: { deletedFor: userId } }
    );
    res.json({ message: 'All call history cleared successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle pin status of a call record
// @route   PUT /api/calls/:callId/pin
// @access  Private
exports.togglePinCall = async (req, res) => {
  try {
    const call = await Call.findById(req.params.callId);
    if (!call) return res.status(404).json({ message: 'Call not found' });
    call.isPinned = !call.isPinned;
    await call.save();
    res.json(call);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle archive status of a call record
// @route   PUT /api/calls/:callId/archive
// @access  Private
exports.toggleArchiveCall = async (req, res) => {
  try {
    const call = await Call.findById(req.params.callId);
    if (!call) return res.status(404).json({ message: 'Call not found' });
    call.isArchived = !call.isArchived;
    await call.save();
    res.json(call);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
