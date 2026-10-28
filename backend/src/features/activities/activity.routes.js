import express from 'express';
import { getTicketActivities } from './activity.controller.js';

const router = express.Router({ mergeParams: true });

router.get('/', getTicketActivities);

export default router;
