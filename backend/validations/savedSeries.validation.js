import Joi from 'joi';

export const savedSeriesValidation = {
  // Query parameters for GET /api/v1/user/saved-series
  listQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().trim().allow('').max(100),
    q: Joi.string().trim().allow('').max(100),
    genre: Joi.string().trim().allow(''),
    sortBy: Joi.string().valid('recent', 'rating', 'title', 'episodes').default('recent')
  }),

  // Drama identifier param for :dramaId (can be 24-char ObjectId or drama slug)
  dramaParam: Joi.object({
    dramaId: Joi.string().trim().required().messages({
      'string.empty': 'Drama identifier (ID or slug) is required.',
      'any.required': 'Drama identifier is required.'
    })
  })
};
