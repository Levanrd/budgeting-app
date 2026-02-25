import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { email, password, name } = req.body;
      const exists = await User.findOne({ email });
      if (exists) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      const user = await User.create({ email, password, name });
      const token = generateToken(user._id);
      res.status(201).json({
        user: { id: user._id, email: user.email, name: user.name, isAdmin: user.isAdmin },
        token,
      });
    } catch (err) {
      res.status(500).json({ message: err.message || 'Registration failed' });
    }
  }
);

router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { email, password } = req.body;
      const user = await User.findOne({ email }).select('+password');
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      const token = generateToken(user._id);
      res.json({
        user: { id: user._id, email: user.email, name: user.name, isAdmin: user.isAdmin },
        token,
      });
    } catch (err) {
      res.status(500).json({ message: err.message || 'Login failed' });
    }
  }
);

router.get('/me', protect, async (req, res) => {
  res.json({ user: req.user });
});

router.get('/test', async (req, res) => {
  res.json({ message: 'Hello World' });
});

export default router;
