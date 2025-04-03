//commits
import { Router } from 'express';
import { syncCommits } from 'src/controllers/crankyCommit';

const commitRouter = Router();

// POST /commits/sync to trigger commit sync

commitRouter.post('/sync', syncCommits);

export default commitRouter;