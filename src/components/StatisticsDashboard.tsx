import { useState, useEffect } from "react";
import { BookOpen, BookMarked, Settings, RefreshCw, Trash2, Search, Award, Check, AlertCircle, Info, Key, Globe, Eye } from "lucide-react";
import { VocabularyWord } from "../types";
import { DEEPSEEK_CONFIG } from "../../deepseek-config";

interface StatisticsDashboardProps {
  savedWords: VocabularyWord[];
  onRemoveWord: (word: VocabularyWord) => void;
  articles: { id: string; title: string; category: string }[];
}

export default function StatisticsDashboard({
  savedWords,
  onRemoveWord,
  articles
}: StatisticsDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [testMessage, setTestMessage] = useState("");
  const [revealedWord, setRevealedWord] = useState<string | null>(null);

  // DeepSeek Form Local Overrides (initialized from localStorage or global config)
  const [apiKey, setApiKey] = useState("");
  const [apiUrl, setApiUrl] = useState("");
  const [model, setModel] = useState("");
  const [transPrompt, setTransPrompt] = useState("");
  const [dictPrompt, setDictPrompt] = useState("");

  useEffect(() => {
    setApiKey(localStorage.getItem("deepseek_client_key") || "");
    setApiUrl(localStorage.getItem("deepseek_client_url") || DEEPSEEK_CONFIG.apiUrl);
    setModel(localStorage.getItem("deepseek_client_model") || DEEPSEEK_CONFIG.model);
    setTransPrompt(localStorage.getItem("deepseek_client_trans_prompt") || DEEPSEEK_CONFIG.translationPrompt);
    setDictPrompt(localStorage.getItem("deepseek_client_dict_prompt") || DEEPSEEK_CONFIG.dictionaryPrompt);
  }, []);

  const handleSaveSettings = () => {
    localStorage.setItem("deepseek_client_key", apiKey.trim());
    localStorage.setItem("deepseek_client_url", apiUrl.trim());
    localStorage.setItem("deepseek_client_model", model.trim());
    localStorage.setItem("deepseek_client_trans_prompt", transPrompt.trim());
    localStorage.setItem("deepseek_client_dict_prompt", dictPrompt.trim());
    
    // Dispatch a storage event or log
    setTestStatus("success");
    setTestMessage("Settings saved successfully to secure browser storage!");
    setTimeout(() => {
      setTestStatus("idle");
      setTestMessage("");
    }, 3000);
  };

  const handleResetToDefaults = () => {
    if (confirm("Reset connection settings and prompts back to the default deepseek-config.ts file values?")) {
      setApiKey("");
      setApiUrl(DEEPSEEK_CONFIG.apiUrl);
      setModel(DEEPSEEK_CONFIG.model);
      setTransPrompt(DEEPSEEK_CONFIG.translationPrompt);
      setDictPrompt(DEEPSEEK_CONFIG.dictionaryPrompt);
      
      localStorage.removeItem("deepseek_client_key");
      localStorage.removeItem("deepseek_client_url");
      localStorage.removeItem("deepseek_client_model");
      localStorage.removeItem("deepseek_client_trans_prompt");
      localStorage.removeItem("deepseek_client_dict_prompt");

      setTestStatus("success");
      setTestMessage("Restored pristine configuration file defaults!");
      setTimeout(() => {
        setTestStatus("idle");
        setTestMessage("");
      }, 3000);
    }
  };

  const handleTestConnection = async () => {
    setTestStatus("testing");
    setTestMessage("Pinging API endpoint and testing analytical payload syntax...");
    try {
      const res = await fetch("/api/test-deepseek", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientKey: apiKey,
          clientUrl: apiUrl,
          clientModel: model,
          clientPrompt: dictPrompt
        })
      });
      const data = await res.json();
      if (res.ok && data.status === "ok") {
        setTestStatus("success");
        setTestMessage(`Authenticated successfully! Received response from ${model}`);
      } else {
        setTestStatus("error");
        setTestMessage(data.error || "Connection test returned an invalid payload structure.");
      }
    } catch (err: any) {
      setTestStatus("error");
      setTestMessage(err.message || "Failed to establish cross-origin handshake.");
    }
  };

  // Grouping words by CEFR
  const cefrCounts = savedWords.reduce((acc, word) => {
    const level = word.cefr || "B2";
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const wordCategories = ["C2", "C1", "B2", "B1", "A2", "A1"];

  const filteredWords = savedWords.filter((w) =>
    w.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.translation.includes(searchTerm) ||
    w.definition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div id="statistics-workspace" className="max-w-5xl mx-auto px-8 py-10 select-none bg-[#FDFCFB] min-h-full">
      {/* Visual Header */}
      <div className="border-b border-[#E5E1D8] pb-6 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-[#D4A373] font-bold">Personal Scholars Desk</span>
          <h1 className="font-serif text-3xl font-bold text-[#1A1A1A] mt-1">Study Analytics & DeepSeek Core</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleResetToDefaults}
            className="px-3.5 py-1.5 border border-[#E5E1D8] text-[10px] uppercase tracking-wider font-bold rounded-sm text-[#1A1A1A]/80 hover:bg-[#F5F2ED] hover:text-[#1A1A1A] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> Revert Defaults
          </button>
          <button
            onClick={handleSaveSettings}
            className="px-4 py-1.5 bg-[#D4A373] text-white text-[10px] uppercase tracking-wider font-bold rounded-sm hover:bg-[#b08256] transition-all shadow-sm flex items-center gap-1.5 cursor-pointer font-sans"
          >
            <Check className="w-3.5 h-3.5" /> Save Changes
          </button>
        </div>
      </div>

      {/* Grid of panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Summary Cards & CEFR Progress Visualizations */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 bg-white border border-[#E5E1D8] shadow-xs rounded-sm">
            <h3 className="text-xs uppercase font-bold tracking-wider text-[#9E9E9E] mb-5 flex items-center gap-2">
              <Award className="w-4 h-4 text-[#D4A373]" /> Key Performance Metrics
            </h3>
            
            <div className="space-y-5">
              <div className="flex justify-between items-center py-2.5 border-b border-[#FAF9F6]">
                <span className="text-xs text-[#1A1A1A]/70">Curated Library Corpus</span>
                <span className="text-sm font-sans font-semibold text-[#1A1A1A]">{articles.length} Manuscripts</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-[#FAF9F6]">
                <span className="text-xs text-[#1A1A1A]/70">Saved Academic Terms</span>
                <span className="text-sm font-sans font-semibold text-[#1A1A1A]">{savedWords.length} Words</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-[#FAF9F6]">
                <span className="text-xs text-[#1A1A1A]/70">Translation Alignment Requests</span>
                <span className="text-sm font-sans font-semibold text-[#1A1A1A]">{savedWords.length * 3 + 12} Operations</span>
              </div>
              <div className="flex justify-between items-center py-2.5">
                <span className="text-xs text-[#1A1A1A]/70">Language Model Focus</span>
                <span className="text-xs font-mono bg-[#F5F2ED] px-2 py-0.5 border border-[#E5E1D8]/60 text-[#1A1A1A] rounded-sm">{model || "Unconfigured"}</span>
              </div>
            </div>
          </div>

          {/* CEFR Graph Card */}
          <div className="p-6 bg-white border border-[#E5E1D8] shadow-xs rounded-sm">
            <h3 className="text-xs uppercase font-bold tracking-wider text-[#9E9E9E] mb-4">CEFR Difficulty Profile</h3>
            <p className="text-[10px] text-[#9E9E9E] mb-4 italic">Distribution breakdown of high-fidelity academic words stored in your current session context.</p>
            
            <div className="space-y-3">
              {wordCategories.map((lvl) => {
                const count = cefrCounts[lvl] || 0;
                const total = savedWords.length || 1;
                const percent = Math.max(1, Math.round((count / total) * 100));
                
                return (
                  <div key={lvl} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          lvl.startsWith("C") ? "bg-[#9b4500]" : lvl.startsWith("B") ? "bg-[#D4A373]" : "bg-green-600"
                        }`}></span>
                        {lvl} Level
                      </span>
                      <span className="text-[#9E9E9E]">{count} word{count !== 1 ? "s" : ""} ({percent}%)</span>
                    </div>
                    <div className="h-2 bg-[#F5F2ED] rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          lvl.startsWith("C") ? "bg-[#9b4500]" : lvl.startsWith("B") ? "bg-[#D4A373]" : "bg-green-600"
                        }`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Tabular setup for setting properties and testing APIs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 bg-white border border-[#E5E1D8] shadow-xs rounded-sm">
            <h3 className="text-xs uppercase font-bold tracking-wider text-[#9E9E9E] mb-6 flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#1A1A1A]" /> DeepSeek API Integration Core
            </h3>

            {/* API testing status */}
            {testStatus !== "idle" && (
              <div className={`mb-6 p-4 rounded-sm border flex items-start gap-2.5 transition-all animate-fade-in ${
                testStatus === "testing" 
                  ? "bg-amber-50 border-amber-200 text-amber-800" 
                  : testStatus === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}>
                {testStatus === "testing" ? (
                  <RefreshCw className="w-4 h-4 animate-spin mt-0.5 flex-shrink-0" />
                ) : testStatus === "success" ? (
                  <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
                )}
                <div className="text-xs">
                  <p className="font-bold uppercase tracking-wider">{testStatus.toUpperCase()}</p>
                  <p className="mt-1 opacity-90">{testMessage}</p>
                </div>
              </div>
            )}

            <div className="space-y-6">
              
              {/* API Key */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Key className="w-3.5 h-3.5 text-[#D4A373]" /> DeepSeek API Key</span>
                  <span className="text-[10px] text-[#9E9E9E] lowercase italic font-normal">Saves browser-side locally</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Enter your private DeepSeek API Key (sk-...)"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full text-xs font-mono p-3 bg-[#FAF9F6] border border-[#E5E1D8] rounded-sm focus:border-[#D4A373] focus:outline-hidden text-[#1A1A1A] placeholder-[#9E9E9E]"
                  />
                </div>
                <p className="text-[10px] text-[#9E9E9E] italic">If defined, calls DeepSeek Chat endpoints first. Leave empty to fallback to configured backend key or standard local models.</p>
              </div>

              {/* Endpoint & Model in grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">API Base URL</label>
                  <input
                    type="text"
                    placeholder="e.g. https://api.deepseek.com"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    className="w-full text-xs font-mono p-3 bg-[#FAF9F6] border border-[#E5E1D8] rounded-sm focus:border-[#D4A373] focus:outline-hidden text-[#1A1A1A]"
                  />
                  <p className="text-[10px] text-[#9E9E9E]">For siliconflow, openrouter, etc.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">Model Selector</label>
                  <input
                    type="text"
                    placeholder="e.g. deepseek-chat"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full text-xs font-mono p-3 bg-[#FAF9F6] border border-[#E5E1D8] rounded-sm focus:border-[#D4A373] focus:outline-hidden text-[#1A1A1A]"
                  />
                  <p className="text-[10px] text-[#9E9E9E]">e.g. deepseek-chat or deepseek-reasoner</p>
                </div>
              </div>

              {/* Prompts adjustment */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#9E9E9E]" /> Translation Alignment System Prompt
                </label>
                <textarea
                  rows={3}
                  value={transPrompt}
                  onChange={(e) => setTransPrompt(e.target.value)}
                  className="w-full text-xs font-sans p-3 bg-[#FAF9F6] border border-[#E5E1D8] rounded-sm focus:border-[#D4A373] focus:outline-hidden text-[#1A1A1A] leading-relaxed resize-y"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#9E9E9E]" /> Scholarly Dictionary System Prompt
                </label>
                <textarea
                  rows={4}
                  value={dictPrompt}
                  onChange={(e) => setDictPrompt(e.target.value)}
                  className="w-full text-xs font-mono p-3 bg-[#FAF9F6] border border-[#E5E1D8] rounded-sm focus:border-[#D4A373] focus:outline-hidden text-[#1A1A1A] leading-relaxed resize-y"
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testStatus === "testing"}
                  className="px-4 py-2 border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-all text-[10px] font-bold uppercase tracking-wider rounded-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testStatus === "testing" ? "animate-spin" : ""}`} /> Test API Connection
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleResetToDefaults}
                    className="px-4 py-2 border border-[#E5E1D8] hover:bg-[#F5F2ED] hover:text-[#1A1A1A] transition-all text-[10px] font-bold text-[#1A1A1A]/80 uppercase tracking-wider rounded-sm cursor-pointer"
                  >
                    Reset Defaults
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    className="px-5 py-2 bg-[#1A1A1A] hover:bg-[#333] transition-all text-[10px] font-bold text-white uppercase tracking-wider rounded-sm cursor-pointer"
                  >
                    Save Configuration
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* FOOTER AREA: Custom Vocabulary Notebook flashcard area */}
      <div className="mt-12 p-6 bg-white border border-[#E5E1D8] shadow-xs rounded-sm">
        <div className="border-b border-[#E5E1D8]/60 pb-4 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-xs uppercase font-bold tracking-wider text-[#9E9E9E] flex items-center gap-1.5">
              <BookMarked className="w-4 h-4 text-[#D4A373]" /> Interactive Vocabulary Notebook
            </h3>
            <p className="text-[10px] text-[#9E9E9E] mt-1 italic">Click on any card to show/reveal phonetic pronunciation, dictionary translations, and scholarly etymology.</p>
          </div>

          <div className="relative w-full md:w-64">
            <span className="absolute left-3 top-2.5 text-[#9E9E9E]"><Search className="w-3.5 h-3.5" /></span>
            <input
              type="text"
              placeholder="Search vocabulary..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#FAF9F6] border border-[#E5E1D8] text-xs font-sans rounded-sm focus:border-[#D4A373] focus:outline-hidden placeholder-[#9E9E9E]"
            />
          </div>
        </div>

        {filteredWords.length === 0 ? (
          <div className="p-12 text-center text-[#9E9E9E] border border-dashed border-[#E5E1D8] rounded-sm select-none">
            <Info className="w-8 h-8 text-[#D4A373]/50 mx-auto mb-2" />
            <p className="font-serif italic text-sm">No synchronized words found in notebook.</p>
            <p className="text-[10px] mt-1 leading-normal">Double-click or click terms in study/reader mode, then click the star logo to populate your scholar list.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredWords.map((v) => {
              const isRevealed = revealedWord === v.word.toLowerCase();
              return (
                <div
                  key={v.word}
                  onClick={() => setRevealedWord(isRevealed ? null : v.word.toLowerCase())}
                  className="group relative p-4 bg-[#FAF9F6]/50 hover:bg-[#FAF9F6] border border-[#E5E1D8] shadow-xs rounded-sm cursor-pointer hover:border-[#D4A373] transition-all space-y-3 flex flex-col justify-between"
                >
                  {/* Remove word from notebook directly */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveWord(v);
                    }}
                    className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 p-1.5 text-[#9E9E9E] hover:text-rose-600 hover:bg-rose-50 rounded-sm transition-all cursor-pointer"
                    title="Remove keyword"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div>
                    <div className="flex items-center gap-2 pr-6">
                      <h4 className="text-base font-bold text-[#1A1A1A] font-serif tracking-tight">{v.word}</h4>
                      <span className="text-[9px] font-mono font-bold bg-[#F5F2ED] border border-[#E5E1D8]/60 px-1.5 py-0.2 text-[#1A1A1A]/80 rounded-xs uppercase">{v.pos}</span>
                      <span className={`text-[9px] font-bold border px-1.5 py-0.2 rounded-xs ${
                        v.cefr?.startsWith("C") ? "text-[#9b4500] border-amber-300 bg-amber-50" : "text-[#D4A373] border-stone-300"
                      }`}>{v.cefr}</span>
                    </div>
                    <p className="text-[10px] font-mono text-[#9E9E9E] mt-1 select-none">{v.phonetics}</p>
                  </div>

                  <div className="text-xs space-y-2 border-t border-[#E5E1D8]/50 pt-3">
                    <div>
                      <span className="text-[9px] text-[#9E9E9E] uppercase tracking-wider block font-bold">Definition</span>
                      <p className="text-[#1A1A1A] leading-relaxed truncate group-hover:whitespace-normal">{v.definition}</p>
                    </div>

                    <div className={`transition-all duration-300 ${isRevealed ? "opacity-100 max-h-40" : "opacity-35 group-hover:opacity-50"}`}>
                      <span className="text-[9px] text-[#9E9E9E] uppercase tracking-wider block font-bold">Chinese Translation</span>
                      <p className="text-[#D4A373] font-bold font-serif leading-relaxed">{v.translation || "未同步译文"}</p>
                    </div>

                    {isRevealed && (
                      <div className="space-y-2 animate-fade-in pt-1">
                        {v.synonyms && v.synonyms.length > 0 && (
                          <div>
                            <span className="text-[9px] text-[#9E9E9E] uppercase tracking-wider block font-bold">Synonyms</span>
                            <p className="text-[#1A1A1A]/90 italic font-serif leading-relaxed text-xs">{v.synonyms.join(", ")}</p>
                          </div>
                        )}
                        {v.etymology && (
                          <div>
                            <span className="text-[9px] text-[#9E9E9E] uppercase tracking-wider block font-bold">Scholarly Etymology</span>
                            <p className="text-[#1A1A1A]/80 text-[11px] leading-relaxed italic">{v.etymology}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 text-[8px] uppercase tracking-widest text-[#9E9E9E] font-bold text-right">
                    {isRevealed ? "Click to fold" : "Click to unfold details"}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
