import { useState, useEffect } from "react";
import { BookOpen, Edit, Globe, ChevronLeft, Volume2, Type as FontIcon, List, Eye, Trash2, ArrowLeft } from "lucide-react";
import { Article, VocabularyWord } from "../types";

interface ReaderProps {
  article: Article;
  activeWord: string | null;
  onSelectWord: (word: string, context: string) => void;
  onBackToLibrary: () => void;
  savedWords: string[];
  onToggleSaveWord: (word: VocabularyWord) => void;
  readingMode: "Immersive" | "Study" | "Dual-Link";
  setReadingMode: (mode: "Immersive" | "Study" | "Dual-Link") => void;
}

export default function Reader({
  article,
  activeWord,
  onSelectWord,
  onBackToLibrary,
  savedWords,
  onToggleSaveWord,
  readingMode,
  setReadingMode
}: ReaderProps) {
  const [fontSize, setFontSize] = useState<number>(18);
  const [paragraphTranslations, setParagraphTranslations] = useState<Record<number, string>>({});
  const [loadingTranslations, setLoadingTranslations] = useState<Record<number, boolean>>({});

  // Reset translations and selected words when switching articles
  useEffect(() => {
    setParagraphTranslations({});
    setLoadingTranslations({});
  }, [article]);

  const handleDecreaseFont = () => {
    if (fontSize > 14) setFontSize(fontSize - 1);
  };

  const handleIncreaseFont = () => {
    if (fontSize < 28) setFontSize(fontSize + 1);
  };

  const translateParagraph = async (pIdx: number, text: string) => {
    // Check if we already have it in state
    if (paragraphTranslations[pIdx]) {
      setParagraphTranslations((prev) => {
        const next = { ...prev };
        delete next[pIdx]; // Toggle off
        return next;
      });
      return;
    }

    // Checking if parsed dynamically via markdown upload translations
    if (article.translations?.[pIdx]) {
      setParagraphTranslations((prev) => ({ ...prev, [pIdx]: article.translations![pIdx] }));
      return;
    }

    // Checking if default "The Remote Revolution" matches common pre-rendered values for convenience
    if (article.id === "remote-revolution") {
      const defaultTrans: Record<number, string> = {
        0: "从局部的、同步的办公考勤制度向分布式的、异步的操作机制的范式转变，代表了21世纪最重大的社会经济转型之一。这不仅仅是劳动力在地理空间上的重新安置，它是对认知任务如何组织、评估和执行的根本性的重构。",
        1: "历史上，办公室的建筑结构充当了生产力的代理指标。身在现场被等同于卓越表现。然而，当代景观要求我们对产出有更细致微妙的理解，一种脱离与管理层物理距离的产出。",
        2: "这种演变的一个关键组成部分是向异步沟通的迈进。当团队由于分布于多个时区而分散时，期待即时回复不仅变得不切实际，而且会对深度的、专注的工作造成伤害。对书面文档和清晰明确指令的依赖，缓和了同步、对话式环境中常见的模糊和不确定性。",
        3: "此外，朝九晚五通勤的消除在全球范围内开辟了数百万小时的空隙，展示了将时间资源重新分配给个人福祉、家庭或继续教育的机会。然而，这种新发现的自治权需要相应地增加个人的纪律和自我调节能力。",
        4: "随着我们进一步走进这个去中心化的时代，生活与工作的边界亟需主动重新校准。那些蓬勃发展的组织绝不是那些在数字媒介中死板复制办公室物理监督的机构，而是那些培育了深思熟虑、建立在双向信任基础之上的生产力框架的企业。",
        5: "脑力劳动不再是亦步亦趋的同步。通过重新夺回时间主权，现代学者和专业技术人员正迎来一个生产力释放的崭新阶段，在这个阶段，认知质量和持久的心流状态远比在 physical headquarter 物理设施中展示出的姿态重要得多。"
      };
      if (defaultTrans[pIdx]) {
        setParagraphTranslations((prev) => ({ ...prev, [pIdx]: defaultTrans[pIdx] }));
        return;
      }
    }

    if (article.id === "cognitive-surplus") {
      const defaultTrans: Record<number, string> = {
        0: "现代数字景观呈现出空前的智力资源积累的特征，学术界将其定义为认知盈余。在这种环境下，以往用于消极媒体消费的数十亿联合时间正被重新分配给建设性的合作知识公地。",
        1: "这种范式转变的特征在于一种共同的自发意愿来生产、合作和分享。公民不再是独立的信息消费者，而是全球共享数字档案的活跃建设者。",
        2: "公共维基条目、开源代码库以及去中心化在线讲堂的大量涌现，见证了知识分发和专业素养的重大民主化过程。知识免受专利化封存，降低了以往学术交流中的重重樊篱。",
        3: "然而，这种共享资源的无序扩张也带来了认知方面的重重考验。缺乏规律和过滤的学术资源发布可能引发严重的信息眩晕。因此，学术识读力迫切需要一套科学扎实的思辨方法论体系，用以分流高水准的学术成果与泥沙俱下的虚假数据。",
        4: "长期而言，鼓励严格审查同行贡献、培育高度融洽的学术共同体，对于延续人类认知积淀具有重大的象征意义。这样的群体将设立一套自我繁衍升级、高度科学有机的运转体系，在这里，协作智慧与求真务实将战胜哗众取宠的庸俗话语。"
      };
      if (defaultTrans[pIdx]) {
        setParagraphTranslations((prev) => ({ ...prev, [pIdx]: defaultTrans[pIdx] }));
        return;
      }
    }

    // Call server API for custom uploaded docs
    setLoadingTranslations((prev) => ({ ...prev, [pIdx]: true }));
    try {
      const clientKey = localStorage.getItem("deepseek_client_key") || "";
      const clientUrl = localStorage.getItem("deepseek_client_url") || "";
      const clientModel = localStorage.getItem("deepseek_client_model") || "";
      const clientTransPrompt = localStorage.getItem("deepseek_client_trans_prompt") || "";

      const res = await fetch("/api/translate-paragraph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paragraph: text,
          clientKey,
          clientUrl,
          clientModel,
          clientTransPrompt
        })
      });
      if (res.ok) {
        const data = await res.json();
        setParagraphTranslations((prev) => ({ ...prev, [pIdx]: data.translation }));
      }
    } catch (err) {
      console.error("Translation call failed:", err);
    } finally {
      setLoadingTranslations((prev) => ({ ...prev, [pIdx]: false }));
    }
  };

  // Convert keyVocabulary to record for efficient lookup
  const vocabMap: Record<string, VocabularyWord> = {};
  if (article.keyVocabulary) {
    article.keyVocabulary.forEach((v) => {
      vocabMap[v.word.toLowerCase()] = v;
    });
  }

  // Enhanced helper for matching vocabulary words with potential stems, plurals, and variations
  const findMatchingVocabulary = (word: string): VocabularyWord | undefined => {
    if (!word) return undefined;
    const lower = word.toLowerCase();

    // 1. Direct exact lowercase match
    if (vocabMap[lower]) {
      return vocabMap[lower];
    }

    // 2. Perform suffix analysis for common inflective endings
    // Plurals / 3rd person singular -s
    if (lower.endsWith("s") && lower.length > 3) {
      const stem = lower.slice(0, -1);
      if (vocabMap[stem]) return vocabMap[stem];
    }

    // Plurals / 3rd person -es (e.g. processes -> process)
    if (lower.endsWith("es") && lower.length > 4) {
      const stem = lower.slice(0, -2);
      if (vocabMap[stem]) return vocabMap[stem];
    }

    // Past tense / participial -ed (e.g. nuanced -> nuance, balanced -> balance, mitigated -> mitigate)
    if (lower.endsWith("ed") && lower.length > 4) {
      const stem = lower.slice(0, -2);
      if (vocabMap[stem]) return vocabMap[stem];
      const stemWithE = stem + "e";
      if (vocabMap[stemWithE]) return vocabMap[stemWithE];
    }

    // Gerund / continuous -ing (e.g. profiling -> profile, transforming -> transform)
    if (lower.endsWith("ing") && lower.length > 5) {
      const stem = lower.slice(0, -3);
      if (vocabMap[stem]) return vocabMap[stem];
      const stemWithE = stem + "e";
      if (vocabMap[stemWithE]) return vocabMap[stemWithE];
    }

    // Adverbial suffix -ly (e.g. deliberately -> deliberate)
    if (lower.endsWith("ly") && lower.length > 5) {
      const stem = lower.slice(0, -2);
      if (vocabMap[stem]) return vocabMap[stem];
      const stemWithLe = stem.replace(/i$/, "y");
      if (vocabMap[stemWithLe]) return vocabMap[stemWithLe];
    }

    // 3. Substring scans for more flexible matching
    for (const vocabWord of Object.keys(vocabMap)) {
      if (vocabWord.length > 3) {
        if (lower.startsWith(vocabWord) || vocabWord.startsWith(lower)) {
          return vocabMap[vocabWord];
        }
      }
    }

    return undefined;
  };

  // Tokenizer helper to split sentences into clickable words
  const renderParagraphWithInteractiveWords = (paragraphText: string, pIdx: number) => {
    // Split text by boundaries keeping spaces
    const tokens = paragraphText.split(/(\s+)/);

    return tokens.map((token, idx) => {
      if (token.trim() === "") {
        return <span key={idx}>{token}</span>;
      }

      // Match core word vs prefixes and suffixes
      const match = token.match(/^([^\w\s]*)([\w'-]+)([^\w\s]*)$/);
      if (!match) {
        return <span key={idx}>{token}</span>;
      }

      const [_, prefix, coreWord, suffix] = match;
      const cleanWord = coreWord.toLowerCase();
      
      // Look up vocabulary definition
      const vocabDef = findMatchingVocabulary(cleanWord);
      const isVocab = !!vocabDef;
      
      // Detect and strip out markdown bold wrappers from the rendering, and force bolding
      let hasMarkdownBold = false;
      let cleanPrefix = prefix;
      let cleanSuffix = suffix;

      if (prefix.includes("**") || suffix.includes("**")) {
        hasMarkdownBold = true;
        cleanPrefix = prefix.replace(/\*\*/g, "");
        cleanSuffix = suffix.replace(/\*\*/g, "");
      } else if (prefix.includes("*") || suffix.includes("*")) {
        hasMarkdownBold = true;
        cleanPrefix = prefix.replace(/\*/g, "");
        cleanSuffix = suffix.replace(/\*/g, "");
      } else if (prefix.includes("__") || suffix.includes("__")) {
        hasMarkdownBold = true;
        cleanPrefix = prefix.replace(/__/g, "");
        cleanSuffix = suffix.replace(/__/g, "");
      } else if (prefix.includes("_") || suffix.includes("_")) {
        hasMarkdownBold = true;
        cleanPrefix = prefix.replace(/_/g, "");
        cleanSuffix = suffix.replace(/_/g, "");
      }

      const isActive = activeWord?.toLowerCase() === cleanWord || (vocabDef && activeWord?.toLowerCase() === vocabDef.word);

      // Select dynamic highlighting styles based on state & options
      let wordClass = "interactive-word transition-all duration-150 rounded-xs ";
      
      // If Vocab OR Bolded in the text, we make it bold and highlight it
      if (isVocab || hasMarkdownBold) {
        if (readingMode === "Study") {
          wordClass += "font-bold text-[#D4A373] bg-[#FFE8D6]/20 border-b border-dotted border-[#D4A373] hover:bg-[#FFE8D6]/40 ";
        } else if (readingMode === "Immersive") {
          wordClass += "font-semibold text-[#1A1A1A] border-b border-dotted border-outline/35 hover:border-solid ";
        } else { // Dual-Link
          wordClass += "font-bold text-[#D4A373] bg-[#FFE8D6]/10 border-b border-dotted border-[#D4A373]/50 hover:bg-[#FFE8D6]/20 ";
        }
      } else {
        wordClass += "hover:bg-[#F5F2ED] rounded-sm ";
      }

      if (isActive) {
        wordClass = "bg-[#FFE8D6] border-[#D4A373] border-b-2 border-solid text-[#1A1A1A] font-bold rounded-sm px-0.5 shadow-xs ";
      }

      // If activeWord matches the stem or clean word, use vocab lookup word if possible
      const lookupWord = vocabDef ? vocabDef.word : cleanWord;

      return (
        <span key={idx} className="inline font-reading-body">
          {cleanPrefix}
          <span
            className={`${wordClass} cursor-pointer`}
            onClick={() => onSelectWord(lookupWord, paragraphText)}
          >
            {coreWord}
          </span>
          {cleanSuffix}
        </span>
      );
    });
  };

  return (
    <div id="reader-wrapper" className="flex-1 flex flex-col h-full bg-[#FDFCFB] relative overflow-y-auto pb-32">
      {/* Floating Header */}
      <header className="bg-[#FAF9F6]/90 border-b border-[#E5E1D8] sticky top-0 z-20 backdrop-blur px-8 py-3.5 flex items-center justify-between">
        <button
          onClick={onBackToLibrary}
          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#9E9E9E] hover:text-[#1A1A1A] transition-colors duration-150"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Library Back
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono bg-[#F5F2ED] border border-[#E5E1D8] px-2 py-0.5 text-[#1A1A1A]/90 rounded-sm">
            {article.category}
          </span>
          <span className="text-[10px] font-mono text-[#9E9E9E]">• {article.readTime}</span>
        </div>
      </header>

      {/* Main text column */}
      <article className="max-w-reading-container-max mx-auto px-6 pt-12">
        <div className="mb-10 text-center">
          <div className="flex justify-center gap-2 mb-4">
            <span className="text-[10px] bg-[#F5F2ED] border border-[#E5E1D8] px-2 py-0.5 font-mono text-[#1A1A1A]/70 uppercase">source_text.md</span>
            <span className="text-[10px] bg-[#F5F2ED] border border-[#E5E1D8] px-2 py-0.5 font-mono text-[#1A1A1A]/70">B2 Level</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl text-[#1A1A1A] mb-5 leading-tight select-text">
            {article.title}
          </h1>
          <p className="font-serif italic text-[#333]/90 text-sm md:text-base border-t border-b border-[#E5E1D8] py-4 my-6 max-w-xl mx-auto leading-relaxed select-text">
            {article.summary}
          </p>
        </div>

        {/* Floating Controller / Sticky Tools */}
        <div className="sticky top-16 z-10 bg-[#FDFCFB]/95 backdrop-blur py-3 mb-8 border-b border-[#E5E1D8] flex items-center justify-between select-none">
          <div className="flex gap-1.5 bg-[#F5F2ED] p-1 rounded-sm border border-[#E5E1D8]">
            <button
              onClick={() => setReadingMode("Immersive")}
              className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded-sm transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
                readingMode === "Immersive"
                  ? "bg-[#1A1A1A] text-white shadow-xs"
                  : "text-[#1A1A1A]/60 hover:text-[#1A1A1A]"
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> Immersive
            </button>
            <button
              onClick={() => setReadingMode("Study")}
              className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded-sm transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
                readingMode === "Study"
                  ? "bg-[#1A1A1A] text-white shadow-xs"
                  : "text-[#1A1A1A]/60 hover:text-[#1A1A1A]"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> Study
            </button>
            <button
              onClick={() => setReadingMode("Dual-Link")}
              className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded-sm transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
                readingMode === "Dual-Link"
                  ? "bg-[#1A1A1A] text-white shadow-xs"
                  : "text-[#1A1A1A]/60 hover:text-[#1A1A1A]"
              }`}
            >
              <Globe className="w-3.5 h-3.5" /> Dual-Link
            </button>
          </div>

          {/* Right controls for typographic options */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-[#9E9E9E]">Size: {fontSize}px</span>
            <div className="flex gap-1 bg-[#F5F2ED] p-1 rounded-sm border border-[#E5E1D8]">
              <button
                onClick={handleDecreaseFont}
                disabled={fontSize <= 14}
                className="px-2 py-0.5 text-xs font-bold text-[#1A1A1A]/70 hover:text-[#1A1A1A] disabled:opacity-30 cursor-pointer"
                title="Decrease font size"
              >
                A-
              </button>
              <button
                onClick={handleIncreaseFont}
                disabled={fontSize >= 28}
                className="px-2 py-0.5 text-xs font-bold text-[#1A1A1A]/70 hover:text-[#1A1A1A] disabled:opacity-30 cursor-pointer"
                title="Increase font size"
              >
                A+
              </button>
            </div>
          </div>
        </div>

        {/* The dynamic manuscript sections mapping */}
        <div className="space-y-8 select-text">
          {article.sections && article.sections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-6">
              {section.title && (
                <div className="mt-8 mb-4 border-b border-[#E5E1D8]/40 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#D4A373] font-mono">
                    {section.title}
                  </h3>
                </div>
              )}

              {section.paragraphs && section.paragraphs.map((paragraph, pIdx) => {
                const uniqueParagraphKey = sIdx * 1000 + pIdx;
                const isTranslated =
                  readingMode === "Dual-Link" || !!paragraphTranslations[uniqueParagraphKey];
                const isLoading = !!loadingTranslations[uniqueParagraphKey];

                if (readingMode === "Dual-Link") {
                  return (
                    <div key={pIdx} className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-[#E5E1D8]/40 pb-6 mb-6">
                      {/* Left Side: English with Interactive Words */}
                      <div className="space-y-2">
                        <span className="text-[9px] uppercase tracking-wider font-mono text-[#9E9E9E] font-bold">English Manuscript</span>
                        <p 
                          style={{ fontSize: `${fontSize}px` }} 
                          className="font-reading-body text-justify leading-relaxed text-[#1A1A1A]"
                        >
                          {sIdx === 0 && pIdx === 0 && (
                            <span className="float-left text-[3.8em] leading-[0.75] pr-2.5 pt-1.5 font-bold select-none text-[#1A1A1A] font-serif">
                              {paragraph.trim().charAt(0)}
                            </span>
                          )}
                          {sIdx === 0 && pIdx === 0
                            ? renderParagraphWithInteractiveWords(paragraph.trim().slice(1), uniqueParagraphKey)
                            : renderParagraphWithInteractiveWords(paragraph, uniqueParagraphKey)}
                        </p>
                      </div>

                      {/* Right Side: Chinese Translation Coupling */}
                      <div className="space-y-2 bg-[#FDFCFB] border-l border-[#D4A373]/30 pl-4">
                        <span className="text-[9px] uppercase tracking-wider font-mono text-[#D4A373] font-bold">Chinese Translation</span>
                        {isLoading ? (
                          <div className="text-xs text-[#D4A373] py-2 animate-pulse flex items-center gap-1.5 select-none font-sans">
                            <span className="w-2 h-2 rounded-full bg-[#D4A373] animate-ping"></span>
                            Synthesizing aligned translations...
                          </div>
                        ) : (() => {
                          const customTrans = paragraphTranslations[uniqueParagraphKey] ||
                            (article.translations && article.translations[uniqueParagraphKey]);
                          if (customTrans) {
                            return (
                              <p 
                                style={{ fontSize: `${fontSize - 2}px` }} 
                                className="font-serif leading-relaxed text-[#444] text-justify select-text"
                              >
                                {customTrans}
                              </p>
                            );
                          }

                          let revTrans = "";
                          if (article.id === "remote-revolution") {
                            revTrans = {
                              0: "从局部的、同步的办公考勤制度向分布式的、异步的操作机制的范式转变，代表了21世纪最重大的社会经济转型之一。这不仅仅是劳动力在地理空间上的重新安置，它是对认知任务如何组织、评估和执行的根本性的重构。",
                              1: "历史上，办公室的建筑结构充当了生产力的代理指标。身在现场被等同于卓越表现。然而，当代景观要求我们对产出有更细致微妙的理解，一种脱离与管理层物理距离的产出。",
                              2: "这种演变的一个关键组成部分是向异步沟通的迈进。当团队由于分布于多个时区而分散时，期待即时回复不仅变得不切实际，而且会对深度的、专注的工作造成伤害。对书面文档 and 清晰明确指令的依赖，缓和了同步、对话式环境中常见的模糊 and 不确定性。",
                              3: "此外，朝九晚五通勤的消除在全球范围内开辟了数百万小时的空隙，展示了将时间资源重新分配给个人福祉、家庭或继续教育的机会。然而，这种新发现的自治权需要相应地增加个人的纪律 and 自我调节能力。",
                              4: "随着我们进一步走进这个去中心化的时代，生活与工作的边界亟需主动重新校准。那些蓬勃发展的组织绝不是那些在数字媒介中死板复制办公室物理监督的机构，而是那些培育了深思虑、建立在双向信任基础之上的生产力框架的企业。",
                              5: "脑力劳动不再是亦步亦趋的同步。通过重新夺回时间主权，现代学者和专业技术人员正迎来一个生产力释放的崭新阶段，在这个阶段，认知质量和持久的心流状态远比在 physical headquarter 物理设施中展示出的姿态重要得多。"
                            }[pIdx] || "";
                          } else if (article.id === "cognitive-surplus") {
                            revTrans = {
                              0: "现代数字景观呈现出空前的智力资源积累的特征，学术界将其定义为认知盈余。在这种环境下，以往用于消极媒体消费的数十亿联合时间正被重新分配给建设性的合作知识公地。",
                              1: "这种范式转变的特征在于一种共同的自发意愿来生产、合作和分享。公民不再是独立的信息消费者，而是全球共享数字档案的活跃建设者。",
                              2: "公共维基条目、开源代码库以及去中心化在线讲堂的大量涌现，见证了知识分发和专业素养的重大民主化过程。知识免受专利化封存，降低了以往学术交流中的重重樊篱。",
                              3: "然而，这种共享资源的无序扩张也带来了认知方面的重重考验。缺乏规律和过滤的学术资源发布可能引发严重的信息眩晕。因此，学术识读力迫切需要一套科学扎实的思辨方法论体系，用以分流高水准的学术成果与泥沙俱下的虚假数据。",
                              4: "长期而言，鼓励严格审查同行贡献、培育高度融洽的学术共同体，对于延续人类认知积淀具有重大的象征意义。这样的群体将设立一套自我繁衍升级、高度科学有机的运转体系，在这里，协作智慧与求真务实将战胜哗众取宠的庸俗话语。"
                            }[pIdx] || "";
                          }

                          if (revTrans) {
                            return (
                              <p 
                                style={{ fontSize: `${fontSize - 2}px` }} 
                                className="font-serif leading-relaxed text-[#444] text-justify select-text"
                              >
                                {revTrans}
                              </p>
                            );
                          }

                          return (
                            <div className="flex flex-col gap-2 items-start pl-1 py-1 select-none font-sans">
                              <span className="text-[11px] text-[#9E9E9E] italic font-serif">
                                Dynamic translation not retrieved yet.
                              </span>
                              <button
                                onClick={() => translateParagraph(uniqueParagraphKey, paragraph)}
                                className="px-3 py-1 text-[9px] font-bold uppercase tracking-wider bg-[#D4A373] text-white hover:bg-[#b08256] rounded-xs transition-all flex items-center gap-1.5 cursor-pointer"
                              >
                                <Globe className="w-3.5 h-3.5" /> Translate Live
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={pIdx} className="group relative space-y-3 mb-6">
                    {/* Render Content Paragraph */}
                    <p 
                      style={{ fontSize: `${fontSize}px` }} 
                      className="font-reading-body leading-loose tracking-normal relative select-text text-[#1A1A1A]/95 text-justify"
                    >
                      {sIdx === 0 && pIdx === 0 && (
                        <span className="float-left text-[3.8em] leading-[0.75] pr-2.5 pt-1.5 font-bold select-none text-[#1A1A1A] font-serif">
                          {paragraph.trim().charAt(0)}
                        </span>
                      )}
                      
                      {sIdx === 0 && pIdx === 0
                        ? renderParagraphWithInteractiveWords(paragraph.trim().slice(1), uniqueParagraphKey)
                        : renderParagraphWithInteractiveWords(paragraph, uniqueParagraphKey)}
                    </p>

                    {/* Paragraph translation buttons for Study mode */}
                    {readingMode === "Study" && (
                      <div className="flex justify-end select-none opacity-0 group-hover:opacity-100 transition-opacity absolute right-[-42px] top-1">
                        <button
                          onClick={() => translateParagraph(uniqueParagraphKey, paragraph)}
                          className="p-1.5 rounded-full bg-slate-50 border border-[#E5E1D8]/60 text-[#1A1A1A]/80 hover:bg-[#F5F2ED] hover:text-[#1A1A1A] transition-all cursor-pointer"
                          title="Translate this paragraph"
                        >
                          <Globe className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Translation Overlay Block */}
                    {readingMode === "Study" && isTranslated && (
                      <div className="p-4 bg-white border border-[#E5E1D8]/40 rounded-sm shadow-xs animate-fade-in my-3 select-text">
                        <div className="flex gap-1.5 items-center mb-1 text-[11px] font-bold text-[#D4A373] uppercase tracking-wider">
                          <Globe className="w-3 h-3" /> Bilingual Translation Alignment
                        </div>

                        {isLoading ? (
                          <div className="text-xs text-on-surface-variant py-2 animate-pulse flex items-center gap-1.5 select-none font-sans">
                            <span className="w-2 h-2 rounded-full bg-[#D4A373] animate-ping"></span>
                            Synthesizing aligned translations...
                          </div>
                        ) : (() => {
                          const customTrans = paragraphTranslations[uniqueParagraphKey] ||
                            (article.translations && article.translations[uniqueParagraphKey]);
                          if (customTrans) {
                            return (
                              <p 
                                style={{ fontSize: `${fontSize - 2}px` }} 
                                className="font-serif leading-relaxed text-[#444] border-l border-[#D4A373] pl-3 text-justify select-text"
                              >
                                {customTrans}
                              </p>
                            );
                          }

                          let revTrans = "";
                          if (article.id === "remote-revolution") {
                            revTrans = {
                              0: "从局部的、同步的办公考勤制度向分布式的、异步的操作机制的范式转变，代表了21世纪最重大的社会经济转型之一。这不仅仅是劳动力在地理空间上的重新安置，它是对认知任务如何组织、评估和执行的根本性的重构。",
                              1: "历史上，办公室的建筑结构充当了生产力的代理指标。身在现场被等同于卓越表现。然而，当代景观要求我们对产出有更细致微妙的理解，一种脱离与管理层物理距离的产出。",
                              2: "这种演变的一个关键组成部分是向异步沟通的迈进。当团队由于分布于多个时区而分散时，期待即时回复不仅变得不切实际，而且会对深度的、专注的工作造成伤害。对书面文档 and 清晰明确指令的依赖，缓和了同步、对话式环境中常见的模糊 and 不确定性。",
                              3: "此外，朝九晚五通勤的消除在全球范围内开辟了数百万小时的空隙，展示了将时间资源重新分配给个人福祉、家庭或继续教育的机会。然而，这种新发现的自治权需要相应地增加个人的纪律 and 自我调节能力。",
                              4: "随着我们进一步走进这个去中心化的时代，生活与工作的边界亟需主动重新校准。那些蓬勃发展的组织绝不是那些在数字媒介中死板复制办公室物理监督的机构，而是那些培育了深思熟虑、建立在双向信任基础之上的生产力框架的企业。",
                              5: "脑力劳动不再是亦步亦趋的同步。通过重新夺回时间主权，现代学者和专业技术人员正迎来一个生产力释放的崭新阶段，在这个阶段，认知质量和持久的心流状态远比在 physical headquarter 物理设施中展示出的姿态重要得多。"
                            }[pIdx] || "";
                          } else if (article.id === "cognitive-surplus") {
                            revTrans = {
                              0: "现代数字景观呈现出空前的智力资源积累的特征，学术界将其定义为认知盈余。在这种环境下，以往用于消极媒体消费的数十亿联合时间正被重新分配给建设性的合作知识公地。",
                              1: "传统意义范式转变的特征在于一种共同的自发意愿来生产、合作和分享。公民不再是独立的信息消费者，而是全球共享数字档案的活跃建设者。",
                              2: "公共维基条目、开源代码库以及去中心化在线讲堂的大量涌现，见证了知识分发 and 专业素养的重大民主化过程。知识免受专利化封存，降低了以往学术交流中的重重樊篱。",
                              3: "然而，这种共享资源的无序扩张也带来了认知方面的重重考验。缺乏规律和过滤的学术资源发布可能引发严重的信息眩晕。因此，学术识读力迫切需要一套科学扎实的思辨方法论体系，用以分流高水准的学术成果与泥沙俱下的虚假数据。",
                              4: "长期而言，鼓励严格审查同行贡献、培育高度融洽的学术共同体，对于延续人类认知积淀具有重大的象征意义。这样的群体将设立一套自我繁衍升级、高度科学有机的运转体系，在这里，协作智慧与求真务实将战胜哗众取宠的庸俗话语。"
                            }[pIdx] || "";
                          }

                          if (revTrans) {
                            return (
                              <p 
                                style={{ fontSize: `${fontSize - 2}px` }} 
                                className="font-serif leading-relaxed text-[#444] border-l border-[#D4A373] pl-3 text-justify select-text"
                              >
                                {revTrans}
                              </p>
                            );
                          }

                          return (
                            <div className="flex flex-col gap-2 items-start pl-3 py-1 select-none font-sans">
                              <span className="text-xs text-[#9E9E9E] italic font-serif">
                                Dual alignment translation for this paragraph is not loaded.
                              </span>
                              <button
                                onClick={() => translateParagraph(uniqueParagraphKey, paragraph)}
                                className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-[#D4A373] text-white hover:bg-[#b08256] rounded transition-all flex items-center gap-1.5 cursor-pointer font-sans"
                              >
                                <Globe className="w-3.5 h-3.5" /> Synthesize Translation
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}
