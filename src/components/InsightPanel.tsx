import { useState, useEffect } from "react";
import { Lightbulb, Bookmark, BookmarkCheck, BarChart3, BookOpen, Trash2, X, RefreshCw, AlertCircle } from "lucide-react";
import { Article, VocabularyWord } from "../types";

interface InsightPanelProps {
  article: Article;
  selectedWord: string | null;
  selectedWordContext: string | null;
  onClose: () => void;
  savedWordsList: VocabularyWord[];
  onToggleSaveWord: (word: VocabularyWord) => void;
  onSelectWord: (word: string, context: string) => void;
}

export default function InsightPanel({
  article,
  selectedWord,
  selectedWordContext,
  onClose,
  savedWordsList,
  onToggleSaveWord,
  onSelectWord
}: InsightPanelProps) {
  const [wordDetails, setWordDetails] = useState<VocabularyWord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorString, setErrorString] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"insights" | "deck">("insights");

  // Fetch word definition upon selection
  useEffect(() => {
    if (!selectedWord) {
      setWordDetails(null);
      setErrorString(null);
      return;
    }

    // First check if the word is already preloaded in the article's own keyVocabulary
    const matchPreloaded = article.keyVocabulary?.find(
      (v) => v.word.toLowerCase() === selectedWord.toLowerCase()
    );

    if (matchPreloaded) {
      setWordDetails(matchPreloaded);
      setErrorString(null);
      setIsLoading(false);
      setActiveTab("insights");
      return;
    }

    // Call fallback local dictionary lookup for basic terms
    // but default to calling Gemini dictionary API for a truly universal 划词 lookup!
    const fetchLiveLookup = async () => {
      setIsLoading(true);
      setErrorString(null);
      setWordDetails(null);
      setActiveTab("insights");

      try {
        const clientKey = localStorage.getItem("deepseek_client_key") || "";
        const clientUrl = localStorage.getItem("deepseek_client_url") || "";
        const clientModel = localStorage.getItem("deepseek_client_model") || "";
        const clientDictPrompt = localStorage.getItem("deepseek_client_dict_prompt") || "";

        const response = await fetch("/api/lookup-word", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            word: selectedWord,
            context: selectedWordContext || "",
            clientKey,
            clientUrl,
            clientModel,
            clientDictPrompt
          })
        });

        if (!response.ok) {
          throw new Error("Unable to contact live dictionaries.");
        }

        const data: VocabularyWord = await response.json();
        setWordDetails(data);
      } catch (err: any) {
        console.error("Lookup error:", err);
        // Fallback card if offline or API rate-limited
        setWordDetails({
          word: selectedWord,
          pos: "word",
          phonetics: "/.../",
          cefr: "B2",
          definition: `Live dictionary analysis was unable to load. Click to study in context or retry.`,
          translation: `未能在词典中加载。`,
          synonyms: ["context", "reference"],
          etymology: "Modern digital lookup."
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchLiveLookup();
  }, [selectedWord, selectedWordContext, article]);

  const isSaved = (wordName: string) => {
    return savedWordsList.some((w) => w.word.toLowerCase() === wordName.toLowerCase());
  };

  const activeArticleIsSaved = wordDetails && isSaved(wordDetails.word);

  return (
    <aside
      id="insight-panel-container"
      className="insight-panel w-full lg:w-80 bg-surface-container border-l border-outline-variant/30 h-full overflow-y-auto flex-shrink-0 flex flex-col z-30"
    >
      {/* Tab Selectors */}
      <div className="flex border-b border-outline-variant/20 bg-surface-container-high text-xs select-none sticky top-0 z-10">
        <button
          onClick={() => setActiveTab("insights")}
          className={`flex-1 py-3.5 text-center font-bold tracking-wide transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === "insights"
              ? "bg-background border-b-2 border-secondary text-secondary"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5" /> Insights Panel
        </button>
        <button
          onClick={() => setActiveTab("deck")}
          className={`flex-1 py-3.5 text-center font-bold tracking-wide transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === "deck"
              ? "bg-background border-b-2 border-secondary text-secondary"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" /> Saved Words ({savedWordsList.length})
        </button>
      </div>

      {activeTab === "insights" ? (
        <div className="p-6 flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E1D8]">
            <h3 className="font-sans text-[10px] uppercase tracking-wider text-[#D4A373] font-bold flex items-center gap-2">
              <Lightbulb className="w-4 h-4" /> Selected Context
            </h3>
            {selectedWord && (
              <button
                onClick={onClose}
                className="p-1 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-colors"
                title="Clear selected word"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Loaders */}
          {isLoading ? (
            <div className="bg-background rounded-sm p-8 border border-[#E5E1D8] shadow-[0px_4px_20px_rgba(0,0,0,0.02)] text-center flex flex-col items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 text-secondary animate-spin mb-3" />
              <p className="text-xs text-on-surface font-semibold animate-pulse select-none">
                Querying Linguistic Index...
              </p>
              <p className="text-[10px] text-[#9E9E9E] italic select-none mt-1">
                Fetching etymology and translation couplings
              </p>
            </div>
          ) : wordDetails ? (
            /* Active Selected Word card represented as clean academic index-card layout */
            <div className="bg-white rounded-sm border border-[#E5E1D8] shadow-[0px_4px_20px_rgba(0,0,0,0.02)] overflow-hidden relative">
              {/* CEFR Badge */}
              <div className="absolute top-4 right-4 bg-[#F5F2ED] border border-[#E5E1D8] text-[#1A1A1A] font-bold text-[9px] font-mono px-1.5 py-0.5 rounded-sm tracking-wide uppercase select-none">
                {wordDetails.cefr || "B2"}
              </div>

              <div className="p-5 border-b border-[#E5E1D8]/65">
                <h4 id="word-title-detail" className="font-serif text-2xl text-[#1A1A1A] italic font-bold tracking-tight mb-1 capitalize select-text">
                  {wordDetails.word}
                </h4>
                <div className="flex items-center gap-2 select-text">
                  <p className="text-[#9E9E9E] text-[11px] font-mono">{wordDetails.phonetics}</p>
                  <span className="text-[10px] text-[#9E9E9E] italic">• {wordDetails.pos}</span>
                </div>
              </div>

              <div className="p-5 space-y-4 select-text">
                <div>
                  <p className="font-bold text-[10px] text-[#9E9E9E] uppercase tracking-wider mb-1 px-0.5">
                    Definition
                  </p>
                  <p className="text-xs text-[#333] leading-relaxed font-normal bg-[#FAF9F6] p-2.5 rounded-sm border border-[#E5E1D8]/40">
                    {wordDetails.definition}
                  </p>
                </div>

                {wordDetails.translation && (
                  <div>
                    <p className="font-bold text-[10px] text-[#9E9E9E] uppercase tracking-wider mb-1 px-0.5">
                      Translation / 释义
                    </p>
                    <p className="text-base font-medium text-[#D4A373] leading-relaxed pl-1.5 border-l-2 border-[#D4A373]/60 select-text">
                      {wordDetails.translation}
                    </p>
                  </div>
                )}

                {wordDetails.synonyms && wordDetails.synonyms.length > 0 && (
                  <div>
                    <p className="font-bold text-[10px] text-[#9E9E9E] uppercase tracking-wider mb-1.5 px-0.5">
                      Synonym Cluster
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {wordDetails.synonyms.map((syn, index) => (
                        <span
                          key={index}
                          onClick={() => onSelectWord(syn, "")}
                          className="px-2 py-0.5 bg-[#FAF9F6] hover:bg-[#FFE8D6] hover:text-[#1A1A1A] duration-150 text-[10px] text-[#1A1A1A]/80 rounded-sm border border-[#E5E1D8] font-medium cursor-pointer"
                        >
                          {syn}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {wordDetails.etymology && (
                  <div>
                    <p className="font-bold text-[10px] text-[#9E9E9E] uppercase tracking-wider mb-1 px-0.5">
                      Etymology
                    </p>
                    <p className="text-[10px] text-[#444] leading-relaxed bg-[#F5F2ED] p-2.5 rounded-sm border border-[#E5E1D8]/35 select-text">
                      {wordDetails.etymology}
                    </p>
                  </div>
                )}
              </div>

              {/* Action items */}
              <div className="p-4 border-t border-[#E5E1D8]">
                <button
                  onClick={() => onToggleSaveWord(wordDetails)}
                  className={`w-full py-3 text-[10px] uppercase font-bold tracking-widest transition-all duration-150 flex items-center justify-center gap-1.5 select-none cursor-pointer ${
                    activeArticleIsSaved
                      ? "bg-white border border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white"
                      : "bg-[#1A1A1A] border border-[#1A1A1A] text-white hover:bg-[#333]"
                  }`}
                >
                  {activeArticleIsSaved ? (
                    <>
                      <BookmarkCheck className="w-4 h-4 text-[#D4A373]" /> Saved to Deck
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4" /> Save to Study Deck
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Standard state if no word is selected */
            <div className="text-center py-8 px-5 bg-[#F5F2ED]/60 rounded-sm border border-dashed border-[#E5E1D8]">
              <BookOpen className="w-7 h-7 text-[#9E9E9E] mx-auto mb-3" />
              <p className="text-xs font-serif italic text-[#1A1A1A] mb-1.5 select-none">
                Linguistic Index Active
              </p>
              <p className="text-[11px] text-[#9E9E9E] leading-relaxed max-w-[200px] mx-auto select-none font-sans">
                Select any word inside the literary document to view definitions, exact alignments, and historical context.
              </p>
            </div>
          )}

          {/* Vocab Density Map Block */}
          <div id="vocab-density-panel">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#9E9E9E] mb-3 flex items-center gap-1.5 border-b border-[#E5E1D8] pb-2">
              <BarChart3 className="w-3.5 h-3.5 text-[#9E9E9E]" /> Academic Vocab Density
            </h4>

            <div className="bg-white p-4 rounded-sm border border-[#E5E1D8] shadow-[0px_4px_20px_rgba(0,0,0,0.01)] select-none">
              <div className="flex flex-col gap-3">
                {article.sections.map((sec, idx) => {
                  // Retrieve or approximate concentration
                  const densityScore = article.vocabDensity?.[sec.title] || (idx === 0 ? 4 : idx === 1 ? 12 : 3);
                  // Max limits for rating bars
                  const maxLimit = 15;
                  const pct = Math.min((densityScore / maxLimit) * 100, 100);

                  return (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="text-[10px] text-[#1A1A1A]/80 font-medium w-12 text-right truncate">
                        {sec.title}
                      </span>
                      <div className="flex-1 h-1.5 bg-[#F5F2ED] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#D4A373] rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] font-bold text-[#1A1A1A]">
                        {densityScore}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[9px] text-[#9E9E9E] mt-4 text-center italic leading-tight select-none">
                B2+ scholarly phrasing index per text segment.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* SAVED VOCABULARY DECK VIEW */
        <div className="p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E1D8]">
            <h3 className="text-[10px] uppercase tracking-[0.15em] text-[#D4A373] font-bold flex items-center gap-1.5 select-none">
              <Bookmark className="w-3.5 h-3.5" /> Study Flashcards
            </h3>
          </div>

          {savedWordsList.length === 0 ? (
            <div className="text-center py-10 px-4 bg-[#F5F2ED]/60 rounded-sm border border-dashed border-[#E5E1D8] select-none">
              <Bookmark className="w-8 h-8 text-[#9E9E9E] mx-auto mb-2.5" />
              <p className="text-xs text-[#1A1A1A] font-serif italic mb-1">
                Flashcard Deck is Empty
              </p>
              <p className="text-[10.5px] text-[#9E9E9E] leading-relaxed max-w-[180px] mx-auto font-sans">
                Words saved during study mode will accumulate here for review.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
              {savedWordsList.map((sw, idx) => (
                <div
                  key={idx}
                  id={`saved-card-${sw.word}`}
                  className="bg-white p-4 rounded-sm border border-[#E5E1D8] shadow-xs hover:shadow-sm transition-all relative group"
                >
                  <button
                    onClick={() => onToggleSaveWord(sw)}
                    className="absolute top-2.5 right-2.5 text-[#9E9E9E] hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-1"
                    title="Remove from deck"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div
                    className="cursor-pointer"
                    onClick={() => onSelectWord(sw.word, "")}
                  >
                    <div className="flex items-center gap-1.5 mb-1.5 select-text">
                      <span className="font-serif italic font-bold text-[#1A1A1A] group-hover:text-[#D4A373] duration-150 text-base capitalize">{sw.word}</span>
                      <span className="text-[8px] bg-[#FAF9F6] border border-[#E5E1D8] text-[#1A1A1A] font-bold font-mono px-1 rounded-sm uppercase">
                        {sw.cefr}
                      </span>
                    </div>

                    <p className="text-[10px] text-[#444] leading-relaxed line-clamp-2 select-text font-normal mb-1.5">
                      &ldquo;{sw.definition}&rdquo;
                    </p>

                    {sw.translation && (
                      <p className="text-[11px] text-[#D4A373] font-semibold flex items-center gap-1 select-text border-t border-[#E5E1D8]/45 pt-1.5">
                        {sw.translation}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
