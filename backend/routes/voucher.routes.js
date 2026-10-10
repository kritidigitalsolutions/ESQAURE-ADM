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

const router = Router();

// ─── Admin Routes ─────────────────────────────────────────────────────────────
router.get('/admin',               getAdminVouchers);
router.post('/admin',              createVoucher);
router.post('/admin/bulk-generate', bulkGenerateVouchers);
router.get('/admin/:id',           getVoucherById);
router.patch('/admin/:id',         updateVoucher);
router.delete('/admin/:id',        deleteVoucher);
router.patch('/admin/:id/toggle',  toggleVoucherStatus);

// ─── Public / Client Routes ───────────────────────────────────────────────────
router.post('/validate',           validateVoucherCode);
router.post('/redeem',             redeemVoucher);
router.get('/my-history',          getUserVoucherHistory);

export default router;
