import app from '../app.js';
import { connectDB } from '../config/db.js';
import { seedDefaultGenres } from '../config/seedGenres.js';
import { seedDefaultLegalDocs } from '../config/seedLegalDocs.js';
import { removeDummyUsers } from '../config/seedUsers.js';
import { initializeFirebase } from '../config/firebase.js';

let initialized = false;

export default async function handler(req, res) {
  if (!initialized) {
    try {
      await connectDB();
      initializeFirebase();

      // Only run initial migration seeds in development, not on production lambda cold starts
      if (process.env.NODE_ENV !== 'production') {
        await seedDefaultGenres();
        await seedDefaultLegalDocs();
        await removeDummyUsers();
      }
      initialized = true;
    } catch (err) {
      console.error('[Vercel Serverless Initialization Error]:', err);
    }
  }


  return app(req, res);
}
