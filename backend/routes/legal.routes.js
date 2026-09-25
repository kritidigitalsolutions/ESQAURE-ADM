import { Router } from 'express';
import { LegalController } from '../controllers/legal.controller.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
//  ADMIN PANEL ROUTES  (/api/v1/legal/admin/...)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/legal/admin/all
 * Retrieve all legal documents (active + inactive) for Admin Legal & Compliance management
 */
router.get('/admin/all', LegalController.adminGetAllLegalDocs);

/**
 * PUT /api/v1/legal/admin/compliance
 * Update statutory Grievance Redressal Officer & age-classification maturity metadata
 * Body: { name, designation, email, address, sla, certifiedMaturityTags }
 */
router.put('/admin/compliance', LegalController.updateComplianceOfficer);

/**
 * PUT /api/v1/legal/admin/:slug
 * Create or update full legal document text, version, and details
 * Body: { title, content, summary, version, effectiveDate, isActive, metadata }
 */
router.put('/admin/:slug', LegalController.upsertLegalDoc);

/**
 * PATCH /api/v1/legal/admin/:slug/toggle
 * Toggle active/inactive status of a legal document
 */
router.patch('/admin/:slug/toggle', LegalController.toggleLegalDocStatus);

/**
 * POST /api/v1/legal/admin/seed
 * Seed or reset default legal policies (Terms, Privacy, Refund, Compliance)
 * Body: { "force": false }
 */
router.post('/admin/seed', LegalController.seedLegalDocs);

// ─────────────────────────────────────────────────────────────────────────────
//  PUBLIC / MOBILE CLIENT ROUTES  (/api/v1/legal/...)
//  Used by Mobile App Profile screen: Privacy Policy, Terms & Conditions, etc.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/legal
 * Returns summary and dictionary of all active legal documents.
 * Query: ?includeContent=true (optional)
 */
router.get('/', LegalController.getAllLegalDocs);

/**
 * GET /api/v1/legal/compliance/grievance
 * Returns statutory Grievance Redressal Officer details under Indian IT Rules 2021
 */
router.get('/compliance/grievance', LegalController.getComplianceOfficer);

/**
 * GET /api/v1/legal/:slug
 * Retrieve full text and details for a specific legal document by slug or alias.
 * Examples:
 *   /api/v1/legal/privacy-policy  or  /api/v1/legal/privacy
 *   /api/v1/legal/terms-and-conditions  or  /api/v1/legal/terms
 *   /api/v1/legal/refund-policy  or  /api/v1/legal/refund
 *   /api/v1/legal/grievance-compliance  or  /api/v1/legal/compliance
 */
router.get('/:slug', LegalController.getLegalDocBySlug);

export default router;
