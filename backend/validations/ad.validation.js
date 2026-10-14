import Joi from 'joi';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const adValidation = {
  // Query schema for GET /api/v1/ads/custom (Admin inventory listing)
  customAdsQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(50),
    type: Joi.string().trim().default('ALL'),
    placement: Joi.string().trim().default('ALL'),
    status: Joi.string().trim().default('ALL'),
    device: Joi.string().trim().default('ALL'),
    search: Joi.string().trim().allow('', null),
    sortBy: Joi.string()
      .valid('newest', 'oldest', 'priority', 'impressions', 'clicks', 'ctr', 'name')
      .default('newest')
  }),

  // Payload schema for POST /api/v1/ads/custom (Create new custom ad)
  createCustomAd: Joi.object({
    title: Joi.string().trim().min(2).max(150).required().messages({
      'string.empty': 'Campaign title is required.',
      'any.required': 'Campaign title is required.'
    }),
    advertiser: Joi.string().trim().min(2).max(120).required().messages({
      'string.empty': 'Advertiser / Sponsor name is required.',
      'any.required': 'Advertiser / Sponsor name is required.'
    }),
    notes: Joi.string().trim().allow('', null).default(''),
    type: Joi.string()
      .valid('BANNER', 'INTERSTITIAL', 'VIDEO_PREROLL', 'NATIVE_CARD', 'SPLASH_POPUP', 'REWARDED')
      .required()
      .messages({
        'any.only': 'Invalid ad format type selected.'
      }),
    placement: Joi.string()
      .valid(
        'ALL_PLACEMENTS',
        'HOME_BANNER',
        'PLAYER_PREROLL',
        'EPISODE_TRANSITION',
        'DRAWER_CARD',
        'GLOBAL_POPUP',
        'HEADER_LEADERBOARD',
        'EPISODE_SIDEBAR',
        'FOOTER_BANNER'
      )
      .default('ALL_PLACEMENTS'),
    mediaType: Joi.string().valid('IMAGE', 'VIDEO').default('IMAGE'),
    mediaUrl: Joi.string().trim().required().messages({
      'string.empty': 'Creative media asset URL is required.',
      'any.required': 'Creative media asset URL is required.'
    }),
    thumbnailUrl: Joi.string().trim().allow('', null).default(''),
    companionBannerUrl: Joi.string().trim().allow('', null).default(''),
    aspectRatio: Joi.string().valid('AUTO', '16:9', '9:16', '1:1', '4:3').default('AUTO'),
    videoDuration: Joi.number().min(0).max(3600).default(15),
    skipAfterSeconds: Joi.number().min(0).max(600).default(5),
    ctaText: Joi.string().trim().max(60).default('Learn More'),
    ctaAction: Joi.string()
      .valid('EXTERNAL_URL', 'DEEP_LINK_DRAMA', 'DEEP_LINK_SUBSCRIPTION', 'IN_APP_BROWSER')
      .default('EXTERNAL_URL'),
    targetUrl: Joi.string().trim().allow('', null).default(''),
    targetWindow: Joi.string().valid('_blank', '_self', 'deep_link').default('_blank'),
    targetDevices: Joi.string().valid('ALL', 'ANDROID', 'IOS', 'WEB').default('ALL'),
    targetPage: Joi.string().valid('ALL_PAGES', 'HOME_ONLY', 'WATCH_ONLY', 'VIP_PAGE').default('ALL_PAGES'),
    targetDramaId: Joi.string().regex(objectIdRegex).allow('', null).default(null),
    targetDramas: Joi.array().items(Joi.string().regex(objectIdRegex)).default([]),
    targetGenres: Joi.array().items(Joi.string().trim()).default([]),
    status: Joi.string().valid('ACTIVE', 'PAUSED', 'EXPIRED', 'SCHEDULED', 'ARCHIVED').default('ACTIVE'),
    priority: Joi.number().integer().min(1).max(10).default(5),
    startDate: Joi.date().iso().allow('', null).default(() => new Date()),
    endDate: Joi.date().iso().allow('', null).default(null),
    cappingImpressions: Joi.number().integer().min(1).allow('', null).default(null),
    cappingClicks: Joi.number().integer().min(1).allow('', null).default(null),
    dailyImpressionCap: Joi.number().integer().min(1).allow('', null).default(null),
    userFrequencyCap: Joi.number().integer().min(1).allow('', null).default(null)
  }),

  // Payload schema for PUT /api/v1/ads/custom/:id (Update custom ad)
  updateCustomAd: Joi.object({
    title: Joi.string().trim().min(2).max(150),
    advertiser: Joi.string().trim().min(2).max(120),
    notes: Joi.string().trim().allow('', null),
    type: Joi.string().valid('BANNER', 'INTERSTITIAL', 'VIDEO_PREROLL', 'NATIVE_CARD', 'SPLASH_POPUP', 'REWARDED'),
    placement: Joi.string().valid(
      'ALL_PLACEMENTS',
      'HOME_BANNER',
      'PLAYER_PREROLL',
      'EPISODE_TRANSITION',
      'DRAWER_CARD',
      'GLOBAL_POPUP',
      'HEADER_LEADERBOARD',
      'EPISODE_SIDEBAR',
      'FOOTER_BANNER'
    ),
    mediaType: Joi.string().valid('IMAGE', 'VIDEO'),
    mediaUrl: Joi.string().trim(),
    thumbnailUrl: Joi.string().trim().allow('', null),
    companionBannerUrl: Joi.string().trim().allow('', null),
    aspectRatio: Joi.string().valid('AUTO', '16:9', '9:16', '1:1', '4:3'),
    videoDuration: Joi.number().min(0).max(3600),
    skipAfterSeconds: Joi.number().min(0).max(600),
    ctaText: Joi.string().trim().max(60),
    ctaAction: Joi.string().valid('EXTERNAL_URL', 'DEEP_LINK_DRAMA', 'DEEP_LINK_SUBSCRIPTION', 'IN_APP_BROWSER'),
    targetUrl: Joi.string().trim().allow('', null),
    targetWindow: Joi.string().valid('_blank', '_self', 'deep_link'),
    targetDevices: Joi.string().valid('ALL', 'ANDROID', 'IOS', 'WEB'),
    targetPage: Joi.string().valid('ALL_PAGES', 'HOME_ONLY', 'WATCH_ONLY', 'VIP_PAGE'),
    targetDramaId: Joi.string().regex(objectIdRegex).allow('', null),
    targetDramas: Joi.array().items(Joi.string().regex(objectIdRegex)),
    targetGenres: Joi.array().items(Joi.string().trim()),
    status: Joi.string().valid('ACTIVE', 'PAUSED', 'EXPIRED', 'SCHEDULED', 'ARCHIVED'),
    priority: Joi.number().integer().min(1).max(10),
    startDate: Joi.date().iso().allow('', null),
    endDate: Joi.date().iso().allow('', null),
    cappingImpressions: Joi.number().integer().min(1).allow('', null),
    cappingClicks: Joi.number().integer().min(1).allow('', null),
    dailyImpressionCap: Joi.number().integer().min(1).allow('', null),
    userFrequencyCap: Joi.number().integer().min(1).allow('', null)
  }),

  // Query schema for GET /api/v1/ads/serve (Ad Serving Decision Engine)
  serveAdQuery: Joi.object({
    placement: Joi.string().trim().allow('', null),
    format: Joi.string().trim().allow('', null),
    platform: Joi.string().trim().lowercase().valid('android', 'ios', 'web').default('android'),
    page: Joi.string().trim().allow('', null),
    isVip: Joi.boolean().truthy('true', '1').falsy('false', '0').default(false),
    dramaId: Joi.string().trim().allow('', null),
    genre: Joi.string().trim().allow('', null),
    excludeAdIds: Joi.string().trim().allow('', null) // Comma-delimited list of ad IDs recently shown
  }),

  // Body schema for POST /api/v1/ads/track/:id/video-event (VAST Quartile Milestone Tracking)
  trackVideoEvent: Joi.object({
    eventType: Joi.string()
      .valid('start', 'firstQuartile', 'midpoint', 'thirdQuartile', 'complete', 'skip')
      .required()
      .messages({
        'any.only': 'eventType must be start, firstQuartile, midpoint, thirdQuartile, complete, or skip.'
      }),
    progressSeconds: Joi.number().min(0).allow(null)
  }),

  // Body schema for PUT /api/v1/ads/custom/rotation-settings
  rotationSettings: Joi.object({
    enabled: Joi.boolean().required(),
    policy: Joi.string()
      .valid('EQUAL_RANDOM', 'PRIORITY_WEIGHTED', 'CTR_OPTIMIZED')
      .default('EQUAL_RANDOM'),
    preventConsecutive: Joi.boolean().default(true),
    dailyGlobalImpressionCap: Joi.number().min(0).default(0)
  }),

  // Body schema for POST /api/v1/ads/custom/bulk-action
  bulkAction: Joi.object({
    action: Joi.string().valid('ACTIVATE', 'PAUSE', 'DELETE', 'RESET_STATS').required(),
    ids: Joi.array().items(Joi.string().regex(objectIdRegex)).min(1).required()
  }),

  // Query schema for GET /api/v1/ads/custom/:id/analytics
  analyticsQuery: Joi.object({
    days: Joi.number().integer().min(1).max(90).default(30)
  })
};
