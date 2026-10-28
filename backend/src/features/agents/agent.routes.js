import express from 'express';
import { getAgents, createAgent } from './agent.controller.js';

const router = express.Router();

router.get('/', getAgents);
router.post('/', createAgent);

export default router;
