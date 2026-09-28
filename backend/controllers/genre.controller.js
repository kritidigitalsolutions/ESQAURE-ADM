import mongoose from 'mongoose';
import { Genre } from '../models/Genre.js';
import { Drama } from '../models/Drama.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';

/**
 * Helper to slugify string
 */
const slugify = (text = '') =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');

export class GenreController {
  /**
   * 1. Admin: Get All Genres with live calculated Drama counts
   * GET /api/v1/genres/admin
   */
  static async getAdminGenres(req, res, next) {
    try {
      const genres = await Genre.find().sort({ displayOrder: 1, createdAt: 1 }).lean();

      // Aggregate real-time drama count for every genre
      const dramaCounts = await Drama.aggregate([
        { $unwind: '$genres' },
        { $group: { _id: '$genres', count: { $sum: 1 } } }
      ]);

      const countMap = {};
      dramaCounts.forEach((dc) => {
        if (dc._id) {
          countMap[dc._id.toString()] = dc.count;
        }
      });

      const formatted = genres.map((g) => {
        const idStr = g._id.toString();
        return {
          id: idStr,
          _id: idStr,
          name: g.name,
          slug: g.slug,
          icon: g.icon || 'Tags',
          iconUrl: g.iconUrl || '',
          imageUrl: g.imageUrl || '',
          color: g.color || '#F59E0B',
          displayOrder: g.displayOrder || 0,
          isActive: Boolean(g.isActive),
          isTrending: Boolean(g.isTrending),
          isPopular: Boolean(g.isPopular),
          dramaCount: countMap[idStr] || 0,
          createdAt: g.createdAt,
          updatedAt: g.updatedAt
        };
      });

      const totalGenres = formatted.length;
      const activeGenres = formatted.filter((g) => g.isActive).length;
      const hiddenGenres = totalGenres - activeGenres;
      const trendingGenres = formatted.filter((g) => g.isTrending).length;
      const popularGenres = formatted.filter((g) => g.isPopular).length;
      const totalSeries = Object.values(countMap).reduce((a, b) => a + b, 0);

      return ApiResponse.success(res, 'Admin genres fetched successfully', {
        genres: formatted,
        stats: {
          totalGenres,
          activeGenres,
          hiddenGenres,
          trendingGenres,
          popularGenres,
          totalSeries
        }
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * 2. Public / Mobile App: Get Active Genres (with optional trending / popular filters)
   * GET /api/v1/genres?trending=true&popular=true
   */
  static async getActiveGenres(req, res, next) {
    try {
      const query = { isActive: true };
      if (req?.query?.trending === 'true') query.isTrending = true;
      if (req?.query?.popular === 'true') query.isPopular = true;

      const genres = await Genre.find(query)
        .sort({ displayOrder: 1, name: 1 })
        .lean();

      const dramaCounts = await Drama.aggregate([
        { $match: { status: 'PUBLISHED' } },
        { $unwind: '$genres' },
        { $group: { _id: '$genres', count: { $sum: 1 } } }
      ]);

      const countMap = {};
      dramaCounts.forEach((dc) => {
        if (dc._id) {
          countMap[dc._id.toString()] = dc.count;
        }
      });

      const formatted = genres.map((g) => {
        const idStr = g._id.toString();
        return {
          id: idStr,
          _id: idStr,
          name: g.name,
          slug: g.slug,
          icon: g.icon || 'Tags',
          iconUrl: g.iconUrl || '',
          imageUrl: g.imageUrl || '',
          color: g.color || '#F59E0B',
          displayOrder: g.displayOrder || 0,
          isActive: true,
          isTrending: Boolean(g.isTrending),
          isPopular: Boolean(g.isPopular),
          dramaCount: countMap[idStr] || 0
        };
      });

      return ApiResponse.success(res, 'Active genres fetched successfully', {
        genres: formatted
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * 3. Get Single Genre by ID
   * GET /api/v1/genres/:id
   */
  static async getGenreById(req, res, next) {
    try {
      const { id } = req.params;

      let genre;
      if (mongoose.Types.ObjectId.isValid(id)) {
        genre = await Genre.findById(id).lean();
      } else {
        genre = await Genre.findOne({ slug: id.toLowerCase().trim() }).lean();
      }

      if (!genre) {
        throw new AppError('Genre not found', 404, 'NOT_FOUND');
      }

      const associatedDramas = await Drama.find({
        genres: genre._id
      })
        .select('title slug posterUrl bannerUrl viewsCount rating status isPaid')
        .sort({ priority: 1, createdAt: -1 })
        .lean();

      return ApiResponse.success(res, 'Genre fetched successfully', {
        genre: {
          id: genre._id.toString(),
          _id: genre._id.toString(),
          name: genre.name,
          slug: genre.slug,
          icon: genre.icon || 'Tags',
          color: genre.color || '#F59E0B',
          displayOrder: genre.displayOrder || 0,
          isActive: genre.isActive,
          dramaCount: associatedDramas.length
        },
        dramas: associatedDramas
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * 4. Admin: Create New Genre
   * POST /api/v1/genres
   */
  static async createGenre(req, res, next) {
    try {
      const { name, slug, icon = 'Heart', color = '#F59E0B', isActive = true, isTrending = false, isPopular = false, displayOrder } = req.body;

      if (!name || !name.trim()) {
        throw new AppError('Genre name is required', 400, 'VALIDATION_ERROR');
      }

      const cleanName = name.trim();
      const cleanSlug = slug && slug.trim() ? slugify(slug) : slugify(cleanName);

      // Check if duplicate name or slug exists
      const existing = await Genre.findOne({
        $or: [
          { name: new RegExp(`^${cleanName}$`, 'i') },
          { slug: cleanSlug }
        ]
      });

      if (existing) {
        throw new AppError(`A genre with the name "${cleanName}" or slug "${cleanSlug}" already exists`, 409, 'DUPLICATE_GENRE');
      }

      let order = displayOrder;
      if (order === undefined || order === null) {
        const lastGenre = await Genre.findOne().sort({ displayOrder: -1 }).select('displayOrder');
        order = lastGenre && typeof lastGenre.displayOrder === 'number' ? lastGenre.displayOrder + 1 : 1;
      }

      const newGenre = await Genre.create({
        name: cleanName,
        slug: cleanSlug,
        icon: icon || 'Tags',
        color: color || '#F59E0B',
        isActive: Boolean(isActive),
        isTrending: Boolean(isTrending),
        isPopular: Boolean(isPopular),
        displayOrder: Number(order) || 0
      });

      return ApiResponse.success(
        res,
        'Genre created successfully',
        {
          genre: {
            id: newGenre._id.toString(),
            _id: newGenre._id.toString(),
            name: newGenre.name,
            slug: newGenre.slug,
            icon: newGenre.icon,
            color: newGenre.color,
            isActive: newGenre.isActive,
            isTrending: newGenre.isTrending,
            isPopular: newGenre.isPopular,
            displayOrder: newGenre.displayOrder,
            dramaCount: 0
          }
        },
        201
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * 5. Admin: Update Existing Genre
   * PATCH /api/v1/genres/:id
   */
  static async updateGenre(req, res, next) {
    try {
      const { id } = req.params;
      const { name, slug, icon, color, isActive, isTrending, isPopular, displayOrder } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError('Invalid Genre ID', 400, 'INVALID_ID');
      }

      const genre = await Genre.findById(id);
      if (!genre) {
        throw new AppError('Genre not found', 404, 'NOT_FOUND');
      }

      if (name && name.trim()) {
        const cleanName = name.trim();
        // Check uniqueness if name changed
        if (cleanName.toLowerCase() !== genre.name.toLowerCase()) {
          const duplicate = await Genre.findOne({
            _id: { $ne: genre._id },
            name: new RegExp(`^${cleanName}$`, 'i')
          });
          if (duplicate) {
            throw new AppError(`Another genre with the name "${cleanName}" already exists`, 409, 'DUPLICATE_NAME');
          }
        }
        genre.name = cleanName;
        if (!slug) {
          genre.slug = slugify(cleanName);
        }
      }

      if (slug && slug.trim()) {
        const cleanSlug = slugify(slug);
        if (cleanSlug !== genre.slug) {
          const duplicate = await Genre.findOne({
            _id: { $ne: genre._id },
            slug: cleanSlug
          });
          if (duplicate) {
            throw new AppError(`Another genre with slug "${cleanSlug}" already exists`, 409, 'DUPLICATE_SLUG');
          }
          genre.slug = cleanSlug;
        }
      }

      if (icon !== undefined) genre.icon = icon;
      if (color !== undefined) genre.color = color;
      if (isActive !== undefined) genre.isActive = Boolean(isActive);
      if (isTrending !== undefined) genre.isTrending = Boolean(isTrending);
      if (isPopular !== undefined) genre.isPopular = Boolean(isPopular);
      if (displayOrder !== undefined) genre.displayOrder = Number(displayOrder);

      await genre.save();

      const dramaCount = await Drama.countDocuments({ genres: genre._id });

      return ApiResponse.success(res, 'Genre updated successfully', {
        genre: {
          id: genre._id.toString(),
          _id: genre._id.toString(),
          name: genre.name,
          slug: genre.slug,
          icon: genre.icon,
          color: genre.color,
          isActive: genre.isActive,
          isTrending: Boolean(genre.isTrending),
          isPopular: Boolean(genre.isPopular),
          displayOrder: genre.displayOrder,
          dramaCount
        }
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * 6. Admin: Toggle Active Status
   * PATCH /api/v1/genres/:id/toggle-active
   */
  static async toggleActive(req, res, next) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError('Invalid Genre ID', 400, 'INVALID_ID');
      }

      const genre = await Genre.findById(id);
      if (!genre) {
        throw new AppError('Genre not found', 404, 'NOT_FOUND');
      }

      genre.isActive = !genre.isActive;
      await genre.save();

      const dramaCount = await Drama.countDocuments({ genres: genre._id });

      return ApiResponse.success(
        res,
        `Genre is now ${genre.isActive ? 'Active' : 'Hidden'}`,
        {
          genre: {
            id: genre._id.toString(),
            _id: genre._id.toString(),
            name: genre.name,
            slug: genre.slug,
            icon: genre.icon,
            color: genre.color,
            isActive: genre.isActive,
            isTrending: Boolean(genre.isTrending),
            isPopular: Boolean(genre.isPopular),
            displayOrder: genre.displayOrder,
            dramaCount
          }
        }
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * 6.1 Admin: Toggle Trending Status
   * PATCH /api/v1/genres/:id/toggle-trending
   */
  static async toggleTrending(req, res, next) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError('Invalid Genre ID', 400, 'INVALID_ID');
      }

      const genre = await Genre.findById(id);
      if (!genre) {
        throw new AppError('Genre not found', 404, 'NOT_FOUND');
      }

      genre.isTrending = !genre.isTrending;
      await genre.save();

      return ApiResponse.success(
        res,
        `Genre is now ${genre.isTrending ? 'marked as Trending' : 'removed from Trending'}`,
        {
          id: genre._id.toString(),
          name: genre.name,
          isTrending: genre.isTrending
        }
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * 6.2 Admin: Toggle Popular Status
   * PATCH /api/v1/genres/:id/toggle-popular
   */
  static async togglePopular(req, res, next) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError('Invalid Genre ID', 400, 'INVALID_ID');
      }

      const genre = await Genre.findById(id);
      if (!genre) {
        throw new AppError('Genre not found', 404, 'NOT_FOUND');
      }

      genre.isPopular = !genre.isPopular;
      await genre.save();

      return ApiResponse.success(
        res,
        `Genre is now ${genre.isPopular ? 'marked as Popular' : 'removed from Popular'}`,
        {
          id: genre._id.toString(),
          name: genre.name,
          isPopular: genre.isPopular
        }
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * 7. Admin: Delete Genre (Cleanly unlinks from dramas)
   * DELETE /api/v1/genres/:id
   */
  static async deleteGenre(req, res, next) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError('Invalid Genre ID', 400, 'INVALID_ID');
      }

      const genre = await Genre.findById(id);
      if (!genre) {
        throw new AppError('Genre not found', 404, 'NOT_FOUND');
      }

      // Unlink from all dramas so no broken references remain
      await Drama.updateMany(
        { genres: genre._id },
        { $pull: { genres: genre._id } }
      );

      await Genre.findByIdAndDelete(genre._id);

      return ApiResponse.success(res, `Genre "${genre.name}" deleted successfully`, {
        deletedId: id
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * 8. Admin: Batch reorder genre display orders / priority ranks
   * PATCH /api/v1/genres/reorder
   */
  static async reorderGenres(req, res, next) {
    try {
      const { items } = req.body; // [{ id: "...", displayOrder: 1, isTrending: true, isPopular: true }]
      if (!Array.isArray(items)) {
        throw new AppError('Items array is required for reordering.', 400, 'VALIDATION_ERROR');
      }

      const bulkOps = items.map((item) => {
        const updateFields = {};
        if (item.displayOrder !== undefined) updateFields.displayOrder = Number(item.displayOrder);
        if (item.isTrending !== undefined) updateFields.isTrending = Boolean(item.isTrending);
        if (item.isPopular !== undefined) updateFields.isPopular = Boolean(item.isPopular);
        if (item.isActive !== undefined) updateFields.isActive = Boolean(item.isActive);

        return {
          updateOne: {
            filter: { _id: item.id },
            update: { $set: updateFields }
          }
        };
      });

      await Genre.bulkWrite(bulkOps);

      return ApiResponse.success(res, 'Genre display priorities updated successfully');
    } catch (error) {
      return next(error);
    }
  }
}
