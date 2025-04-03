// Summary
import { Router } from "express";
import { generateSummary, getLatestSummary, sendSummaryEmail } from "src/controllers/endTroller";

const summRouter = Router();

// POST /summary/generate: Generate and store a new summary
summRouter.post('/generate', generateSummary);

// GET /summary/latest: Get the most recent summary
summRouter.get('/latest', getLatestSummary);

// POST /summary/send-email: Simulate sending summary email
summRouter.post('/send-email', sendSummaryEmail);

export default summRouter;