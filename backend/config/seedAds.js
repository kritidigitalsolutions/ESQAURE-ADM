import { CustomAd } from '../models/CustomAd.js';

export const seedDefaultCustomAds = async () => {
  try {
    const count = await CustomAd.countDocuments();
    if (count > 0) return;

    const sampleAds = [
      {
        title: 'Monster Energy — Unleash the Beast',
        advertiser: 'Monster Energy India',
        type: 'VIDEO_PREROLL',
        placement: 'PLAYER_PREROLL',
        mediaType: 'VIDEO',
        mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1622543925917-763c34d1a86e?w=800&q=80',
        videoDuration: 15,
        skipAfterSeconds: 5,
        ctaText: 'Grab 20% Off',
        ctaAction: 'EXTERNAL_URL',
        targetUrl: 'https://www.monsterenergy.com',
        status: 'ACTIVE',
        priority: 9,
        impressionsCount: 14200,
        clicksCount: 840,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'E² Stories VIP Annual Pass — 50% Off Flash Sale',
        advertiser: 'E² Stories OTT Official',
        type: 'INTERSTITIAL',
        placement: 'EPISODE_TRANSITION',
        mediaType: 'IMAGE',
        mediaUrl: 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?w=800&q=80',
        videoDuration: 0,
        skipAfterSeconds: 3,
        ctaText: 'Upgrade for ₹499',
        ctaAction: 'DEEP_LINK_SUBSCRIPTION',
        targetUrl: '/subscriptions',
        status: 'ACTIVE',
        priority: 8,
        impressionsCount: 28900,
        clicksCount: 2150,
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'boAt Airdopes Pro — Ultra Low Latency Sound',
        advertiser: 'boAt Lifestyle',
        type: 'BANNER',
        placement: 'HOME_BANNER',
        mediaType: 'IMAGE',
        mediaUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
        videoDuration: 0,
        skipAfterSeconds: 0,
        ctaText: 'Shop boAt Now',
        ctaAction: 'EXTERNAL_URL',
        targetUrl: 'https://www.boat-lifestyle.com',
        status: 'ACTIVE',
        priority: 7,
        impressionsCount: 51200,
        clicksCount: 3100,
        startDate: new Date(),
        endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Secret Billionaire Official Merchandise & Hoodies',
        advertiser: 'E² Merch Store',
        type: 'NATIVE_CARD',
        placement: 'DRAWER_CARD',
        mediaType: 'IMAGE',
        mediaUrl: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&q=80',
        videoDuration: 0,
        skipAfterSeconds: 0,
        ctaText: 'View Merch',
        ctaAction: 'EXTERNAL_URL',
        targetUrl: 'https://store.e2stories.com',
        status: 'PAUSED',
        priority: 5,
        impressionsCount: 8400,
        clicksCount: 420,
        startDate: new Date(),
        endDate: null
      }
    ];

    await CustomAd.insertMany(sampleAds);
    console.log('✅ Seeded default Custom Ads successfully');
  } catch (err) {
    console.error('❌ Failed to seed custom ads:', err.message);
  }
};
