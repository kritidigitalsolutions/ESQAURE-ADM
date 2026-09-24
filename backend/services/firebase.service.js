import { getMessaging } from '../config/firebase.js';
import { User } from '../models/User.js';

/**
 * Split an array into chunks of a specific size (FCM max is 500 tokens per multicast)
 */
function chunkArray(array, size = 500) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Clean up invalid or unregistered FCM tokens from MongoDB to keep the database tidy.
 */
async function cleanupStaleTokens(staleTokens) {
  if (!staleTokens || staleTokens.length === 0) return;
  try {
    const result = await User.updateMany(
      { fcmTokens: { $in: staleTokens } },
      { $pull: { fcmTokens: { $in: staleTokens } } }
    );
    console.log(`🧹 [Firebase] Purged ${staleTokens.length} expired FCM tokens from ${result.modifiedCount} user records.`);
  } catch (err) {
    console.error('❌ [Firebase] Failed to clean up stale tokens:', err.message);
  }
}

/**
 * Send push notification to a list of FCM device tokens via Firebase Admin SDK
 * 
 * @param {string[]} tokens - Array of device FCM tokens
 * @param {object} options
 * @param {string} options.title - Notification title
 * @param {string} options.body - Notification body
 * @param {string} [options.imageUrl] - Optional banner image URL
 * @param {string} [options.deepLink] - Optional deep link (e.g. /watch/ep-1)
 * @param {object} [options.data] - Additional key-value payload (must be strings)
 * @returns {Promise<{status: string, sentCount: number, deliveredCount: number, failureCount: number, errors?: any[]}>}
 */
export async function sendFcmPush(tokens, { title, body, imageUrl, deepLink, data = {} }) {
  if (!tokens || tokens.length === 0) {
    return {
      status: 'NO_TOKENS',
      sentCount: 0,
      deliveredCount: 0,
      failureCount: 0,
      message: 'No device FCM tokens registered for target audience'
    };
  }

  // Filter unique valid strings
  const validTokens = [...new Set(tokens.filter((t) => typeof t === 'string' && t.trim().length > 10))];
  if (validTokens.length === 0) {
    return {
      status: 'NO_VALID_TOKENS',
      sentCount: 0,
      deliveredCount: 0,
      failureCount: tokens.length,
      message: 'All provided tokens were invalid or empty'
    };
  }

  const messaging = getMessaging();
  if (!messaging) {
    console.warn('⚠️ [Firebase] Messaging service is not initialized. Skipping push.');
    return {
      status: 'CONFIG_MISSING',
      sentCount: validTokens.length,
      deliveredCount: 0,
      failureCount: 0,
      message: 'Firebase Admin credentials not configured'
    };
  }

  // Convert all data values to strings (FCM data payload requirement)
  const stringifiedData = {};
  if (deepLink) stringifiedData.deepLink = String(deepLink);
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined && val !== null) {
      stringifiedData[key] = typeof val === 'object' ? JSON.stringify(val) : String(val);
    }
  }

  // Prepare chunks of at most 500 tokens
  const tokenChunks = chunkArray(validTokens, 500);
  let totalDelivered = 0;
  let totalFailed = 0;
  const staleTokensToPurge = [];

  for (const chunk of tokenChunks) {
    const message = {
      tokens: chunk,
      notification: {
        title: title || '',
        body: body || '',
        ...(imageUrl ? { imageUrl } : {})
      },
      data: stringifiedData,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'esquare_alerts',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          ...(imageUrl ? { imageUrl } : {})
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        },
        fcmOptions: {
          ...(imageUrl ? { imageUrl } : {})
        }
      }
    };

    try {
      const response = await messaging.sendEachForMulticast(message);
      totalDelivered += response.successCount;
      totalFailed += response.failureCount;

      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const code = resp.error?.code;
          // Token is dead or unregistered
          if (
            code === 'messaging/registration-token-not-registered' ||
            code === 'messaging/invalid-registration-token' ||
            code === 'messaging/invalid-argument'
          ) {
            staleTokensToPurge.push(chunk[idx]);
          }
        }
      });
    } catch (chunkErr) {
      console.error('❌ [Firebase] Error sending multicast chunk:', chunkErr.message);
      totalFailed += chunk.length;
    }
  }

  // Purge any dead tokens asynchronously
  if (staleTokensToPurge.length > 0) {
    cleanupStaleTokens(staleTokensToPurge).catch(() => {});
  }

  return {
    status: totalDelivered > 0 ? 'COMPLETED' : totalFailed > 0 ? 'FAILED' : 'NO_OP',
    sentCount: validTokens.length,
    deliveredCount: totalDelivered,
    failureCount: totalFailed
  };
}

export default { sendFcmPush };
