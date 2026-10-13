import { Subscription } from '../models/Subscription.js';
import { User } from '../models/User.js';

let sweeperIntervalId = null;

/**
 * Sweeps the database for any overdue subscriptions (Zero-Grace enforcement).
 * Automatically transitions TRIAL, ACTIVE, and CANCELLED subscriptions past
 * their currentPeriodEnd date to EXPIRED, and revokes VIP status for users.
 *
 * @returns {Promise<number>} Count of expired subscriptions processed
 */
export const sweepExpiredSubscriptions = async () => {
  try {
    const now = new Date();

    // 1. Locate all subscriptions that have ended but are not marked EXPIRED
    const overdueSubs = await Subscription.find({
      status: { $in: ['TRIAL', 'ACTIVE', 'CANCELLED'] },
      currentPeriodEnd: { $lte: now }
    }).select('_id userId currentPeriodEnd status planCode');

    if (overdueSubs.length === 0) {
      return 0;
    }

    const subIds = overdueSubs.map((s) => s._id);
    const userIds = [...new Set(overdueSubs.map((s) => s.userId.toString()))];

    // 2. Mark overdue subscriptions as EXPIRED
    await Subscription.updateMany(
      { _id: { $in: subIds } },
      { $set: { status: 'EXPIRED', autoRenew: false } }
    );

    // 3. For each affected user, check if they have any other active subscription;
    // if not, downgrade to Free Tier and revoke VIP status
    let revokedUsersCount = 0;
    for (const uid of userIds) {
      const remainingActiveSub = await Subscription.findOne({
        userId: uid,
        status: { $in: ['TRIAL', 'ACTIVE'] },
        currentPeriodEnd: { $gt: now }
      });

      if (!remainingActiveSub) {
        await User.findByIdAndUpdate(uid, {
          isVip: false,
          plan: 'Free Tier',
          vipExpiresAt: null,
          currentSubscriptionId: null
        });
        revokedUsersCount++;
      }
    }

    console.log(
      `[Subscription Sweeper] Expired ${overdueSubs.length} overdue subscription(s) & updated ${revokedUsersCount} user account(s).`
    );

    return overdueSubs.length;
  } catch (error) {
    console.error('[Subscription Sweeper Error]:', error.message);
    return 0;
  }
};

/**
 * Start the recurring subscription sweeper.
 * Runs once immediately on server startup, then repeats every interval.
 *
 * @param {number} intervalMs - Frequency in milliseconds (default: 1 hour)
 */
export const startSubscriptionSweeper = (intervalMs = 60 * 60 * 1000) => {
  if (sweeperIntervalId) {
    clearInterval(sweeperIntervalId);
  }

  // Initial sweep upon launch
  sweepExpiredSubscriptions().catch((err) => {
    console.error('[Subscription Sweeper Startup Error]:', err.message);
  });

  // Scheduled recurring sweep
  sweeperIntervalId = setInterval(() => {
    sweepExpiredSubscriptions().catch((err) => {
      console.error('[Subscription Sweeper Recurring Error]:', err.message);
    });
  }, intervalMs);

  // Unref timer so it doesn't hold open Node process on shutdown
  if (sweeperIntervalId.unref) {
    sweeperIntervalId.unref();
  }

  console.log(`[Subscription Sweeper] Active (running every ${Math.round(intervalMs / 60000)}m)`);
};

/**
 * Stop the recurring subscription sweeper on graceful shutdown
 */
export const stopSubscriptionSweeper = () => {
  if (sweeperIntervalId) {
    clearInterval(sweeperIntervalId);
    sweeperIntervalId = null;
  }
};

export default {
  sweepExpiredSubscriptions,
  startSubscriptionSweeper,
  stopSubscriptionSweeper
};
