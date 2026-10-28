import express from 'express';
import { getAgents, createAgent, deleteAgent } from './agent.controller.js';

const router = express.Router();

router.get('/', getAgents);
router.post('/', createAgent);
router.delete('/:id', deleteAgent);

export default router;
