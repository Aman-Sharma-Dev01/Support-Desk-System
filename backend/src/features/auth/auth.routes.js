import express from 'express';
import { login, getMe, register, signup } from './auth.controller.js';
import { protect, adminOnly } from '../../middleware/auth.js';

const router = express.Router();

// Public
router.post('/login', login);
router.post('/signup', signup);


// Protected
router.get('/me', protect, getMe);

// Admin only
router.post('/register', protect, adminOnly, register);

export default router;
