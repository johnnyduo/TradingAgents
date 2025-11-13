import { Application } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import analysisRoutes from './analysis.routes';
import configRoutes from './config.routes';
import authRoutes from './auth.routes';

export const setupRoutes = (app: Application, io: SocketIOServer) => {
  // API version prefix
  const apiV1 = '/api/v1';

  // Mount routes
  app.use(`${apiV1}/analysis`, analysisRoutes(io));
  app.use(`${apiV1}/config`, configRoutes);
  app.use(`${apiV1}/auth`, authRoutes);

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: 'Route not found',
    });
  });
};
