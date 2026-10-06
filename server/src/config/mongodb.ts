import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectToDatabase(): Promise<void> {
  await mongoose.connect(env.MONGODB_URI);
}
