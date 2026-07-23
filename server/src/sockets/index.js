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
    socket.on('new message', (newMessageReceived) => {
      var chat = newMessageReceived.chat;
      if (!chat || !chat.users) return console.log('chat.users not defined');

      chat.users.forEach((user) => {
        const recipientId = user._id || user;
        if (recipientId == newMessageReceived.sender._id) return;
        socket.in(recipientId).emit('message received', newMessageReceived);
      });
    });

    // Read receipt
    socket.on('messages read', ({ chatId, userId }) => {
      socket.in(chatId).emit('messages read', { chatId, userId });
    });

    // Message deleted
    socket.on('message deleted', ({ messageId, chatId }) => {
      socket.in(chatId).emit('message deleted', { messageId, chatId });
    });

    // --- WebRTC Call Signaling ---
    socket.on('call-user', (data) => {
      // data: { userToCall: recipientId, signalData, from, name, type (audio/video) }
      socket.in(data.userToCall).emit('call-user', {
        signal: data.signalData,
        from: data.from,
        name: data.name,
        type: data.type
      });
    });

    socket.on('answer-call', (data) => {
      // data: { to: callerId, signal }
      socket.in(data.to).emit('call-accepted', data.signal);
    });

    socket.on('reject-call', (data) => {
      socket.in(data.to).emit('call-rejected');
    });

    socket.on('end-call', (data) => {
      socket.in(data.to).emit('call-ended');
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
