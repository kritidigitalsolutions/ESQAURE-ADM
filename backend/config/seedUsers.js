import { User } from '../models/User.js';

export const DUMMY_PHONE_NUMBERS = [
  '9820144582',
  '9711239810',
  '9845012893',
  '9167088231',
  '9923456123',
  '9422099112',
  '9833012948',
  '9740192837'
];

export const DUMMY_EMAILS = [
  'aarav.sharma@gmail.com',
  'priya.m22@yahoo.com',
  'rohan.v@outlook.com',
  'sneha.patel@gmail.com',
  'vikram.sen@gmail.com',
  'ananya.roy@hotmail.com',
  'rajesh.k@gmail.com',
  'meera.nair@yahoo.com'
];

/**
 * Permanently delete any mock/sample users from MongoDB so only 100% genuine real users exist.
 */
export const removeDummyUsers = async () => {
  try {
    const result = await User.deleteMany({
      $or: [
        { phoneNumber: { $in: DUMMY_PHONE_NUMBERS } },
        { email: { $in: DUMMY_EMAILS } }
      ]
    });
    if (result.deletedCount > 0) {
      console.log(`[Database] Permanently deleted ${result.deletedCount} dummy seed users from MongoDB.`);
    }
  } catch (error) {
    console.warn('[Database] Could not clean dummy users:', error.message);
  }
};

export const seedDefaultUsers = async () => {
  // Purge any dummy users and NEVER insert mock data
  await removeDummyUsers();
};
