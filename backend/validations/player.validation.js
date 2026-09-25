import Joi from 'joi';

export const playerValidation = {
  // Sync playback progress (Heartbeat & Scrubber)
  recordProgress: Joi.object({
    dramaId: Joi.string()
      .trim()
      .required()
      .messages({
        'string.empty': 'Drama ID is required.',
        'any.required': 'Drama ID is required.'
      }),
    episodeNumber: Joi.number()
      .integer()
      .min(1)
      .default(1),
    watchedSeconds: Joi.number()
      .min(0)
      .required()
      .messages({
        'number.base': 'Watched seconds must be a number.',
        'any.required': 'Watched seconds is required.'
      }),
    durationSeconds: Joi.number()
      .min(0)
      .default(135)
  })
};
