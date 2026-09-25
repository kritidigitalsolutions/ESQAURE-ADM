import Joi from 'joi';

export const searchValidation = {
  // Query schema for GET /api/v1/search
  searchQuery: Joi.object({
    q: Joi.string()
      .trim()
      .allow('', null)
      .max(100)
      .default(''),
    query: Joi.string()
      .trim()
      .allow('', null)
      .max(100),
    genre: Joi.string()
      .trim()
      .allow('', null),
    language: Joi.string()
      .trim()
      .allow('', null),
    sortBy: Joi.string()
      .valid('relevance', 'popular', 'latest', 'rating')
      .default('relevance'),
    page: Joi.number()
      .integer()
      .min(1)
      .default(1),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(50)
      .default(10)
  }),

  // Query schema for GET /api/v1/search/popular
  popularQuery: Joi.object({
    limit: Joi.number()
      .integer()
      .min(1)
      .max(30)
      .default(10)
  }),

  // Query schema for GET /api/v1/search/recommended
  recommendedQuery: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(50)
      .default(10)
  }),

  // Query schema for GET /api/v1/search/suggestions
  suggestionsQuery: Joi.object({
    q: Joi.string()
      .trim()
      .min(1)
      .max(100)
      .required()
      .messages({
        'string.empty': 'Search query string "q" is required.',
        'any.required': 'Search query string "q" is required.'
      }),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(20)
      .default(8)
  })
};
