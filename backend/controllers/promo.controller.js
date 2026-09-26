import { Promo } from '../models/Promo.js';
import { SubscriptionPlan } from '../models/SubscriptionPlan.js';

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/v1/promos/admin  — list all promos with stats
// ─────────────────────────────────────────────────────────────────────────────
export const getAdminPromos = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const skip  = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status.toUpperCase();

    // Auto-update expired promos before listing
    await Promo.updateMany(
      { expiryDate: { $lt: new Date() }, status: { $ne: 'EXPIRED' } },
      { $set: { status: 'EXPIRED' } }
    );

    const [promos, total] = await Promise.all([
      Promo.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Promo.countDocuments(filter)
    ]);

    // Summary stats
    const allPromos = await Promo.find({}).lean();
    const activeCount  = allPromos.filter(p => p.status === 'ACTIVE').length;
    const expiredCount = allPromos.filter(p => p.status === 'EXPIRED').length;
    const totalUses    = allPromos.reduce((sum, p) => sum + (p.currentUses || 0), 0);

    const formatted = promos.map(p => ({
      id:            p._id.toString(),
      code:          p.code,
      discountType:  p.discountType,
      discountValue: p.discountValue,
      applicablePlan: p.applicablePlan,
      maxUses:       p.maxUses,
      currentUses:   p.currentUses,
      expiryDate:    p.expiryDate,
      status:        p.status,
      description:   p.description || '',
      createdAt:     p.createdAt
    }));

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Promos fetched successfully',
      data: {
        promos: formatted,
        stats: { activeCount, expiredCount, totalUses },
        pagination: {
          page, limit, total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    });
  } catch (err) {
    console.error('[Promo] getAdminPromos error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/v1/promos/admin  — create a new promo
// ─────────────────────────────────────────────────────────────────────────────
export const createPromo = async (req, res) => {
  try {
    const {
      code, discountType, discountValue,
      applicablePlan, maxUses, expiryDate, description
    } = req.body;

    if (!code || !discountType || discountValue === undefined || !expiryDate) {
      return res.status(400).json({
        success: false,
        message: 'code, discountType, discountValue, and expiryDate are required'
      });
    }

    // Check uniqueness
    const exists = await Promo.findOne({ code: code.toUpperCase().trim() });
    if (exists) {
      return res.status(409).json({ success: false, message: `Promo code "${code.toUpperCase()}" already exists` });
    }

    const promo = await Promo.create({
      code:          code.toUpperCase().trim(),
      discountType,
      discountValue: Number(discountValue),
      applicablePlan: applicablePlan || 'ALL',
      maxUses:       Number(maxUses) || 1000,
      expiryDate:    new Date(expiryDate),
      description:   description || '',
      status:        'ACTIVE',
      currentUses:   0
    });

    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Promo created successfully',
      data: {
        id:            promo._id.toString(),
        code:          promo.code,
        discountType:  promo.discountType,
        discountValue: promo.discountValue,
        applicablePlan: promo.applicablePlan,
        maxUses:       promo.maxUses,
        currentUses:   promo.currentUses,
        expiryDate:    promo.expiryDate,
        status:        promo.status,
        description:   promo.description,
        createdAt:     promo.createdAt
      }
    });
  } catch (err) {
    console.error('[Promo] createPromo error:', err);
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Promo code already exists' });
    }
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  PATCH /api/v1/promos/admin/:id  — update a promo
// ─────────────────────────────────────────────────────────────────────────────
export const updatePromo = async (req, res) => {
  try {
    const { id } = req.params;
    const allowedFields = ['discountType', 'discountValue', 'applicablePlan', 'maxUses', 'expiryDate', 'status', 'description'];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.expiryDate) updates.expiryDate = new Date(updates.expiryDate);
    if (updates.discountValue !== undefined) updates.discountValue = Number(updates.discountValue);
    if (updates.maxUses !== undefined) updates.maxUses = Number(updates.maxUses);

    const promo = await Promo.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true });
    if (!promo) return res.status(404).json({ success: false, message: 'Promo not found' });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Promo updated successfully',
      data: {
        id: promo._id.toString(),
        code: promo.code,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        applicablePlan: promo.applicablePlan,
        maxUses: promo.maxUses,
        currentUses: promo.currentUses,
        expiryDate: promo.expiryDate,
        status: promo.status,
        description: promo.description,
        createdAt: promo.createdAt
      }
    });
  } catch (err) {
    console.error('[Promo] updatePromo error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  DELETE /api/v1/promos/admin/:id  — delete a promo
// ─────────────────────────────────────────────────────────────────────────────
export const deletePromo = async (req, res) => {
  try {
    const { id } = req.params;
    const promo = await Promo.findByIdAndDelete(id);
    if (!promo) return res.status(404).json({ success: false, message: 'Promo not found' });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: `Promo "${promo.code}" deleted successfully`
    });
  } catch (err) {
    console.error('[Promo] deletePromo error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  PATCH /api/v1/promos/admin/:id/toggle  — toggle status ACTIVE <-> PAUSED
// ─────────────────────────────────────────────────────────────────────────────
export const togglePromoStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const promo = await Promo.findById(id);
    if (!promo) return res.status(404).json({ success: false, message: 'Promo not found' });

    if (promo.status === 'EXPIRED') {
      return res.status(400).json({ success: false, message: 'Cannot toggle an expired promo' });
    }

    promo.status = promo.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    await promo.save();

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: `Promo ${promo.status === 'ACTIVE' ? 'activated' : 'paused'} successfully`,
      data: { id: promo._id.toString(), status: promo.status }
    });
  } catch (err) {
    console.error('[Promo] togglePromoStatus error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/v1/promos/validate  — mobile app validates a promo code
// ─────────────────────────────────────────────────────────────────────────────
export const validatePromoCode = async (req, res) => {
  try {
    const { code, planId } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Promo code is required' });

    const promo = await Promo.findOne({ code: code.toUpperCase().trim() });
    if (!promo) return res.status(404).json({ success: false, message: 'Invalid promo code' });

    if (promo.status === 'EXPIRED' || promo.expiryDate < new Date()) {
      return res.status(400).json({ success: false, message: 'This promo code has expired' });
    }
    if (promo.status === 'PAUSED') {
      return res.status(400).json({ success: false, message: 'This promo code is currently inactive' });
    }
    if (promo.currentUses >= promo.maxUses) {
      return res.status(400).json({ success: false, message: 'This promo code has reached its maximum usage limit' });
    }

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Promo code is valid',
      data: {
        code:          promo.code,
        discountType:  promo.discountType,
        discountValue: promo.discountValue,
        applicablePlan: promo.applicablePlan,
        expiryDate:    promo.expiryDate
      }
    });
  } catch (err) {
    console.error('[Promo] validatePromoCode error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
