import React, { useState, useEffect } from "react";
import { 
  Github, 
  Award, 
  RefreshCw, 
  Trash2, 
  Plus, 
  Search, 
  ExternalLink, 
  X, 
  GitBranch, 
  Users, 
  Link as LinkIcon, 
  Calendar, 
  Check, 
  AlertCircle, 
  Sparkles,
  TrendingUp,
  Share2,
  Terminal,
  Grid
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { DeveloperProfile, Platform } from "./types";

const DEFAULT_PROFILES: DeveloperProfile[] = [];

export default function App() {
  const [profiles, setProfiles] = useState<DeveloperProfile[]>(() => {
    const saved = localStorage.getItem("footprints_profiles");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_PROFILES;
      }
    }
    return DEFAULT_PROFILES;
  });

  const [inputUrl, setInputUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<"all" | "github" | "leetcode">("all");
  const [sortBy, setSortBy] = useState<"dateAdded" | "username" | "followers" | "solved">("dateAdded");
  const [activeDetailProfile, setActiveDetailProfile] = useState<DeveloperProfile | null>(null);
  const [refreshingIds, setRefreshingIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem("footprints_profiles", JSON.stringify(profiles));
  }, [profiles]);

  const handleTrackProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmedUrl = inputUrl.trim();
    if (!trimmedUrl) {
      setErrorMsg("Please enter a profile URL first.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/fetch-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ url: trimmedUrl })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process profile URL.");
      }

      const duplicate = profiles.find(p => p.id === data.id);
      if (duplicate) {
        setErrorMsg(`Profile for "${data.username}" is already being tracked.`);
        setIsLoading(false);
        return;
      }

      setProfiles(prev => [data, ...prev]);
      setSuccessMsg(`Successfully started tracking ${data.name || data.username}!`);
      setInputUrl("");
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while tracking the profile.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshProfile = async (profile: DeveloperProfile) => {
    setRefreshingIds(prev => [...prev, profile.id]);
    try {
      const response = await fetch("/api/fetch-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ url: profile.url })
      });
      const data = await response.json();
      if (response.ok) {
        setProfiles(prev => prev.map(p => p.id === profile.id ? data : p));
      }
    } catch (e) {
    } finally {
      setRefreshingIds(prev => prev.filter(id => id !== profile.id));
    }
  };

  const handleRefreshAll = async () => {
    if (profiles.length === 0) return;
    setRefreshingIds(profiles.map(p => p.id));
    for (const profile of profiles) {
      try {
        const response = await fetch("/api/fetch-profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ url: profile.url })
        });
        const data = await response.json();
        if (response.ok) {
          setProfiles(prev => prev.map(p => p.id === profile.id ? data : p));
        }
      } catch (e) {
      } finally {
        setRefreshingIds(prev => prev.filter(id => id !== profile.id));
      }
    }
  };

  const handleDeleteProfile = (id: string, name: string) => {
    setProfiles(prev => prev.filter(p => p.id !== id));
    setSuccessMsg(`"${name}" deleted successfully! All cache data has been securely deleted from local storage.`);
    if (activeDetailProfile?.id === id) {
      setActiveDetailProfile(null);
    }
  };

  const handleCopyProfileUrl = (profile: DeveloperProfile) => {
    navigator.clipboard.writeText(profile.url);
    setCopiedId(profile.id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const filteredAndSortedProfiles = profiles
    .filter(profile => {
      const matchesSearch = 
        profile.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesPlatform = 
        platformFilter === "all" || 
        profile.platform === platformFilter;

      return matchesSearch && matchesPlatform;
    })
    .sort((a, b) => {
      if (sortBy === "username") {
        return a.username.localeCompare(b.username);
      }
      if (sortBy === "followers") {
        const aFollowers = a.stats.followers || 0;
        const bFollowers = b.stats.followers || 0;
        return bFollowers - aFollowers;
      }
      if (sortBy === "solved") {
        const aSolved = a.stats.solvedCount || 0;
        const bSolved = b.stats.solvedCount || 0;
        return bSolved - aSolved;
      }
      return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
    });

  const gitHubCount = profiles.filter(p => p.platform === "github").length;
  const leetCodeCount = profiles.filter(p => p.platform === "leetcode").length;

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#e7e0e7] font-sans antialiased flex flex-col relative overflow-x-hidden select-none">
      <header className="sticky top-0 z-40 bg-[#151217]/90 backdrop-blur-md border-b border-[#334155]/60">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-[#d7baff] to-[#ffb867] bg-clip-text text-transparent">
                Footprints
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-mono px-2 py-0.5 bg-[#1d1b1f] border border-[#4a454f] rounded-full text-[#ccc4d0]">
                Live
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4 text-xs font-mono text-[#ccc4d0]">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-[#1e293b] border border-[#334155] rounded-md">
                <span className="inline-block w-2 h-2 rounded-full bg-indigo-400"></span>
                <span>Secure Local Vault</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-[#1e293b] border border-[#334155] rounded-md">
                <span>Github: <strong className="text-[#d7baff]">{gitHubCount}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-[#1e293b] border border-[#334155] rounded-md">
                <span>LeetCode: <strong className="text-[#ffb867]">{leetCodeCount}</strong></span>
              </div>
            </div>

            <nav className="flex items-center gap-2">
              <button className="text-sm font-semibold text-[#d7baff] border-b-2 border-[#d7baff] pb-1 cursor-default">
                My Dashboard
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 relative">
        <section className="text-center max-w-3xl mx-auto mb-16 px-4">
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4"
          >
            Track Your Developer Journey
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-base sm:text-lg text-[#ccc4d0] leading-relaxed mb-10 max-w-2xl mx-auto"
          >
            Aggregate and monitor coding footprints from GitHub and LeetCode in a centralized, private portal. No registration or database needed — completely powered by your local storage.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full relative max-w-2xl mx-auto"
          >
            <div className="absolute inset-x-0 -top-4 -bottom-4 bg-gradient-to-r from-[#d7baff]/10 to-[#ffb867]/10 blur-xl rounded-2xl opacity-60 pointer-events-none"></div>
            
            <form onSubmit={handleTrackProfile} className="relative flex items-center bg-[#1e293b] rounded-xl border border-[#334155] p-2 focus-within:border-[#d7baff] focus-within:ring-2 focus-within:ring-[#d7baff]/20 transition-all shadow-xl overflow-hidden">
              <div className="flex items-center pl-3 text-[#ccc4d0]">
                <LinkIcon className="w-5 h-5" />
              </div>
              <input 
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="Paste profile URL: github.com/user OR leetcode.com/user"
                className="w-full bg-transparent border-0 outline-none focus:ring-0 text-[#e7e0e7] font-mono text-sm px-4 py-2 placeholder-[#958e9a]"
              />
              <button 
                type="submit"
                disabled={isLoading}
                className="bg-[#6e5494] hover:bg-[#8364ad] text-white px-6 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span>Track</span>
              </button>
            </form>

            <AnimatePresence>
              {errorMsg && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-3 py-2 px-4 bg-[#93000a]/30 border border-[#ffb4ab]/30 text-[#ffb4ab] text-xs font-mono rounded-lg flex items-center gap-2 justify-center"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </motion.div>
              )}

              {successMsg && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-3 py-2.5 px-4 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono rounded-lg flex items-center gap-2 justify-center shadow-lg"
                >
                  <Check className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                  <span>{successMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </section>

        <section className="bg-[#1e293b]/40 backdrop-blur-sm border border-[#334155]/50 rounded-2xl p-6 mb-8 shadow-md">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <button 
                onClick={() => setPlatformFilter("all")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${
                  platformFilter === "all" 
                    ? "bg-[#d7baff] text-[#3c2360] border-[#d7baff]" 
                    : "bg-[#151217]/40 text-[#ccc4d0] border-[#334155] hover:border-[#958e9a]"
                }`}
              >
                All Platforms
              </button>
              <button 
                onClick={() => setPlatformFilter("github")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border flex items-center gap-1.5 ${
                  platformFilter === "github" 
                    ? "bg-[#6e5494] text-white border-[#6e5494]" 
                    : "bg-[#151217]/40 text-[#ccc4d0] border-[#334155] hover:border-[#958e9a]"
                }`}
              >
                <Github className="w-3.5 h-3.5" />
                <span>GitHub</span>
              </button>
              <button 
                onClick={() => setPlatformFilter("leetcode")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border flex items-center gap-1.5 ${
                  platformFilter === "leetcode" 
                    ? "bg-[#f29600] text-[#1d1d00] border-[#f29600]" 
                    : "bg-[#151217]/40 text-[#ccc4d0] border-[#334155] hover:border-[#958e9a]"
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>LeetCode</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-60">
                <Search className="w-4 h-4 text-[#958e9a] absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tracked devs..."
                  className="w-full bg-[#151217]/50 border border-[#334155] rounded-lg text-xs font-mono pl-9 pr-4 py-2 text-[#e7e0e7] focus:border-[#d7baff] focus:ring-1 focus:ring-[#d7baff]/20 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <select 
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="bg-[#151217]/50 border border-[#334155] rounded-lg text-xs font-mono px-3 py-2 text-[#ccc4d0] outline-none focus:border-[#d7baff]"
                >
                  <option value="dateAdded">Sort: Date Added</option>
                  <option value="username">Sort: Username</option>
                  <option value="followers">Sort: Followers (GitHub)</option>
                  <option value="solved">Sort: Solved (LeetCode)</option>
                </select>

                <button 
                  onClick={handleRefreshAll}
                  disabled={profiles.length === 0}
                  className="bg-[#1d1b1f] hover:bg-[#2c292e] text-[#ccc4d0] border border-[#334155] p-2 rounded-lg transition-all flex items-center justify-center disabled:opacity-40"
                  title="Force re-fetch stats"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshingIds.length > 0 ? "animate-spin text-[#d7baff]" : ""}`} />
                </button>
              </div>

            </div>
          </div>
        </section>

        <section className="relative">
          <AnimatePresence mode="popLayout">
            {filteredAndSortedProfiles.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 text-center bg-[#1e293b]/10 border border-[#334155]/20 rounded-2xl"
              >
                <div className="p-4 bg-[#d7baff]/5 border border-[#d7baff]/15 rounded-full mb-4">
                  <Grid className="w-8 h-8 text-[#958e9a]" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">No Profiles Found</h3>
                <p className="text-sm text-[#ccc4d0] max-w-sm px-4">
                  {profiles.length === 0 
                    ? "Your tracking deck is empty. Paste a profile link above to start monitoring!"
                    : "No tracked profiles match your current search queries or platform filters."}
                </p>
              </motion.div>
            ) : (
              <motion.div 
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredAndSortedProfiles.map((profile) => {
                  const isGitHub = profile.platform === "github";
                  const isRefreshing = refreshingIds.includes(profile.id);
                  
                  return (
                    <motion.article
                      layout
                      key={profile.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      className={`relative flex flex-col bg-[#1e293b]/70 backdrop-blur-sm rounded-2xl border-t-4 p-5 hover:border-[#d7baff]/50 hover:shadow-xl transition-all ${
                        isGitHub ? "border-t-[#6e5494] border-x border-b border-[#334155]" : "border-t-[#f29600] border-x border-b border-[#334155]"
                      }`}
                    >
                      <div className="absolute top-4 right-4 flex items-center gap-1.5">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRefreshProfile(profile);
                          }}
                          disabled={isRefreshing}
                          className="p-1 px-1.5 text-xs text-[#958e9a] hover:text-white bg-[#151217]/50 rounded border border-[#334155] transition-all flex items-center gap-1"
                          title="Refresh Stats"
                        >
                          <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProfile(profile.id, profile.name);
                          }}
                          className="p-1.5 text-[#958e9a] hover:text-rose-400 bg-rose-950/20 rounded border border-[#334155] transition-all"
                          title="Remove from List"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div 
                        className="flex items-center gap-4 mb-4 cursor-pointer" 
                        onClick={() => setActiveDetailProfile(profile)}
                      >
                        <div className="relative">
                          <img 
                            src={profile.avatarUrl} 
                            alt={profile.username}
                            className={`w-14 h-14 rounded-full border-2 p-0.5 object-cover bg-[#0f172a] ${
                              isGitHub ? "border-[#6e5494]" : "border-[#f29600]"
                            }`} 
                          />
                          <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#1e293b] ${
                            isGitHub ? "bg-emerald-500" : "bg-amber-500"
                          }`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-bold text-white tracking-tight truncate hover:text-[#d7baff] transition-colors">
                            {profile.name}
                          </h3>
                          <p className="text-xs font-mono text-[#958e9a] truncate">
                            @{profile.username}
                          </p>
                          <div className="mt-1 flex items-center gap-1.5">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono tracking-wider uppercase font-bold rounded-full ${
                              isGitHub 
                                ? "bg-[#d7baff]/10 text-[#d7baff] border border-[#d7baff]/20" 
                                : "bg-[#ffb867]/10 text-[#ffb867] border border-[#ffb867]/20"
                            }`}>
                              {isGitHub ? <Github className="w-2.5 h-2.5" /> : <Award className="w-2.5 h-2.5" />}
                              <span>{profile.platform}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-5 mt-auto pt-4">
                        {isGitHub ? (
                          <>
                            <div className="bg-[#151217]/50 border border-[#334155] p-2.5 rounded-lg">
                              <span className="block text-[10px] font-mono text-[#958e9a] uppercase mb-0.5 tracking-wider font-semibold">Followers</span>
                              <div className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5 text-indigo-400" />
                                <span className="text-sm font-bold font-mono text-white">
                                  {profile.stats.followers?.toLocaleString() || 0}
                                </span>
                              </div>
                            </div>
                            <div className="bg-[#151217]/50 border border-[#334155] p-2.5 rounded-lg">
                              <span className="block text-[10px] font-mono text-[#958e9a] uppercase mb-0.5 tracking-wider font-semibold">Repositories</span>
                              <div className="flex items-center gap-1">
                                <GitBranch className="w-3.5 h-3.5 text-purple-400" />
                                <span className="text-sm font-bold font-mono text-white">
                                  {profile.stats.publicRepos || 0}
                                </span>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="bg-[#151217]/50 border border-[#334155] p-2.5 rounded-lg">
                              <span className="block text-[10px] font-mono text-[#958e9a] uppercase mb-0.5 tracking-wider font-semibold">Solved</span>
                              <div className="flex items-center gap-1">
                                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-sm font-bold font-mono text-white">
                                  {profile.stats.solvedCount || 0}
                                </span>
                              </div>
                            </div>
                            <div className="bg-[#151217]/50 border border-[#334155] p-2.5 rounded-lg">
                              <span className="block text-[10px] font-mono text-[#958e9a] uppercase mb-0.5 tracking-wider font-semibold">Rank</span>
                              <div className="flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                <span className="text-sm font-bold font-mono text-white truncate max-w-full">
                                  {profile.stats.ranking || "N/A"}
                                </span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="mb-4 h-5 flex items-end gap-1 px-1">
                        <div className={`w-full rounded-t-sm h-[35%] opacity-65 ${isGitHub ? "bg-[#6e5494]" : "bg-[#f29600]"}`}></div>
                        <div className={`w-full rounded-t-sm h-[60%] opacity-85 ${isGitHub ? "bg-[#6e5494]" : "bg-[#f29600]"}`}></div>
                        <div className={`w-full rounded-t-sm h-[40%] opacity-50 ${isGitHub ? "bg-[#6e5494]" : "bg-[#f29600]"}`}></div>
                        <div className={`w-full rounded-t-sm h-[85%] opacity-100 ${isGitHub ? "bg-[#6e5494]" : "bg-[#f29600]"}`}></div>
                        <div className={`w-full rounded-t-sm h-[50%] opacity-65 ${isGitHub ? "bg-[#6e5494]" : "bg-[#f29600]"}`}></div>
                        <div className={`w-full rounded-t-sm h-[95%] opacity-90 ${isGitHub ? "bg-[#6e5494]" : "bg-[#f29600]"}`}></div>
                        <div className={`w-full rounded-t-sm h-[70%] opacity-75 ${isGitHub ? "bg-[#6e5494]" : "bg-[#f29600]"}`}></div>
                      </div>

                      <div className="flex items-center justify-between border-t border-[#334155]/50 pt-3 text-[10px] font-mono text-[#958e9a]">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Updated {new Date(profile.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <button 
                          onClick={() => setActiveDetailProfile(profile)}
                          className="text-[#d7baff] hover:underline flex items-center gap-0.5 font-bold"
                        >
                          <span>Explore</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </motion.article>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      <AnimatePresence>
        {activeDetailProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#0f0d12]/80 backdrop-blur-md"
              onClick={() => setActiveDetailProfile(null)}
            ></motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-[#211f23] rounded-2xl border border-[#4a454f] overflow-hidden shadow-2xl z-10 flex flex-col max-h-[85vh]"
            >
              <div className="p-4 bg-[#1d1b1f] border-b border-[#4a454f] flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#d7baff]" />
                  <span className="text-xs font-mono font-bold text-[#ccc4d0]">profile_analyser_output.sh</span>
                </div>
                <button 
                  onClick={() => setActiveDetailProfile(null)}
                  className="p-1 text-[#ccc4d0] hover:text-white"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <div className="flex items-center gap-4 mb-6">
                  <img 
                    src={activeDetailProfile.avatarUrl} 
                    alt={activeDetailProfile.username}
                    className={`w-16 h-16 rounded-full border-2 p-0.5 object-cover bg-[#0f172a] ${
                      activeDetailProfile.platform === "github" ? "border-[#6e5494]" : "border-[#f29600]"
                    }`}
                  />
                  <div>
                    <h2 className="text-xl font-extrabold text-white">{activeDetailProfile.name}</h2>
                    <p className="text-sm font-mono text-[#ccc4d0]">@{activeDetailProfile.username}</p>
                    <a 
                      href={activeDetailProfile.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#d7baff] hover:underline inline-flex items-center gap-1 mt-1 font-mono"
                    >
                      <span>{activeDetailProfile.url}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#1d1b1f] p-3 rounded-xl border border-[#4a454f]">
                      <span className="text-[10px] font-mono text-[#958e9a] uppercase tracking-wider block mb-1">Telemetry Origin</span>
                      <span className="text-sm font-mono font-bold text-white capitalize">{activeDetailProfile.platform} Integration</span>
                    </div>
                    <div className="bg-[#1d1b1f] p-3 rounded-xl border border-[#4a454f]">
                      <span className="text-[10px] font-mono text-[#958e9a] uppercase tracking-wider block mb-1">Cache Timestamp</span>
                      <span className="text-sm font-mono font-bold text-white">
                        {new Date(activeDetailProfile.lastUpdated).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#1d1b1f] p-4 rounded-xl border border-[#4a454f]">
                    <span className="text-[10px] font-mono text-[#958e9a] uppercase tracking-wider block mb-2">Technical Capabilities</span>
                    
                    {activeDetailProfile.platform === "github" ? (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs text-[#ccc4d0]">
                          <span>Community Reach</span>
                          <span className="font-mono text-white font-bold">{activeDetailProfile.stats.followers?.toLocaleString() || 0} followers</span>
                        </div>
                        <div className="w-full bg-[#2c292e] rounded-full h-1.5">
                          <div className="bg-[#6e5494] h-1.5 rounded-full" style={{ width: `${Math.min(100, ((activeDetailProfile.stats.followers || 0) / 5000) * 100)}%` }}></div>
                        </div>

                        <div className="flex justify-between items-center text-xs text-[#ccc4d0] pt-2">
                          <span>Repository Base</span>
                          <span className="font-mono text-white font-bold">{activeDetailProfile.stats.publicRepos || 0} open repos</span>
                        </div>
                        <div className="w-full bg-[#2c292e] rounded-full h-1.5">
                          <div className="bg-[#6e5494] h-1.5 rounded-full" style={{ width: `${Math.min(100, ((activeDetailProfile.stats.publicRepos || 0) / 150) * 100)}%` }}></div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs text-[#ccc4d0]">
                          <span>Problem Solving Index</span>
                          <span className="font-mono text-white font-bold">{activeDetailProfile.stats.solvedCount || 0} Solved</span>
                        </div>
                        <div className="w-full bg-[#2c292e] rounded-full h-1.5">
                          <div className="bg-[#f29600] h-1.5 rounded-full" style={{ width: `${Math.min(100, ((activeDetailProfile.stats.solvedCount || 0) / 1000) * 100)}%` }}></div>
                        </div>

                        <div className="flex justify-between items-center text-xs text-[#ccc4d0] pt-2">
                          <span>Developer Ranking</span>
                          <span className="font-mono text-white font-bold">{activeDetailProfile.stats.ranking || "N/A"}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#1d1b1f] border-t border-[#4a454f] flex gap-2">
                <button 
                  onClick={() => handleCopyProfileUrl(activeDetailProfile)}
                  className="flex-1 bg-[#2c292e] hover:bg-[#373438] text-white border border-[#4a454f] py-2 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-2"
                >
                  {copiedId === activeDetailProfile.id ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Copied Link!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      <span>Copy Profile URL</span>
                    </>
                  )}
                </button>
                <button 
                  onClick={() => handleDeleteProfile(activeDetailProfile.id, activeDetailProfile.name)}
                  className="bg-rose-950/40 hover:bg-rose-900/50 text-[#ffb4ab] border border-rose-900 py-2 px-4 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="mt-auto bg-[#0f0d12] border-t border-[#334155]/60 py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-mono text-[#958e9a]">
          <div>
            <span>Footprints - Secure local cataloging.</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Direct GitHub user API</span>
            <span>•</span>
            <span>LeetCode Official GraphQL</span>
          </div>
          <div>
            <span className="text-[#ffb867]">Zero Authentication Required</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
