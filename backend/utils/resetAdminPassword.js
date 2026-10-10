import { initializeFirebase } from '../config/firebase.js';
import { getAuth } from 'firebase-admin/auth';

/**
 * Script to reset or create an admin user in Firebase Authentication.
 * Usage:
 *   node utils/resetAdminPassword.js [email] [password]
 * Example:
 *   node utils/resetAdminPassword.js e2.storiesofficial@gmail.com Admin@123
 */
const run = async () => {
  const email = process.argv[2] || 'e2.storiesofficial@gmail.com';
  const password = process.argv[3] || 'Admin@123';

  console.log(`[Admin Setup] Initializing Firebase Admin SDK...`);
  const app = initializeFirebase();
  if (!app) {
    console.error('❌ Failed to initialize Firebase Admin SDK. Please check serviceAccountKey.json.');
    process.exit(1);
  }

  const auth = getAuth(app);

  try {
    let user;
    try {
      user = await auth.getUserByEmail(email);
      console.log(`Found existing user with UID: ${user.uid}. Updating password...`);
      await auth.updateUser(user.uid, {
        password: password,
        disabled: false
      });
      console.log(`✅ Successfully updated password for ${email}`);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        console.log(`User not found. Creating new admin user: ${email}...`);
        user = await auth.createUser({
          email: email,
          password: password,
          displayName: 'Super Admin',
          emailVerified: true
        });
        console.log(`✅ Successfully created admin user: ${email} (UID: ${user.uid})`);
      } else {
        throw err;
      }
    }

    console.log(`\n🎉 Admin credentials ready:`);
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error configuring admin user:', error.message);
    process.exit(1);
  }
};

run();
