import { Router } from 'express';
import {
  getAdminPromos,
  createPromo,
  updatePromo,
  deletePromo,
  togglePromoStatus,
  validatePromoCode
} from '../controllers/promo.controller.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
//  ADMIN PANEL
// ─────────────────────────────────────────────────────────────────────────────
router.get('/admin',               getAdminPromos);
router.post('/admin',              createPromo);
router.patch('/admin/:id',         updatePromo);
router.delete('/admin/:id',        deletePromo);
router.patch('/admin/:id/toggle',  togglePromoStatus);

// ─────────────────────────────────────────────────────────────────────────────
//  MOBILE APP
// ─────────────────────────────────────────────────────────────────────────────
router.post('/validate',  validatePromoCode);

export default router;
