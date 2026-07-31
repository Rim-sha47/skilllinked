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

    // Notify receiver
    const Notification = require('../models/Notification');
    const sender = await User.findById(senderId);
    const notif = await Notification.create({
      user: receiverId,
      sender: senderId,
      type: 'connection_request',
      content: `${sender.fullName || sender.username} sent you a connection request.`,
    });
    if (req.io) req.io.to(receiverId.toString()).emit('notification', notif);

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

      // Notify sender that their request was accepted
      const Notification = require('../models/Notification');
      const notif = await Notification.create({
        user: sender._id,
        sender: receiver._id,
        type: 'connection_accepted',
        content: `${receiver.fullName || receiver.username} accepted your connection request.`,
      });
      if (req.io) req.io.to(sender._id.toString()).emit('notification', notif);
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
// @desc    Get people you may know (suggestions)
// @route   GET /api/connections/suggestions
// @access  Private
exports.getSuggestions = async (req, res) => {
  try {
    // Find all connection IDs involving the current user
    const existingConnections = await Connection.find({
      $or: [{ sender: req.user.id }, { receiver: req.user.id }],
    });

    const excludeIds = new Set([req.user.id]);
    const myConnectionIds = new Set();
    const pendingUserIds = new Set();
    
    existingConnections.forEach(c => {
      if (c.status === 'accepted') {
        // Exclude accepted connections from suggestions
        excludeIds.add(c.sender.toString());
        excludeIds.add(c.receiver.toString());
        myConnectionIds.add(c.sender.toString() === req.user.id ? c.receiver.toString() : c.sender.toString());
      } else if (c.status === 'pending') {
        // Track pending but don't exclude - we want to show them with "Pending" status
        const otherUserId = c.sender.toString() === req.user.id ? c.receiver.toString() : c.sender.toString();
        pendingUserIds.add(otherUserId);
      }
    });

    // Find users not in exclude set (accepted connections + self)
    const users = await User.find({
      _id: { $nin: Array.from(excludeIds) },
    })
      .select('fullName username profilePicture headline location')
      .limit(20)
      .lean();

    // Calculate mutual connections and add connectionStatus
    const suggestionsWithMutuals = await Promise.all(users.map(async (u) => {
      const userConns = await Connection.find({
        $or: [{ sender: u._id }, { receiver: u._id }],
        status: 'accepted'
      });
      
      let mutualCount = 0;
      userConns.forEach(c => {
        const otherId = c.sender.toString() === u._id.toString() ? c.receiver.toString() : c.sender.toString();
        if (myConnectionIds.has(otherId)) mutualCount++;
      });
      
      return {
        ...u,
        mutualConnectionsCount: mutualCount,
        connectionStatus: pendingUserIds.has(u._id.toString()) ? 'pending' : 'none'
      };
    }));

    // Sort by mutual connections descending
    suggestionsWithMutuals.sort((a, b) => b.mutualConnectionsCount - a.mutualConnectionsCount);

    res.json(suggestionsWithMutuals);
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

    // Atomic update to prevent duplicates on rapid clicks
    const updatedCurrentUser = await User.findByIdAndUpdate(
      currentUserId,
      { $addToSet: { following: targetUserId } },
      { new: true }
    );

    const updatedTargetUser = await User.findByIdAndUpdate(
      targetUserId,
      { $addToSet: { followers: currentUserId } },
      { new: true }
    );

    // Notify targetUser only if it was a new follow
    if (!targetUser.followers.includes(currentUserId)) {
      const Notification = require('../models/Notification');
      const notif = await Notification.create({
        user: targetUserId,
        sender: currentUserId,
        type: 'new_follower',
        content: `${currentUser.fullName || currentUser.username} started following you.`,
      });
      // Populate sender before emitting for UI mapping
      await notif.populate('sender', 'fullName username profilePicture');
      if (req.io) req.io.to(targetUserId.toString()).emit('notification', notif);
    }

    res.json({ message: 'User followed successfully', followersCount: updatedTargetUser.followers.length });
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

    // Atomic pull
    await User.findByIdAndUpdate(
      currentUserId,
      { $pull: { following: targetUserId } }
    );

    const updatedTargetUser = await User.findByIdAndUpdate(
      targetUserId,
      { $pull: { followers: currentUserId } },
      { new: true }
    );

    res.json({ message: 'User unfollowed successfully', followersCount: updatedTargetUser.followers.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove a follower
// @route   DELETE /api/connections/follower/:id
// @access  Private
exports.removeFollower = async (req, res) => {
  try {
    const followerId = req.params.id;
    const currentUserId = req.user.id;

    const follower = await User.findById(followerId);
    const currentUser = await User.findById(currentUserId);

    if (!follower || !currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove follower from current user's followers
    const updatedCurrentUser = await User.findByIdAndUpdate(
      currentUserId,
      { $pull: { followers: followerId } },
      { new: true }
    );

    // Remove current user from follower's following
    await User.findByIdAndUpdate(
      followerId,
      { $pull: { following: currentUserId } }
    );

    res.json({ message: 'Follower removed successfully', followersCount: updatedCurrentUser.followers.length });
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

// @desc    Get connections for a specific user
// @route   GET /api/connections/user/:userId
// @access  Public
exports.getConnectionsByUser = async (req, res) => {
  try {
    const connections = await Connection.find({
      $or: [{ sender: req.params.userId }, { receiver: req.params.userId }],
      status: 'accepted',
    }).populate('sender receiver', 'fullName username profilePicture headline');

    const friends = connections.map(c =>
      c.sender._id.toString() === req.params.userId ? c.receiver : c.sender
    );

    res.json(friends);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
