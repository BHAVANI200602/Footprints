export type Platform = "github" | "leetcode";

export interface ProfileStats {
  followers?: number;
  publicRepos?: number;
  solvedCount?: number;
  ranking?: string;
  acceptanceRate?: string;
  totalSubmissions?: number;
}

export interface DeveloperProfile {
  id: string;
  url: string;
  username: string;
  platform: Platform;
  name: string;
  avatarUrl: string;
  stats: ProfileStats;
  lastUpdated: string;
}
