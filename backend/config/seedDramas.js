import { Drama } from '../models/Drama.js';
import { Episode } from '../models/Episode.js';
import { Genre } from '../models/Genre.js';

export const seedDefaultDramas = async () => {
  try {
    // 1. Ensure primary genres exist
    const romance = await Genre.findOneAndUpdate(
      { slug: 'romance' },
      { $setOnInsert: { name: 'Romance', slug: 'romance', icon: 'heart', isActive: true } },
      { upsert: true, new: true }
    );
    const drama = await Genre.findOneAndUpdate(
      { slug: 'drama' },
      { $setOnInsert: { name: 'Drama', slug: 'drama', icon: 'theater-masks', isActive: true } },
      { upsert: true, new: true }
    );
    const thriller = await Genre.findOneAndUpdate(
      { slug: 'thriller' },
      { $setOnInsert: { name: 'Thriller', slug: 'thriller', icon: 'zap', isActive: true } },
      { upsert: true, new: true }
    );
    const mystery = await Genre.findOneAndUpdate(
      { slug: 'mystery' },
      { $setOnInsert: { name: 'Mystery', slug: 'mystery', icon: 'detective', isActive: true } },
      { upsert: true, new: true }
    );
    const action = await Genre.findOneAndUpdate(
      { slug: 'action' },
      { $setOnInsert: { name: 'Action', slug: 'action', icon: 'running', isActive: true } },
      { upsert: true, new: true }
    );

    const initialDramas = [
      {
        title: 'Security Guard Ki CEO GF',
        slug: 'security-guard-ki-ceo-gf',
        synopsis:
          'A humble security guard with a mysterious past crosses paths with an uncompromising billionaire female CEO. Love, corporate intrigue, and dark secrets collide in this high-intensity serialized romance drama.',
        posterUrl:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=720&q=80',
        bannerUrl:
          'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?auto=format&fit=crop&w=1280&q=80',
        trailerUrl:
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        genres: [romance._id, drama._id],
        languages: ['Hindi', 'English'],
        tags: ['Romance', 'Drama', 'CEO', 'Action', 'Trending'],
        totalEpisodes: 30,
        freeEpisodes: 3,
        viewsCount: 35400,
        rating: 4.9,
        isTrending: true,
        trendingRank: 1,
        isFeatured: true,
        isNewRelease: true,
        priority: 1,
        isPaid: true,
        plan: 'Premium Plan',
        status: 'PUBLISHED'
      },
      {
        title: 'Dhokha - Lover turned Enemy',
        slug: 'dhokha-lover-turned-enemy',
        synopsis:
          'When love is shattered by betrayal, a former lover returns under a fake identity to destroy the empire that ruined his family.',
        posterUrl:
          'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=720&q=80',
        bannerUrl:
          'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1280&q=80',
        trailerUrl:
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        genres: [thriller._id, romance._id],
        languages: ['Hindi', 'English'],
        tags: ['Thriller', 'Betrayal', 'Revenge'],
        totalEpisodes: 42,
        freeEpisodes: 3,
        viewsCount: 4200000,
        rating: 4.8,
        isTrending: true,
        trendingRank: 2,
        isFeatured: true,
        isNewRelease: false,
        priority: 2,
        isPaid: true,
        plan: 'Monthly Pass',
        status: 'PUBLISHED'
      },
      {
        title: 'Pyaar, Nafrat aur Badla',
        slug: 'pyaar-nafrat-aur-badla',
        synopsis:
          'A intense saga of love, hatred, and ruthless revenge between two warring business dynasties in Mumbai.',
        posterUrl:
          'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=720&q=80',
        bannerUrl:
          'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=1280&q=80',
        trailerUrl:
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        genres: [romance._id, drama._id],
        languages: ['Hindi'],
        tags: ['Romance', 'Drama', 'Revenge'],
        totalEpisodes: 28,
        freeEpisodes: 5,
        viewsCount: 1800000,
        rating: 4.7,
        isTrending: false,
        isFeatured: false,
        isNewRelease: true,
        priority: 3,
        isPaid: false,
        plan: 'Free Tier',
        status: 'PUBLISHED'
      },
      {
        title: 'Billionaire Ka Secret Heir',
        slug: 'billionaire-ka-secret-heir',
        synopsis:
          'An orphaned mechanic discovers he is the sole heir to a trillion-dollar corporate conglomerate.',
        posterUrl:
          'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=720&q=80',
        bannerUrl:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1280&q=80',
        trailerUrl:
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        genres: [romance._id, drama._id],
        languages: ['Hindi', 'English'],
        tags: ['Billionaire', 'Heir', 'Romance'],
        totalEpisodes: 50,
        freeEpisodes: 2,
        viewsCount: 6100000,
        rating: 4.9,
        isTrending: true,
        trendingRank: 3,
        isFeatured: true,
        isNewRelease: false,
        priority: 4,
        isPaid: true,
        plan: 'Yearly All-Access',
        status: 'PUBLISHED'
      },
      {
        title: 'The Secret Heiress Returns',
        slug: 'the-secret-heiress-returns',
        synopsis:
          'Thought to be dead for five years, a disgraced heiress returns in secret to reclaim her lost legacy and unmask her traitors.',
        posterUrl:
          'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=720&q=80',
        bannerUrl:
          'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1280&q=80',
        trailerUrl:
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        genres: [drama._id, mystery._id],
        languages: ['Hindi', 'English'],
        tags: ['Drama', 'Mystery', 'Heiress'],
        totalEpisodes: 36,
        freeEpisodes: 3,
        viewsCount: 2400000,
        rating: 4.6,
        isTrending: false,
        isFeatured: false,
        isNewRelease: true,
        priority: 5,
        isPaid: true,
        plan: 'Premium Plan',
        status: 'PUBLISHED'
      },
      {
        title: 'Mafia Don Ki Dulhan',
        slug: 'mafia-don-ki-dulhan',
        synopsis:
          'Forced into an arranged marriage with the most dangerous mafia Don in the city, an innocent doctor must navigate deadly criminal underworlds.',
        posterUrl:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=720&q=80',
        bannerUrl:
          'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=1280&q=80',
        trailerUrl:
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        genres: [action._id, drama._id],
        languages: ['Hindi'],
        tags: ['Action', 'Mafia', 'Drama'],
        totalEpisodes: 24,
        freeEpisodes: 4,
        viewsCount: 950000,
        rating: 4.5,
        isTrending: false,
        isFeatured: false,
        isNewRelease: false,
        priority: 6,
        isPaid: false,
        plan: 'Free Tier',
        status: 'PUBLISHED'
      }
    ];

    for (const dData of initialDramas) {
      const dramaDoc = await Drama.findOneAndUpdate(
        { slug: dData.slug },
        { $set: dData },
        { upsert: true, new: true }
      );

      // Seed sample episodes for each drama if no episodes exist yet
      const existingEpCount = await Episode.countDocuments({ dramaId: dramaDoc._id });
      if (existingEpCount === 0) {
        const sampleTitles = [
          'The First Encounter',
          'Hidden Intentions',
          'Truth Unveiled',
          'The Silent Betrayal',
          'Shadows of the Past',
          'The Power Play'
        ];
        for (let i = 1; i <= Math.min(dData.totalEpisodes, 6); i++) {
          await Episode.create({
            dramaId: dramaDoc._id,
            seasonNumber: 1,
            episodeNumber: i,
            title: sampleTitles[i - 1] || `Episode ${i}`,
            synopsis: `Synopsis for episode ${i} of ${dramaDoc.title}`,
            thumbnailUrl: dData.posterUrl,
            videoStreamUrl: dData.trailerUrl,
            resolutions: [
              { quality: 'Auto', url: dData.trailerUrl },
              { quality: '1080p', url: dData.trailerUrl }
            ],
            durationSeconds: 120 + i * 5,
            formattedDuration: `2:${(10 + i * 5).toString().padStart(2, '0')}`,
            subtitles: [
              { language: 'Hindi', label: 'Hindi', url: '' },
              { language: 'English', label: 'English', url: '' }
            ],
            isFree: i <= dData.freeEpisodes,
            viewsCount: Math.floor(dData.viewsCount / (i * 2 + 1))
          });
        }
      }
    }

    console.log('[Database] Default Dramas and Episodes seeded successfully.');
  } catch (error) {
    console.warn('[Database] Could not seed default dramas:', error.message);
  }
};
