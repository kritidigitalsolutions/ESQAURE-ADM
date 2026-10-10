import { Promo } from '../models/Promo.js';
import { SubscriptionPlan } from '../models/SubscriptionPlan.js';

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/v1/promos/admin  — list all promos with search, filter & stats
// ─────────────────────────────────────────────────────────────────────────────
export const getAdminPromos = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const skip  = (page - 1) * limit;

    const filter = {};
    if (req.query.status && req.query.status.toUpperCase() !== 'ALL') {
      filter.status = req.query.status.toUpperCase();
    }

    if (req.query.search) {
      const q = req.query.search.trim();
      filter.$or = [
        { code: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { applicablePlan: { $regex: q, $options: 'i' } }
      ];
    }

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
    const pausedCount  = allPromos.filter(p => p.status === 'PAUSED').length;
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
        stats: {
          activeCount,
          pausedCount,
          expiredCount,
          totalUses,
          totalPromos: allPromos.length
        },
        pagination: {
          page,
          limit,
          total,
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
//  GET /api/v1/promos/admin/:id  — get single promo by ID or code
// ─────────────────────────────────────────────────────────────────────────────
export const getPromoById = async (req, res) => {
  try {
    const { id } = req.params;
    let promo = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      promo = await Promo.findById(id).lean();
    }
    if (!promo) {
      promo = await Promo.findOne({ code: id.toUpperCase().trim() }).lean();
    }

    if (!promo) {
      return res.status(404).json({ success: false, message: 'Promo code not found' });
    }

    // Auto-update expired
    if (new Date(promo.expiryDate) < new Date() && promo.status !== 'EXPIRED') {
      await Promo.findByIdAndUpdate(promo._id, { $set: { status: 'EXPIRED' } });
      promo.status = 'EXPIRED';
    }

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Promo details fetched successfully',
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
        description:   promo.description || '',
        createdAt:     promo.createdAt
      }
    });
  } catch (err) {
    console.error('[Promo] getPromoById error:', err);
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

    const cleanCode = code.toUpperCase().trim();

    // Check uniqueness
    const exists = await Promo.findOne({ code: cleanCode });
    if (exists) {
      return res.status(409).json({ success: false, message: `Promo code "${cleanCode}" already exists` });
    }

    const promo = await Promo.create({
      code:          cleanCode,
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
//  POST /api/v1/promos/admin/bulk-generate  — batch generate promo codes
// ─────────────────────────────────────────────────────────────────────────────
export const bulkGeneratePromos = async (req, res) => {
  try {
    const {
      prefix = 'PROMO',
      count = 5,
      discountType = 'PERCENTAGE',
      discountValue = 20,
      applicablePlan = 'ALL',
      maxUses = 100,
      expiryDate,
      description = ''
    } = req.body;

    if (!expiryDate) {
      return res.status(400).json({ success: false, message: 'expiryDate is required' });
    }

    const qty = Math.min(100, Math.max(1, Number(count) || 5));
    const createdPromos = [];
    const cleanPrefix = prefix.toUpperCase().replace(/[^A-Z0-9]/g, '');

    for (let i = 0; i < qty; i++) {
      const randStr = Math.random().toString(36).substring(2, 6).toUpperCase();
      const code = `${cleanPrefix}-${randStr}`;

      const exists = await Promo.findOne({ code });
      if (!exists) {
        const promo = await Promo.create({
          code,
          discountType,
          discountValue: Number(discountValue),
          applicablePlan: applicablePlan || 'ALL',
          maxUses: Number(maxUses) || 100,
          expiryDate: new Date(expiryDate),
          description: description || `Bulk generated under ${cleanPrefix}`,
          status: 'ACTIVE',
          currentUses: 0
        });
        createdPromos.push({
          id: promo._id.toString(),
          code: promo.code,
          discountType: promo.discountType,
          discountValue: promo.discountValue,
          applicablePlan: promo.applicablePlan,
          maxUses: promo.maxUses,
          expiryDate: promo.expiryDate,
          status: promo.status
        });
      }
    }

    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: `Successfully generated ${createdPromos.length} promo codes`,
      data: {
        totalGenerated: createdPromos.length,
        promos: createdPromos
      }
    });
  } catch (err) {
    console.error('[Promo] bulkGeneratePromos error:', err);
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
//  POST /api/v1/promos/validate  — mobile app / client validates promo code
// ─────────────────────────────────────────────────────────────────────────────
export const validatePromoCode = async (req, res) => {
  try {
    const { code, planId, planCode } = req.body;
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

    // Optional plan verification & price calculation
    let planData = null;
    const targetPlanRef = planId || planCode;

    if (targetPlanRef) {
      let dbPlan = null;
      if (typeof targetPlanRef === 'string' && targetPlanRef.match(/^[0-9a-fA-F]{24}$/)) {
        dbPlan = await SubscriptionPlan.findById(targetPlanRef);
      }
      if (!dbPlan) {
        dbPlan = await SubscriptionPlan.findOne({ code: String(targetPlanRef).toUpperCase().trim() });
      }

      if (dbPlan) {
        // Check applicablePlan restriction
        if (promo.applicablePlan !== 'ALL' &&
            promo.applicablePlan !== dbPlan.code &&
            promo.applicablePlan !== dbPlan._id.toString()) {
          return res.status(400).json({
            success: false,
            message: `This promo code is not applicable to the ${dbPlan.name} plan.`
          });
        }

        const originalPrice = dbPlan.price;
        let discountAmount = 0;
        let extraDays = 0;

        if (promo.discountType === 'PERCENTAGE') {
          discountAmount = Math.round((originalPrice * promo.discountValue) / 100);
        } else if (promo.discountType === 'FLAT') {
          discountAmount = Math.min(originalPrice, promo.discountValue);
        } else if (promo.discountType === 'FREE_DAYS') {
          extraDays = promo.discountValue;
        }

        const finalPrice = Math.max(0, originalPrice - discountAmount);

        planData = {
          planId: dbPlan._id.toString(),
          planName: dbPlan.name,
          planCode: dbPlan.code,
          originalPrice,
          discountAmount,
          finalPrice,
          extraDays
        };
      }
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
        expiryDate:    promo.expiryDate,
        description:   promo.description || '',
        pricing:       planData
      }
    });
  } catch (err) {
    console.error('[Promo] validatePromoCode error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/v1/promos/apply  — apply promo code and calculate checkout pricing
// ─────────────────────────────────────────────────────────────────────────────
export const applyPromoCode = async (req, res) => {
  return validatePromoCode(req, res);
};
