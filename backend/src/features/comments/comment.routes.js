import express from 'express';
import { getComments, addComment } from './comment.controller.js';

const router = express.Router({ mergeParams: true });

router.get('/', getComments);
router.post('/', addComment);

export default router;
