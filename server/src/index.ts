import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectToDatabase } from './config/mongodb.js';

try {
  await connectToDatabase();
  app.listen(env.PORT, () => logger.info({ port: env.PORT }, 'TripSOS API listening'));
} catch (error) {
  logger.error(
    { errorType: error instanceof Error ? error.name : 'UnknownError' },
    'TripSOS could not connect to its database',
  );
  process.exitCode = 1;
}
