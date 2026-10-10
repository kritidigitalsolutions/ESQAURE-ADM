import { Voucher } from '../models/Voucher.js';
import { SubscriptionPlan } from '../models/SubscriptionPlan.js';
import { Subscription } from '../models/Subscription.js';
import { User } from '../models/User.js';

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/v1/vouchers/admin  — list all plan vouchers with stats
// ─────────────────────────────────────────────────────────────────────────────
export const getAdminVouchers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status && req.query.status.toUpperCase() !== 'ALL') {
      filter.status = req.query.status.toUpperCase();
    }
    if (req.query.search) {
      const q = req.query.search.trim();
      filter.$or = [
        { code: { $regex: q, $options: 'i' } },
        { planName: { $regex: q, $options: 'i' } },
        { campaignName: { $regex: q, $options: 'i' } },
        { notes: { $regex: q, $options: 'i' } }
      ];
    }

    // Auto-expire vouchers past their expiry date
    await Voucher.updateMany(
      { expiryDate: { $lt: new Date() }, status: { $ne: 'EXPIRED' } },
      { $set: { status: 'EXPIRED' } }
    );

    // Auto-mark exhausted vouchers
    await Voucher.updateMany(
      { $expr: { $gte: ['$currentUses', '$maxUses'] }, status: 'ACTIVE' },
      { $set: { status: 'EXHAUSTED' } }
    );

    const [vouchers, total] = await Promise.all([
      Voucher.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Voucher.countDocuments(filter)
    ]);

    // Summary stats
    const allVouchers = await Voucher.find({}).lean();
    const activeCount = allVouchers.filter((v) => v.status === 'ACTIVE').length;
    const pausedCount = allVouchers.filter((v) => v.status === 'PAUSED').length;
    const expiredCount = allVouchers.filter((v) => v.status === 'EXPIRED').length;
    const exhaustedCount = allVouchers.filter((v) => v.status === 'EXHAUSTED').length;
    const totalGrantedPlans = allVouchers.reduce((sum, v) => sum + (v.currentUses || 0), 0);

    const formatted = vouchers.map((v) => ({
      id: v._id.toString(),
      code: v.code,
      planCode: v.planCode,
      planName: v.planName,
      durationDays: v.durationDays,
      voucherType: v.voucherType,
      maxUses: v.maxUses,
      currentUses: v.currentUses,
      usedBy: v.usedBy || [],
      expiryDate: v.expiryDate,
      status: v.status,
      campaignName: v.campaignName || '',
      notes: v.notes || '',
      createdAt: v.createdAt
    }));

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Plan vouchers fetched successfully',
      data: {
        vouchers: formatted,
        stats: {
          activeCount,
          pausedCount,
          expiredCount,
          exhaustedCount,
          totalGrantedPlans,
          totalVouchers: allVouchers.length
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
    console.error('[Voucher] getAdminVouchers error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/v1/vouchers/admin/:id  — get single voucher by ID with claim history
// ─────────────────────────────────────────────────────────────────────────────
export const getVoucherById = async (req, res) => {
  try {
    const { id } = req.params;
    let voucher = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      voucher = await Voucher.findById(id).lean();
    }
    if (!voucher) {
      voucher = await Voucher.findOne({ code: id.toUpperCase().trim() }).lean();
    }

    if (!voucher) {
      return res.status(404).json({ success: false, message: 'Voucher not found' });
    }

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Voucher fetched successfully',
      data: {
        id: voucher._id.toString(),
        code: voucher.code,
        planCode: voucher.planCode,
        planName: voucher.planName,
        durationDays: voucher.durationDays,
        voucherType: voucher.voucherType,
        maxUses: voucher.maxUses,
        currentUses: voucher.currentUses,
        usedBy: voucher.usedBy || [],
        expiryDate: voucher.expiryDate,
        status: voucher.status,
        campaignName: voucher.campaignName || '',
        notes: voucher.notes || '',
        createdAt: voucher.createdAt
      }
    });
  } catch (err) {
    console.error('[Voucher] getVoucherById error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/v1/vouchers/admin  — create a new plan voucher
// ─────────────────────────────────────────────────────────────────────────────
export const createVoucher = async (req, res) => {
  try {
    const {
      code,
      planCode,
      planName,
      durationDays,
      voucherType,
      maxUses,
      expiryDate,
      campaignName,
      notes
    } = req.body;

    if (!code || !expiryDate) {
      return res.status(400).json({
        success: false,
        message: 'Voucher code and expiry date are required.'
      });
    }

    const cleanCode = code.toUpperCase().trim();

    // Check code uniqueness
    const exists = await Voucher.findOne({ code: cleanCode });
    if (exists) {
      return res.status(409).json({
        success: false,
        message: `Voucher code "${cleanCode}" already exists.`
      });
    }

    // Resolve plan information
    let resolvedPlanName = planName;
    let resolvedDurationDays = durationDays ? Number(durationDays) : null;
    const resolvedPlanCode = planCode ? planCode.toUpperCase().trim() : 'PLAN_1M';

    if (!resolvedPlanName || !resolvedDurationDays) {
      const dbPlan = await SubscriptionPlan.findOne({ code: resolvedPlanCode });
      if (dbPlan) {
        resolvedPlanName = resolvedPlanName || dbPlan.name;
        resolvedDurationDays = resolvedDurationDays || dbPlan.durationDays;
      } else {
        resolvedPlanName = resolvedPlanName || (resolvedPlanCode === 'PLAN_12M' ? '12 Month Annual Pass' : resolvedPlanCode === 'PLAN_6M' ? '6 Month Pass' : '1 Month Pass');
        resolvedDurationDays = resolvedDurationDays || (resolvedPlanCode === 'PLAN_12M' ? 365 : resolvedPlanCode === 'PLAN_6M' ? 180 : 30);
      }
    }

    const type = voucherType === 'MULTI_USE' ? 'MULTI_USE' : 'SINGLE_USE';
    const quota = type === 'SINGLE_USE' ? 1 : Math.max(1, Number(maxUses) || 1);

    const voucher = await Voucher.create({
      code: cleanCode,
      planCode: resolvedPlanCode,
      planName: resolvedPlanName,
      durationDays: resolvedDurationDays,
      voucherType: type,
      maxUses: quota,
      expiryDate: new Date(expiryDate),
      campaignName: campaignName ? campaignName.trim() : '',
      notes: notes ? notes.trim() : '',
      status: 'ACTIVE',
      currentUses: 0,
      usedBy: []
    });

    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Plan voucher created successfully',
      data: {
        id: voucher._id.toString(),
        code: voucher.code,
        planCode: voucher.planCode,
        planName: voucher.planName,
        durationDays: voucher.durationDays,
        voucherType: voucher.voucherType,
        maxUses: voucher.maxUses,
        currentUses: voucher.currentUses,
        expiryDate: voucher.expiryDate,
        status: voucher.status,
        campaignName: voucher.campaignName,
        notes: voucher.notes,
        createdAt: voucher.createdAt
      }
    });
  } catch (err) {
    console.error('[Voucher] createVoucher error:', err);
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Voucher code already exists' });
    }
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/v1/vouchers/admin/bulk-generate  — batch generate plan vouchers
// ─────────────────────────────────────────────────────────────────────────────
export const bulkGenerateVouchers = async (req, res) => {
  try {
    const {
      prefix = 'VIP',
      count = 5,
      planCode = 'PLAN_1M',
      planName,
      durationDays,
      voucherType = 'SINGLE_USE',
      maxUses = 1,
      expiryDate,
      campaignName = '',
      notes = ''
    } = req.body;

    if (!expiryDate) {
      return res.status(400).json({ success: false, message: 'expiryDate is required' });
    }

    const qty = Math.min(100, Math.max(1, Number(count) || 5));
    const cleanPrefix = prefix.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const cleanPlanCode = planCode.toUpperCase().trim();

    // Resolve plan
    let resolvedPlanName = planName;
    let resolvedDurationDays = durationDays ? Number(durationDays) : null;
    if (!resolvedPlanName || !resolvedDurationDays) {
      const dbPlan = await SubscriptionPlan.findOne({ code: cleanPlanCode });
      if (dbPlan) {
        resolvedPlanName = resolvedPlanName || dbPlan.name;
        resolvedDurationDays = resolvedDurationDays || dbPlan.durationDays;
      } else {
        resolvedPlanName = resolvedPlanName || (cleanPlanCode === 'PLAN_12M' ? '12 Month Annual Pass' : cleanPlanCode === 'PLAN_6M' ? '6 Month Pass' : '1 Month Pass');
        resolvedDurationDays = resolvedDurationDays || (cleanPlanCode === 'PLAN_12M' ? 365 : cleanPlanCode === 'PLAN_6M' ? 180 : 30);
      }
    }

    const type = voucherType === 'MULTI_USE' ? 'MULTI_USE' : 'SINGLE_USE';
    const quota = type === 'SINGLE_USE' ? 1 : Math.max(1, Number(maxUses) || 1);

    const createdVouchers = [];

    for (let i = 0; i < qty; i++) {
      const randStr = Math.random().toString(36).substring(2, 6).toUpperCase();
      const code = `${cleanPrefix}-${randStr}`;

      const exists = await Voucher.findOne({ code });
      if (!exists) {
        const voucher = await Voucher.create({
          code,
          planCode: cleanPlanCode,
          planName: resolvedPlanName,
          durationDays: resolvedDurationDays,
          voucherType: type,
          maxUses: quota,
          expiryDate: new Date(expiryDate),
          campaignName: campaignName.trim(),
          notes: notes.trim(),
          status: 'ACTIVE',
          currentUses: 0,
          usedBy: []
        });

        createdVouchers.push({
          id: voucher._id.toString(),
          code: voucher.code,
          planCode: voucher.planCode,
          planName: voucher.planName,
          durationDays: voucher.durationDays,
          voucherType: voucher.voucherType,
          maxUses: voucher.maxUses,
          expiryDate: voucher.expiryDate,
          status: voucher.status
        });
      }
    }

    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: `Successfully generated ${createdVouchers.length} plan vouchers`,
      data: {
        totalGenerated: createdVouchers.length,
        vouchers: createdVouchers
      }
    });
  } catch (err) {
    console.error('[Voucher] bulkGenerateVouchers error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  PATCH /api/v1/vouchers/admin/:id  — update a plan voucher
// ─────────────────────────────────────────────────────────────────────────────
export const updateVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    const allowedFields = [
      'planCode',
      'planName',
      'durationDays',
      'voucherType',
      'maxUses',
      'expiryDate',
      'status',
      'campaignName',
      'notes'
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.expiryDate) updates.expiryDate = new Date(updates.expiryDate);
    if (updates.durationDays !== undefined) updates.durationDays = Number(updates.durationDays);
    if (updates.maxUses !== undefined) updates.maxUses = Number(updates.maxUses);
    if (updates.planCode) updates.planCode = updates.planCode.toUpperCase().trim();

    const voucher = await Voucher.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true });
    if (!voucher) return res.status(404).json({ success: false, message: 'Voucher not found' });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Plan voucher updated successfully',
      data: {
        id: voucher._id.toString(),
        code: voucher.code,
        planCode: voucher.planCode,
        planName: voucher.planName,
        durationDays: voucher.durationDays,
        voucherType: voucher.voucherType,
        maxUses: voucher.maxUses,
        currentUses: voucher.currentUses,
        expiryDate: voucher.expiryDate,
        status: voucher.status,
        campaignName: voucher.campaignName,
        notes: voucher.notes,
        createdAt: voucher.createdAt
      }
    });
  } catch (err) {
    console.error('[Voucher] updateVoucher error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  DELETE /api/v1/vouchers/admin/:id  — delete a plan voucher
// ─────────────────────────────────────────────────────────────────────────────
export const deleteVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    const voucher = await Voucher.findByIdAndDelete(id);
    if (!voucher) return res.status(404).json({ success: false, message: 'Voucher not found' });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: `Voucher "${voucher.code}" deleted successfully`
    });
  } catch (err) {
    console.error('[Voucher] deleteVoucher error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  PATCH /api/v1/vouchers/admin/:id/toggle  — toggle status ACTIVE <-> PAUSED
// ─────────────────────────────────────────────────────────────────────────────
export const toggleVoucherStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const voucher = await Voucher.findById(id);
    if (!voucher) return res.status(404).json({ success: false, message: 'Voucher not found' });

    if (voucher.status === 'EXPIRED') {
      return res.status(400).json({ success: false, message: 'Cannot toggle an expired voucher' });
    }
    if (voucher.status === 'EXHAUSTED') {
      return res.status(400).json({ success: false, message: 'Cannot toggle a fully redeemed voucher' });
    }

    voucher.status = voucher.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    await voucher.save();

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: `Voucher ${voucher.status === 'ACTIVE' ? 'activated' : 'paused'} successfully`,
      data: { id: voucher._id.toString(), status: voucher.status }
    });
  } catch (err) {
    console.error('[Voucher] toggleVoucherStatus error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/v1/vouchers/validate  — validate voucher code & view granted plan
// ─────────────────────────────────────────────────────────────────────────────
export const validateVoucherCode = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Voucher code is required' });

    const cleanCode = code.toUpperCase().trim();
    const voucher = await Voucher.findOne({ code: cleanCode });
    if (!voucher) return res.status(404).json({ success: false, message: 'Invalid voucher code' });

    if (voucher.status === 'EXPIRED' || voucher.expiryDate < new Date()) {
      return res.status(400).json({ success: false, message: 'This voucher has expired' });
    }
    if (voucher.status === 'PAUSED') {
      return res.status(400).json({ success: false, message: 'This voucher is currently inactive' });
    }
    if (voucher.currentUses >= voucher.maxUses || voucher.status === 'EXHAUSTED') {
      return res.status(400).json({ success: false, message: 'This voucher has already been fully redeemed' });
    }

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Voucher is valid',
      data: {
        code: voucher.code,
        planCode: voucher.planCode,
        planName: voucher.planName,
        durationDays: voucher.durationDays,
        expiryDate: voucher.expiryDate,
        voucherType: voucher.voucherType,
        campaignName: voucher.campaignName
      }
    });
  } catch (err) {
    console.error('[Voucher] validateVoucherCode error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/v1/vouchers/redeem  — redeem voucher & grant complete plan to user
// ─────────────────────────────────────────────────────────────────────────────
export const redeemVoucher = async (req, res) => {
  try {
    const { code, userId, phoneNumber } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Voucher code is required' });

    const cleanCode = code.toUpperCase().trim();
    const voucher = await Voucher.findOne({ code: cleanCode });
    if (!voucher) return res.status(404).json({ success: false, message: 'Invalid voucher code' });

    if (voucher.status === 'EXPIRED' || voucher.expiryDate < new Date()) {
      return res.status(400).json({ success: false, message: 'This voucher has expired' });
    }
    if (voucher.status === 'PAUSED') {
      return res.status(400).json({ success: false, message: 'This voucher is currently paused' });
    }
    if (voucher.currentUses >= voucher.maxUses || voucher.status === 'EXHAUSTED') {
      return res.status(400).json({ success: false, message: 'This voucher has already been redeemed maximum times' });
    }

    // Resolve user
    let user = null;
    const authUserId = req.userId;
    if (authUserId) {
      user = await User.findById(authUserId);
    }
    if (!user && userId) {
      user = await User.findById(userId);
    }
    if (!user && phoneNumber) {
      const trimmed = phoneNumber.trim();
      const digitsOnly = trimmed.replace(/\D/g, '');
      const last10 = digitsOnly.slice(-10);
      user = await User.findOne({
        $or: [
          { phoneNumber: trimmed },
          { phoneNumber: digitsOnly },
          { phoneNumber: last10 },
          { phoneNumber: `+91${last10}` },
          { email: trimmed.toLowerCase() }
        ]
      });
    }

    if (user) {
      // Check if user already redeemed this voucher
      const alreadyUsed = voucher.usedBy.some((u) => u.userId?.toString() === user._id.toString());
      if (alreadyUsed) {
        return res.status(400).json({
          success: false,
          message: 'You have already redeemed this voucher code.'
        });
      }

      // Calculate new expiry date (extend if user already has VIP, or set from now)
      const now = new Date();
      let startFrom = now;
      if (user.isVip && user.vipExpiresAt && new Date(user.vipExpiresAt) > now) {
        startFrom = new Date(user.vipExpiresAt);
      }
      const expiry = new Date(startFrom.getTime() + Number(voucher.durationDays || 30) * 24 * 60 * 60 * 1000);

      user.isVip = true;
      user.vipExpiresAt = expiry;
      user.plan = voucher.planName;
      user.voucherCode = voucher.code;

      // Also create/update Subscription instance for complete consistency across API layers
      let planDoc = await SubscriptionPlan.findOne({ code: voucher.planCode });
      if (!planDoc) {
        planDoc = await SubscriptionPlan.findOne({ status: 'ACTIVE' });
      }

      if (planDoc) {
        const sub = await Subscription.create({
          userId: user._id,
          planId: planDoc._id,
          planCode: voucher.planCode || planDoc.code,
          status: 'ACTIVE',
          isTrial: false,
          startDate: now,
          currentPeriodStart: now,
          currentPeriodEnd: expiry,
          autoRenew: false,
          paymentGateway: 'RAZORPAY'
        });
        user.currentSubscriptionId = sub._id;
      }

      await user.save();

      // Record in voucher
      voucher.usedBy.push({
        userId: user._id,
        userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || `User #${user.phoneNumber?.slice(-4) || 'VIP'}`,
        userPhone: user.phoneNumber || '',
        redeemedAt: new Date()
      });
    }

    voucher.currentUses = (voucher.currentUses || 0) + 1;
    if (voucher.currentUses >= voucher.maxUses) {
      voucher.status = 'EXHAUSTED';
    }
    await voucher.save();

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: `Congratulations! ${voucher.planName} has been activated successfully!`,
      data: {
        code: voucher.code,
        planName: voucher.planName,
        durationDays: voucher.durationDays,
        userActivated: Boolean(user),
        currentUses: voucher.currentUses,
        maxUses: voucher.maxUses
      }
    });
  } catch (err) {
    console.error('[Voucher] redeemVoucher error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/v1/vouchers/my-history  — list vouchers redeemed by authenticated user
// ─────────────────────────────────────────────────────────────────────────────
export const getUserVoucherHistory = async (req, res) => {
  try {
    const userId = req.userId || req.query.userId;
    const phone = req.query.phoneNumber;

    if (!userId && !phone) {
      return res.status(400).json({ success: false, message: 'User ID or phoneNumber is required' });
    }

    const query = {
      $or: []
    };
    if (userId) query.$or.push({ 'usedBy.userId': userId });
    if (phone) query.$or.push({ 'usedBy.userPhone': phone.trim() });

    const vouchers = await Voucher.find(query).sort({ updatedAt: -1 }).lean();

    const formatted = vouchers.map((v) => {
      const claim = v.usedBy.find(
        (u) => (userId && u.userId?.toString() === userId.toString()) || (phone && u.userPhone === phone.trim())
      );
      return {
        code: v.code,
        planName: v.planName,
        durationDays: v.durationDays,
        campaignName: v.campaignName,
        redeemedAt: claim ? claim.redeemedAt : v.updatedAt
      };
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'User voucher redemption history retrieved',
      data: {
        totalRedeemed: formatted.length,
        history: formatted
      }
    });
  } catch (err) {
    console.error('[Voucher] getUserVoucherHistory error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
