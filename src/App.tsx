import React, { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, History, Globe, Zap, Database, Cpu, ChevronRight, ExternalLink, Filter, TrendingUp, Info, Settings, Sun, Moon, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getLiveSearchResults, SearchResult, getFavicon } from './lib/search';
import { ThemeEffects } from './components/ThemeEffects';

export default function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [searchNotice, setSearchNotice] = useState<string | null>(null);
  const [searchSource, setSearchSource] = useState<'live' | 'local'>('live');
  const [searchProvider, setSearchProvider] = useState<'primary' | 'backup' | 'local'>('primary');
  const [isGenerating, setIsGenerating] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'images' | 'videos' | 'news' | 'shopping'>('all');
  const [searchTime, setSearchTime] = useState<number>(0);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);



  const TABS = [
    { id: 'all', label: 'All', icon: Search },
    { id: 'images', label: 'Images', icon: Globe },
    { id: 'videos', label: 'Videos', icon: Zap },
    { id: 'news', label: 'News', icon: Info },
    { id: 'shopping', label: 'Shopping', icon: Filter },
  ] as const;

  useEffect(() => {
    // Handle keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setShowSuggestions(false);
        setShowSettings(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setShowSettings(!showSettings);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showSettings]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial welcome state or pre-warm cache
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }

    // Load recent searches from localStorage
    const savedSearches = localStorage.getItem('nexusai-recent-searches');
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Save recent searches to localStorage
    if (recentSearches.length > 0) {
      localStorage.setItem('nexusai-recent-searches', JSON.stringify(recentSearches));
    }
  }, [recentSearches]);

  const POPULAR_SEARCHES = [
    'artificial intelligence',
    'machine learning',
    'quantum computing',
    'climate change',
    'renewable energy',
    'blockchain technology',
    'space exploration',
    'biotechnology',
    'cybersecurity'
  ];

  useEffect(() => {
    let active = true;

    if (query.trim().length > 0) {
      const fetchSuggestions = async () => {
        try {
          const res = await fetch(`/api/suggest?q=${encodeURIComponent(query)}`);
          if (res.ok) {
            const data = await res.json();
            if (active) {
              // Combine matching recent searches with live predictions
              const recentMatches = recentSearches.filter(s => 
                s.toLowerCase().includes(query.trim().toLowerCase())
              );
              let combined = [...new Set([...recentMatches, ...data])];
              
              // Fallback to popular searches if no results found
              if (combined.length === 0) {
                const popularMatches = POPULAR_SEARCHES.filter(s => 
                  s.toLowerCase().includes(query.trim().toLowerCase())
                );
                combined = [...new Set([...recentMatches, ...popularMatches])];
              }
              
              setSuggestions(combined.slice(0, 8));
            }
          }
        } catch (err) {
          if (active) {
            const recentMatches = recentSearches.filter(s => 
              s.toLowerCase().includes(query.trim().toLowerCase())
            );
            const popularMatches = POPULAR_SEARCHES.filter(s => 
              s.toLowerCase().includes(query.trim().toLowerCase())
            );
            setSuggestions([...new Set([...recentMatches, ...popularMatches])].slice(0, 8));
          }
        }
      };

      const debounceTimer = setTimeout(fetchSuggestions, 200);
      return () => {
        active = false;
        clearTimeout(debounceTimer);
      };
    } else {
      setSuggestions([]);
      return () => { active = false; };
    }
  }, [query, recentSearches]);

  const handleSearch = async (e?: React.FormEvent, manualQuery?: string) => {
    if (e) e.preventDefault();
    const searchTerm = manualQuery || query;
    if (!searchTerm.trim()) return;

    setShowSuggestions(false); // Hide suggestions when searching
    setIsSearching(true);
    setAiAnswer(null);
    setSearchNotice(null);
    setSearchSource('live');
    setSearchProvider('primary');
    setIsGenerating(true);
    const startTime = performance.now();

    try {
      if (!recentSearches.includes(searchTerm)) {
        setRecentSearches(prev => [searchTerm, ...prev].slice(0, 5));
      }

      const { results: searchResults, answer, notice, source, provider } = await getLiveSearchResults(searchTerm);
      
      setResults(searchResults);
      setAiAnswer(answer);
      setSearchNotice(notice || null);
      setSearchSource(source);
      setSearchProvider(provider);
      setSearchTime(Math.round(performance.now() - startTime));
    } catch (error) {
      console.error("Search failed:", error);
      setSearchNotice("Something went wrong while processing the search request.");
    } finally {
      setIsSearching(false);
      setIsGenerating(false);
    }
  };

  const handleRecentClick = (q: string) => {
    setQuery(q);
    handleSearch(undefined, q);
  };

  return (
    <>
      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes sparkleBurst {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) scale(0);
            opacity: 1;
          }
        }
        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        .animate-fade-in {
          animation: fadeInUp 0.6s ease-out;
        }
      `}</style>
      <div className={`min-h-screen ${isDarkTheme ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900 text-gray-100' : 'bg-gradient-to-br from-orange-50/80 via-amber-50/50 to-yellow-50/80 text-stone-800'} font-sans selection:bg-orange-500/30`}>
      {/* Background Atmosphere */}
      <div className={`fixed inset-0 overflow-hidden pointer-events-none ${isDarkTheme ? '' : ''}`}>
        <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] ${isDarkTheme ? 'bg-gradient-to-r from-blue-600/15 to-indigo-600/15' : 'bg-gradient-to-r from-orange-300/15 to-amber-300/15'} rounded-full blur-[120px] animate-pulse`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] ${isDarkTheme ? 'bg-gradient-to-r from-purple-600/15 to-pink-600/15' : 'bg-gradient-to-r from-yellow-300/15 to-rose-300/15'} rounded-full blur-[120px] animate-pulse`} style={{ animationDelay: '1s' }} />
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] ${isDarkTheme ? 'bg-gradient-to-r from-gray-600/12 to-gray-700/12' : 'bg-gradient-to-r from-stone-300/15 to-orange-300/15'} rounded-full blur-[100px] animate-pulse`} style={{ animationDelay: '2s' }} />
      </div>

      <ThemeEffects isDarkTheme={isDarkTheme} />

      {/* Header */}
      <header className="absolute top-0 w-full z-50 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.reload()}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Zap size={18} className="text-white" />
            </div>
            <div className="flex flex-col">
            <span className={`font-bold text-lg leading-none tracking-tight bg-clip-text text-transparent bg-gradient-to-r ${isDarkTheme ? 'from-blue-400 to-blue-300' : 'from-blue-700 to-blue-600'}`}>
                NexusAI
              </span>
              <span className={`text-[8px] font-mono ${isDarkTheme ? 'text-blue-400/50' : 'text-blue-700/50'} uppercase tracking-widest mt-0.5`}>Vector Search Engine</span>
            </div>
          </div>

          <nav className="flex items-center">
            <button className="px-5 py-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg shadow-blue-500/25">
              Sign In
            </button>
          </nav>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 pt-28 pb-32 z-10">
        {/* Search Hero Area */}
        <section className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-4 mb-12">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-4xl md:text-6xl font-bold tracking-tight"
            >
              The Next Generation of <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 animate-gradient">Discovery</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
              className={`text-lg ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'} max-w-xl mx-auto`}
            >
              Semantic understanding, vector retrieval, and intelligent synthesis in one unified interface.
            </motion.p>
          </div>

          <motion.form 
            onSubmit={handleSearch} 
            className="relative group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <div className={`absolute inset-x-0 -bottom-2 -top-2 ${isDarkTheme ? 'bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-blue-600/20' : 'bg-gradient-to-r from-orange-300/30 via-amber-400/30 to-yellow-300/30'} rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-all duration-500`} />
            <div className="relative flex items-center">
              <motion.div 
                className="absolute left-5 text-gray-500 group-focus-within:text-blue-600 transition-colors"
                animate={{ rotate: isSearching ? 360 : 0 }}
                transition={{ duration: 1, repeat: isSearching ? Infinity : 0, ease: "linear" }}
              >
                <Search size={20} />
              </motion.div>
              <motion.input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown' && suggestions.length > 0) {
                    e.preventDefault();
                    handleSearch(undefined, suggestions[0]);
                  }
                }}
                placeholder="Ask anything... (e.g. quantum computing future)"
                className={`w-full backdrop-blur-sm border rounded-2xl py-4 pl-14 pr-32 text-lg focus:outline-none focus:border-orange-400/50 shadow-lg transition-all focus:shadow-orange-400/20 placeholder-stone-400 ${
                  isDarkTheme 
                    ? 'bg-gray-800/90 border-gray-600 text-white' 
                    : 'bg-orange-50/90 border-orange-200 text-stone-900'
                }`}
                whileFocus={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              />
              <div className="absolute right-3 flex items-center gap-2">
                <kbd className={`hidden sm:inline-flex px-1.5 py-0.5 rounded-lg text-[10px] border shadow-sm ${
                  isDarkTheme 
                    ? 'bg-gray-700 text-gray-300 border-gray-600' 
                    : 'bg-gray-100 text-gray-600 border-gray-300'
                }`}>⌘K</kbd>
                <motion.button
                  type="submit"
                  disabled={isSearching}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white p-2 rounded-xl transition-all shadow-md hover:shadow-blue-500/30 disabled:opacity-50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ChevronRight size={20} />
                </motion.button>
              </div>
            </div>
            
            {/* Search Suggestions Dropdown */}
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-2xl border z-50 ${isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} backdrop-blur-sm`}
                >
                  <div className="max-h-64 overflow-y-auto">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={suggestion}
                        onClick={() => handleSearch(undefined, suggestion)}
                        className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center gap-2 ${isDarkTheme ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'} ${index === 0 ? 'border-b' : ''}`}
                      >
                        <Search size={14} className="opacity-50" />
                        <span>{suggestion}</span>
                        {index === 0 && (
                          <kbd className={`ml-auto text-xs px-2 py-1 rounded ${isDarkTheme ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>↓</kbd>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.form>

          {/* Settings Panel */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`rounded-2xl border ${isDarkTheme ? 'bg-gray-800/90 border-gray-700' : 'bg-white/90 border-gray-200'} p-6 shadow-xl backdrop-blur-sm`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-semibold ${isDarkTheme ? 'text-gray-100' : 'text-gray-800'}`}>Search Settings</h3>
                  <button 
                    onClick={() => setShowSettings(false)}
                    className={`p-1 rounded-lg ${isDarkTheme ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} transition-colors`}
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>Auto-generate summaries</span>
                    <button className="w-12 h-6 bg-blue-600 rounded-full relative transition-colors">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full transition-transform" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>Safe search</span>
                    <button className="w-12 h-6 bg-gray-400 rounded-full relative transition-colors">
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>Results per page</span>
                    <select className={`px-3 py-1 rounded-lg text-sm ${isDarkTheme ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300'} border`}>
                      <option>10</option>
                      <option>20</option>
                      <option>50</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Filters / Tabs */}
          <motion.div 
            className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-none border-b border-gray-200/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            {TABS.map((tab, index) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all relative rounded-lg ${
                  activeTab === tab.id 
                    ? 'text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.5 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <tab.icon size={16} />
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="activeTab" 
                    className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg -z-10"
                  />
                )}
              </motion.button>
            ))}
          </motion.div>
        </section>

        {/* Results Area */}
        <section className="mt-8 flex flex-col gap-8 max-w-3xl mx-auto">
          <AnimatePresence>
            {searchNotice && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl border border-amber-500/25 bg-gradient-to-r from-amber-50 to-yellow-50 px-4 py-3 text-sm text-amber-700 shadow-md"
              >
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-amber-600">
                  <Info size={12} />
                  <span>Search Notice</span>
                </div>
                <p className="mt-2 leading-relaxed">{searchNotice}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search Overview */}
          <AnimatePresence>
            {(isGenerating || aiAnswer) && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white/70 backdrop-blur-sm border border-blue-500/25 rounded-3xl overflow-hidden shadow-lg"
              >
                <div className="p-6">
                  <div className="flex flex-wrap items-center gap-3 mb-6">
                    <div className="flex items-center gap-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-1 rounded-full border border-blue-200/30">
                      <span className="text-sm">🧠</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">AI Answer</span>
                    </div>
                    {results.length > 0 && (
                      <>
                        <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-full border border-gray-200/50">
                          <span className="text-sm">📊</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
                            Confidence: {Math.min(1, results[0].score || 0.85).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-full border border-gray-200/50">
                          <span className="text-sm">🔗</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 truncate max-w-[200px]">
                            Sources: {results.slice(0, 2).map(r => r.title.substring(0, 15) + '...').join(', ')}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {isGenerating ? (
                    <div className="space-y-3">
                      <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse w-full" />
                      <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse w-[94%]" />
                      <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse w-[88%]" />
                    </div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }}
                      className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap font-medium"
                    >
                      {aiAnswer?.replace(/\n{3,}/g, "\n\n").trim()}
                    </motion.div>
                  )}
                </div>
                <div className="px-6 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200/50 flex items-center justify-between text-[10px] text-gray-600">
                  <span>Summaries are generated from the current search results.</span>
                  <div className="flex gap-4">
                    <button className="hover:text-blue-600 transition-colors">Feedback</button>
                    <button className="hover:text-blue-600 transition-colors">Learn more</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results Feed */}
          <div className="space-y-10">
            <AnimatePresence mode='wait'>
              {isSearching ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-8"
                >
                  {[1, 2, 3].map(i => (
                    <div key={i} className="space-y-3">
                      <div className="h-4 bg-gray-800 rounded animate-pulse w-1/3" />
                      <div className="h-6 bg-gray-800 rounded animate-pulse w-2/3" />
                      <div className="h-4 bg-gray-800 rounded animate-pulse w-full" />
                    </div>
                  ))}
                </motion.div>
              ) : results.length > 0 ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-10"
                >
                  <div className="flex items-center gap-4 text-xs text-gray-600 font-mono">
                    <span>About {results.length} results</span>
                    <span>({(searchTime / 1000).toFixed(2)} seconds)</span>
                    <span>
                      {searchSource === 'live'
                        ? `LIVE RESULTS · ${searchProvider === 'backup' ? 'BACKUP' : 'PRIMARY'}`
                        : 'LOCAL FALLBACK'}
                    </span>
                  </div>
                  
                  {results.slice(0, 10).map((result, idx) => (
                    <motion.a
                      key={result.id}
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group p-4 rounded-2xl bg-white/70 backdrop-blur-sm hover:bg-white border border-gray-200/50 hover:border-blue-500/40 transition-all block overflow-hidden shadow-md hover:shadow-lg"
                    >
                      <div className="flex gap-4">
                        {/* Site Image / Favicon */}
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 p-2 flex items-center justify-center border border-gray-200/50 overflow-hidden">
                            {result.favicon ? (
                              <img 
                                src={getFavicon(result.url)} 
                                alt="" 
                                className="w-full h-full object-contain"
                                referrerPolicy="no-referrer"
                                onLoad={() => console.log('Favicon loaded:', result.url)}
                                onError={(e) => {
                                  console.log('Favicon failed to load:', result.url);
                                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Ccircle cx="12" cy="12" r="10"%3E%3C/circle%3E%3Cline x1="2" y1="12" x2="22" y2="12"%3E%3C/line%3E%3Cpath d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"%3E%3C/path%3E%3C/svg%3E';
                                }}
                              />
                            ) : (
                              <Globe size={24} className="text-gray-500" />
                            )}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest truncate max-w-[200px]">
                              {new URL(result.url || 'https://google.com').hostname.replace('www.', '')}
                            </span>
                            <ExternalLink size={10} className="text-gray-500 group-hover:text-blue-600 transition-colors" />
                          </div>
                          <h3 className="text-lg font-semibold text-blue-700 group-hover:text-blue-600 transition-colors mb-1 truncate">
                            {result.title}
                          </h3>
                          <p className="text-gray-600 text-sm leading-relaxed mb-2 line-clamp-2">
                            {result.siteSummary || result.snippet}
                          </p>
                          
                          <div className="flex items-center gap-3">
                            <div className="text-[10px] flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/30 text-blue-700">
                              <Sparkles size={10} />
                              <span>Overview</span>
                            </div>
                            <div className="text-[10px] text-gray-500 font-mono">
                              98% Match
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.a>
                  ))}
                </motion.div>
              ) : !isSearching && query && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20"
                >
                  <h3 className="text-xl font-medium mb-1 text-gray-800">No results for "{query}"</h3>
                  <p className="text-gray-600">Try using broader terms or checking your spelling.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar-style items integrated at bottom for cleaner look */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 pt-12 border-t border-gray-200/30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            {/* Recent Searches */}
            <div className="bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-3xl p-6 shadow-md">
              <div className="flex items-center gap-2 mb-6">
                <History size={16} className="text-gray-600" />
                <h4 className="text-xs font-bold uppercase tracking-widest text-gray-700">Recents</h4>
              </div>
              
                <div className="space-y-2">
                  {recentSearches.length > 0 ? recentSearches.map(s => (
                  <button 
                    key={s}
                    onClick={() => handleRecentClick(s)}
                    className={`w-full text-left px-3 py-2 text-sm hover:text-gray-800 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 rounded-lg transition-all flex items-center justify-between group ${isDarkTheme ? 'text-gray-400 hover:text-gray-100' : 'text-gray-600'}`}
                  >
                    <span className="truncate">{s}</span>
                    <div className="flex items-center gap-2">
                      <ChevronRight size={14} className="opacity-0 group-hover:opacity-100" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const newRecentSearches = recentSearches.filter(item => item !== s);
                          setRecentSearches(newRecentSearches);
                        }}
                        className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${isDarkTheme ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                      >
                        ✕
                      </button>
                    </div>
                  </button>
                )) : (
                  <p className="text-xs text-gray-500 text-center py-4 italic">No recent history</p>
                )}
              </div>
            </div>

            {/* System Status (Hardware style) */}
            <div className="bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-3xl p-6 font-mono text-[10px] space-y-4 shadow-md">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                <span className="text-gray-600 uppercase">Engine Status</span>
                <span className="text-green-600 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse" />
                  ONLINE
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-700 uppercase">Vector Version</span>
                  <span className="text-gray-600">0.04-TE</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 uppercase">Compute Load</span>
                  <span className="text-gray-600">12.4ms avg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 uppercase">Search Scope</span>
                  <span className="text-gray-600">
                    {searchSource === 'live'
                      ? searchProvider === 'backup'
                        ? 'Live Search (Backup)'
                        : 'Live Search'
                      : 'Local Knowledge Base'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="border-t border-gray-200/50 mt-20 py-12 px-4 bg-gradient-to-r from-gray-50 to-slate-50 relative z-10 pb-28">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 opacity-50">
            <Zap size={16} />
            <span className="font-bold text-sm tracking-tighter uppercase bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">NexusAI Labs</span>
          </div>
          <div className="flex items-center gap-8 text-xs font-semibold text-gray-600 uppercase tracking-widest">
            <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Safety</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-blue-600 transition-colors">API</a>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-600 hover:text-blue-600 transition-colors border border-gray-300 rounded-lg hover:border-blue-300 hover:bg-blue-50">
              <Globe size={18} />
            </button>
            <button className="p-2 text-gray-600 hover:text-blue-600 transition-colors border border-gray-300 rounded-lg hover:border-blue-300 hover:bg-blue-50">
              <Filter size={18} />
            </button>
          </div>
        </div>
      </footer>

      {/* Floating Controls Dock (Auto-hiding on scroll) */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[400px] h-24 z-50 group flex justify-center">
        {/* Peek Indicator */}
        <div className={`absolute top-2 w-12 h-1.5 rounded-full transition-all duration-300 ${
          isScrolled ? 'opacity-100 translate-y-0 group-hover:opacity-0 group-hover:-translate-y-4' : 'opacity-0 -translate-y-4'
        } ${isDarkTheme ? 'bg-gray-700/50' : 'bg-gray-300/80'}`} />
        
        {/* Dock Content */}
        <div 
          className={`absolute top-6 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] px-8 py-3.5 rounded-full flex items-center gap-8 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-2xl border ${
            isScrolled 
              ? '-translate-y-24 opacity-0 scale-95 group-hover:scale-100 group-hover:translate-y-0 group-hover:opacity-100' 
              : 'translate-y-0 opacity-100 scale-100'
          } ${
            isDarkTheme 
              ? 'bg-gray-800/80 border-gray-700/50 text-gray-300 shadow-[0_8px_30px_rgba(0,0,0,0.4)]' 
              : 'bg-white/80 border-gray-200/50 text-gray-700'
          }`}
        >
          <button 
            onClick={() => setIsDarkTheme(!isDarkTheme)}
            className={`flex items-center gap-2 text-sm font-medium transition-all hover:scale-110 hover:text-blue-500`}
          >
            {isDarkTheme ? <Sun size={20} /> : <Moon size={20} />}
            <span className="hidden sm:inline font-semibold tracking-wide">{isDarkTheme ? 'Light' : 'Dark'}</span>
          </button>
          <div className={`w-[2px] h-5 rounded-full ${isDarkTheme ? 'bg-gray-700' : 'bg-gray-200'}`} />
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center gap-2 text-sm font-medium transition-all hover:scale-110 hover:text-blue-500`}
          >
            <Settings size={20} />
            <span className="hidden sm:inline font-semibold tracking-wide">Settings</span>
          </button>
          <div className={`w-[2px] h-5 rounded-full ${isDarkTheme ? 'bg-gray-700' : 'bg-gray-200'}`} />
          <button className={`flex items-center gap-2 text-sm font-medium transition-all hover:scale-110 hover:text-blue-500`}>
            <HelpCircle size={20} />
            <span className="hidden sm:inline font-semibold tracking-wide">Help</span>
          </button>
        </div>
      </div>
      </div>
    </>
  );
}
