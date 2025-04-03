// Auth
import { Router, Request, Response } from "express";
import dotenv from 'dotenv';
import client from '@repo/db/client';
import { error } from "console";

const axios = require('axios').default; 
dotenv.config();
const gittyRouter = Router();
const CLIENT_ID = process.env.GITHUB_CLIENT_ID!;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET!;
const CALLBACK_URL = process.env.GITHUB_CALLBACK_URL!;

// Get /auth/github - redirecting to github for auth
gittyRouter.get('/github', async (req:Request, res:Response): Promise<void> => {
    const redirectUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${CALLBACK_URL}&scope=user`;
    res.redirect(redirectUrl);
});

// Get /auth/github/callback - Handle Oauth callback and upsert user
gittyRouter.get('/github/callback', async (req:Request, res:Response): Promise<void> => {
    const code = req.query.code;
    if (!code) 
     res.status(400).send("No code recieved");

    try {
        //Exchange code for access token
        const tokenResponse = await axios.post(
            'https://github.com/login/oauth/access_token',
            {
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                code,
                redirect_uri: CALLBACK_URL,
            },
            { headers: { Accept: 'application/json' } }
        );

        const accessToken = tokenResponse.data.access_token;
        if(!accessToken) {
            res.status(400).send("No access token received");
        }

        // Fetch user from Github
        const userResponse = await axios.get('https://api.github.com/user', {
            headers: { Authorization: `token ${accessToken}`},
        });

        const { id, login, name, avatar_url, email } = userResponse.data;

        // Upsert user record in database
        const user = await client.user.upsert({
            where: { githubId: id.toString() },
            update: { name, email, avatarUrl: avatar_url, accessToken },
            create: {
                githubId: id.toString(),
                name,
                email,
                avatarUrl: avatar_url,
                accessToken,
            },
        });

        // Return the user object for now (Add session/jwt later)
        res.json(user);
    } catch { 
        console.error("Error during Github Oauth:", error);
        res.status(500).send("Error during Github Oauth");
    }
});

export default gittyRouter;