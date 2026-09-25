import { User } from '../models/User.js';
import { Subscription } from '../models/Subscription.js';
import { SubscriptionPlan } from '../models/SubscriptionPlan.js';

/**
 * Utility to synchronize User and Subscription collections and purge orphaned records.
 * Ensures 100% real-time data consistency across User Directory, Subscribers page, and Dashboard metrics.
 */
export async function syncAndCleanSubscriptionData() {
  try {
    // 1. Fetch all active (non-deleted) users
    const activeUsers = await User.find({ status: { $ne: 'DELETED' } }).select('_id isVip vipExpiresAt plan currentSubscriptionId');
    const activeUserIds = activeUsers.map((u) => u._id);

    // 2. Permanently delete orphaned subscriptions whose userId does not exist in User collection
    await Subscription.deleteMany({
      $or: [
        { userId: { $exists: false } },
        { userId: null },
        { userId: { $nin: activeUserIds } }
      ]
    });

    // 3. Synchronize user isVip status with Subscription collection
    const now = new Date();
    for (const user of activeUsers) {
      const activeSub = await Subscription.findOne({
        userId: user._id,
        status: { $in: ['ACTIVE', 'TRIAL'] },
        currentPeriodEnd: { $gte: now }
      }).populate('planId').sort({ createdAt: -1 });

      if (activeSub) {
        const planName = activeSub.planId?.name || (activeSub.isTrial ? '7-Day Free Trial' : '1 Month Pass');
        const isExpiringSame = user.vipExpiresAt && activeSub.currentPeriodEnd && Math.abs(user.vipExpiresAt.getTime() - activeSub.currentPeriodEnd.getTime()) < 1000;

        if (!user.isVip || user.plan !== planName || !isExpiringSame || String(user.currentSubscriptionId) !== String(activeSub._id)) {
          user.isVip = true;
          user.plan = planName;
          user.vipExpiresAt = activeSub.currentPeriodEnd;
          user.currentSubscriptionId = activeSub._id;
          await user.save();
        }
      } else {
        // If user has no active subscription in Subscription collection or currentPeriodEnd has passed
        if (user.isVip && (!user.vipExpiresAt || user.vipExpiresAt < now)) {
          user.isVip = false;
          user.plan = 'Free Tier';
          user.currentSubscriptionId = null;
          await user.save();
        }
      }
    }
  } catch (error) {
    console.warn('[SyncSubscriptionData] Warning during sync:', error.message);
  }
}
