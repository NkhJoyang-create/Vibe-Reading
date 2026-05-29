/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { defaultArticles } from "./data";
import { Article, VocabularyWord } from "./types";
import Library from "./components/Library";
import Reader from "./components/Reader";
import InsightPanel from "./components/InsightPanel";
import StatisticsDashboard from "./components/StatisticsDashboard";
import { BookOpen, Sparkles, BookMarked, Layers, Settings, HelpCircle, GraduationCap, ArrowLeft, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [articles, setArticles] = useState<Article[]>(defaultArticles);
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedWordContext, setSelectedWordContext] = useState<string | null>(null);
  const [savedWords, setSavedWords] = useState<VocabularyWord[]>([]);
  const [readingMode, setReadingMode] = useState<"Immersive" | "Study" | "Dual-Link">("Study");
  const [isMobileInsightOpen, setIsMobileInsightOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"library" | "statistics">("library");

  // Load saved vocabulary deck from localStorage on launch
  useEffect(() => {
    const saved = localStorage.getItem("lexis-reader-words-deck");
    if (saved) {
      try {
        setSavedWords(JSON.parse(saved));
      } catch (err) {
        console.error("Failed to parse saved vocabulary:", err);
      }
    }
  }, []);

  // Save changes back to localStorage
  const saveWordsToLocalStorage = (words: VocabularyWord[]) => {
    localStorage.setItem("lexis-reader-words-deck", JSON.stringify(words));
  };

  const handleSelectArticle = (article: Article) => {
    setActiveArticle(article);
    // Reset selection state when changing focus texts
    setSelectedWord(null);
    setSelectedWordContext(null);
    setIsMobileInsightOpen(false);
    setActiveTab("library");
  };

  const handleImportArticle = (newArticle: Article) => {
    setArticles((prev) => [newArticle, ...prev]);
  };

  const handleSelectWord = (word: string, context: string) => {
    setSelectedWord(word);
    setSelectedWordContext(context);
    setIsMobileInsightOpen(true); // Auto reveal drawer on mobile
  };

  const handleToggleSaveWord = (word: VocabularyWord) => {
    // Check if vocabulary is already added
    const existsIdx = savedWords.findIndex((w) => w.word.toLowerCase() === word.word.toLowerCase());
    let nextSavedList: VocabularyWord[] = [];

    if (existsIdx >= 0) {
      // Remove
      nextSavedList = savedWords.filter((w) => w.word.toLowerCase() !== word.word.toLowerCase());
    } else {
      // Add
      nextSavedList = [...savedWords, { ...word, saved: true }];
    }

    setSavedWords(nextSavedList);
    saveWordsToLocalStorage(nextSavedList);
  };

  return (
    <div id="lexis-app-root" className="h-screen overflow-hidden bg-background text-on-background flex flex-col font-sans transition-all duration-300 select-none">
      
      {/* BRAND HEADER BAR */}
      <header className="border-b border-[#E5E1D8] bg-[#FDFCFB]/95 sticky top-0 z-40 backdrop-blur-md px-10 py-5 flex items-center justify-between shadow-xs select-none">
        <div className="flex items-center gap-8">
          <span 
            className="text-2xl font-serif italic tracking-tight cursor-pointer"
            onClick={() => {
              setActiveArticle(null);
              setActiveTab("library");
            }}
          >
            Lecta.
          </span>
          {/* Central Nav */}
          <nav className="hidden md:flex gap-6 text-[10px] uppercase tracking-widest font-bold">
            <button
              onClick={() => {
                setActiveArticle(null);
                setActiveTab("library");
              }}
              className={`transition-colors py-1 cursor-pointer ${
                activeArticle === null && activeTab === "library"
                  ? "text-[#D4A373] border-b border-[#D4A373]"
                  : "text-[#1A1A1A]/60 hover:text-[#1A1A1A]"
              }`}
            >
              Library
            </button>
            {activeArticle && (
              <span className="text-[#D4A373] py-1 border-b border-[#D4A373]">
                Immersive Study
              </span>
            )}
            <button
              onClick={() => {
                setActiveArticle(null);
                setActiveTab("statistics");
              }}
              className={`transition-colors py-1 cursor-pointer ${
                activeArticle === null && activeTab === "statistics"
                  ? "text-[#D4A373] border-b-2 border-[#D4A373]"
                  : "text-[#1A1A1A]/60 hover:text-[#1A1A1A]"
              }`}
            >
              Statistics
            </button>
          </nav>
        </div>

        {/* Status indicator items */}
        <div className="flex items-center gap-4">
          {activeArticle && (
            <button
              onClick={() => setActiveArticle(null)}
              className="px-4 py-1.5 border border-[#1A1A1A] text-[10px] font-bold uppercase tracking-widest hover:bg-[#1A1A1A] hover:text-white transition-all flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Library
            </button>
          )}
          <span className="hidden sm:flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-[#9E9E9E] mt-0.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            MD Sync Active
          </span>
        </div>
      </header>

      {/* VIEWPORT BODY */}
      <div id="workspace-viewport" className="flex-1 flex min-h-0 h-0 w-full overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeArticle === null ? (
            activeTab === "statistics" ? (
              <motion.main
                key="statistics"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="flex-1 overflow-y-auto"
              >
                <StatisticsDashboard
                  savedWords={savedWords}
                  onRemoveWord={handleToggleSaveWord}
                  articles={articles}
                />
              </motion.main>
            ) : (
              /* LIBRARY DASHBOARD */
              <motion.main
                key="library"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="flex-1 overflow-y-auto"
              >
                <Library
                  articles={articles}
                  onSelectArticle={handleSelectArticle}
                  onImportArticle={handleImportArticle}
                />
              </motion.main>
            )
          ) : (
            /* Immersive Reader workspace container with side navigators */
            <motion.div
              key="reader-workspace"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex w-full h-full relative"
            >
              {/* LEFT SIDEBAR: Document Index (Web Only) */}
              {readingMode !== "Immersive" && (
                <aside className="hidden xl:flex w-[260px] border-r border-[#E5E1D8] p-8 flex-col bg-[#FDFCFB] select-none">
                  <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold mb-6 text-[#9E9E9E]">Current Collection</h3>
                  <div className="space-y-6 flex-1 overflow-y-auto pr-1">
                    {articles.map((art, idx) => {
                      const isSelected = art.id === activeArticle.id;
                      return (
                        <div
                          key={art.id}
                          onClick={() => handleSelectArticle(art)}
                          className={`group cursor-pointer transition-opacity duration-150 ${
                            isSelected ? "" : "opacity-45 hover:opacity-100"
                          }`}
                        >
                          <p className={`text-xs font-serif italic mb-1 ${isSelected ? "text-[#D4A373]" : "text-[#9E9E9E]"}`}>
                            {String(idx + 1).padStart(2, "0")}
                          </p>
                          <h4 className="text-sm font-semibold leading-snug text-[#1A1A1A]">
                            {art.title}
                          </h4>
                          {isSelected && <div className="w-full bg-[#E5E1D8] h-[1px] mt-3"></div>}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6">
                    <div className="bg-[#F5F2ED] p-4 rounded-sm border border-[#E5E1D8]/60">
                      <p className="text-[10px] uppercase font-bold tracking-wider mb-2 text-[#1A1A1A]">Daily Study Goal</p>
                      <div className="h-1 bg-[#E5E1D8] w-full rounded-full overflow-hidden">
                        <div className="h-full bg-[#1A1A1A] w-[71%] font-sans"></div>
                      </div>
                      <p className="text-[10px] mt-2 opacity-60 text-[#1A1A1A]">1,420 / 2,000 words completed</p>
                    </div>
                  </div>
                </aside>
              )}

              {/* READ SURFACE PANELS */}
              <Reader
                article={activeArticle}
                activeWord={selectedWord}
                onSelectWord={handleSelectWord}
                onBackToLibrary={() => setActiveArticle(null)}
                savedWords={savedWords.map((v) => v.word.toLowerCase())}
                onToggleSaveWord={handleToggleSaveWord}
                readingMode={readingMode}
                setReadingMode={setReadingMode}
              />

              {/* RIGHT INTEL CHANNEL (INSIGHTS AND DICTIONARIES) */}
              {/* Desktop version */}
              {readingMode !== "Immersive" && (
                <div className="hidden lg:block">
                  <InsightPanel
                    article={activeArticle}
                    selectedWord={selectedWord}
                    selectedWordContext={selectedWordContext}
                    onClose={() => {
                      setSelectedWord(null);
                      setSelectedWordContext(null);
                    }}
                    savedWordsList={savedWords}
                    onToggleSaveWord={handleToggleSaveWord}
                    onSelectWord={handleSelectWord}
                  />
                </div>
              )}

              {/* Mobile overlay version */}
              <AnimatePresence>
                {isMobileInsightOpen && (
                  <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
                    {/* Backdrop */}
                    <div
                      className="absolute inset-0 bg-black/40 backdrop-blur-xs"
                      onClick={() => setIsMobileInsightOpen(false)}
                    ></div>

                    {/* Sliding sheet */}
                    <motion.div
                      initial={{ y: "100%" }}
                      animate={{ y: 0 }}
                      exit={{ y: "100%" }}
                      transition={{ type: "spring", damping: 25, stiffness: 220 }}
                      className="relative bg-surface-container rounded-t-2xl shadow-2xl overflow-y-auto max-h-[80vh] flex flex-col pt-2"
                    >
                      {/* Swipe pill handler */}
                      <div className="mx-auto w-12 h-1.5 bg-outline-variant rounded-full mb-3 cursor-pointer" onClick={() => setIsMobileInsightOpen(false)}></div>
                      
                      <div className="flex-1 overflow-y-auto">
                        <InsightPanel
                          article={activeArticle}
                          selectedWord={selectedWord}
                          selectedWordContext={selectedWordContext}
                          onClose={() => {
                            setSelectedWord(null);
                            setSelectedWordContext(null);
                            setIsMobileInsightOpen(false);
                          }}
                          savedWordsList={savedWords}
                          onToggleSaveWord={handleToggleSaveWord}
                          onSelectWord={handleSelectWord}
                        />
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* Mobile reveal button if selection active and sheet is closed */}
              {!isMobileInsightOpen && selectedWord && (
                <button
                  onClick={() => setIsMobileInsightOpen(true)}
                  className="lg:hidden fixed bottom-6 right-6 p-4 rounded-full bg-[#9b4500] text-on-secondary shadow-lg z-30 flex items-center gap-1.5 font-bold text-xs"
                >
                  <Lightbulb className="w-4 h-4 animate-bounce" /> Review Insights
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
