import { Router } from 'express';
import {
  getAdminPromos,
  getPromoById,
  createPromo,
  bulkGeneratePromos,
  updatePromo,
  deletePromo,
  togglePromoStatus,
  validatePromoCode,
  applyPromoCode
} from '../controllers/promo.controller.js';
import { verifyAdmin } from '../middlewares/adminAuth.middleware.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
//  ADMIN PANEL ROUTES (Protected)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/admin',               verifyAdmin, getAdminPromos);
router.post('/admin',              verifyAdmin, createPromo);
router.post('/admin/bulk-generate', verifyAdmin, bulkGeneratePromos);
router.get('/admin/:id',           verifyAdmin, getPromoById);
router.patch('/admin/:id',         verifyAdmin, updatePromo);
router.delete('/admin/:id',        verifyAdmin, deletePromo);
router.patch('/admin/:id/toggle',  verifyAdmin, togglePromoStatus);


// ─────────────────────────────────────────────────────────────────────────────
//  CLIENT / MOBILE APP ROUTES
// ─────────────────────────────────────────────────────────────────────────────
router.post('/validate',           validatePromoCode);
router.post('/apply',              applyPromoCode);

export default router;
