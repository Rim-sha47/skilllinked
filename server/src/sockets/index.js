const Message = require('../models/Message');
const User = require('../models/User');

const onlineUsers = new Map(); // userId -> socketId

// Import centralized privacy helper
const { canSeePresence } = require('../utils/privacyHelper');

// Helper to broadcast presence updates
const broadcastPresence = async (io, targetUserId, isOnline) => {
  try {
    const targetUser = await User.findById(targetUserId).select('privacySettings following followers lastSeen isOnline isRecording typingTo');
    if (!targetUser) return;

    for (const [viewerId, viewerSocketId] of onlineUsers.entries()) {
      if (viewerId === targetUserId.toString()) continue;

      let canSeeOnline = canSeePresence(targetUser, viewerId, 'onlineStatus');
      if (targetUser.privacySettings?.onlineStatus === 'Same as Last Seen') {
        canSeeOnline = canSeePresence(targetUser, viewerId, 'lastSeen');
      }

      const canSeeLastSeen = canSeePresence(targetUser, viewerId, 'lastSeen');

      if (isOnline) {
        if (canSeeOnline) {
          io.to(viewerId).emit('user online', { userId: targetUserId, online: true });
        }
      } else {
        if (canSeeLastSeen) {
          io.to(viewerId).emit('user offline', { userId: targetUserId, lastSeen: targetUser.lastSeen });
        } else {
          // If they can't see last seen, they just get a generic offline event without timestamp
          io.to(viewerId).emit('user offline', { userId: targetUserId });
        }
      }
    }
  } catch (err) {
    console.error('Error broadcasting presence:', err);
  }
};

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // User comes online
    socket.on('setup', async (userData) => {
      if (!userData || !userData._id) return;
      const userId = userData._id.toString();
      socket.userId = userId;
      onlineUsers.set(userId, socket.id);
      socket.join(userId);

      // If user is Admin, join admins room for notifications
      if (userData.role === 'Admin') {
        socket.join('admins');
      }

      try {
        const user = await User.findById(userId);
        if (user) {
          if (!user.activeSockets.includes(socket.id)) {
            user.activeSockets.push(socket.id);
          }
          user.isOnline = true;
          await user.save();
          await broadcastPresence(io, userId, true);
        }
      } catch (err) {
        console.error('Error in setup DB update:', err);
      }

      socket.emit('connected');
      // Send current online users list (might need filtering on client side based on privacy, but we just send all online users and let them filter or just send them blindly for now)
      socket.emit('online users', Array.from(onlineUsers.keys()));
      console.log(`User ${userData.fullName || userData.name || userId} is online`);
    });

    // Join a specific chat room
    socket.on('join chat', (room) => {
      socket.join(room);
      console.log(`User joined chat room: ${room}`);
    });

    // Leave a chat room
    socket.on('leave chat', (room) => {
      socket.leave(room);
    });

    // Typing indicators
    socket.on('typing', async (room) => {
      socket.in(room).emit('typing', { room, userId: socket.userId });
      try {
        if (socket.userId) await User.findByIdAndUpdate(socket.userId, { typingTo: room });
      } catch (e) {}
    });
    
    socket.on('stop typing', async (room) => {
      socket.in(room).emit('stop typing', { room, userId: socket.userId });
      try {
        if (socket.userId) await User.findByIdAndUpdate(socket.userId, { $unset: { typingTo: "" } });
      } catch (e) {}
    });

    // Recording indicators
    socket.on('recording-start', async (room) => {
      socket.in(room).emit('recording-start', { room, userId: socket.userId });
      try {
        if (socket.userId) await User.findByIdAndUpdate(socket.userId, { isRecording: true });
      } catch (e) {}
    });

    socket.on('recording-stop', async (room) => {
      socket.in(room).emit('recording-stop', { room, userId: socket.userId });
      try {
        if (socket.userId) await User.findByIdAndUpdate(socket.userId, { isRecording: false });
      } catch (e) {}
    });
    // New message: broadcast to all users in the chat except sender
    // Also update status to 'delivered' for online recipients
    socket.on('new message', async (newMessageReceived) => {
      const chat = newMessageReceived.chat;
      if (!chat || !chat.users) return console.log('chat.users not defined');

      const deliveredTo = [];
      chat.users.forEach((user) => {
        const recipientId = (user._id || user).toString();
        const senderId = (newMessageReceived.sender?._id || newMessageReceived.sender || '').toString();
        if (recipientId === senderId) return;

        // Emit message to recipient
        socket.in(recipientId).emit('message received', newMessageReceived);

        // If recipient is online, mark as delivered
        if (onlineUsers.has(recipientId)) {
          deliveredTo.push(recipientId);
        }
      });

      // If any recipients online, update status to 'delivered' and notify sender
      if (deliveredTo.length > 0 && newMessageReceived._id) {
        try {
          await Message.findByIdAndUpdate(newMessageReceived._id, { status: 'delivered' });
          // Notify the sender that message was delivered
          socket.emit('message status update', {
            messageId: newMessageReceived._id,
            chatId: chat._id || chat,
            status: 'delivered',
          });
        } catch (err) {
          console.error('Error updating delivered status:', err.message);
        }
      }
    });

    // Read receipt: when user opens a chat, mark all as seen
    socket.on('messages read', ({ chatId, userId }) => {
      // Broadcast to ALL users in the chat room (so sender gets blue ticks)
      socket.in(chatId).emit('messages read', { chatId, userId });
    });

    // Sender gets notified that their messages are seen (blue ticks)
    socket.on('mark seen', async ({ chatId, senderId }) => {
      try {
        // Update DB: mark messages as seen
        await Message.updateMany(
          { chat: chatId, sender: senderId, status: { $ne: 'seen' } },
          { $set: { status: 'seen' } }
        );
        // Notify sender about blue ticks
        socket.in(senderId).emit('messages seen', { chatId });
      } catch (err) {
        console.error('Error marking messages seen:', err.message);
      }
    });

    // Message deleted
    socket.on('message deleted', ({ messageId, chatId }) => {
      socket.in(chatId).emit('message deleted', { messageId, chatId });
    });

    // Message updated (edited)
    socket.on('message updated', (message) => {
      socket.in(message.chat._id || message.chat).emit('message updated', message);
    });

    // Message pinned
    socket.on('message pinned', (message) => {
      socket.in(message.chat._id || message.chat).emit('message pinned', message);
    });

    // Group events
    socket.on('group updated', (chat) => {
      chat.users?.forEach((user) => {
        const uid = (user._id || user).toString();
        if (uid !== socket.userId) {
          socket.in(uid).emit('group updated', chat);
        }
      });
    });

    // --- WebRTC Call Signaling (1-on-1 & Group) ---
    socket.on('call-user', async (data) => {
      // Check block privacy status
      try {
        const caller = await User.findById(socket.userId).select('blockedUsers');
        const receiver = await User.findById(data.userToCall).select('blockedUsers');
        if (
          caller?.blockedUsers?.map(String).includes(data.userToCall) ||
          receiver?.blockedUsers?.map(String).includes(socket.userId)
        ) {
          socket.emit('call-blocked', { message: 'User cannot be called due to privacy settings.' });
          return;
        }
      } catch (err) {
        console.error('Error checking block status for call:', err);
      }

      // Check if receiver is online or already in call
      const isOnline = onlineUsers.has(data.userToCall);
      if (!isOnline) {
        socket.emit('call-offline', { userToCall: data.userToCall });
      }

      socket.in(data.userToCall).emit('call-user', {
        signalData: data.signalData,
        from: data.from || socket.userId,
        name: data.name,
        type: data.type,
        callId: data.callId,
        chatId: data.chatId,
      });
    });

    socket.on('answer-call', (data) => {
      socket.in(data.to).emit('call-accepted', data.signal);
      io.to(data.to).to(socket.userId).emit('call-history-updated');
    });

    socket.on('reject-call', (data) => {
      socket.in(data.to).emit('call-rejected', { from: socket.userId });
      io.to(data.to).to(socket.userId).emit('call-history-updated');
    });

    socket.on('end-call', (data) => {
      socket.in(data.to).emit('call-ended', { from: socket.userId, duration: data.duration });
      io.to(data.to).to(socket.userId).emit('call-history-updated');
    });

    socket.on('call-busy', (data) => {
      socket.in(data.to).emit('call-busy', { from: socket.userId });
    });

    socket.on('call-reconnecting', (data) => {
      socket.in(data.to).emit('call-reconnecting');
    });

    socket.on('call-reconnected', (data) => {
      socket.in(data.to).emit('call-reconnected');
    });

    // Group Call Signaling
    socket.on('group-call-initiate', (data) => {
      // data: { chatId, caller, chatName, type }
      socket.to(data.chatId).emit('group-call-incoming', {
        chatId: data.chatId,
        caller: data.caller,
        chatName: data.chatName,
        type: data.type,
      });
    });

    socket.on('group-call-join', (data) => {
      // data: { chatId, user }
      socket.to(data.chatId).emit('group-call-user-joined', {
        chatId: data.chatId,
        user: data.user,
      });
    });

    socket.on('group-call-leave', (data) => {
      // data: { chatId, userId }
      socket.to(data.chatId).emit('group-call-user-left', {
        chatId: data.chatId,
        userId: data.userId,
      });
    });

    // Disconnect
    socket.on('disconnect', async () => {
      if (socket.userId) {
        try {
          const user = await User.findById(socket.userId);
          if (user) {
            user.activeSockets = user.activeSockets.filter(s => s !== socket.id);
            if (user.activeSockets.length === 0) {
              user.isOnline = false;
              user.lastSeen = new Date();
              onlineUsers.delete(socket.userId);
              await user.save();
              await broadcastPresence(io, socket.userId, false);
            } else {
              await user.save();
            }
          } else {
             onlineUsers.delete(socket.userId);
          }
        } catch (err) {
          console.error('Error on disconnect:', err);
          onlineUsers.delete(socket.userId);
        }
      }
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};
