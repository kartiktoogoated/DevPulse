import { Request, Response } from "express";
import client from '@repo/db/client';

// Generate a summary (simulating AI work)
export const generateSummary = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.body.userId;
        if (!userId) {
            res.status(400).json({ error: "Missing userId" });
            return;
        }

        // In real usage, call your AI service here
        const summaryContent = "This week, you improved backend performance and added new features.";
        const aiSuggestions = "Consider writing more tests and reviewing error handling.";

        const summary = await client.summary.create({
            data: {
                userId,
                weekStart: new Date(),  // Use a calculated week start date in production
                content: summaryContent,
                aiSuggestions: aiSuggestions,
            },
        });

        res.json(summary);
    } catch (error) {
        console.error("Error generating summary:", error);
        res.status(500).json({ error: "Error generating summary" });
    }
};

// Retrieve the latest summary for a user
export const getLatestSummary = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.query.userId as string;
        if (!userId) {
            res.status(400).json({ error: "Missing userId" });
            return;
        }

        const summary = await client.summary.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        if (!summary) {
            res.status(404).json({ error: "No summary found" });
            return;
        }

        res.json(summary);
    } catch (error) {
        console.error("Error fetching summary:", error);
        res.status(500).json({ error: "Error fetching summary" });
    }
};

// Simulate sending summary via email
export const sendSummaryEmail = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.body.userId;
        if (!userId) {
            res.status(400).json({ error: "Missing userId" });
            return;
        }

        // In production, integrate an email service
        res.json({ message: "Email sent successfully (simulated)" });
    } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).json({ error: "Error sending email" });
    }
};
