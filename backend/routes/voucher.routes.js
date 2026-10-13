import { Router } from 'express';
import {
  getAdminVouchers,
  getVoucherById,
  createVoucher,
  bulkGenerateVouchers,
  updateVoucher,
  deleteVoucher,
  toggleVoucherStatus,
  validateVoucherCode,
  redeemVoucher,
  getUserVoucherHistory
} from '../controllers/voucher.controller.js';
import { verifyAdmin } from '../middlewares/adminAuth.middleware.js';

const router = Router();

// ─── Admin Routes (Protected) ──────────────────────────────────────────────────
router.get('/admin',               verifyAdmin, getAdminVouchers);
router.post('/admin',              verifyAdmin, createVoucher);
router.post('/admin/bulk-generate', verifyAdmin, bulkGenerateVouchers);
router.get('/admin/:id',           verifyAdmin, getVoucherById);
router.patch('/admin/:id',         verifyAdmin, updateVoucher);
router.delete('/admin/:id',        verifyAdmin, deleteVoucher);
router.patch('/admin/:id/toggle',  verifyAdmin, toggleVoucherStatus);


// ─── Public / Client Routes ───────────────────────────────────────────────────
router.post('/validate',           validateVoucherCode);
router.post('/redeem',             redeemVoucher);
router.get('/my-history',          getUserVoucherHistory);

export default router;
