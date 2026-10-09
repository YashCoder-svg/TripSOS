import http from 'node:http';
import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectToDatabase } from './config/mongodb.js';
import { initSocketServer } from './sockets/socketServer.js';

try {
  await connectToDatabase();
  const httpServer = http.createServer(app);
  initSocketServer(httpServer);
  httpServer.listen(env.PORT, () =>
    logger.info({ port: env.PORT }, 'TripSOS API & Socket.io server listening'),
  );
} catch (error) {
  logger.error(
    { errorType: error instanceof Error ? error.name : 'UnknownError' },
    'TripSOS could not connect to its database',
  );
  process.exitCode = 1;
}
