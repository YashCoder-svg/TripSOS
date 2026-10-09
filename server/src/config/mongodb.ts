import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

interface EmbeddedMongoInstance {
  getUri(): string;
  stop(): Promise<boolean>;
}

let embeddedMongo: EmbeddedMongoInstance | null = null;

export async function connectToDatabase(): Promise<void> {
  try {
    // Attempt standard connection with a fast timeout
    await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
  } catch (error) {
    // If not production and target is localhost/127.0.0.1, auto-spin embedded development database
    const isLocal = env.MONGODB_URI.includes('127.0.0.1') || env.MONGODB_URI.includes('localhost');
    if (env.NODE_ENV !== 'production' && isLocal) {
      logger.info('Local MongoDB server not detected. Starting embedded development database...');
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        const dbPath = path.resolve(process.cwd(), '.mongodb-data');
        fs.mkdirSync(dbPath, { recursive: true });

        try {
          embeddedMongo = await MongoMemoryServer.create({
            instance: {
              port: 27017,
              dbPath,
              storageEngine: 'wiredTiger',
            },
            binary: { version: '7.0.14' },
          });
        } catch {
          embeddedMongo = await MongoMemoryServer.create({
            binary: { version: '7.0.14' },
          });
        }

        const uri = `${embeddedMongo.getUri().replace(/\/$/, '')}/tripsos`;
        await mongoose.connect(uri);
        logger.info({ uri }, 'Connected to embedded development MongoDB');
        return;
      } catch (embeddedError) {
        logger.error({ embeddedError }, 'Failed to start embedded MongoDB');
        throw error;
      }
    }
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  if (embeddedMongo) {
    await embeddedMongo.stop();
    embeddedMongo = null;
  }
}
