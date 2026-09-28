import mongoose from 'mongoose';
import { env } from './env.js';

let isConnected = false;

/**
 * Connect to MongoDB with resilient auto-reconnect
 */
export const connectDB = async () => {
  if (isConnected) {
    return;
  }

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000
    });

    isConnected = true;
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`[Database Error] MongoDB connection failed: ${error.message}`);
    // Do not crash the process abruptly if running in serverless environment (e.g. Vercel)
    if (env.NODE_ENV === 'production' && !process.env.VERCEL) {
      process.exit(1);
    }
  }

  mongoose.connection.on('error', (err) => {
    console.error(`[Database Error] Runtime error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[Database] MongoDB disconnected. Attempting to reconnect...');
    isConnected = false;
  });
};

export const closeDB = async () => {
  if (isConnected) {
    await mongoose.connection.close();
    isConnected = false;
    console.log('[Database] MongoDB connection closed');
  }
};
