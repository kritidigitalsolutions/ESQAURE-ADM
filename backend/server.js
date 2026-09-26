import app from './app.js';
import { env } from './config/env.js';
import { connectDB, closeDB } from './config/db.js';
import { seedDefaultGenres } from './config/seedGenres.js';
import { seedDefaultLegalDocs } from './config/seedLegalDocs.js';
import { removeDummyUsers } from './config/seedUsers.js';
import { initializeFirebase } from './config/firebase.js';

const startServer = async () => {
  // Connect to database
  await connectDB();
  await seedDefaultGenres();
  await seedDefaultLegalDocs();
  await removeDummyUsers();
  initializeFirebase();

  // Listen for incoming traffic
  const server = app.listen(env.PORT, () => {
    console.log(`=================================================`);
    console.log(`🎬 E² Stories (Entertainment Squared) OTT Backend`);
    console.log(`🚀 Server listening on http://localhost:${env.PORT}`);
    console.log(`🌐 Environment: [${env.NODE_ENV}]`);
    console.log(`🔐 Auth API: http://localhost:${env.PORT}/api/v1/auth`);
    console.log(`=================================================`);
  });

  // Graceful shutdown handling
  const shutdown = async (signal) => {
    console.log(`\nReceived ${signal}. Shutting down server gracefully...`);
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
