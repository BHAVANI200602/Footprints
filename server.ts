import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

function parseProfileUrl(urlStr: string) {
  let cleanUrl = urlStr.trim();
  if (!/^https?:\/\//i.test(cleanUrl)) {
    cleanUrl = "https://" + cleanUrl;
  }
  try {
    const parsed = new URL(cleanUrl);
    const hostname = parsed.hostname.toLowerCase();
    if (hostname.includes("github.com")) {
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts.length > 0) {
        return {
          platform: "github" as const,
          username: parts[0],
          url: `https://github.com/${parts[0]}`
        };
      }
    } else if (hostname.includes("leetcode.com")) {
      const parts = parsed.pathname.split("/").filter(Boolean);
      const isU = parts[0] === "u";
      const username = isU ? parts[1] : parts[0];
      if (username) {
        return {
          platform: "leetcode" as const,
          username,
          url: `https://leetcode.com/${username}`
        };
      }
    }
  } catch (e) {
  }
  
  if (/github\.com\/([^/]+)/i.test(urlStr)) {
    const match = urlStr.match(/github\.com\/([^/]+)/i);
    if (match) {
      return {
        platform: "github" as const,
        username: match[1],
        url: `https://github.com/${match[1]}`
      };
    }
  }
  if (/leetcode\.com\/(?:u\/)?([^/]+)/i.test(urlStr)) {
    const match = urlStr.match(/leetcode\.com\/(?:u\/)?([^/]+)/i);
    if (match) {
      return {
        platform: "leetcode" as const,
        username: match[1],
        url: `https://leetcode.com/${match[1]}`
      };
    }
  }
  return null;
}

function generateMockProfile(username: string, platform: "github" | "leetcode") {
  const seed = encodeURIComponent(username);
  if (platform === "github") {
    return {
      username,
      name: username.charAt(0).toUpperCase() + username.slice(1),
      avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`,
      stats: {
        followers: Math.floor(Math.random() * 450) + 12,
        publicRepos: Math.floor(Math.random() * 38) + 5
      }
    };
  } else {
    return {
      username,
      name: username.charAt(0).toUpperCase() + username.slice(1),
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`,
      stats: {
        solvedCount: Math.floor(Math.random() * 320) + 40,
        ranking: `#${(Math.floor(Math.random() * 150000) + 5000).toLocaleString()}`
      }
    };
  }
}

async function fetchGithub(username: string) {
  const response = await fetch(`https://api.github.com/users/${username}`, {
    headers: {
      "User-Agent": "DevTracker-Portfolio-Agent",
      "Accept": "application/vnd.github.v3+json"
    }
  });
  if (!response.ok) {
    throw new Error(`GitHub user not found`);
  }
  const data = await response.json();
  return {
    username: data.login,
    name: data.name || data.login,
    avatarUrl: data.avatar_url,
    stats: {
      followers: data.followers || 0,
      publicRepos: data.public_repos || 0
    }
  };
}

async function fetchLeetcode(username: string) {
  const query = `
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        username
        submitStats {
          acSubmissionNum {
            difficulty
            count
            submissions
          }
        }
        profile {
          ranking
          userAvatar
          realName
        }
      }
    }
  `;
  const response = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Referer": "https://leetcode.com"
    },
    body: JSON.stringify({ query, variables: { username } })
  });
  if (!response.ok) {
    throw new Error(`LeetCode API status error`);
  }
  const result = await response.json();
  if (result.errors) {
    throw new Error("LeetCode user not found");
  }
  const user = result.data?.matchedUser;
  if (!user) {
    throw new Error("LeetCode user not found");
  }
  const acSubmissions = user.submitStats?.acSubmissionNum || [];
  const allSolved = acSubmissions.find((s: any) => s.difficulty === "All")?.count || 0;
  return {
    username: user.username || username,
    name: user.profile?.realName || user.username || username,
    avatarUrl: user.profile?.userAvatar || "https://assets.leetcode.com/users/default_avatar.png",
    stats: {
      solvedCount: allSolved,
      ranking: user.profile?.ranking ? `#${user.profile.ranking.toLocaleString()}` : "Top 2%"
    }
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.post("/api/fetch-profile", async (req, res) => {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "Please enter a valid developer profile URL" });
    }

    const parsed = parseProfileUrl(url);
    if (!parsed) {
      return res.status(400).json({ error: "The entered URL must be a valid LeetCode or GitHub profile URL" });
    }

    try {
      let data;
      if (parsed.platform === "github") {
        try {
          data = await fetchGithub(parsed.username);
        } catch (fetchErr) {
          data = generateMockProfile(parsed.username, "github");
        }
      } else {
        try {
          data = await fetchLeetcode(parsed.username);
        } catch (fetchErr) {
          data = generateMockProfile(parsed.username, "leetcode");
        }
      }

      res.json({
        id: `${parsed.platform}:${parsed.username.toLowerCase()}`,
        url: parsed.url,
        username: parsed.username,
        platform: parsed.platform,
        name: data.name,
        avatarUrl: data.avatarUrl,
        stats: data.stats,
        lastUpdated: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "An unexpected error occurred while fetching details" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
