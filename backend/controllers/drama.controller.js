import mongoose from 'mongoose';
import { Drama } from '../models/Drama.js';
import { Episode } from '../models/Episode.js';
import { Genre } from '../models/Genre.js';
import { WatchHistory } from '../models/WatchHistory.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';

/**
 * Format numbers into K/M strings (e.g., 35400 -> "35.4k", 4200000 -> "4.2M")
 */
const formatViews = (num = 0) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return String(num);
};

/**
 * Format Date object to YYYY-MM-DD
 */
const formatDate = (date) => {
  if (!date) return '2026-01-15';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '2026-01-15';
  return d.toISOString().split('T')[0];
};

/**
 * Helper to slugify string
 */
const slugify = (text = '') =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * Normalizes priorities sequentially (1, 2, 3...)
 */
const normalizePrioritiesInDb = async () => {
  const allDramas = await Drama.find().sort({ priority: 1, createdAt: -1 });
  for (let index = 0; index < allDramas.length; index++) {
    const d = allDramas[index];
    const newPriority = index + 1;
    if (d.priority !== newPriority) {
      d.priority = newPriority;
      await d.save();
    }
  }
};

export class DramaController {
  /**
   * 1. Get All Dramas with Pagination & Filters for Catalog / Mobile
   * GET /api/v1/dramas?page=1&limit=10&genre=&search=&trending=true
   */
  static async getDramas(req, res, next) {
    try {
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.max(1, Number(req.query.limit || 100));
      const skip = (page - 1) * limit;

      const { genre, search, trending, newRelease, status } = req.query;
      const query = {};

      if (status && status !== 'ALL') {
        if (status === 'ACTIVE' || status === 'PUBLISHED') {
          query.status = 'PUBLISHED';
        } else if (status === 'INACTIVE' || status === 'DRAFT') {
          query.status = 'DRAFT';
        } else {
          query.status = status;
        }
      } else if (!req.query.admin) {
        query.status = 'PUBLISHED';
      }

      if (search) {
        query.$or = [
          { title: { $regex: search.trim(), $options: 'i' } },
          { synopsis: { $regex: search.trim(), $options: 'i' } }
        ];
      }

      if (trending === 'true') {
        query.isTrending = true;
      }

      if (newRelease === 'true') {
        query.isNewRelease = true;
      }

      if (genre && genre !== 'ALL') {
        if (mongoose.Types.ObjectId.isValid(genre) && genre.length === 24) {
          query.genres = genre;
        } else {
          const genreDoc = await Genre.findOne({ slug: genre.toLowerCase().trim() });
          if (genreDoc) {
            query.genres = genreDoc._id;
          }
        }
      }

      const total = await Drama.countDocuments(query);
      const totalPages = Math.ceil(total / limit);

      const dramas = await Drama.find(query)
        .populate('genres', 'name slug')
        .sort({ priority: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const formattedDramas = dramas.map((d) => {
        const genreNames = (d.genres || []).map((g) => (typeof g === 'object' ? g.name : g)).filter(Boolean);
        const isActive = d.status === 'PUBLISHED';
        return {
          id: d._id.toString(),
          title: d.title,
          slug: d.slug,
          synopsis: d.synopsis,
          poster: d.posterUrl,
          posterUrl: d.posterUrl,
          banner: d.bannerUrl,
          bannerUrl: d.bannerUrl,
          trailerUrl: d.trailerUrl,
          genres: genreNames.length > 0 ? genreNames : ['Drama'],
          genreDisplay: genreNames.join(' / ') || 'Drama',
          totalEpisodes: d.totalEpisodes || 0,
          freeEpisodes: d.freeEpisodes || 3,
          views: formatViews(d.viewsCount || 0),
          viewsCount: d.viewsCount || 0,
          rating: d.rating || 4.8,
          releaseDate: formatDate(d.releaseDate),
          status: d.status,
          isActive,
          isPaid: d.isPaid !== undefined ? d.isPaid : true,
          plan: d.plan || (d.isPaid === false ? 'Free Tier' : 'Premium Plan'),
          isTrending: Boolean(d.isTrending),
          trendingRank: d.trendingRank || null,
          priority: d.priority || 1
        };
      });

      return ApiResponse.success(res, 'All dramas fetched successfully', {
        dramas: formattedDramas,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * 2. Admin: Get Full Content Library with Stats & Filter Parameters
   * GET /api/v1/dramas/admin
   */
  static async getAdminDramas(req, res, next) {
    try {
      const allDramas = await Drama.find().populate('genres', 'name slug').sort({ priority: 1, createdAt: -1 });

      // Calculate total statistics across catalog
      const totalSeries = allDramas.length;
      const published = allDramas.filter((d) => d.status === 'PUBLISHED').length;
      const totalEpisodes = allDramas.reduce((acc, d) => acc + (d.totalEpisodes || 0), 0);
      const totalViewsRaw = allDramas.reduce((acc, d) => acc + (d.viewsCount || 0), 0);
      const totalStreams = formatViews(totalViewsRaw);
      
      const topDramaDoc = allDramas.reduce((prev, current) =>
        (current.viewsCount || 0) > (prev?.viewsCount || 0) ? current : prev, allDramas[0]
      );

      const topDrama = topDramaDoc
        ? {
            title: topDramaDoc.title,
            views: formatViews(topDramaDoc.viewsCount || 0)
          }
        : { title: 'Security Guard Ki CEO GF', views: '35.4k' };

      const formattedDramas = allDramas.map((d, index) => {
        const genreNames = (d.genres || []).map((g) => (typeof g === 'object' ? g.name : g)).filter(Boolean);
        const isActive = d.status === 'PUBLISHED';
        return {
          id: d._id.toString(),
          title: d.title,
          slug: d.slug,
          synopsis: d.synopsis,
          poster: d.posterUrl,
          posterUrl: d.posterUrl,
          banner: d.bannerUrl,
          bannerUrl: d.bannerUrl,
          trailerUrl: d.trailerUrl,
          genres: genreNames.length > 0 ? genreNames : ['Drama'],
          genreDisplay: genreNames.join(' / ') || 'Drama',
          totalEpisodes: d.totalEpisodes || 0,
          freeEpisodes: d.freeEpisodes || 3,
          views: formatViews(d.viewsCount || 0),
          viewsCount: d.viewsCount || 0,
          rating: d.rating || 4.8,
          releaseDate: formatDate(d.releaseDate),
          status: d.status,
          isActive,
          isPaid: d.isPaid !== undefined ? d.isPaid : true,
          plan: d.plan || (d.isPaid === false ? 'Free Tier' : 'Premium Plan'),
          isTrending: Boolean(d.isTrending),
          trendingRank: d.trendingRank || null,
          priority: d.priority || (index + 1)
        };
      });

      return ApiResponse.success(res, 'Admin dramas catalog fetched successfully', {
        dramas: formattedDramas,
        stats: {
          totalSeries,
          published,
          totalEpisodes,
          totalStreams,
          topDrama,
          watchTime: '2.04M Hrs'
        }
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * 3. Admin: Create New Drama Series
   * POST /api/v1/dramas
   */
  static async createDrama(req, res, next) {
    try {
      const {
        title,
        synopsis,
        posterUrl,
        bannerUrl,
        trailerUrl,
        genres = [],
        totalEpisodes = 24,
        freeEpisodes = 3,
        isPaid = true,
        plan = 'Premium Plan',
        status = 'PUBLISHED',
        priority,
        isTrending = false
      } = req.body;

      if (!title || !title.trim()) {
        throw new AppError('Drama title is required.', 400, 'VALIDATION_ERROR');
      }

      const slug = slugify(title);
      let genreObjectIds = [];

      // Resolve genres array (names or ObjectIds)
      if (Array.isArray(genres) && genres.length > 0) {
        for (const g of genres) {
          if (mongoose.Types.ObjectId.isValid(g) && String(g).length === 24) {
            genreObjectIds.push(g);
          } else {
            const foundG = await Genre.findOne({
              $or: [{ name: new RegExp(`^${g}$`, 'i') }, { slug: slugify(g) }]
            });
            if (foundG) {
              genreObjectIds.push(foundG._id);
            }
          }
        }
      }

      const maxPriorityDoc = await Drama.findOne().sort({ priority: -1 });
      const nextPriority = priority || (maxPriorityDoc ? (maxPriorityDoc.priority || 0) + 1 : 1);

      const drama = await Drama.create({
        title: title.trim(),
        slug,
        synopsis: synopsis || '',
        posterUrl: posterUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=720&q=80',
        bannerUrl: bannerUrl || '',
        trailerUrl: trailerUrl || '',
        genres: genreObjectIds,
        totalEpisodes: Number(totalEpisodes) || 24,
        freeEpisodes: Number(freeEpisodes) || 3,
        isPaid: Boolean(isPaid),
        plan: isPaid ? (plan || 'Premium Plan') : 'Free Tier',
        status: status === 'DRAFT' ? 'DRAFT' : 'PUBLISHED',
        priority: nextPriority,
        isTrending: Boolean(isTrending)
      });

      await normalizePrioritiesInDb();

      return ApiResponse.success(res, 'Drama series created successfully', {
        drama
      }, 201);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * 4. Admin: Update Drama Details
   * PATCH /api/v1/dramas/:id
   */
  static async updateDrama(req, res, next) {
    try {
      const { id } = req.params;
      const drama = await Drama.findById(id);

      if (!drama) {
        throw new AppError('Drama series not found.', 404, 'DRAMA_NOT_FOUND');
      }

      const updates = req.body;

      if (updates.title) {
        drama.title = updates.title.trim();
        drama.slug = slugify(updates.title);
      }
      if (updates.synopsis !== undefined) drama.synopsis = updates.synopsis;
      if (updates.poster || updates.posterUrl) drama.posterUrl = updates.poster || updates.posterUrl;
      if (updates.banner || updates.bannerUrl) drama.bannerUrl = updates.banner || updates.bannerUrl;
      if (updates.trailerUrl !== undefined) drama.trailerUrl = updates.trailerUrl;
      if (updates.totalEpisodes !== undefined) drama.totalEpisodes = Number(updates.totalEpisodes);
      if (updates.freeEpisodes !== undefined) drama.freeEpisodes = Number(updates.freeEpisodes);
      if (updates.isPaid !== undefined) {
        drama.isPaid = Boolean(updates.isPaid);
        if (!drama.isPaid) drama.plan = 'Free Tier';
      }
      if (updates.plan !== undefined && drama.isPaid) drama.plan = updates.plan;
      if (updates.isActive !== undefined) {
        drama.status = updates.isActive ? 'PUBLISHED' : 'DRAFT';
      }
      if (updates.status !== undefined) drama.status = updates.status;
      if (updates.isTrending !== undefined) drama.isTrending = Boolean(updates.isTrending);
      if (updates.priority !== undefined) drama.priority = Number(updates.priority);

      // Resolve genres if updated
      if (Array.isArray(updates.genres)) {
        let genreObjectIds = [];
        for (const g of updates.genres) {
          if (mongoose.Types.ObjectId.isValid(g) && String(g).length === 24) {
            genreObjectIds.push(g);
          } else {
            const foundG = await Genre.findOne({
              $or: [{ name: new RegExp(`^${g}$`, 'i') }, { slug: slugify(g) }]
            });
            if (foundG) {
              genreObjectIds.push(foundG._id);
            }
          }
        }
        drama.genres = genreObjectIds;
      }

      await drama.save();
      await normalizePrioritiesInDb();

      return ApiResponse.success(res, 'Drama series updated successfully', {
        drama
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * 5. Admin: Delete Drama Series
   * DELETE /api/v1/dramas/:id
   */
  static async deleteDrama(req, res, next) {
    try {
      const { id } = req.params;
      const drama = await Drama.findById(id);

      if (!drama) {
        throw new AppError('Drama series not found.', 404, 'DRAMA_NOT_FOUND');
      }

      await Episode.deleteMany({ dramaId: drama._id });
      await Drama.findByIdAndDelete(id);

      // Re-normalize remaining drama priorities sequentially
      await normalizePrioritiesInDb();

      return ApiResponse.success(res, 'Drama series deleted successfully', { id });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * 6. Admin: Toggle Active / Inactive Status
   * PATCH /api/v1/dramas/:id/toggle-active
   */
  static async toggleActive(req, res, next) {
    try {
      const { id } = req.params;
      const drama = await Drama.findById(id);

      if (!drama) {
        throw new AppError('Drama series not found.', 404, 'DRAMA_NOT_FOUND');
      }

      const nextActive = drama.status !== 'PUBLISHED';
      drama.status = nextActive ? 'PUBLISHED' : 'DRAFT';
      await drama.save();

      return ApiResponse.success(res, `Drama is now ${nextActive ? 'Active' : 'Inactive'}`, {
        id: drama._id.toString(),
        status: drama.status,
        isActive: nextActive
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * 7. Admin: Toggle Paid / Free Access
   * PATCH /api/v1/dramas/:id/toggle-paid
   */
  static async togglePaid(req, res, next) {
    try {
      const { id } = req.params;
      const drama = await Drama.findById(id);

      if (!drama) {
        throw new AppError('Drama series not found.', 404, 'DRAMA_NOT_FOUND');
      }

      const nextPaid = !drama.isPaid;
      drama.isPaid = nextPaid;
      drama.plan = nextPaid ? (drama.plan === 'Free Tier' ? 'Premium Plan' : drama.plan || 'Premium Plan') : 'Free Tier';
      await drama.save();

      return ApiResponse.success(res, `Drama access updated to ${nextPaid ? 'Paid' : 'Free Tier'}`, {
        id: drama._id.toString(),
        isPaid: drama.isPaid,
        plan: drama.plan
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * 8. Admin: Reassign / Shift Drama Priority
   * PATCH /api/v1/dramas/:id/priority
   */
  static async setDramaPriority(req, res, next) {
    try {
      const { id } = req.params;
      const newPriority = Number(req.body.priority || 1);

      const drama = await Drama.findById(id);
      if (!drama) {
        throw new AppError('Drama series not found.', 404, 'DRAMA_NOT_FOUND');
      }

      drama.priority = newPriority;
      await drama.save();

      await normalizePrioritiesInDb();

      return ApiResponse.success(res, 'Drama priority updated successfully', {
        id: drama._id.toString(),
        priority: newPriority
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * 9. Get Single Drama Details
   * GET /api/v1/dramas/:id
   */
  static async getDramaById(req, res, next) {
    try {
      const { id } = req.params;

      let dramaQuery = {};
      if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
        dramaQuery = { _id: id };
      } else {
        dramaQuery = { slug: id.toLowerCase().trim() };
      }

      const drama = await Drama.findOne(dramaQuery).populate('genres', 'name slug icon');
      if (!drama) {
        throw new AppError('Drama series not found.', 404, 'DRAMA_NOT_FOUND');
      }

      const episodes = await Episode.find({ dramaId: drama._id }).sort({ episodeNumber: 1 });
      const genreNames = (drama.genres || []).map((g) => (typeof g === 'object' ? g.name : g)).filter(Boolean);

      return ApiResponse.success(res, 'Drama details retrieved successfully', {
        drama: {
          id: drama._id.toString(),
          title: drama.title,
          slug: drama.slug,
          synopsis: drama.synopsis,
          poster: drama.posterUrl,
          posterUrl: drama.posterUrl,
          banner: drama.bannerUrl,
          bannerUrl: drama.bannerUrl,
          trailerUrl: drama.trailerUrl,
          genres: genreNames.length > 0 ? genreNames : ['Drama'],
          genreDisplay: genreNames.join(' / ') || 'Drama',
          rating: drama.rating,
          viewsCount: drama.viewsCount,
          totalEpisodes: episodes.length || drama.totalEpisodes,
          freeEpisodes: drama.freeEpisodes,
          isPaid: drama.isPaid,
          plan: drama.plan,
          status: drama.status,
          isActive: drama.status === 'PUBLISHED',
          isTrending: drama.isTrending,
          priority: drama.priority,
          episodes: episodes.map((e) => ({
            id: e._id.toString(),
            dramaId: drama._id.toString(),
            episodeNumber: e.episodeNumber,
            title: e.title,
            synopsis: e.synopsis,
            thumbnailUrl: e.thumbnailUrl,
            videoStreamUrl: e.videoStreamUrl,
            duration: e.formattedDuration || '2:15',
            durationSeconds: e.durationSeconds || 135,
            isFree: e.isFree,
            views: formatViews(e.viewsCount || 0),
            videoFileName: `ep_${e.episodeNumber.toString().padStart(2, '0')}_1080p.mp4`,
            subtitleTracks: (e.subtitles || []).map((s) => s.language)
          }))
        }
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * 10. Admin: Batch Save / Update Drama Episodes & Paywall Rules
   * POST /api/v1/dramas/:id/episodes/admin
   */
  static async saveAdminEpisodes(req, res, next) {
    try {
      const { id } = req.params;
      const { episodes = [], freeEpisodes } = req.body;

      const drama = await Drama.findById(id);
      if (!drama) {
        throw new AppError('Drama series not found.', 404, 'DRAMA_NOT_FOUND');
      }

      if (freeEpisodes !== undefined) {
        drama.freeEpisodes = Number(freeEpisodes);
      }

      if (Array.isArray(episodes) && episodes.length > 0) {
        drama.totalEpisodes = episodes.length;

        for (const ep of episodes) {
          const epNum = Number(ep.episodeNumber || 1);
          await Episode.findOneAndUpdate(
            { dramaId: drama._id, episodeNumber: epNum },
            {
              $set: {
                title: ep.title || `Episode ${epNum}`,
                isFree: ep.isFree !== undefined ? Boolean(ep.isFree) : epNum <= (freeEpisodes || drama.freeEpisodes || 3),
                durationSeconds: ep.durationSeconds || 135,
                formattedDuration: ep.duration || '2:15',
                videoStreamUrl: ep.videoStreamUrl || drama.trailerUrl,
                thumbnailUrl: ep.thumbnailUrl || drama.posterUrl
              }
            },
            { upsert: true, new: true }
          );
        }
      }

      await drama.save();

      return ApiResponse.success(res, 'Drama episodes updated successfully', {
        id: drama._id.toString(),
        totalEpisodes: drama.totalEpisodes,
        freeEpisodes: drama.freeEpisodes
      });
    } catch (error) {
      return next(error);
    }
  }
}
