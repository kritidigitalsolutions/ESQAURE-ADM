import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';

const router = Router();

// GET /api/v1/users - List users with search & filters
router.get('/', UserController.getUsers);

// GET /api/v1/users/:id - Get user by ID
router.get('/:id', UserController.getUserById);

// PATCH /api/v1/users/:id - Update user details
router.patch('/:id', UserController.updateUser);

// PATCH /api/v1/users/:id/status - Toggle/set status
router.patch('/:id/status', UserController.updateUserStatus);

// PATCH /api/v1/users/:id/vip - Grant/revoke VIP tier
router.patch('/:id/vip', UserController.updateUserVip);

// DELETE /api/v1/users/:id - Delete user
router.delete('/:id', UserController.deleteUser);

export default router;
