import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { BookOpen, Upload, FileText, ChevronRight, AlertCircle, RefreshCw } from "lucide-react";
import { Article } from "../types";

interface LibraryProps {
  articles: Article[];
  onSelectArticle: (article: Article) => void;
  onImportArticle: (newArticle: Article) => void;
}

const LOADER_MESSAGES = [
  "Analyzing typographic syntax...",
  "Calibrating CEFR vocabulary density profiles...",
  "Querying historical etymological chains...",
  "Drafting billingual paragraph couplings...",
  "Synthesizing structured aesthetic reading blocks..."
];

export default function Library({ articles, onSelectArticle, onImportArticle }: LibraryProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startLoaderAnimation = () => {
    setIsLoading(true);
    setUploadError(null);
    setLoadingMsgIdx(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setLoadingMsgIdx((prev) => (prev + 1) % LOADER_MESSAGES.length);
    }, 2800);
  };

  const stopLoaderAnimation = () => {
    setIsLoading(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleProcessFile = async (rawText: string) => {
    if (!rawText.trim()) {
      setUploadError("The uploaded markdown document is empty.");
      return;
    }

    startLoaderAnimation();

    try {
      const response = await fetch("/api/analyze-markdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown: rawText }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Linguistic parsing failed on the server.");
      }

      const articlePayload = await response.json();
      const uniqueId = `user-doc-${Date.now()}`;
      
      const parsedArticle: Article = {
        ...articlePayload,
        id: uniqueId,
        isUserUploaded: true
      };

      onImportArticle(parsedArticle);
      onSelectArticle(parsedArticle);
    } catch (err: any) {
      setUploadError(err.message || "An unexpected error occurred during document parsing.");
    } finally {
      stopLoaderAnimation();
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await readAndProcessFile(file);
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await readAndProcessFile(file);
    }
  };

  const readAndProcessFile = (file: File): Promise<void> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target?.result as string;
        await handleProcessFile(text);
        resolve();
      };
      reader.onerror = () => {
        setUploadError("Unable to read the local file.");
        resolve();
      };
      reader.readAsText(file);
    });
  };

  const triggerManualUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div id="library-container" className="max-w-4xl mx-auto px-6 py-12 select-none bg-[#FDFCFB]">
      {/* Header section representing scholastic atmosphere */}
      <div className="text-center mb-12">
        <div id="library-logo" className="text-3xl font-serif italic mb-2 tracking-tight text-[#D4A373]">
          Lecta.
        </div>
        <h1 id="library-headline" className="font-serif text-3xl font-bold text-[#1A1A1A] tracking-tight mb-3">
          University Knowledge Archives
        </h1>
        <p id="library-sub" className="text-[#9E9E9E] font-serif italic max-w-lg mx-auto leading-relaxed text-sm">
          Select curated standard literature below, or import your personal annotated papers in Markdown for real-time linguistic mapping.
        </p>
      </div>

      <div className="grid md:grid-cols-5 gap-8 items-start">
        {/* Curated Article Library */}
        <div id="library-curated" className="md:col-span-3 space-y-6">
          <h2 className="text-[10px] uppercase tracking-[0.15em] text-[#9E9E9E] font-bold border-b border-[#E5E1D8] pb-3">
            Scholarly Library
          </h2>

          <div className="space-y-4">
            {articles.map((article, idx) => (
              <div
                key={article.id}
                id={`article-card-${article.id}`}
                onClick={() => onSelectArticle(article)}
                className="group relative bg-[#FAF9F6] p-6 rounded-sm border border-[#E5E1D8] hover:border-[#D4A373] hover:shadow-xs transition-all cursor-pointer"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="px-2 py-0.5 bg-[#F5F2ED] border border-[#E5E1D8] text-[#1A1A1A] text-[10px] font-mono tracking-wider rounded-sm uppercase">
                    {article.category}
                  </span>
                  <span className="text-[10px] text-[#9E9E9E] font-mono select-none">
                    • {article.readTime}
                  </span>
                </div>
                <h3 className="font-serif text-xl font-bold text-[#1A1A1A] group-hover:text-[#D4A373] transition-colors mb-2">
                  {article.title}
                </h3>
                <p className="text-[#444] font-serif text-sm italic font-normal leading-relaxed mb-4">
                  {article.summary}
                </p>
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#D4A373] group-hover:translate-x-1 transition-all">
                  Enter Study Workspace <ChevronRight className="w-3.5 h-3.5" />
                </div>

                {article.isUserUploaded && (
                  <span className="absolute bottom-4 right-4 text-[9px] bg-[#1A1A1A] text-white font-mono tracking-widest px-1.5 py-0.5 rounded-sm">
                    IMPORTED
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Import Panel */}
        <div id="library-uploader" className="md:col-span-2 space-y-6">
          <h2 className="text-[10px] uppercase tracking-[0.15em] text-[#9E9E9E] font-bold border-b border-[#E5E1D8] pb-3">
            Import Document
          </h2>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border border-dashed rounded-sm p-8 text-center transition-all flex flex-col justify-center items-center ${
              isDragging
                ? "border-[#D4A373] bg-[#FFE8D6]/10"
                : "border-[#E5E1D8] bg-[#FAF9F6] hover:border-[#D4A373]"
            } ${isLoading ? "pointer-events-none opacity-85" : "cursor-pointer"}`}
            onClick={isLoading ? undefined : triggerManualUpload}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".md"
              className="hidden"
            />

            {isLoading ? (
              <div className="py-6 flex flex-col items-center">
                <RefreshCw className="w-10 h-10 text-[#D4A373] animate-spin mb-4" />
                <p className="font-serif italic text-sm font-semibold text-[#1A1A1A] mb-2">
                  Processing Manuscript...
                </p>
                <p className="text-xs text-[#9E9E9E] italic select-none animate-pulse">
                  {LOADER_MESSAGES[loadingMsgIdx]}
                </p>
              </div>
            ) : (
              <div className="py-6 flex flex-col items-center">
                <div className="w-12 h-12 rounded-sm bg-white flex items-center justify-center mb-4 border border-[#E5E1D8]">
                  <Upload className="w-5 h-5 text-[#9E9E9E]" />
                </div>
                <p className="font-serif italic text-sm text-[#1A1A1A] font-semibold mb-1">
                  Drag and drop markdown file
                </p>
                <p className="text-xs text-[#9E9E9E] mb-4">
                  or click to select file (.md)
                </p>
                <div className="px-5 py-2.5 bg-[#1A1A1A] hover:bg-[#333] text-white font-bold text-[10px] uppercase tracking-widest transition-all">
                  Browse Files
                </div>
              </div>
            )}
          </div>

          {uploadError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-sm flex gap-3 text-red-800">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold mb-1">Import Failure</p>
                <p className="leading-tight text-red-700">{uploadError}</p>
              </div>
            </div>
          )}

          <div className="bg-[#F5F2ED] border border-[#E5E1D8] p-5 rounded-sm">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#1A1A1A] mb-3">
              Parsing Guidelines
            </h4>
            <ul className="text-xs text-[#444] space-y-2.5 list-disc list-inside leading-relaxed font-serif italic">
              <li>Supports standard English articles and manuscripts.</li>
              <li>Underlines will automatically bind to high CEFR-level vocabulary words.</li>
              <li>Generates bilingual side-by-side coupling alignments dynamically.</li>
              <li>Maps section-by-section academic density metrics.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
