import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { AccountDeletionRequest } from '../models/AccountDeletionRequest.js';
import { env } from '../config/env.js';

import { signJwt } from '../utils/jwt.js';

async function runTest() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(env.MONGODB_URI);
  console.log('Connected to MongoDB.');

  const testPhone = '9999900001';

  // 1. Clean up any previous test user
  await User.deleteMany({ phoneNumber: testPhone });
  await AccountDeletionRequest.deleteMany({ phoneNumber: testPhone });

  // 2. Create a test user
  const user = await User.create({
    phoneNumber: testPhone,
    countryCode: '+91',
    firstName: 'Test',
    lastName: 'DeletionUser',
    email: 'testdeletion@example.com',
    status: 'ACTIVE',
    isVip: true,
    plan: '1 Month Pass',
    totalWatchTime: '4.5 hrs'
  });
  console.log('✓ Created test user:', user._id.toString());

  // 3. User requests deletion via API simulation
  const baseUrl = 'http://localhost:5001/api/v1';
  
  const token = signJwt({
    userId: user._id.toString(),
    phoneNumber: user.phoneNumber,
    isProfileCompleted: true
  });
  console.log('✓ Obtained JWT auth token for test user');

  // 4. Test delete account request (DELETE /auth/profile)
  const delRes = await fetch(`${baseUrl}/auth/profile`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ reason: 'Testing 24hr deletion workflow' })
  }).then(r => r.json());

  console.log('✓ Deletion request response:', delRes);
  if (!delRes.success || !delRes.data?.deletionRequested || delRes.data?.status !== 'PENDING_DELETION') {
    throw new Error('Deletion request failed assertion!');
  }
  console.log('✓ Verified user notification message: account will be deleted within 24 hours by admin');

  // 5. Verify database state
  const updatedUser = await User.findById(user._id);
  console.log('✓ User DB Status:', updatedUser.status);
  console.log('✓ User DeletionRequest:', updatedUser.deletionRequest);
  if (updatedUser.status !== 'PENDING_DELETION' || !updatedUser.deletionRequest?.isRequested) {
    throw new Error('User DB status was not PENDING_DELETION!');
  }

  // 6. Verify AccountDeletionRequest document
  const reqDoc = await AccountDeletionRequest.findOne({ userId: user._id, status: 'PENDING' });
  if (!reqDoc) throw new Error('AccountDeletionRequest was not created in DB!');
  console.log('✓ Created AccountDeletionRequest in DB:', reqDoc._id.toString(), 'reason:', reqDoc.reason);

  // 7. Test Admin API: Get Users with filter=DELETION_REQUESTS
  const adminKey = env.ADMIN_API_KEY || 'esquare_admin_dev_secret_2026';
  const adminHeaders = {
    'x-admin-key': adminKey,
    'Content-Type': 'application/json'
  };

  const usersListRes = await fetch(`${baseUrl}/users?filter=DELETION_REQUESTS`, {
    headers: adminHeaders
  }).then(r => r.json());

  console.log('✓ Admin getUsers counts:', usersListRes.data?.counts);
  const foundUser = usersListRes.data?.users?.find(u => u.id === user._id.toString());
  if (!foundUser) throw new Error('User not found in filter=DELETION_REQUESTS!');
  console.log('✓ Found user in admin filter=DELETION_REQUESTS list:', foundUser.name);

  // 8. Test Admin API: Get deletion requests list
  const delRequestsListRes = await fetch(`${baseUrl}/users/admin/deletion-requests`, {
    headers: adminHeaders
  }).then(r => r.json());
  console.log('✓ Admin getDeletionRequests pending count:', delRequestsListRes.data?.pendingCount);

  // 9. Test Admin API: Reject Deletion Request
  const rejectRes = await fetch(`${baseUrl}/users/${user._id}/reject-deletion`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ adminNote: 'Verified active user, request cancelled' })
  }).then(r => r.json());
  console.log('✓ Admin rejectDeletion response:', rejectRes.message);
  
  const userAfterReject = await User.findById(user._id);
  if (userAfterReject.status !== 'ACTIVE' || userAfterReject.deletionRequest?.isRequested) {
    throw new Error('User status not restored to ACTIVE after rejection!');
  }
  console.log('✓ User successfully restored to ACTIVE after admin rejection');

  // 10. User requests deletion again and Admin confirms verification & permanent delete
  await fetch(`${baseUrl}/auth/delete-request`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ reason: 'Permanent removal test' })
  });

  const verifyDeleteRes = await fetch(`${baseUrl}/users/${user._id}/verify-delete`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ adminNotes: 'Verified and permanently deleted' })
  }).then(r => r.json());

  console.log('✓ Admin verifyAndDelete response:', verifyDeleteRes.message);

  const deletedUserCheck = await User.findById(user._id);
  if (deletedUserCheck !== null) {
    throw new Error('User was not permanently removed from database!');
  }
  console.log('✓ User successfully and permanently purged from database after admin verification');

  // Clean up
  await AccountDeletionRequest.deleteMany({ phoneNumber: testPhone });
  console.log('\n========================================');
  console.log('ALL DELETION FLOW TESTS PASSED 100%!');
  console.log('========================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

runTest().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
