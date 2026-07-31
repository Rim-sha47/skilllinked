const Message = require('../models/Message');

const onlineUsers = new Map(); // userId -> socketId

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // User comes online
    socket.on('setup', (userData) => {
      if (!userData || !userData._id) return;
      socket.userId = userData._id;
      onlineUsers.set(userData._id, socket.id);
      socket.join(userData._id);

      // If user is Admin, join admins room for notifications
      if (userData.role === 'Admin') {
        socket.join('admins');
      }

      socket.emit('connected');
      // Broadcast online status
      io.emit('user online', { userId: userData._id, online: true });
      // Send current online users list
      socket.emit('online users', Array.from(onlineUsers.keys()));
      console.log(`User ${userData.fullName || userData.name || userData._id} is online`);
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
    socket.on('typing', (room) => socket.in(room).emit('typing', { room, userId: socket.userId }));
    socket.on('stop typing', (room) => socket.in(room).emit('stop typing', { room, userId: socket.userId }));

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
    socket.on('call-user', (data) => {
      socket.in(data.userToCall).emit('call-user', {
        signal: data.signalData,
        from: data.from,
        name: data.name,
        type: data.type,
      });
    });

    socket.on('answer-call', (data) => {
      socket.in(data.to).emit('call-accepted', data.signal);
    });

    socket.on('reject-call', (data) => {
      socket.in(data.to).emit('call-rejected');
    });

    socket.on('end-call', (data) => {
      socket.in(data.to).emit('call-ended');
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
    socket.on('disconnect', () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        io.emit('user online', { userId: socket.userId, online: false });
      }
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};
