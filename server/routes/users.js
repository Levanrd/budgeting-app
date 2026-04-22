import express from 'express';
import { body, param, validationResult } from 'express-validator';
import User from '../models/User.js';
import { admin, protect, requireCsrf } from '../middleware/auth.js';
import { writeRateLimit } from '../middleware/security.js';

const router = express.Router();

const userPayloadValidators = [
  body('email').optional().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('name').optional().trim().notEmpty().withMessage('Name is required'),
  body('password')
    .optional({ values: 'falsy' })
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('isAdmin').optional().isBoolean().withMessage('isAdmin must be true or false'),
];

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return null;
  }

  return res.status(400).json({
    message: errors.array()[0]?.msg || 'Validation failed',
    errors: errors.array(),
  });
};

const ensureAnotherAdminExists = async (userId) => {
  const adminCount = await User.countDocuments({
    isAdmin: true,
    _id: { $ne: userId },
  });

  return adminCount > 0;
};

router.use(protect, admin);

router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to load users' });
  }
});

router.post(
  '/',
  writeRateLimit,
  requireCsrf,
  [
    body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('isAdmin').optional().isBoolean().withMessage('isAdmin must be true or false'),
  ],
  async (req, res) => {
    try {
      const validationResponse = handleValidation(req, res);
      if (validationResponse) return validationResponse;

      const { email, name, password } = req.body;
      const isAdminUser = req.body.isAdmin === true;

      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      const user = await User.create({
        email,
        name,
        password,
        isAdmin: isAdminUser,
      });

      res.status(201).json({
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          isAdmin: user.isAdmin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    } catch (err) {
      res.status(500).json({ message: err.message || 'Failed to create user' });
    }
  }
);

router.put(
  '/:id',
  writeRateLimit,
  requireCsrf,
  [param('id').isMongoId().withMessage('Invalid user id'), ...userPayloadValidators],
  async (req, res) => {
    try {
      const validationResponse = handleValidation(req, res);
      if (validationResponse) return validationResponse;

      const user = await User.findById(req.params.id).select('+password');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (req.body.email && req.body.email !== user.email) {
        const existing = await User.findOne({ email: req.body.email, _id: { $ne: user._id } });
        if (existing) {
          return res.status(400).json({ message: 'Email already registered' });
        }
        user.email = req.body.email;
      }

      if (req.body.name) {
        user.name = req.body.name;
      }

      if (req.body.password) {
        user.password = req.body.password;
      }

      if (typeof req.body.isAdmin === 'boolean' && req.body.isAdmin !== user.isAdmin) {
        const isDemotingLastAdmin = user.isAdmin && req.body.isAdmin === false;
        if (isDemotingLastAdmin) {
          const hasAnotherAdmin = await ensureAnotherAdminExists(user._id);
          if (!hasAnotherAdmin) {
            return res.status(400).json({ message: 'At least one admin account must remain' });
          }
        }
        user.isAdmin = req.body.isAdmin;
      }

      await user.save();

      res.json({
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          isAdmin: user.isAdmin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    } catch (err) {
      res.status(500).json({ message: err.message || 'Failed to update user' });
    }
  }
);

router.delete(
  '/:id',
  writeRateLimit,
  requireCsrf,
  [param('id').isMongoId().withMessage('Invalid user id')],
  async (req, res) => {
    try {
      const validationResponse = handleValidation(req, res);
      if (validationResponse) return validationResponse;

      if (req.user?._id?.toString() === req.params.id) {
        return res.status(400).json({ message: 'You cannot delete your own account' });
      }

      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (user.isAdmin) {
        const hasAnotherAdmin = await ensureAnotherAdminExists(user._id);
        if (!hasAnotherAdmin) {
          return res.status(400).json({ message: 'At least one admin account must remain' });
        }
      }

      await user.deleteOne();
      res.json({ message: 'User deleted' });
    } catch (err) {
      res.status(500).json({ message: err.message || 'Failed to delete user' });
    }
  }
);

export default router;
