import Joi from 'joi';

export const watchHistoryValidation = {
  // Query parameters for GET /api/v1/watch-history & /api/v1/user/watch-history
  listQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().trim().allow('').max(100),
    q: Joi.string().trim().allow('').max(100),
    status: Joi.string().valid('all', 'completed', 'in-progress', 'continue').default('all'),
    period: Joi.string().valid('all', 'today', 'yesterday', 'this_week', 'this_month').default('all'),
    genre: Joi.string().trim().allow(''),
    sortBy: Joi.string().valid('recent', 'oldest', 'progress', 'title').default('recent'),
    view: Joi.string().valid('dramas', 'episodes', 'grouped').default('dramas'),
    groupBy: Joi.string().valid('date', 'none').default('none')
  }),

  // Body for POST /api/v1/watch-history (manual or player-driven sync)
  recordWatch: Joi.object({
    dramaId: Joi.string().trim().required().messages({
      'string.empty': 'Drama identifier (ID or slug) is required.',
      'any.required': 'Drama identifier is required.'
    }),
    episodeNumber: Joi.number().integer().min(0).default(1),
    episodeId: Joi.string().trim().optional(),
    watchedSeconds: Joi.number().min(0).default(0),
    durationSeconds: Joi.number().min(0).optional(),
    isCompleted: Joi.boolean().optional()
  }),

  // Body for POST /api/v1/watch-history/mark-completed
  markCompleted: Joi.object({
    dramaId: Joi.string().trim().required().messages({
      'string.empty': 'Drama identifier (ID or slug) is required.',
      'any.required': 'Drama identifier is required.'
    }),
    episodeNumber: Joi.number().integer().min(0).optional()
  }),

  // Identifier param for :historyId
  historyParam: Joi.object({
    historyId: Joi.string().trim().required().messages({
      'string.empty': 'History ID is required.',
      'any.required': 'History ID is required.'
    })
  }),

  // Identifier param for :dramaId
  dramaParam: Joi.object({
    dramaId: Joi.string().trim().required().messages({
      'string.empty': 'Drama identifier (ID or slug) is required.',
      'any.required': 'Drama identifier is required.'
    })
  })
};
