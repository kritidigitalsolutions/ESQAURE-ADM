import os from 'os';
import app from './app.js';
import { env } from './config/env.js';
import { connectDB, closeDB } from './config/db.js';
import { seedDefaultGenres } from './config/seedGenres.js';
import { seedDefaultLegalDocs } from './config/seedLegalDocs.js';
import { removeDummyUsers } from './config/seedUsers.js';
import { seedDefaultCustomAds } from './config/seedAds.js';
import { initializeFirebase } from './config/firebase.js';
import { startSubscriptionSweeper, stopSubscriptionSweeper } from './services/subscriptionSweeper.service.js';

/**
 * Dynamically discover the active local network IPv4 address
 */
const getLocalIp = () => {
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const net of interfaces[name] || []) {
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
  } catch {}
  return 'localhost';
};

const startServer = async () => {
  // Connect to database
  await connectDB();
  await seedDefaultGenres();
  await seedDefaultLegalDocs();
  await removeDummyUsers();
  await seedDefaultCustomAds();
  initializeFirebase();

  // Start background subscription expiration sweeper (Zero-Grace enforcement)
  startSubscriptionSweeper();

  const lanIp = getLocalIp();

  // Listen for incoming traffic on all network interfaces
  const server = app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`=================================================`);
    console.log(`🎬 E² Stories (Entertainment Squared) OTT Backend`);
    console.log(`🚀 Local URL:  http://localhost:${env.PORT}`);
    console.log(`📱 LAN Mobile: http://${lanIp}:${env.PORT}/api/v1`);
    console.log(`🌐 Environment: [${env.NODE_ENV}]`);
    console.log(`🔐 Auth API:   http://${lanIp}:${env.PORT}/api/v1/auth`);
    console.log(`=================================================`);
  });

  // Graceful shutdown handling
  const shutdown = async (signal) => {
    console.log(`\nReceived ${signal}. Shutting down server gracefully...`);
    stopSubscriptionSweeper();
    server.close(async () => {
      console.log('HTTP server closed.');
      await closeDB();
      process.exit(0);
    });

    // Force shutdown after 10s if hung
    setTimeout(() => {
      console.error('Forcefully terminating process after timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};


startServer().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
