// Health
import { Router, Request, Response } from "express";

const router = Router();

router.get('/', (req:Request, res:Response) => {
    res.json({ status: 'OK', message: 'DevPulse backend is healthy' });
});

export default router;