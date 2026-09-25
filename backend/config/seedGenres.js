import { Genre } from '../models/Genre.js';

export const INITIAL_GENRES = [
  {
    name: 'Romance',
    slug: 'romance',
    icon: 'Heart',
    color: '#EC4899',
    displayOrder: 1,
    isActive: true
  },
  {
    name: 'Thriller',
    slug: 'thriller',
    icon: 'Zap',
    color: '#EF4444',
    displayOrder: 2,
    isActive: true
  },
  {
    name: 'Drama',
    slug: 'drama',
    icon: 'Flame',
    color: '#F59E0B',
    displayOrder: 3,
    isActive: true
  },
  {
    name: 'Mystery',
    slug: 'mystery',
    icon: 'Compass',
    color: '#8B5CF6',
    displayOrder: 4,
    isActive: true
  },
  {
    name: 'Action',
    slug: 'action',
    icon: 'Flame',
    color: '#F97316',
    displayOrder: 5,
    isActive: true
  },
  {
    name: 'Horror',
    slug: 'horror',
    icon: 'ShieldAlert',
    color: '#3B82F6',
    displayOrder: 6,
    isActive: true
  },
  {
    name: 'Comedy',
    slug: 'comedy',
    icon: 'Smile',
    color: '#10B981',
    displayOrder: 7,
    isActive: true
  },
  {
    name: 'Fantasy',
    slug: 'fantasy',
    icon: 'Sparkles',
    color: '#8B5CF6',
    displayOrder: 8,
    isActive: true
  }
];

export const seedDefaultGenres = async () => {
  try {
    for (const g of INITIAL_GENRES) {
      await Genre.findOneAndUpdate(
        { slug: g.slug },
        { 
          $setOnInsert: { name: g.name, slug: g.slug, displayOrder: g.displayOrder, isActive: g.isActive },
          $set: { color: g.color, icon: g.icon }
        },
        { upsert: true, new: true }
      );
    }
    console.log('[Database] Default onboarding genres ensured.');
  } catch (error) {
    console.warn('[Database] Could not seed genres:', error.message);
  }
};
