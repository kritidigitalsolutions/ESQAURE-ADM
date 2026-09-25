import Joi from 'joi';

export const homeValidation = {
  // Query schema for GET /api/v1/home/content (Admin Prioritized Content)
  contentQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10),
    genre: Joi.string().trim().allow('', null),
    sortOrder: Joi.string().valid('asc', 'desc').default('asc')
  }),

  // Query schema for GET /api/v1/home/continue-watching
  continueWatchingQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10)
  }),

  // Query schema for GET /api/v1/home/categories
  categoriesQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10),
    includeDramas: Joi.boolean().default(false),
    dramasLimit: Joi.number().integer().min(1).max(20).default(6)
  }),

  // Query schema for GET /api/v1/home/recommended-categories
  recommendedCategoriesQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10),
    includeDramas: Joi.boolean().default(true),
    dramasLimit: Joi.number().integer().min(1).max(20).default(6)
  }),

  // Query schema for GET /api/v1/home/new-releases
  newReleasesQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10),
    genre: Joi.string().trim().allow('', null)
  }),

  // Query schema for GET /api/v1/home/sections (Mobile client)
  sectionsQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(30).default(10)
  }),

  // Admin: Create new category section on home page
  createSection: Joi.object({
    title: Joi.string().trim().min(2).max(100).required().messages({
      'string.empty': 'Section title is required.',
      'any.required': 'Section title is required.'
    }),
    subtitle: Joi.string().trim().allow('', null).default(''),
    slug: Joi.string().trim().lowercase().allow('', null),
    sectionType: Joi.string()
      .valid('GENRE', 'CUSTOM_CURATED', 'NEW_RELEASES', 'TRENDING', 'PRIORITY_CONTENT')
      .default('GENRE'),
    genreId: Joi.string().trim().allow('', null),
    dramaIds: Joi.array().items(Joi.string().trim()).default([]),
    layout: Joi.string()
      .valid('HORIZONTAL_CARD', 'PORTRAIT_GRID', 'HERO_CAROUSEL', 'FEATURED_BANNER')
      .default('HORIZONTAL_CARD'),
    displayOrder: Joi.number().integer().default(0),
    maxItems: Joi.number().integer().min(1).max(50).default(10),
    viewAllEnabled: Joi.boolean().default(true),
    isActive: Joi.boolean().default(true)
  }),

  // Admin: Update category section on home page
  updateSection: Joi.object({
    title: Joi.string().trim().min(2).max(100),
    subtitle: Joi.string().trim().allow('', null),
    slug: Joi.string().trim().lowercase(),
    sectionType: Joi.string()
      .valid('GENRE', 'CUSTOM_CURATED', 'NEW_RELEASES', 'TRENDING', 'PRIORITY_CONTENT'),
    genreId: Joi.string().trim().allow('', null),
    dramaIds: Joi.array().items(Joi.string().trim()),
    layout: Joi.string()
      .valid('HORIZONTAL_CARD', 'PORTRAIT_GRID', 'HERO_CAROUSEL', 'FEATURED_BANNER'),
    displayOrder: Joi.number().integer(),
    maxItems: Joi.number().integer().min(1).max(50),
    viewAllEnabled: Joi.boolean(),
    isActive: Joi.boolean()
  }).min(1),

  // Admin: Reorder sections
  reorderSections: Joi.object({
    items: Joi.array()
      .items(
        Joi.object({
          id: Joi.string().required(),
          displayOrder: Joi.number().integer().required()
        })
      )
      .min(1)
      .required()
  }),

  // Admin: Set drama priority
  setDramaPriority: Joi.object({
    priority: Joi.number().integer().min(0).required().messages({
      'any.required': 'Priority number is required.'
    })
  })
};
