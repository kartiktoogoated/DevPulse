import { Request, Response, NextFunction } from "express";
import Redis from 'ioredis';
import { RateLimiterRedis } from "rate-limiter-flexible";

// Creating a Redis Clientr
const redisUrl = process.env.REDIS_URI || 'redis://localhost:6379';
const redisClient = new Redis(redisUrl);

// Create a rate limiter; 10 reqs per minute per IP
const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'middleware',
    points: 10,
    duration: 60,
});

export const rateLimiterMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Use req.ip 
    const ip = req.ip ?? 'unknown';
    rateLimiter
    .consume(ip)
    .then(() => {
        next();
    })
    .catch(() => {
        res.status(429).send('Too many requests');
    });
};