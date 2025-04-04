import { Request, RequestHandler, Response, NextFunction } from "express";
import client from "@repo/db/client";
import { AuthRequest } from "src/middlewares/authtuah";
import axios from "axios";

export const syncCommits: RequestHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(400).json({ error: 'Missing userId' });
      return;
    }

    const user = await client.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    if (!user.accessToken) {
      res.status(400).json({ error: 'No Github access token available' });
      return;
    }

    // Fetch user's repositories (only the ones you own) from GitHub
    const reposResponse = await axios.get('https://api.github.com/user/repos?type=owner', {
      headers: { Authorization: `token ${user.accessToken}` },
    });
    let repos = reposResponse.data;

    // If you want, you can filter out forked repos here,
    // but since you need commits from your forked repos as well,
    // we'll keep them and add additional filtering.
    // repos = repos.filter((repo: any) => !repo.fork);

    const commitPromises = repos.map(async (repo: any) => {
      const { name, owner, fork } = repo;
      let allCommits: any[] = [];
      let page = 1;
      const perPage = 100; // Fetch up to 100 commits per request

      // Build the base URL for commits.
      // For forked repos, filter commits by your GitHub login to only fetch your commits.
      const baseUrl = `https://api.github.com/repos/${owner.login}/${name}/commits`;
      
      // Loop through pages until no more commits are returned.
      while (true) {
        let url = `${baseUrl}?per_page=${perPage}&page=${page}`;
        // If this repo is a fork, add author filter
        if (fork) {
          // userResponse from OAuth returned "login" earlier; use it here.
          url += `&author=${user.githubId ? user.githubId : ''}`; // You might instead use your GitHub login if stored separately.
          // Alternatively, if you stored the GitHub login during OAuth, use that.
          // For example: url += `&author=${user.login}`;
        }
        try {
          const commitResponse = await axios.get(url, {
            headers: { Authorization: `token ${user.accessToken}` },
          });
          const commits = commitResponse.data;
          if (commits.length === 0) break;
          allCommits = allCommits.concat(commits);
          page++;
        } catch (err: any) {
          if (err.response && err.response.status === 409) {
            console.warn(`Repo "${name}" is empty. Skipping commits fetch.`);
            break;
          } else {
            throw err;
          }
        }
      }

      // Use upsert to insert commits without duplicates, using commit SHA as a unique identifier.
      for (const commit of allCommits) {
        const commitSha = commit.sha;

        // Fetch detailed commit info to get additions/deletions
        let additions = 0;
        let deletions = 0;

        try {
          const detailRes = await axios.get(
            `https://api.github.com/repos/${owner.login}/${name}/commits/${commitSha}`,
            { headers : { Authorization: `token ${user.accessToken}` } }
          );
          const stats = detailRes.data.stats;
          additions = stats.additions;
          deletions = stats.deletions;
        } catch (err:any) {
          console.warn(`Failed to fetch commit details for ${commitSha}`);
        }

        // Save to DB with stats
        await client.commit.upsert({
          where: { sha: commitSha },
          update: {},
          create: {
            userId,
            repoName: name,
            sha: commitSha,
            message: commit.commit.message,
            additions,
            deletions,
            timestamp: new Date(commit.commit.author.date),
          }
        })
      }
    });

    const results = await Promise.all(commitPromises);
    res.json({ message: 'Commits fetched and stored successfully', data: results });
  } catch (error: any) {
    console.error('Error fetching commits:', error.message);
    res.status(500).json({ error: 'Error fetching commits' });
  }
};
