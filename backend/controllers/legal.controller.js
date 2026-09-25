import { LegalDoc } from '../models/LegalDoc.js';
import { INITIAL_LEGAL_DOCS, seedDefaultLegalDocs } from '../config/seedLegalDocs.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

export class LegalController {
  /**
   * Ensure default legal documents exist in DB if empty
   */
  static async ensureDefaultDocs() {
    const count = await LegalDoc.countDocuments();
    if (count === 0) {
      await seedDefaultLegalDocs();
    }
  }

  /**
   * GET /api/v1/legal
   * Public endpoint for Mobile App and Web clients.
   * Lists all active legal policies (Privacy Policy, Terms, Refund, Compliance).
   * Optional query ?includeContent=true to return full text.
   */
  static async getAllLegalDocs(req, res, next) {
    try {
      await LegalController.ensureDefaultDocs();

      const { includeContent = 'false' } = req.query;
      const shouldInclude = includeContent === 'true' || includeContent === '1';

      const projection = shouldInclude
        ? 'slug title content summary version effectiveDate lastUpdated metadata isActive'
        : 'slug title summary version effectiveDate lastUpdated metadata isActive';

      const docs = await LegalDoc.find({ isActive: true })
        .select(projection)
        .sort({ createdAt: 1 })
        .lean();

      // Also create a convenient keyed map for direct client lookups
      const docsMap = {};
      docs.forEach((doc) => {
        docsMap[doc.slug] = doc;
      });

      return ApiResponse.success(res, 'Legal documents retrieved successfully', {
        documents: docs,
        bySlug: docsMap,
        total: docs.length
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * GET /api/v1/legal/:slug
   * Public endpoint for Mobile App Profile menu items (Privacy Policy, Terms & Conditions, etc.).
   * Supports normalized aliases: 'privacy', 'terms', 'refund', 'compliance', 'grievance'.
   */
  static async getLegalDocBySlug(req, res, next) {
    try {
      await LegalController.ensureDefaultDocs();

      const { slug } = req.params;
      const normalizedSlug = LegalDoc.normalizeSlug(slug);

      let doc = await LegalDoc.findOne({
        slug: normalizedSlug,
        isActive: true
      }).lean();

      if (!doc) {
        return next(
          new AppError(
            `Legal document with slug '${slug}' not found or inactive.`,
            404,
            ERROR_CODES.LEGAL_DOC_NOT_FOUND
          )
        );
      }

      return ApiResponse.success(res, `${doc.title} retrieved successfully`, doc);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * GET /api/v1/legal/compliance/grievance
   * Public endpoint for statutory Grievance Redressal Officer under Indian IT Rules 2021
   */
  static async getComplianceOfficer(req, res, next) {
    try {
      await LegalController.ensureDefaultDocs();

      const doc = await LegalDoc.findOne({ slug: 'grievance-compliance' }).lean();

      if (!doc) {
        return next(
          new AppError(
            'Grievance compliance information is currently unavailable.',
            404,
            ERROR_CODES.LEGAL_DOC_NOT_FOUND
          )
        );
      }

      return ApiResponse.success(res, 'Statutory grievance officer details retrieved', {
        title: doc.title,
        officer: doc.metadata || {},
        summary: doc.summary,
        lastUpdated: doc.lastUpdated
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * GET /api/v1/legal/admin/all
   * Admin Panel endpoint: Returns all legal documents with full text and status
   */
  static async adminGetAllLegalDocs(req, res, next) {
    try {
      await LegalController.ensureDefaultDocs();

      const docs = await LegalDoc.find()
        .sort({ createdAt: 1 })
        .lean();

      // Return both array and keyed object for easy admin form population
      const bySlug = {};
      docs.forEach((doc) => {
        bySlug[doc.slug] = doc;
      });

      return ApiResponse.success(res, 'All legal documents retrieved for admin management', {
        documents: docs,
        bySlug,
        total: docs.length
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * PUT /api/v1/legal/admin/:slug
   * Admin Panel endpoint: Upsert / update a specific legal document
   */
  static async upsertLegalDoc(req, res, next) {
    try {
      const { slug } = req.params;
      const normalizedSlug = LegalDoc.normalizeSlug(slug);

      const {
        title,
        content,
        summary,
        version,
        effectiveDate,
        isActive,
        metadata,
        updatedBy = 'Admin'
      } = req.body;

      const updateData = {
        lastUpdated: new Date(),
        updatedBy
      };

      if (title !== undefined) updateData.title = title.trim();
      if (content !== undefined) updateData.content = content;
      if (summary !== undefined) updateData.summary = summary.trim();
      if (version !== undefined) updateData.version = version.trim();
      if (effectiveDate !== undefined) updateData.effectiveDate = new Date(effectiveDate);
      if (isActive !== undefined) updateData.isActive = Boolean(isActive);
      if (metadata !== undefined) updateData.metadata = metadata;

      const setOnInsert = { slug: normalizedSlug };
      if (title === undefined) setOnInsert.title = normalizedSlug.replace(/-/g, ' ').toUpperCase();
      if (content === undefined) setOnInsert.content = '';

      const doc = await LegalDoc.findOneAndUpdate(
        { slug: normalizedSlug },
        {
          $set: updateData,
          $setOnInsert: setOnInsert
        },
        { upsert: true, new: true, runValidators: true }
      );

      return ApiResponse.success(res, `${doc.title} updated successfully`, doc);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * PUT /api/v1/legal/admin/compliance
   * Admin Panel endpoint: Update Statutory Grievance Redressal Officer & Maturity tags
   */
  static async updateComplianceOfficer(req, res, next) {
    try {
      const {
        name,
        designation,
        email,
        address,
        sla,
        certifiedMaturityTags
      } = req.body;

      const metadataUpdate = {};
      if (name !== undefined) metadataUpdate['metadata.officerName'] = name;
      if (designation !== undefined) metadataUpdate['metadata.designation'] = designation;
      if (email !== undefined) metadataUpdate['metadata.email'] = email;
      if (address !== undefined) metadataUpdate['metadata.address'] = address;
      if (sla !== undefined) metadataUpdate['metadata.sla'] = sla;
      if (certifiedMaturityTags !== undefined) {
        metadataUpdate['metadata.certifiedMaturityTags'] = certifiedMaturityTags;
      }

      metadataUpdate.lastUpdated = new Date();
      metadataUpdate.updatedBy = 'Compliance Officer / Admin';

      const doc = await LegalDoc.findOneAndUpdate(
        { slug: 'grievance-compliance' },
        { $set: metadataUpdate },
        { new: true, upsert: true }
      );

      return ApiResponse.success(
        res,
        'Statutory grievance officer and compliance settings updated',
        doc
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * PATCH /api/v1/legal/admin/:slug/toggle
   * Admin Panel endpoint: Toggle active status of a legal document
   */
  static async toggleLegalDocStatus(req, res, next) {
    try {
      const { slug } = req.params;
      const normalizedSlug = LegalDoc.normalizeSlug(slug);

      const doc = await LegalDoc.findOne({ slug: normalizedSlug });
      if (!doc) {
        return next(
          new AppError(
            `Legal document '${slug}' not found`,
            404,
            ERROR_CODES.LEGAL_DOC_NOT_FOUND
          )
        );
      }

      doc.isActive = !doc.isActive;
      doc.lastUpdated = new Date();
      await doc.save();

      return ApiResponse.success(
        res,
        `Document '${doc.title}' is now ${doc.isActive ? 'Active' : 'Inactive'}`,
        { slug: doc.slug, isActive: doc.isActive }
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * POST /api/v1/legal/admin/seed
   * Admin / Dev endpoint: Re-seed default legal documents
   */
  static async seedLegalDocs(req, res, next) {
    try {
      const { force = false } = req.body;

      if (force) {
        for (const doc of INITIAL_LEGAL_DOCS) {
          await LegalDoc.findOneAndUpdate(
            { slug: doc.slug },
            { $set: doc },
            { upsert: true, new: true }
          );
        }
      } else {
        await seedDefaultLegalDocs();
      }

      const allDocs = await LegalDoc.find().sort({ createdAt: 1 }).lean();

      return ApiResponse.success(
        res,
        'Default OTT legal documents seeded successfully',
        { documents: allDocs, total: allDocs.length }
      );
    } catch (error) {
      return next(error);
    }
  }
}
