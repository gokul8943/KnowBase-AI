import { app } from './app';
import { config } from './config';
import { prisma } from './config/prisma';
import { redis } from './config/redis';

const startServer = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log('Database connected');

    await redis.connect();
    console.log('Redis connected');

    const server = app.listen(config.port, () => {
      console.log(`Server running on port ${config.port} in ${config.env} mode`);
      console.log(`API Documentation: http://localhost:${config.port}/api-docs`);
    });

    const shutdown = async (signal: string): Promise<void> => {
      console.log(`${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        await redis.quit();
        console.log('Connections closed');
        process.exit(0);
      });

      setTimeout(() => {
        console.error('Forced shutdown');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();