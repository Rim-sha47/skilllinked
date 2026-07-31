const Call = require('../models/Call');

// @desc    Get call history for current user
// @route   GET /api/calls
// @access  Private
exports.getCallHistory = async (req, res) => {
  try {
    const calls = await Call.find({
      $or: [{ caller: req.user.id }, { receiver: req.user.id }],
    })
      .populate('caller', 'name fullName username profilePicture avatar headline')
      .populate('receiver', 'name fullName username profilePicture avatar headline')
      .populate('chat')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(calls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a call record
// @route   POST /api/calls
// @access  Private
exports.createCall = async (req, res) => {
  const { receiverId, type, chatId } = req.body;
  try {
    const call = await Call.create({
      caller: req.user.id,
      receiver: receiverId,
      type: type || 'voice',
      chat: chatId || null,
      status: 'missed',
    });
    const populated = await Call.findById(call._id)
      .populate('caller', 'name fullName username profilePicture avatar headline')
      .populate('receiver', 'name fullName username profilePicture avatar headline');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update call status (answered/rejected/missed)
// @route   PUT /api/calls/:callId
// @access  Private
exports.updateCall = async (req, res) => {
  try {
    const call = await Call.findByIdAndUpdate(
      req.params.callId,
      { status: req.body.status, duration: req.body.duration || 0 },
      { new: true }
    )
      .populate('caller', 'name fullName username profilePicture avatar headline')
      .populate('receiver', 'name fullName username profilePicture avatar headline');
    if (!call) return res.status(404).json({ message: 'Call not found' });
    res.json(call);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
