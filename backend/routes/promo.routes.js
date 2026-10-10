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

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
//  ADMIN PANEL ROUTES
// ─────────────────────────────────────────────────────────────────────────────
router.get('/admin',               getAdminPromos);
router.post('/admin',              createPromo);
router.post('/admin/bulk-generate', bulkGeneratePromos);
router.get('/admin/:id',           getPromoById);
router.patch('/admin/:id',         updatePromo);
router.delete('/admin/:id',        deletePromo);
router.patch('/admin/:id/toggle',  togglePromoStatus);

// ─────────────────────────────────────────────────────────────────────────────
//  CLIENT / MOBILE APP ROUTES
// ─────────────────────────────────────────────────────────────────────────────
router.post('/validate',           validatePromoCode);
router.post('/apply',              applyPromoCode);

export default router;
