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
  Grid,
  Database
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
  const [storageLog, setStorageLog] = useState<{time: string; action: string; detail: string; type: 'add' | 'delete' | 'refresh'}[]>([]);

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
      setStorageLog(prev => [{time: new Date().toISOString(), action: 'STORED', detail: `${data.platform.toUpperCase()} • ${data.username}`, type: 'add' as const}, ...prev.slice(0, 49)]);
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
          setStorageLog(prev => [{time: new Date().toISOString(), action: 'UPDATED', detail: `${profile.platform.toUpperCase()} • ${profile.username}`, type: 'refresh' as const}, ...prev.slice(0, 49)]);
        }
      } catch (e) {
      } finally {
        setRefreshingIds(prev => prev.filter(id => id !== profile.id));
      }
    }
  };

  const handleDeleteProfile = (id: string, name: string) => {
    const profileToDelete = profiles.find(p => p.id === id);
    setProfiles(prev => prev.filter(p => p.id !== id));
    setSuccessMsg(`"${name}" deleted successfully! All cache data has been securely deleted from local storage.`);
    if (profileToDelete) {
      setStorageLog(prev => [{time: new Date().toISOString(), action: 'PURGED', detail: `${profileToDelete.platform.toUpperCase()} • ${profileToDelete.username}`, type: 'delete' as const}, ...prev.slice(0, 49)]);
    }
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
    <div className="min-h-screen bg-[#131313] text-[#e2e2e2] font-sans antialiased flex flex-col relative overflow-x-hidden select-none">
      <header className="sticky top-0 z-40 bg-[#1a1a1a]/90 backdrop-blur-md border-b border-[#2c2c2c]/60">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-[#8ab4d4] to-[#dfaa60] bg-clip-text text-transparent">
                Footprints
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-mono px-2 py-0.5 bg-[#1e1e1e] border border-[#383838] rounded-full text-[#9e9e9e]">
                Live
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4 text-xs font-mono text-[#9e9e9e]">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-[#1f1f1f] border border-[#2c2c2c] rounded-md">
                <span className="inline-block w-2 h-2 rounded-full bg-indigo-400"></span>
                <span>Secure Local Vault</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-[#1f1f1f] border border-[#2c2c2c] rounded-md">
                <span>Github: <strong className="text-[#8ab4d4]">{gitHubCount}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-[#1f1f1f] border border-[#2c2c2c] rounded-md">
                <span>LeetCode: <strong className="text-[#dfaa60]">{leetCodeCount}</strong></span>
              </div>
            </div>

            <nav className="flex items-center gap-2">
              <button className="text-sm font-semibold text-[#8ab4d4] border-b-2 border-[#8ab4d4] pb-1 cursor-default">
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
            className="text-base sm:text-lg text-[#9e9e9e] leading-relaxed mb-10 max-w-2xl mx-auto"
          >
            Aggregate and monitor coding footprints from GitHub and LeetCode in a centralized, private portal. No registration or database needed — completely powered by your local storage.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full relative max-w-2xl mx-auto"
          >
            <div className="absolute inset-x-0 -top-4 -bottom-4 bg-gradient-to-r from-[#8ab4d4]/10 to-[#dfaa60]/10 blur-xl rounded-2xl opacity-60 pointer-events-none"></div>
            
            <form onSubmit={handleTrackProfile} className="relative flex items-center bg-[#1f1f1f] rounded-xl border border-[#2c2c2c] p-2 focus-within:border-[#8ab4d4] focus-within:ring-2 focus-within:ring-[#8ab4d4]/20 transition-all shadow-xl overflow-hidden">
              <div className="flex items-center pl-3 text-[#9e9e9e]">
                <LinkIcon className="w-5 h-5" />
              </div>
              <input 
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="Paste profile URL: github.com/user OR leetcode.com/user"
                className="w-full bg-transparent border-0 outline-none focus:ring-0 text-[#e2e2e2] font-mono text-sm px-4 py-2 placeholder-[#636363]"
              />
              <button 
                type="submit"
                disabled={isLoading}
                className="bg-[#4d87ad] hover:bg-[#5e98be] text-white px-6 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0"
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

        <section className="bg-[#1f1f1f]/40 backdrop-blur-sm border border-[#2c2c2c]/50 rounded-2xl p-6 mb-8 shadow-md">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <button 
                onClick={() => setPlatformFilter("all")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${
                  platformFilter === "all" 
                    ? "bg-[#8ab4d4] text-[#1a2f3d] border-[#8ab4d4]" 
                    : "bg-[#1a1a1a]/40 text-[#9e9e9e] border-[#2c2c2c] hover:border-[#636363]"
                }`}
              >
                All Platforms
              </button>
              <button 
                onClick={() => setPlatformFilter("github")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border flex items-center gap-1.5 ${
                  platformFilter === "github" 
                    ? "bg-[#4d87ad] text-white border-[#4d87ad]" 
                    : "bg-[#1a1a1a]/40 text-[#9e9e9e] border-[#2c2c2c] hover:border-[#636363]"
                }`}
              >
                <Github className="w-3.5 h-3.5" />
                <span>GitHub</span>
              </button>
              <button 
                onClick={() => setPlatformFilter("leetcode")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border flex items-center gap-1.5 ${
                  platformFilter === "leetcode" 
                    ? "bg-[#c9853e] text-[#1f1400] border-[#c9853e]" 
                    : "bg-[#1a1a1a]/40 text-[#9e9e9e] border-[#2c2c2c] hover:border-[#636363]"
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>LeetCode</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-60">
                <Search className="w-4 h-4 text-[#636363] absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tracked devs..."
                  className="w-full bg-[#1a1a1a]/50 border border-[#2c2c2c] rounded-lg text-xs font-mono pl-9 pr-4 py-2 text-[#e2e2e2] focus:border-[#8ab4d4] focus:ring-1 focus:ring-[#8ab4d4]/20 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <select 
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="bg-[#1a1a1a]/50 border border-[#2c2c2c] rounded-lg text-xs font-mono px-3 py-2 text-[#9e9e9e] outline-none focus:border-[#8ab4d4]"
                >
                  <option value="dateAdded">Sort: Date Added</option>
                  <option value="username">Sort: Username</option>
                  <option value="followers">Sort: Followers (GitHub)</option>
                  <option value="solved">Sort: Solved (LeetCode)</option>
                </select>

                <button 
                  onClick={handleRefreshAll}
                  disabled={profiles.length === 0}
                  className="bg-[#1e1e1e] hover:bg-[#2a2a2a] text-[#9e9e9e] border border-[#2c2c2c] p-2 rounded-lg transition-all flex items-center justify-center disabled:opacity-40"
                  title="Force re-fetch stats"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshingIds.length > 0 ? "animate-spin text-[#8ab4d4]" : ""}`} />
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
                className="flex flex-col items-center justify-center py-20 text-center bg-[#1f1f1f]/10 border border-[#2c2c2c]/20 rounded-2xl"
              >
                <div className="p-4 bg-[#8ab4d4]/5 border border-[#8ab4d4]/15 rounded-full mb-4">
                  <Grid className="w-8 h-8 text-[#636363]" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">No Profiles Found</h3>
                <p className="text-sm text-[#9e9e9e] max-w-sm px-4">
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
                      className={`relative flex flex-col bg-[#1f1f1f]/70 backdrop-blur-sm rounded-2xl border-t-4 p-5 hover:border-[#8ab4d4]/50 hover:shadow-xl transition-all ${
                        isGitHub ? "border-t-[#4d87ad] border-x border-b border-[#2c2c2c]" : "border-t-[#c9853e] border-x border-b border-[#2c2c2c]"
                      }`}
                    >
                      <div className="absolute top-4 right-4 flex items-center gap-1.5">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRefreshProfile(profile);
                          }}
                          disabled={isRefreshing}
                          className="p-1 px-1.5 text-xs text-[#636363] hover:text-white bg-[#1a1a1a]/50 rounded border border-[#2c2c2c] transition-all flex items-center gap-1"
                          title="Refresh Stats"
                        >
                          <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProfile(profile.id, profile.name);
                          }}
                          className="p-1.5 text-[#636363] hover:text-rose-400 bg-rose-950/20 rounded border border-[#2c2c2c] transition-all"
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
                            className={`w-14 h-14 rounded-full border-2 p-0.5 object-cover bg-[#131313] ${
                              isGitHub ? "border-[#4d87ad]" : "border-[#c9853e]"
                            }`} 
                          />
                          <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#1f1f1f] ${
                            isGitHub ? "bg-emerald-500" : "bg-amber-500"
                          }`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-bold text-white tracking-tight truncate hover:text-[#8ab4d4] transition-colors">
                            {profile.name}
                          </h3>
                          <p className="text-xs font-mono text-[#636363] truncate">
                            @{profile.username}
                          </p>
                          <div className="mt-1 flex items-center gap-1.5">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono tracking-wider uppercase font-bold rounded-full ${
                              isGitHub 
                                ? "bg-[#8ab4d4]/10 text-[#8ab4d4] border border-[#8ab4d4]/20" 
                                : "bg-[#dfaa60]/10 text-[#dfaa60] border border-[#dfaa60]/20"
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
                            <div className="bg-[#1a1a1a]/50 border border-[#2c2c2c] p-2.5 rounded-lg">
                              <span className="block text-[10px] font-mono text-[#636363] uppercase mb-0.5 tracking-wider font-semibold">Followers</span>
                              <div className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5 text-indigo-400" />
                                <span className="text-sm font-bold font-mono text-white">
                                  {profile.stats.followers?.toLocaleString() || 0}
                                </span>
                              </div>
                            </div>
                            <div className="bg-[#1a1a1a]/50 border border-[#2c2c2c] p-2.5 rounded-lg">
                              <span className="block text-[10px] font-mono text-[#636363] uppercase mb-0.5 tracking-wider font-semibold">Repositories</span>
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
                            <div className="bg-[#1a1a1a]/50 border border-[#2c2c2c] p-2.5 rounded-lg">
                              <span className="block text-[10px] font-mono text-[#636363] uppercase mb-0.5 tracking-wider font-semibold">Solved</span>
                              <div className="flex items-center gap-1">
                                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-sm font-bold font-mono text-white">
                                  {profile.stats.solvedCount || 0}
                                </span>
                              </div>
                            </div>
                            <div className="bg-[#1a1a1a]/50 border border-[#2c2c2c] p-2.5 rounded-lg">
                              <span className="block text-[10px] font-mono text-[#636363] uppercase mb-0.5 tracking-wider font-semibold">Rank</span>
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


                      <div className="flex items-center justify-between border-t border-[#2c2c2c]/50 pt-3 text-[10px] font-mono text-[#636363]">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Updated {new Date(profile.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <button 
                          onClick={() => setActiveDetailProfile(profile)}
                          className="text-[#8ab4d4] hover:underline flex items-center gap-0.5 font-bold"
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

        {/* ── LocalStorage Vault ── */}
        <section className="mt-14 pb-4">
          <div className="flex items-center gap-4 mb-5">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#2c2c2c] to-transparent"></div>
            <div className="flex items-center gap-2 px-4 py-1.5 bg-[#1a1a1a] border border-[#2c2c2c] rounded-full">
              <Database className="w-3.5 h-3.5 text-[#8ab4d4]" />
              <span className="text-[11px] font-mono font-bold text-[#9e9e9e] uppercase tracking-widest">Local Storage Vault</span>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#2c2c2c] to-transparent"></div>
          </div>
          <p className="text-center text-[11px] text-[#636363] font-mono mb-6">
            Real-time view of <span className="text-[#8ab4d4]">footprints_profiles</span> key &mdash; reflects every track &amp; delete instantly
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Storage State */}
            <div className="bg-[#181818] border border-[#2c2c2c] rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#2c2c2c] flex items-center justify-between bg-[#1a1a1a]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-[11px] font-mono font-bold text-[#9e9e9e] uppercase tracking-widest">Storage State</span>
                </div>
                <span className="text-[10px] font-mono text-[#636363]">
                  {profiles.length === 0 ? '0 bytes' : `~${(JSON.stringify(profiles).length / 1024).toFixed(1)} KB`}
                </span>
              </div>
              <div className="p-4 max-h-72 overflow-y-auto font-mono text-xs leading-relaxed">
                {profiles.length === 0 ? (
                  <div className="text-[#636363] italic py-8 text-center">
                    <div className="text-lg mb-2 text-[#2c2c2c] tracking-widest">[ ]</div>
                    <div>// localStorage is empty</div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="text-[#636363]">{'['}</div>
                    {profiles.map((p, i) => (
                      <div key={p.id} className="pl-3">
                        <div className="text-[#636363]">{'{'}</div>
                        <div className="pl-4 space-y-0.5 py-0.5 border-l border-[#2c2c2c] ml-1">
                          <div><span className="text-[#636363]">id: </span><span className="text-[#dfaa60]">"{p.id}"</span></div>
                          <div><span className="text-[#636363]">platform: </span><span className={p.platform === 'github' ? 'text-[#8ab4d4]' : 'text-[#dfaa60]'}>"{p.platform}"</span></div>
                          <div><span className="text-[#636363]">username: </span><span className="text-[#e2e2e2]">"{p.username}"</span></div>
                          <div><span className="text-[#636363]">lastUpdated: </span><span className="text-[#636363]">"{new Date(p.lastUpdated).toLocaleString()}"</span></div>
                        </div>
                        <div className="text-[#636363]">{'}'}{i < profiles.length - 1 ? ',' : ''}</div>
                      </div>
                    ))}
                    <div className="text-[#636363]">{']'}</div>
                  </div>
                )}
              </div>
              <div className="px-4 py-2 bg-[#1a1a1a] border-t border-[#2c2c2c] flex justify-between items-center">
                <span className="text-[10px] font-mono text-[#636363]">{profiles.length} record{profiles.length !== 1 ? 's' : ''}</span>
                <span className={`text-[10px] font-mono ${profiles.length > 0 ? 'text-emerald-500' : 'text-[#636363]'}`}>
                  {profiles.length > 0 ? '● synced' : '○ empty'}
                </span>
              </div>
            </div>

            {/* Activity Log */}
            <div className="bg-[#181818] border border-[#2c2c2c] rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#2c2c2c] flex items-center justify-between bg-[#1a1a1a]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#dfaa60]"></span>
                  <span className="text-[11px] font-mono font-bold text-[#9e9e9e] uppercase tracking-widest">Activity Log</span>
                </div>
                {storageLog.length > 0 && (
                  <button
                    onClick={() => setStorageLog([])}
                    className="text-[10px] font-mono text-[#636363] hover:text-[#9e9e9e] transition-colors border border-[#2c2c2c] px-2 py-0.5 rounded"
                  >
                    clear
                  </button>
                )}
              </div>
              <div className="p-4 max-h-72 overflow-y-auto space-y-2">
                {storageLog.length === 0 ? (
                  <div className="text-[#636363] italic py-8 text-center font-mono text-xs">
                    <div className="text-lg mb-2 text-[#2c2c2c] tracking-widest">· · ·</div>
                    <div>// no activity yet</div>
                    <div className="mt-1 text-[10px]">track or remove a profile to see events</div>
                  </div>
                ) : (
                  storageLog.map((entry, i) => (
                    <div key={i} className="flex items-start gap-3 py-1.5 border-b border-[#2c2c2c]/40 last:border-0">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono tracking-widest flex-shrink-0 ${
                        entry.type === 'add'
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/60'
                          : entry.type === 'delete'
                          ? 'bg-rose-950/60 text-rose-400 border border-rose-900/60'
                          : 'bg-[#8ab4d4]/10 text-[#8ab4d4] border border-[#8ab4d4]/30'
                      }`}>{entry.action}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[#9e9e9e] font-mono text-xs truncate">{entry.detail}</div>
                        <div className="text-[#636363] font-mono text-[10px] mt-0.5">{new Date(entry.time).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'})}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="px-4 py-2 bg-[#1a1a1a] border-t border-[#2c2c2c] flex justify-between items-center">
                <span className="text-[10px] font-mono text-[#636363]">{storageLog.length} event{storageLog.length !== 1 ? 's' : ''}</span>
                <span className="text-[10px] font-mono text-[#636363]">capped at 50</span>
              </div>
            </div>

          </div>
        </section>
      </main>

      <AnimatePresence>
        {activeDetailProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#0a0a0a]/80 backdrop-blur-md"
              onClick={() => setActiveDetailProfile(null)}
            ></motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-[#181818] rounded-2xl border border-[#383838] overflow-hidden shadow-2xl z-10 flex flex-col max-h-[85vh]"
            >
              <div className="p-4 bg-[#1e1e1e] border-b border-[#383838] flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#8ab4d4]" />
                  <span className="text-xs font-mono font-bold text-[#9e9e9e]">profile_analyser_output.sh</span>
                </div>
                <button 
                  onClick={() => setActiveDetailProfile(null)}
                  className="p-1 text-[#9e9e9e] hover:text-white"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <div className="flex items-center gap-4 mb-6">
                  <img 
                    src={activeDetailProfile.avatarUrl} 
                    alt={activeDetailProfile.username}
                    className={`w-16 h-16 rounded-full border-2 p-0.5 object-cover bg-[#131313] ${
                      activeDetailProfile.platform === "github" ? "border-[#4d87ad]" : "border-[#c9853e]"
                    }`}
                  />
                  <div>
                    <h2 className="text-xl font-extrabold text-white">{activeDetailProfile.name}</h2>
                    <p className="text-sm font-mono text-[#9e9e9e]">@{activeDetailProfile.username}</p>
                    <a 
                      href={activeDetailProfile.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#8ab4d4] hover:underline inline-flex items-center gap-1 mt-1 font-mono"
                    >
                      <span>{activeDetailProfile.url}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#1e1e1e] p-3 rounded-xl border border-[#383838]">
                      <span className="text-[10px] font-mono text-[#636363] uppercase tracking-wider block mb-1">Telemetry Origin</span>
                      <span className="text-sm font-mono font-bold text-white capitalize">{activeDetailProfile.platform} Integration</span>
                    </div>
                    <div className="bg-[#1e1e1e] p-3 rounded-xl border border-[#383838]">
                      <span className="text-[10px] font-mono text-[#636363] uppercase tracking-wider block mb-1">Cache Timestamp</span>
                      <span className="text-sm font-mono font-bold text-white">
                        {new Date(activeDetailProfile.lastUpdated).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#1e1e1e] p-4 rounded-xl border border-[#383838]">
                    <span className="text-[10px] font-mono text-[#636363] uppercase tracking-wider block mb-2">Technical Capabilities</span>
                    
                    {activeDetailProfile.platform === "github" ? (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs text-[#9e9e9e]">
                          <span>Community Reach</span>
                          <span className="font-mono text-white font-bold">{activeDetailProfile.stats.followers?.toLocaleString() || 0} followers</span>
                        </div>
                        <div className="w-full bg-[#2a2a2a] rounded-full h-1.5">
                          <div className="bg-[#4d87ad] h-1.5 rounded-full" style={{ width: `${Math.min(100, ((activeDetailProfile.stats.followers || 0) / 5000) * 100)}%` }}></div>
                        </div>

                        <div className="flex justify-between items-center text-xs text-[#9e9e9e] pt-2">
                          <span>Repository Base</span>
                          <span className="font-mono text-white font-bold">{activeDetailProfile.stats.publicRepos || 0} open repos</span>
                        </div>
                        <div className="w-full bg-[#2a2a2a] rounded-full h-1.5">
                          <div className="bg-[#4d87ad] h-1.5 rounded-full" style={{ width: `${Math.min(100, ((activeDetailProfile.stats.publicRepos || 0) / 150) * 100)}%` }}></div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs text-[#9e9e9e]">
                          <span>Problem Solving Index</span>
                          <span className="font-mono text-white font-bold">{activeDetailProfile.stats.solvedCount || 0} Solved</span>
                        </div>
                        <div className="w-full bg-[#2a2a2a] rounded-full h-1.5">
                          <div className="bg-[#c9853e] h-1.5 rounded-full" style={{ width: `${Math.min(100, ((activeDetailProfile.stats.solvedCount || 0) / 1000) * 100)}%` }}></div>
                        </div>

                        <div className="flex justify-between items-center text-xs text-[#9e9e9e] pt-2">
                          <span>Developer Ranking</span>
                          <span className="font-mono text-white font-bold">{activeDetailProfile.stats.ranking || "N/A"}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#1e1e1e] border-t border-[#383838] flex gap-2">
                <button 
                  onClick={() => handleCopyProfileUrl(activeDetailProfile)}
                  className="flex-1 bg-[#2a2a2a] hover:bg-[#2e2e2e] text-white border border-[#383838] py-2 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-2"
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

      <footer className="mt-auto bg-[#0a0a0a] border-t border-[#2c2c2c]/60 py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-mono text-[#636363]">
          <div>
            <span>Footprints - Secure local cataloging.</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Direct GitHub user API</span>
            <span>•</span>
            <span>LeetCode Official GraphQL</span>
          </div>
          <div>
            <span className="text-[#dfaa60]">Zero Authentication Required</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
