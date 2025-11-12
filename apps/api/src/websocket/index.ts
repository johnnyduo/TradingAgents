import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../utils/logger';

export const setupWebSocket = (io: SocketIOServer) => {
  io.on('connection', (socket: Socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Join analysis room
    socket.on('join-analysis', (roomId: string) => {
      socket.join(roomId);
      logger.info(`Socket ${socket.id} joined room ${roomId}`);
    });

    // Leave analysis room
    socket.on('leave-analysis', (roomId: string) => {
      socket.leave(roomId);
      logger.info(`Socket ${socket.id} left room ${roomId}`);
    });

    // Disconnect
    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });

  logger.info('✅ WebSocket server initialized');
};
