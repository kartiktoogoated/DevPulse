//commits
import { rateLimiterMiddleware } from '@/utils/rateLimiter';
import { Router } from 'express';
import { syncCommits } from 'src/controllers/crankyCommit';
import { requireAuth } from 'src/middlewares/authtuah';

const commitRouter = Router();

// POST /commits/sync to trigger commit sync

commitRouter.post('/sync', rateLimiterMiddleware, requireAuth, syncCommits);

export default commitRouter;