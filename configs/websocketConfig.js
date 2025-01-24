import { Server } from 'socket.io';

let io;

export const initializeWebSocket = (httpServer) => {
  io = new Server(httpServer, {
    pingTimeout: 60000,
    pingInterval: 25000,
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('send-message', (data) => {
      try {
        const { chatId, content, sender, createdAt } = data;

        if (!chatId || !content || !sender) {
          throw new Error('Invalid message data');
        }

        console.log('send-message', data);
        io.to(chatId).emit('receive-message', { content, sender, createdAt });
        socket.emit('message-sent', {
          status: 'success',
          message: 'Message sent successfully',
        });
      } catch (error) {
        console.error('Error in send-message:', error.message);
        socket.emit('error', error.message);
      }
    });

    socket.on('join-room', (chatId) => {
      if (!chatId) {
        return socket.emit('error', 'Invalid room ID');
      }
      socket.join(chatId);
      console.log(`User ${socket.id} joined room: ${chatId}`);
      socket.emit('room-joined', {
        room: chatId,
        message: 'Successfully joined the room',
      });
    });

    socket.on('leaveRoom', (roomId) => {
      if (!roomId) {
        return socket.emit('error', 'Invalid room ID');
      }
      socket.leave(roomId);
      console.log(`User ${socket.id} left room: ${roomId}`);
    });

    socket.on('disconnect', () => {
      console.log('A user disconnected:', socket.id);

      const rooms = Object.keys(socket.rooms);
      rooms.forEach((room) => {
        socket.leave(room);
        console.log(`User ${socket.id} left room: ${room}`);
      });
    });
  });

  return io;
};

export const notifyEmployee = (message) => {
  if (!message) {
    throw new Error('Message cannot be empty');
  }
  if (!io) {
    throw new Error('WebSocket server not initialized');
  }
  console.log('notifyEmployee', message);
  io.emit('notification', message);
};

export const notifyClient = (clientId, message) => {
  if (!clientId || !message) {
    throw new Error('Client ID and message cannot be empty');
  }
  if (!io) {
    throw new Error('WebSocket server not initialized');
  }
  console.log('notifyClient', { clientId, message });
  io.to(clientId).emit('notification', message);
};
