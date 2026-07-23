const Connection = require('../models/Connection');
const User = require('../models/User');
const Activity = require('../models/Activity');

// @desc    Send a connection request
// @route   POST /api/connections/request/:id
// @access  Private
exports.sendRequest = async (req, res) => {
  try {
    const receiverId = req.params.id;
    const senderId = req.user.id;

    if (senderId === receiverId) {
      return res.status(400).json({ message: 'You cannot send a request to yourself' });
    }

    const existingConnection = await Connection.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    });

    if (existingConnection) {
      return res.status(400).json({ message: 'Connection or request already exists' });
    }

    const connection = new Connection({
      sender: senderId,
      receiver: receiverId,
      status: 'pending',
    });

    await connection.save();

    res.status(201).json({ message: 'Connection request sent' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Accept connection request
// @route   PUT /api/connections/accept/:id
// @access  Private
exports.acceptRequest = async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.id);

    if (!connection) {
      return res.status(404).json({ message: 'Connection request not found' });
    }

    if (connection.receiver.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    connection.status = 'accepted';
    await connection.save();

    // Log Activity for both users
    const sender = await User.findById(connection.sender);
    const receiver = await User.findById(connection.receiver);
    
    if (sender && receiver) {
      await Activity.create([
        {
          user: sender._id,
          type: 'new_connection',
          text: `You connected with ${receiver.fullName || receiver.username}.`,
          relatedId: receiver._id
        },
        {
          user: receiver._id,
          type: 'new_connection',
          text: `You connected with ${sender.fullName || sender.username}.`,
          relatedId: sender._id
        }
      ]);
    }

    res.json({ message: 'Connection request accepted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get my connections
// @route   GET /api/connections
// @access  Private
exports.getMyConnections = async (req, res) => {
  try {
    const connections = await Connection.find({
      $or: [{ sender: req.user.id }, { receiver: req.user.id }],
      status: 'accepted',
    }).populate('sender receiver', 'fullName username profilePicture headline');

    // Filter to return the 'other' person
    const friends = connections.map(c => 
      c.sender._id.toString() === req.user.id ? c.receiver : c.sender
    );

    res.json(friends);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get pending incoming connection requests
// @route   GET /api/connections/pending
// @access  Private
exports.getPendingRequests = async (req, res) => {
  try {
    const pending = await Connection.find({
      receiver: req.user.id,
      status: 'pending',
    }).populate('sender', 'fullName username profilePicture headline location');

    res.json(pending);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get people you may know (suggestions)
// @route   GET /api/connections/suggestions
// @access  Private
exports.getSuggestions = async (req, res) => {
  try {
    // Find all connection IDs involving the current user
    const existingConnections = await Connection.find({
      $or: [{ sender: req.user.id }, { receiver: req.user.id }],
    });

    // Build a set of user IDs to exclude (connected or pending)
    const excludeIds = new Set([req.user.id]);
    existingConnections.forEach(c => {
      excludeIds.add(c.sender.toString());
      excludeIds.add(c.receiver.toString());
    });

    // Find users not in that set
    const suggestions = await User.find({
      _id: { $nin: Array.from(excludeIds) },
    })
      .select('fullName username profilePicture headline location')
      .limit(20);

    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove connection or reject request
// @route   DELETE /api/connections/:id
// @access  Private
exports.removeConnection = async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.id);

    if (!connection) {
      return res.status(404).json({ message: 'Connection not found' });
    }

    // Must be sender or receiver to delete
    const userId = req.user.id;
    if (
      connection.sender.toString() !== userId &&
      connection.receiver.toString() !== userId
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await connection.deleteOne();
    res.json({ message: 'Connection removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Follow a user
// @route   POST /api/connections/follow/:id
// @access  Private
exports.followUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user.id;

    if (targetUserId === currentUserId) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!currentUser.following.includes(targetUserId)) {
      currentUser.following.push(targetUserId);
      await currentUser.save();
    }

    if (!targetUser.followers.includes(currentUserId)) {
      targetUser.followers.push(currentUserId);
      await targetUser.save();
    }

    res.json({ message: 'User followed successfully', followersCount: targetUser.followers.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Unfollow a user
// @route   DELETE /api/connections/follow/:id
// @access  Private
exports.unfollowUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user.id;

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    currentUser.following = currentUser.following.filter(
      (id) => id.toString() !== targetUserId
    );
    await currentUser.save();

    targetUser.followers = targetUser.followers.filter(
      (id) => id.toString() !== currentUserId
    );
    await targetUser.save();

    res.json({ message: 'User unfollowed successfully', followersCount: targetUser.followers.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user followers
// @route   GET /api/connections/followers/:id
// @access  Public
exports.getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('followers', 'fullName username profilePicture headline location bio');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.followers || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user following list
// @route   GET /api/connections/following/:id
// @access  Public
exports.getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('following', 'fullName username profilePicture headline location bio');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.following || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
