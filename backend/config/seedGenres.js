import { Genre } from '../models/Genre.js';

export const INITIAL_GENRES = [
  {
    name: 'Romance',
    slug: 'romance',
    icon: 'heart',
    displayOrder: 1,
    isActive: true
  },
  {
    name: 'Thriller',
    slug: 'thriller',
    icon: 'zap',
    displayOrder: 2,
    isActive: true
  },
  {
    name: 'Drama',
    slug: 'drama',
    icon: 'theater-masks',
    displayOrder: 3,
    isActive: true
  },
  {
    name: 'Mystery',
    slug: 'mystery',
    icon: 'detective',
    displayOrder: 4,
    isActive: true
  },
  {
    name: 'Action',
    slug: 'action',
    icon: 'running',
    displayOrder: 5,
    isActive: true
  },
  {
    name: 'Horror',
    slug: 'horror',
    icon: 'ghost',
    displayOrder: 6,
    isActive: true
  },
  {
    name: 'Comedy',
    slug: 'comedy',
    icon: 'smile',
    displayOrder: 7,
    isActive: true
  },
  {
    name: 'Fantasy',
    slug: 'fantasy',
    icon: 'wand',
    displayOrder: 8,
    isActive: true
  }
];

export const seedDefaultGenres = async () => {
  try {
    for (const g of INITIAL_GENRES) {
      await Genre.findOneAndUpdate(
        { slug: g.slug },
        { $setOnInsert: g },
        { upsert: true, new: true }
      );
    }
    console.log('[Database] Default onboarding genres ensured.');
  } catch (error) {
    console.warn('[Database] Could not seed genres:', error.message);
  }
};
