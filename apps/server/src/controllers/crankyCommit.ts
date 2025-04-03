import { Request, RequestHandler, Response, NextFunction } from "express";
import client from "@repo/db/client";

const axios = require('axios').default;

// Define the syncCommits function with explicit RequestHandler type.

export const syncCommits: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Retrieve the userId from query parameters
    const userId = req.query.userId as string;
    if (!userId) {
      // Instead of returning the response, just send it and exit the function.
      res.status(400).json({ error: 'Missing userId' });
      return;
    }

    // Retrieve the user from the database using the shared Prisma client
    const user = await client.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    if (!user.accessToken) {
      res.status(400).json({ error: 'No Github access token available' });
      return;
    }

    // Fetch user's repositories from GitHub using their access token
    const reposResponse = await axios.get('https://api.github.com/user/repos', {
      headers: {
        Authorization: `token ${user.accessToken}`,
      },
    });
    const repos = reposResponse.data;

    // For each repository, fetch the commits from GitHub
    const commitPromises = repos.map(async (repo: any) => {
      const { name, owner } = repo;
      const commitResponses = await axios.get(
        `https://api.github.com/repos/${owner.login}/${name}/commits`,
        {
          headers: {
            Authorization: `token ${user.accessToken}`,
          },
        }
      );
      const commits = commitResponses.data;

      // Iterate over each commit and store it in the database.
      for (const commit of commits) {
        await client.commit.create({
          data: {
            userId,
            repoName: name,
            message: commit.commit.message,
            additions: 0, // Replace with actual additions if available
            deletions: 0, // Replace with actual deletions if available
            timestamp: new Date(commit.commit.author.date),
          },
        });
      }

      // Return an object summarizing the commit data for this repository.
      return {
        repo: name,
        commitCount: commits.length,
      };
    });

    // Wait for all repositories' commit fetches to complete.
    const results = await Promise.all(commitPromises);

    // Send the final JSON response.
    // Note: We don't return this value; we just call res.json().
    res.json({ message: 'Commits fetched and stored successfully', data: results });
  } catch (error: any) {
    console.error('Error fetching commits:', error.message);
    res.status(500).json({ error: 'Error fetching commits' });
  }
};
