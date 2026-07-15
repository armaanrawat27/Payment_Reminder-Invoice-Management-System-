import rateLimit from 'express-rate-limit';

export const reminderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    return res.status(429).json({
      error: 'Too many reminder requests from this IP. Please try again after 15 minutes.',
    });
  },
});
