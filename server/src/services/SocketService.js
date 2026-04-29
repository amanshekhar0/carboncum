let io;

module.exports = {
  init: (server) => {
    io = require('socket.io')(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    io.on('connection', (socket) => {
      console.log('[Socket] Client connected:', socket.id);
      
      socket.on('join', (userId) => {
        socket.join(userId);
        console.log(`[Socket] User ${userId} joined room`);
      });

      socket.on('disconnect', () => {
        console.log('[Socket] Client disconnected');
      });
    });

    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error("Socket.io not initialized!");
    }
    return io;
  },
  emitUpdate: (userId, data) => {
    if (io) {
      io.to(userId).emit('metrics_update', data);
      console.log(`[Socket] Emitted update to user ${userId}`);
    }
  }
};
