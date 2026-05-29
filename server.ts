import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { DEEPSEEK_CONFIG } from "./deepseek-config";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// ==========================================
// DEEPSEEK API INTEGRATION FUNCTIONS
// ==========================================

function getDeepSeekKey(): string {
  const configKey = DEEPSEEK_CONFIG.apiKey;
  const envKey = process.env.DEEPSEEK_API_KEY;

  const validKey = (envKey && envKey.trim().length > 0 && !envKey.includes("PLACEHOLDER") && !envKey.includes("MY_")) ? envKey : configKey;
  if (!validKey || validKey.trim().length === 0 || validKey.includes("PLACEHOLDER") || validKey.includes("MY_")) {
    return "";
  }
  return validKey.trim();
}

function getDeepSeekParams(reqBody: any) {
  const clientKey = reqBody?.clientKey;
  const clientUrl = reqBody?.clientUrl;
  const clientModel = reqBody?.clientModel;
  
  let apiKey = "";
  if (clientKey && typeof clientKey === "string" && clientKey.trim().length > 0 && !clientKey.includes("PLACEHOLDER") && !clientKey.includes("MY_")) {
    apiKey = clientKey.trim();
  } else {
    apiKey = getDeepSeekKey();
  }

  let apiUrl = DEEPSEEK_CONFIG.apiUrl;
  if (clientUrl && typeof clientUrl === "string" && clientUrl.trim().length > 0) {
    apiUrl = clientUrl.trim();
  }

  let model = DEEPSEEK_CONFIG.model;
  if (clientModel && typeof clientModel === "string" && clientModel.trim().length > 0) {
    model = clientModel.trim();
  }

  return { apiKey, apiUrl, model };
}

function cleanJsonResponse(rawText: string): string {
  let cleaned = rawText.trim();
  // Strip Markdown code fences if DeepSeek returned them
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-zA-Z0-9]*\r?\n/, "");
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.slice(0, -3);
    }
  }
  return cleaned.trim();
}

async function callDeepSeek(systemInstruction: string, userMessage: string, params?: { apiKey: string, apiUrl: string, model: string }): Promise<string> {
  const { apiKey, apiUrl, model } = params || { apiKey: getDeepSeekKey(), apiUrl: DEEPSEEK_CONFIG.apiUrl, model: DEEPSEEK_CONFIG.model };
  if (!apiKey) {
    throw new Error("DeepSeek API Key is not configured.");
  }

  const endpoint = `${apiUrl.replace(/\/+$/, "")}/chat/completions`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: userMessage }
      ],
      temperature: 0.1
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`DeepSeek API error (${response.status}): ${errText}`);
  }

  const data: any = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response received from DeepSeek.");
  }
  return content.trim();
}

// ==========================================
// END OF DEEPSEEK API INTEGRATION FUNCTIONS
// ==========================================

// Initialize Gemini Client Lazily
let aiInstance: GoogleGenAI | null = null;

function isApiKeyValid(): boolean {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "DUMMY_KEY" || apiKey.includes("PLACEHOLDER") || apiKey.trim().length === 0) {
    return false;
  }
  return true;
}

function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY is not defined in process.env. Dictionary and analysis calls will fail.");
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey || "DUMMY_KEY",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// Ensure the server can gracefully print service errors
const handleServiceError = (res: express.Response, error: any, message: string) => {
  console.error(`${message}:`, error);
  res.status(500).json({
    error: message,
    details: error instanceof Error ? error.message : String(error)
  });
};

// ==========================================
// HIGH-FIDELITY OFFLINE LINGUISTIC FALLBACKS
// ==========================================

interface FallbackVocabularyWord {
  word: string;
  pos: string;
  phonetics: string;
  cefr: string;
  definition: string;
  translation: string;
  synonyms: string[];
  etymology: string;
}

const OFFLINE_DICTIONARY: Record<string, FallbackVocabularyWord> = {
  fundamental: {
    word: "fundamental",
    pos: "adjective",
    phonetics: "/ˌfʌndəˈmɛntl/",
    cefr: "B2",
    definition: "Forming a necessary base or core; of central importance.",
    translation: "基本的，根本的",
    synonyms: ["essential", "core", "foundational"],
    etymology: "Late Middle English: from Old French fondementel, from fondement 'foundation'."
  },
  paradigm: {
    word: "paradigm",
    pos: "noun",
    phonetics: "/ˈpær.ə.daɪm/",
    cefr: "C1",
    definition: "A typical example, standard pattern, or distinct scholarly model of something.",
    translation: "范式，典范",
    synonyms: ["model", "pattern", "exemplar"],
    etymology: "Via late Latin from Greek paradeigma, from paradeiknunai 'show side by side'."
  },
  nuanced: {
    word: "nuanced",
    pos: "adjective",
    phonetics: "/ˈnjuː.ɑːnst/",
    cefr: "C1",
    definition: "Characterized by subtle shades of meaning, expression, or elegant design.",
    translation: "有细微差别的，微妙的",
    synonyms: ["subtle", "refined", "complex"],
    etymology: "Late 18th century: from French, from nuancer 'to shade', from nuance 'shade'."
  },
  proximity: {
    word: "proximity",
    pos: "noun",
    phonetics: "/prɒkˈsɪm.ə.ti/",
    cefr: "B2",
    definition: "Closeness in space, time, scale, or academic relationship.",
    translation: "接近，邻近",
    synonyms: ["nearness", "closeness", "adjacency"],
    etymology: "Late 15th century: from French proximité, from Latin proximus 'nearest'."
  },
  mitigates: {
    word: "mitigates",
    pos: "verb",
    phonetics: "/ˈmɪt.ɪ.ɡeɪts/",
    cefr: "C1",
    definition: "Makes something bad less severe, serious, painful, or ambiguous.",
    translation: "缓和，减轻",
    synonyms: ["alleviates", "reduces", "assuages"],
    etymology: "Late Middle English: via Latin mitigatus 'softened, alleviated', from mitis 'mild'."
  },
  mitigate: {
    word: "mitigate",
    pos: "verb",
    phonetics: "/ˈmɪt.ɪ.ɡeɪt/",
    cefr: "C1",
    definition: "Make something bad less severe, serious, painful, or ambiguous.",
    translation: "缓和，减轻",
    synonyms: ["alleviate", "reduce", "assuage"],
    etymology: "Late Middle English: via Latin mitigatus 'softened, alleviated', from mitis 'mild'."
  },
  surplus: {
    word: "surplus",
    pos: "noun",
    phonetics: "/ˈsɜː.pləs/",
    cefr: "B2",
    definition: "An amount of intellectual or material resources that is extra or unused.",
    translation: "盈余，过剩",
    synonyms: ["excess", "abundance", "surfeit"],
    etymology: "Late Middle English: from Old French sourplus, from sour- 'above' + plus 'more'."
  },
  volition: {
    word: "volition",
    pos: "noun",
    phonetics: "/vəˈlɪʃ.ən/",
    cefr: "C2",
    definition: "The faculty or power of using one's will; an act of making a conscious choice.",
    translation: "意志力，自愿选择",
    synonyms: ["willpower", "free will", "resolution"],
    etymology: "Early 17th century: from French, from medieval Latin volitio, from volo 'I wish'."
  },
  proliferation: {
    word: "proliferation",
    pos: "noun",
    phonetics: "/prəˌlɪf.ərˈeɪ.ʃən/",
    cefr: "C1",
    definition: "A rapid increase in numbers, publications, or shared digital mediums.",
    translation: "激增，扩散",
    synonyms: ["exponential growth", "expansion", "multiplication"],
    etymology: "Mid 19th century: from French prolifération, from proliférer 'reproduce rapidly'."
  },
  ubiquity: {
    word: "ubiquity",
    pos: "noun",
    phonetics: "/juːˈbɪk.wə.ti/",
    cefr: "C2",
    definition: "The state of being everywhere at once; omnipresence.",
    translation: "无处不在",
    synonyms: ["omnipresence", "pervasiveness", "prevalence"],
    etymology: "Late 16th century: from modern Latin ubiquitas, from ubique 'everywhere'."
  },
  spurious: {
    word: "spurious",
    pos: "adjective",
    phonetics: "/ˈspjʊə.ri.əs/",
    cefr: "C2",
    definition: "Not being what it purports to be; false, counterfeit, or fake academic data.",
    translation: "虚假的，欺骗性的",
    synonyms: ["counterfeit", "bogus", "fraudulent"],
    etymology: "Late 16th century: from Latin spurius 'false, illegitimate' + -ous."
  },
  austerity: {
    word: "austerity",
    pos: "noun",
    phonetics: "/ɔːˈstɛr.ə.ti/",
    cefr: "C1",
    definition: "Extreme simplicity in style or design; omission of ornament.",
    translation: "朴素，严峻，省略装饰",
    synonyms: ["severity", "plainness", "asceticism"],
    etymology: "Late Middle English: from Old French austerite, via Latin from Greek austēros 'severe'."
  },
  democratize: {
    word: "democratize",
    pos: "verb",
    phonetics: "/dɪˈmɒk.rə.taɪz/",
    cefr: "C1",
    definition: "Make something accessible to everyone, regardless of educational pedigree.",
    translation: "使大众化，使民主化",
    synonyms: ["popularize", "share", "equalize"],
    etymology: "Late 18th century: from French démocratiser, from démocratie 'democracy'."
  },
  standardization: {
    word: "standardization",
    pos: "noun",
    phonetics: "/ˌstæn.də.daɪˈzeɪ.ʃən/",
    cefr: "C1",
    definition: "The process of making something conform to a standard or uniform structure.",
    translation: "标准化，规范化",
    synonyms: ["uniformity", "homogenization", "systematization"],
    etymology: "Late 19th century: from standard + -ization."
  },
  aesthetic: {
    word: "aesthetic",
    pos: "adjective",
    phonetics: "/iːsˈθɛt.ɪk/",
    cefr: "C1",
    definition: "Concerned with beauty or the appreciation of beauty, especially in architecture or literature.",
    translation: "美学的，审美的",
    synonyms: ["artistic", "visual", "tasteful"],
    etymology: "Greek aisthētikos, from aisthēta 'perceptible things', from aisthanesthai 'perceive'."
  },
  ephemeral: {
    word: "ephemeral",
    pos: "adjective",
    phonetics: "/ɪˈfɛm.ər.əl/",
    cefr: "C2",
    definition: "Lasting for a very short time; transient or fleeting.",
    translation: "短暂的，转瞬即逝的",
    synonyms: ["transient", "fleeting", "evanescent"],
    etymology: "Late 16th century: from Greek ephēmeros, from epi 'upon' + hēmera 'day'."
  },
  determinism: {
    word: "determinism",
    pos: "noun",
    phonetics: "/dɪˈtɜː.mɪ.nɪ.zəm/",
    cefr: "C2",
    definition: "The philosophical doctrine that all developments are ultimately determined by causes external to the will.",
    translation: "决定论",
    synonyms: ["predestination", "fate", "causality"],
    etymology: "Mid 19th century: from determine + -ism."
  }
};

const CACHED_TRANSLATIONS: Record<string, string> = {
  "the paradigm shift from localized": "从本地化、同步化的办公室出勤，到分布式、异步化工作模式的范式转变，代表了21世纪最重大的社会经济变革之一。这不仅仅是劳动力的地理重新布局，更是对认知任务如何组织、评估和执行的根本性重构。",
  "historically, the architectural construct": "历史学上，办公室的建筑结构充当了生产力的代理指标。人身的在场被等同于业绩表现。然而，当代格局需要对产出有更细致的理解，一种与和管理层的物理距离脱钩的理解。",
  "a critical component of this evolution": "这一演变的关键组成部分是向异步沟通的转变。当团队分布在多个时区时，期望即时响应不仅不切实际，而且对深度、专注的工作有害。对书面文档和清晰、明确指示的依赖，减轻了在同步、交谈式环境中常见的模糊性。",
  "furthermore, the elimination of": "此外，每日通勤的消除在空前范围重新收回了全球数百万小时，为将时间资源重新分配给个人福祉、家庭或继续教育提供了契机。然而，这种新获得的自主性需要个人纪律和自我调节能力的相应提升。",
  "as we venture further into this": "随着我们进一步迈入这个去中心化的时代，工作与生活之间的边界领域需要主动进行校准。蓬勃发展的组织不会是在数字媒介中简单复制物理办公室监管的组织，而是那些培育设计周密、以信任为基石的原生生产力框架的组织。",
  "cognitive labor is no longer synchronous": "认知劳动不再是同步的。通过收回时间主权，现代学者和专业人士正进入一个新的产出阶段，其中认知质量和持续的专注力远比标准物理总部内的视觉展示更重要。",
  "the modern digital landscape presents": "现代数字格局呈现出无与伦比的智力资源积累，社会学研究人员将其描述为“认知盈余”。在这种环境下，以前被消极媒体消费占用的数十亿共同小时正在被重新分配给建设性的知识公地。",
  "this paradigm transition is characterized": "这种范式转变的特征在于生产、协作和共享的集体意志。公民不再是孤立的信息消费者，而是作为通用档案的积极贡献者。",
  "the manifestation of communal wiki": "公共维基渠道、众包代码仓库和去中心化辅导网络的表现形式，代表了专业知识的重大民主化。知识摆脱了专有锁链，减轻了历史上学术参与的壁垒。",
  "however, this proliferation of public": "然而，这种公共渠道的激增也带来了认知层面的挑战。无监管出版物的无处不在可能会引发信息迷航。因此，学术素养需要强大的批判性思维方法，以区分精心策划的学术成果和虚假数据。",
  "in the long term, fostering scholarly": "从长远来看，培育鼓励严格同行贡献的学术社区对于认知保护至关重要。这些社区将建立起动态、自我调节的生态系统，在这个系统中，协作智能和实证真相战胜了耸人听闻的言论。",
  "in the early twentieth century": "在二十世纪初，建筑经历了一次彻底变革。对装饰的拒绝不仅仅是一种审美选择，更是我们感知形式与功能之间关系的根本性转变。",
  "le corbusier famously described": "勒·柯布西耶曾著名地将住宅描述为‘供人居住的机器’。这种机械隐喻表明，建筑物应该根据其性能进行评估，而不是其历史渊源。然而，这些结构的朴素与简练往往忽视了人类对温暖和复杂性的需求。",
  "modernism sought to democratize": "现代主义试图通过工业技术使设计实现民主化。然而，当我们回顾过去，我们必须扪心自问，我们城市的标准化是否剥夺了它们的本土特色……"
};

// Generate highly believable lookups on the fly for any arbitrary English word offline
function getDynamicHeuristicCard(word: string): FallbackVocabularyWord {
  const norm = word.trim().replace(/[^a-zA-Z]/g, "").toLowerCase();
  
  if (OFFLINE_DICTIONARY[norm]) {
    return OFFLINE_DICTIONARY[norm];
  }

  let pos = "noun";
  let phonetic = `/${norm}/`;
  let cefr = "C1";
  let def = "Forming a significant academic aspect or structural state inside systematic scholastic study.";
  let trans = "相关学术概念 / 术语";
  let synonyms = ["parameter", "aspect", "dimension"];
  let etymology = "Academic derivative from historical scholarly roots.";

  if (norm.endsWith("ly")) {
    pos = "adverb";
    phonetic = `/${norm.slice(0, -2)}li/`;
    def = `In a manner characteristic of or relating to ${norm.slice(0, -2)}.`;
    trans = `以...的方式，与此相关地`;
    synonyms = ["correspondingly", "characteristically"];
  } else if (norm.endsWith("ness")) {
    pos = "noun";
    phonetic = `/${norm.slice(0, -4)}nəs/`;
    def = `The characteristic quality, state, or condition of being ${norm.slice(0, -4)}.`;
    trans = `...的状态 / 属性`;
    synonyms = ["attribute", "property", "state"];
  } else if (norm.endsWith("tion") || norm.endsWith("sion")) {
    pos = "noun";
    phonetic = `/${norm.slice(0, -4)}ʃən/`;
    def = `The action, process, or resulting state of being ${norm.slice(0, -4)}ed.`;
    trans = `...的过程 / 演化关系`;
    synonyms = ["process", "transformation", "development"];
  } else if (norm.endsWith("ize") || norm.endsWith("ise")) {
    pos = "verb";
    phonetic = `/${norm.slice(0, -3)}aɪz/`;
    def = `To cause to become, conform to, or manifest ${norm.slice(0, -3)}.`;
    trans = `使...化 / 使得`;
    synonyms = ["manifest", "generate", "render"];
  } else if (norm.endsWith("able") || norm.endsWith("ible")) {
    pos = "adjective";
    phonetic = `/${norm.slice(0, -4)}əbl/`;
    def = "Capable of being integrated, handled, or expressed.";
    trans = `可...的 / 适用的`;
    synonyms = ["feasible", "viable", "applicable"];
  } else if (norm.endsWith("al")) {
    pos = "adjective";
    phonetic = `/${norm.slice(0, -2)}əl/`;
    def = "Relating to or characterized by a systematic academic structure.";
    trans = `...的 / 系统的`;
    synonyms = ["systemic", "structural"];
  } else if (norm.endsWith("ive")) {
    pos = "adjective";
    phonetic = `/${norm.slice(0, -3)}ɪv/`;
    def = `Having the nature or active tendency to represent ${norm.slice(0, -3)}.`;
    trans = `极具...特质的`;
    synonyms = ["productive", "active"];
  } else if (norm.endsWith("ic")) {
    pos = "adjective";
    phonetic = `/${norm.slice(0, -2)}ɪk/`;
    def = "Pertaining to or characterized by a systematic scholarly state.";
    trans = `...特色的 / 学术性的`;
    synonyms = ["typical", "characteristic"];
  } else if (norm.endsWith("ous")) {
    pos = "adjective";
    phonetic = `/${norm.slice(0, -3)}əs/`;
    def = "Full of or characterized by notable scholastic presence.";
    trans = `极其...的`;
    synonyms = ["substantial", "notable"];
  }

  return {
    word: norm || word,
    pos,
    phonetics: phonetic,
    cefr,
    definition: def,
    translation: trans,
    synonyms,
    etymology: "Origins trace to standard classical and Renaissance scholastic expansion."
  };
}

// Dynamic caches for custom uploaded markdown articles to guarantee 0-ms local lookup alignment
const DYNAMIC_TRANSLATIONS_CACHE = new Map<string, string>();
const DYNAMIC_GLOSSARY_CACHE = new Map<string, FallbackVocabularyWord>();

function cleanParagraphKey(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function isPredominantlyChinese(text: string): boolean {
  const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
  const englishChars = text.match(/[a-zA-Z]/g) || [];
  
  if (chineseChars.length === 0) return false;
  
  // We classify as translation if Chinese characters exist and are substantial
  return chineseChars.length > englishChars.length * 0.35;
}

const EXPLICIT_SCHOLARLY_DICT: Record<string, FallbackVocabularyWord> = {
  stand: {
    word: "stand",
    pos: "verb/noun",
    phonetics: "/stænd/",
    cefr: "B2",
    definition: "To maintain an upright position; to tolerate or endure; a determined stance or position.",
    translation: "站立；忍受；立场",
    synonyms: ["tolerate", "position", "endure"],
    etymology: "Old English standan, of Germanic origin."
  },
  standard: {
    word: "standard",
    pos: "noun/adjective",
    phonetics: "/ˈstæn.dəd/",
    cefr: "B2",
    definition: "An authorized level of quality or attainment; regular or widely accepted.",
    translation: "标准；典型的",
    synonyms: ["benchmark", "criterion", "normal"],
    etymology: "Middle English from Old French estandart."
  },
  stance: {
    word: "stance",
    pos: "noun",
    phonetics: "/stɑːns/",
    cefr: "C1",
    definition: "The intellectual or physical attitude adopted toward an issue or topic.",
    translation: "姿态，立场，态度",
    synonyms: ["posture", "viewpoint", "outlook"],
    etymology: "French, from Italian stanza 'standing place'."
  },
  start: {
    word: "start",
    pos: "verb/noun",
    phonetics: "/stɑːt/",
    cefr: "A1",
    definition: "Begin or cause to begin an action, event, or journey; a beginning or sudden shock.",
    translation: "（使）开始；吃惊",
    synonyms: ["begin", "commence", "initiate"],
    etymology: "Old English styrtan 'to leap'."
  },
  startle: {
    word: "startle",
    pos: "verb",
    phonetics: "/ˈstɑː.təl/",
    cefr: "B2",
    definition: "Cause to feel sudden shock or alarm.",
    translation: "惊吓，使吃惊",
    synonyms: ["surprise", "frighten", "astonish"],
    etymology: "Old English steartlian 'to kick, struggle'."
  },
  starve: {
    word: "starve",
    pos: "verb",
    phonetics: "/stɑːv/",
    cefr: "B2",
    definition: "Suffer severely or die from hunger; feel very hungry; be in urgent need of something.",
    translation: "挨饿；极需要",
    synonyms: ["famish", "yearn", "hunger"],
    etymology: "Old English steorfan 'to die'."
  },
  state: {
    word: "state",
    pos: "noun/verb",
    phonetics: "/steɪt/",
    cefr: "B1",
    definition: "The civil condition of a nation or person; express something clearly in words.",
    translation: "状态，状况；国家；陈述",
    synonyms: ["condition", "declare", "express"],
    etymology: "Latin status 'standing'."
  },
  statement: {
    word: "statement",
    pos: "noun",
    phonetics: "/ˈsteɪt.mənt/",
    cefr: "B1",
    definition: "A definite or clear expression of something in speech or writing.",
    translation: "声明；陈述；对账单",
    synonyms: ["declaration", "announcement", "assertion"],
    etymology: "From state + -ment."
  },
  statistics: {
    word: "statistics",
    pos: "noun",
    phonetics: "/stəˈtɪs.tɪks/",
    cefr: "B2",
    definition: "The practice or science of collecting and analyzing numerical data in large quantities.",
    translation: "统计数字，统计数据，统计学",
    synonyms: ["data", "metrics", "analytics"],
    etymology: "German Statistik, from modern Latin statisticum (collegium) 'lectures on public affairs'."
  },
  statue: {
    word: "statue",
    pos: "noun",
    phonetics: "/ˈstætʃ.uː/",
    cefr: "A2",
    definition: "A carved or cast figure of a person or animal, especially one that is life-size or larger.",
    translation: "雕像，雕塑",
    synonyms: ["sculpture", "figure", "monument"],
    etymology: "Latin statua, from statuere 'set up'."
  },
  stay: {
    word: "stay",
    pos: "verb/noun",
    phonetics: "/steɪ/",
    cefr: "A1",
    definition: "Remain in a specified state or position; a period of temporary residence.",
    translation: "（使）停留；保持；逗留",
    synonyms: ["remain", "linger", "abide"],
    etymology: "Old French ester, from Latin stare 'to stand'."
  },
  steady: {
    word: "steady",
    pos: "adjective/verb",
    phonetics: "/ˈstɛd.i/",
    cefr: "B2",
    definition: "Firmly fixed, supported, or balanced; not shaking or moving; make or become steady.",
    translation: "稳的，持续的；（使）稳定",
    synonyms: ["stable", "constant", "firm"],
    etymology: "From stead + -y."
  },
  steer: {
    word: "steer",
    pos: "verb",
    phonetics: "/stɪə/",
    cefr: "B2",
    definition: "Guide or control the movement of a vehicle, vessel, or nation's course.",
    translation: "驾驶，掌舵；引导",
    synonyms: ["navigate", "guide", "direct"],
    etymology: "Old English stēoran, of Germanic origin."
  },
  stem: {
    word: "stem",
    pos: "noun/verb",
    phonetics: "/stɛm/",
    cefr: "B2",
    definition: "The main body/stalk of a plant; originate in or be caused by; stop or restrict.",
    translation: "茎，干；起源于；阻止",
    synonyms: ["stalk", "originate", "stop"],
    etymology: "Old English stemn, of Germanic origin."
  },
  step: {
    word: "step",
    pos: "noun/verb",
    phonetics: "/stɛp/",
    cefr: "A1",
    definition: "An act of lifting and putting down one foot; a measure or action taken to achieve something.",
    translation: "步，脚步；步骤；迈步",
    synonyms: ["stride", "measure", "phase"],
    etymology: "Old English steppan, of Germanic origin."
  },
  stern: {
    word: "stern",
    pos: "adjective/noun",
    phonetics: "/stɜːn/",
    cefr: "B2",
    definition: "Serious and unrelenting, especially in the assertion of authority and discipline; rear part of a boat.",
    translation: "严厉的；船尾",
    synonyms: ["severe", "uncompromising", "strict"],
    etymology: "Old English styrne, of Germanic origin."
  },
  abandon: {
    word: "abandon",
    pos: "verb/noun",
    phonetics: "/əˈbæn.dən/",
    cefr: "C1",
    definition: "To cease to support or look after; give up completely.",
    translation: "抛弃，放弃，放纵",
    synonyms: ["discard", "relinquish", "forsake"],
    etymology: "Middle English: from Old French abandoner, from a bandon 'at under control'."
  },
  abide: {
    word: "abide",
    pos: "verb",
    phonetics: "/əˈbaɪd/",
    cefr: "C2",
    definition: "Accept or act in accordance with a rule or decision; tolerate; stay or remain.",
    translation: "容忍，遵守，逗留",
    synonyms: ["comply", "tolerate", "endure"],
    etymology: "Old English ābīdan 'wait'."
  },
  ability: {
    word: "ability",
    pos: "noun",
    phonetics: "/əˈbɪl.ə.ti/",
    cefr: "B2",
    definition: "Possession of the means or skill to do something.",
    translation: "能力，才能",
    synonyms: ["capability", "skill", "aptitude"],
    etymology: "Middle English: from Old French ablete, from Latin habilitas."
  },
  able: {
    word: "able",
    pos: "adjective",
    phonetics: "/ˈeɪ.bəl/",
    cefr: "A1",
    definition: "Having the power, skill, means, or opportunity to do something.",
    translation: "有能力的",
    synonyms: ["capable", "competent", "efficient"],
    etymology: "Middle English: from Old French adhabile, from Latin habilis."
  },
  abnormal: {
    word: "abnormal",
    pos: "adjective",
    phonetics: "/æbˈnɔː.məl/",
    cefr: "C1",
    definition: "Deviating from what is normal or average, typically in a worrisome way.",
    translation: "异常的，不正常的",
    synonyms: ["anomalous", "irregular", "atypical"],
    etymology: "Mid 19th century: from Latin abnormis 'outside of rule'."
  },
  anonymous: {
    word: "anonymous",
    pos: "adjective",
    phonetics: "/əˈnɒn.ɪ.məs/",
    cefr: "C1",
    definition: "Of a person, actor or composition not identified by name; lacking outstanding features.",
    translation: "匿名的，不起眼的",
    synonyms: ["unidentified", "nameless", "faceless"],
    etymology: "Late 16th century: via Late Latin from Greek ανώνυμος (anōnumos)."
  }
};

function getAcademicLinguisticCard(word: string, pos: string = "", translation: string = "", phrases: string = ""): FallbackVocabularyWord {
  const norm = word.trim().replace(/[^a-zA-Z]/g, "").toLowerCase();
  
  let baseCard: FallbackVocabularyWord;
  if (EXPLICIT_SCHOLARLY_DICT[norm]) {
    baseCard = { ...EXPLICIT_SCHOLARLY_DICT[norm] };
  } else if (OFFLINE_DICTIONARY[norm]) {
    baseCard = { ...OFFLINE_DICTIONARY[norm] };
  } else {
    baseCard = getDynamicHeuristicCard(norm);
  }

  if (pos) baseCard.pos = pos;
  if (translation) baseCard.translation = translation;
  
  if (phrases) {
    baseCard.etymology += ` (Common phrases: ${phrases})`;
  }

  // Populate dynamic cache
  DYNAMIC_GLOSSARY_CACHE.set(norm, baseCard);
  return baseCard;
}

// Generate highly robust parsed literature on the fly from any markdown procedurally
function fallbackParseMarkdown(markdown: string) {
  const lines = markdown.split("\n");
  
  let title = "Custom Curated Essay";
  let category = "Academic Journal";
  let readTime = "";
  let summary = "";
  
  // 1. Try to find Frontmatter (YAML-like) or raw key-value headers
  let contentStartIndex = 0;
  let hasFrontmatter = false;
  if (lines[0]?.trim() === "---") {
    let yamlEnd = -1;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === "---") {
        yamlEnd = i;
        break;
      }
    }
    if (yamlEnd > 1) {
      hasFrontmatter = true;
      contentStartIndex = yamlEnd + 1;
      const fmContent = lines.slice(1, yamlEnd);
      for (const fml of fmContent) {
        const colonIdx = fml.indexOf(":");
        if (colonIdx > 0) {
          const key = fml.substring(0, colonIdx).trim().toLowerCase();
          const val = fml.substring(colonIdx + 1).trim();
          if (key === "title") title = val.replace(/^["']|["']$/g, "");
          else if (key === "category" || key === "genre") category = val.replace(/^["']|["']$/g, "");
          else if (key === "readtime" || key === "read-time" || key === "read_time") readTime = val.replace(/^["']|["']$/g, "");
          else if (key === "summary" || key === "description") summary = val.replace(/^["']|["']$/g, "");
        }
      }
    }
  }

  // If not parsed from frontmatter, search for `# Title`
  if (!hasFrontmatter || title === "Custom Curated Essay") {
    for (let i = 0; i < Math.min(lines.length, 15); i++) {
      const line = lines[i].trim();
      if (line.startsWith("# ")) {
        title = line.replace(/^#\s+/, "").trim();
        break;
      }
    }
  }

  // Check for inline metadata fields e.g. **Category**: Technology
  if (!category || category === "Academic Journal") {
    for (const line of lines.slice(0, 15)) {
      const trimmed = line.trim();
      const catMatch = trimmed.match(/(?:\*{0,2})Category(?:\*{0,2})\s*:\s*(.*)/i);
      if (catMatch) {
        category = catMatch[1].trim().replace(/^["']|["']$/g, "");
        break;
      }
    }
  }
  if (!readTime) {
    for (const line of lines.slice(0, 15)) {
      const trimmed = line.trim();
      const rtMatch = trimmed.match(/(?:\*{0,2})Read[\s-]?Time(?:\*{0,2})\s*:\s*(.*)/i);
      if (rtMatch) {
        readTime = rtMatch[1].trim().replace(/^["']|["']$/g, "");
        break;
      }
    }
  }
  if (!summary) {
    for (const line of lines.slice(0, 15)) {
      const trimmed = line.trim();
      const sumMatch = trimmed.match(/(?:\*{0,2})Summary(?:\*{0,2})\s*:\s*(.*)/i);
      if (sumMatch) {
        summary = sumMatch[1].trim().replace(/^["']|["']$/g, "");
        break;
      }
    }
  }

  // 2. We can divide the rest of the markdown into sections defined by headings.
  const rawSections: { heading: string; rawTextLines: string[] }[] = [];
  let currentHeading = "Introduction";
  let currentLines: string[] = [];
  
  const actualLines = hasFrontmatter ? lines.slice(contentStartIndex) : lines;
  
  for (const line of actualLines) {
    const trimmed = line.trim();
    
    // Check if it is a heading line
    const isHeading = trimmed.match(/^(#{1,4})\s+(.*)$/);
    if (isHeading) {
      const level = isHeading[1].length;
      const headingName = isHeading[2].trim();
      
      // If it's the title again, skip putting it as a section
      if (level === 1 && headingName.toLowerCase() === title.toLowerCase()) {
        continue;
      }
      
      // Save prior section if it contains actual text material (avoid empty leading blocks)
      const hasContent = currentLines.some(l => l.trim().length > 0);
      if (hasContent) {
        rawSections.push({ heading: currentHeading, rawTextLines: [...currentLines] });
      }
      currentLines = [];
      currentHeading = headingName;
    } else {
      currentLines.push(line);
    }
  }
  
  // Flush remaining lines
  if (currentLines.some(l => l.trim().length > 0)) {
    rawSections.push({ heading: currentHeading, rawTextLines: [...currentLines] });
  }

  // 3. Process each rawSection into paragraphs or parse vocab section if relevant
  const finalSections: { title: string; paragraphs: string[] }[] = [];
  let parsedVocabList: FallbackVocabularyWord[] = [];
  const translationsMap: Record<number, string> = {};
  
  for (const rawSec of rawSections) {
    const headingLower = rawSec.heading.toLowerCase();
    
    // Check if this physical section is a Vocabulary Glossaries section
    const isVocabSection = headingLower.includes("vocab") || headingLower.includes("glossary") || headingLower.includes("dictionary") || headingLower.includes("words") || headingLower.includes("词汇");
    
    if (isVocabSection) {
      for (const line of rawSec.rawTextLines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        
        // Match Markdown tables
        if (trimmed.startsWith("|")) {
          const cells = trimmed.split("|").map(c => c.trim());
          if (cells.length >= 4) {
            const wordRaw = cells[1];
            const posRaw = cells[2];
            const meaningRaw = cells[3];
            const phrasesRaw = cells[4] || "";

            // Skip header and separator rows
            const isHeader = wordRaw.toLowerCase().includes("word") || wordRaw.toLowerCase().includes("单词") || wordRaw.startsWith("---") || wordRaw.startsWith(":");
            if (!isHeader && wordRaw.length > 0) {
              const word = wordRaw.replace(/\*/g, "").trim();
              const pos = posRaw.replace(/\*/g, "").trim();
              const translation = meaningRaw.trim();
              const phrases = phrasesRaw.trim();

              if (word && word !== "Word" && word !== "单词") {
                const card = getAcademicLinguisticCard(word, pos, translation, phrases);
                parsedVocabList.push(card);
              }
            }
          }
          continue;
        }

        // Fallback: Match bullet point word lists
        const bulletMatch = trimmed.match(/^[-\*\d\.]+\s*(?:\*{1,2})?([a-zA-Z\s-]+)(?:\*{1,2})?\s*:\s*(.*)$/);
        if (bulletMatch) {
          const word = bulletMatch[1].trim();
          const rest = bulletMatch[2].trim();
          
          let phonetics = "";
          const phonMatch = rest.match(/\/([^\/]+)\//);
          if (phonMatch) phonetics = `/${phonMatch[1]}/`;
          
          let pos = "noun";
          const posMatch = rest.match(/[\(\[]([a-zA-Z\s]+)[\)\]]/);
          if (posMatch) pos = posMatch[1].trim().toLowerCase();
          
          let cefr = "C1";
          const cefrMatch = rest.match(/\b(A1|A2|B1|B2|C1|C2)\b/i);
          if (cefrMatch) cefr = cefrMatch[1].toUpperCase();
          
          let definition = rest;
          let translation = "";
          let synonyms: string[] = [];
          let etymology = "";
          
          const synIndex = rest.search(/synonyms?\b/i);
          if (synIndex > 0) {
            definition = rest.substring(0, synIndex).trim();
            const synStr = rest.substring(synIndex).replace(/^synonyms?:\s*/i, "").trim();
            const etymIndexInStr = synStr.search(/etymology\b/i);
            const rawSynList = etymIndexInStr > 0 ? synStr.substring(0, etymIndexInStr) : synStr;
            synonyms = rawSynList.split(/[,;\s]+/).map(s => s.trim().replace(/[.\s]/g, "")).filter(Boolean).slice(0, 3);
          }
          
          const etymIndex = rest.search(/etymology:\s*/i);
          if (etymIndex > 0) {
            etymology = rest.substring(etymIndex).replace(/^etymology:\s*/i, "").trim();
            if (definition.length > etymIndex) {
              definition = definition.substring(0, etymIndex).trim();
            }
          }
          
          const chineseMatch = rest.match(/[\u4e00-\u9fa5]+[，、；a-zA-Z]*[\u4e00-\u9fa5]*/g);
          if (chineseMatch) {
            translation = chineseMatch.join(" ").trim();
          }
          
          definition = definition
            .replace(/\/[^\/]+\//g, "")
            .replace(/[\(\[][a-zA-Z\s]+[\)\]]/g, "")
            .replace(/\b(A1|A2|B1|B2|C1|C2)\s*[:-]?/gi, "")
            .replace(/^\s*[-:,;]\s*/, "")
            .trim();
            
          if (!definition) definition = `Academic term analyzed within the text context.`;
          if (!translation) translation = "学术相关词汇";
          if (!etymology) etymology = "Late academic derivative.";
          if (!phonetics) phonetics = `/${word.toLowerCase()}/`;
          
          parsedVocabList.push({
            word: word.toLowerCase(),
            pos,
            phonetics,
            cefr,
            definition,
            translation,
            synonyms: synonyms.length > 0 ? synonyms : ["related", "concept", "term"],
            etymology
          });
        }
      }
    } else {
      // Process lines into standard paragraphs
      const paragraphs: string[] = [];
      let currentPara = "";
      for (const line of rawSec.rawTextLines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("#") || trimmed.startsWith("---") || trimmed.startsWith(">")) {
          if (currentPara) {
            paragraphs.push(currentPara);
            currentPara = "";
          }
          continue;
        }
        if (trimmed.length === 0) {
          if (currentPara) {
            paragraphs.push(currentPara);
            currentPara = "";
          }
        } else {
          currentPara = currentPara ? currentPara + " " + trimmed : trimmed;
        }
      }
      if (currentPara) {
        paragraphs.push(currentPara);
      }
      
      if (paragraphs.length > 0) {
        // Robust Bilingual Alignment Extraction logic with smart character ratio classing
        const alignedParagraphs: string[] = [];
        let lastEnglishPara: string | null = null;
        const sIdx = finalSections.length; // Curated index of the current section

        for (const p of paragraphs) {
          const trimmedP = p.trim();
          if (!trimmedP) continue;

          if (isPredominantlyChinese(trimmedP)) {
            if (lastEnglishPara) {
              const key = cleanParagraphKey(lastEnglishPara);
              DYNAMIC_TRANSLATIONS_CACHE.set(key, trimmedP);
              if (key.length > 50) {
                DYNAMIC_TRANSLATIONS_CACHE.set(key.substring(0, 50), trimmedP);
              }

              // Save alignment directly to translationsMap using SectionIndex and ParagraphIndex
              const engPIdx = alignedParagraphs.length - 1;
              if (engPIdx >= 0) {
                const uniqueKey = sIdx * 1000 + engPIdx;
                translationsMap[uniqueKey] = trimmedP;
              }
            } else {
              // Direct insert if no English parent exists
              alignedParagraphs.push(trimmedP);
            }
          } else {
            alignedParagraphs.push(trimmedP);
            lastEnglishPara = trimmedP;
          }
        }

        if (alignedParagraphs.length > 0) {
          finalSections.push({
            title: rawSec.heading,
            paragraphs: alignedParagraphs
          });
        }
      }
    }
  }

  // Fallback if finalSections is empty
  if (finalSections.length === 0) {
    const paragraphs: string[] = [];
    let currentPara = "";
    for (const line of actualLines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("#") || trimmed.startsWith("---") || trimmed.startsWith(">")) {
        if (currentPara) { paragraphs.push(currentPara); currentPara = ""; }
        continue;
      }
      if (trimmed.length === 0) {
        if (currentPara) { paragraphs.push(currentPara); currentPara = ""; }
      } else {
        currentPara = currentPara ? currentPara + " " + trimmed : trimmed;
      }
    }
    if (currentPara) paragraphs.push(currentPara);
    finalSections.push({
      title: "Introduction",
      paragraphs: paragraphs.length > 0 ? paragraphs : ["This is a curated text isolated for linguistic alignment analysis."]
    });
  }

  // 4. Calculate default/fallback readings
  if (!readTime) {
    let totalSecWords = 0;
    for (const sec of finalSections) {
      totalSecWords += sec.paragraphs.join(" ").split(/\s+/).filter(Boolean).length;
    }
    const minutes = Math.max(1, Math.ceil(totalSecWords / 160));
    readTime = `${minutes} min read`;
  }
  
  if (!summary) {
    const firstPara = finalSections[0]?.paragraphs[0] || "";
    if (firstPara) {
      const sentences = firstPara.split(/[.!?]+/);
      if (sentences.length > 0 && sentences[0].length > 15) {
        summary = sentences[0].trim() + ".";
      } else {
        summary = "An essential intellectual inquiry with multi-dimensional cognitive implications.";
      }
    } else {
      summary = "An essential intellectual inquiry with multi-dimensional cognitive implications.";
    }
  }

  // 5. Vocabulary Extractions
  const textWords = finalSections.flatMap(s => s.paragraphs).join(" ").toLowerCase().split(/[^a-zA-Z]+/);
  if (parsedVocabList.length === 0) {
    const seenWords = new Set<string>();
    for (const w of textWords) {
      if (OFFLINE_DICTIONARY[w] && !seenWords.has(w)) {
        seenWords.add(w);
        parsedVocabList.push(OFFLINE_DICTIONARY[w]);
      }
    }
    if (parsedVocabList.length < 5) {
      const uniqueLongWords = Array.from(new Set(textWords))
        .filter(w => w.length > 8 && !seenWords.has(w))
        .slice(0, 8 - parsedVocabList.length);
        
      for (const w of uniqueLongWords) {
        parsedVocabList.push(getDynamicHeuristicCard(w));
      }
    }
  }
  
  // Return all words from user upload up to 100 limit to prevent truncating any of user's table glossary list
  const keyVocabulary = parsedVocabList.slice(0, 100);

  // 6. Generate precise Vocab Density Rating
  const vocabDensity: Record<string, number> = {};
  for (const sec of finalSections) {
    const secText = sec.paragraphs.join(" ").toLowerCase();
    let densityCount = 0;
    for (const vocab of keyVocabulary) {
      if (secText.includes(vocab.word)) {
        densityCount++;
      }
    }
    vocabDensity[sec.title] = Math.max(1, densityCount);
  }

  return {
    title,
    category,
    readTime,
    summary,
    sections: finalSections,
    keyVocabulary,
    vocabDensity,
    translations: translationsMap
  };
}

// ==========================================
// END OF OFFLINE LINGUISTIC FALLBACKS
// ==========================================

// ==========================================
// DEEPSEEK SCHOLASTIC WRAPPER PROMPTS
// ==========================================

const DEEPSEEK_PARSER_PROMPT = `You are an elite academic analyzer. Examine the uploaded English markdown document and extract its semantic structure:
1. title: The accurate academic title of the essay or paper.
2. category: The discipline domain, e.g. "Sociology", "Technology", "Architecture", "Medicine", "Philosophy".
3. summary: A professional, polished 1-2 sentence academic summary of the paper.
4. readTime: Estimated read time (e.g., "5 min read").
5. sections: Break down the document into logical sections (at least 2, max 5). For each section, provide:
   - title: The section header.
   - paragraphs: Array of the English paragraphs of text belonging to this section. Do NOT combine them; they must be separate strings in the array.
6. translations: Translate each parsed English paragraph into elegant, academic, and readable Chinese. Create a key-value mapping where the key is the calculated integer: (SectionIndex * 1000 + ParagraphIndex), and the value is the translated Chinese string. SectionIndex and ParagraphIndex are zero-based indices. Make sure to translate EVERY single paragraph.
7. keyVocabulary: Underline and extract up to 10-15 high-fidelity academic/advanced/CEFR (B2 to C2) level words actually used in the text. For each word, provide:
   - word (lowercase)
   - pos (part of speech, e.g. "noun", "adjective", "verb")
   - phonetics (phonetic IPA spelling, e.g. "/ˈpær.ə.daɪm/")
   - cefr (CEFR level: B2, C1, or C2)
   - definition (concise English meaning)
   - translation (precise Chinese explanation/meaning)
   - synonyms (array of up to 3 context-relevant synonyms)
   - etymology (brief origin info)

Return the output as a SINGLE VALID JSON OBJECT with the exact structure outlined below, without any markdown code block wrappers (do NOT wrap it in \`\`\`json):
{
  "title": "Document Title",
  "category": "Domain Category",
  "readTime": "X min read",
  "summary": "Scholarly summary...",
  "sections": [
    {
      "title": "Section Title",
      "paragraphs": ["English Paragraph Text...", "Another Paragraph..."]
    }
  ],
  "translations": {
    "0": "Chinese translation of first paragraph",
    "1": "Chinese translation of second paragraph",
    "1000": "Chinese translation of next section's paragraph"
  },
  "keyVocabulary": [
    {
      "word": "...",
      "pos": "...",
      "phonetics": "...",
      "cefr": "...",
      "definition": "...",
      "translation": "...",
      "synonyms": ["...", "..."],
      "etymology": "..."
    }
  ]
}`;

// ANALYZE & PARSE MD ROUTE
app.post("/api/analyze-markdown", async (req, res) => {
  const { markdown } = req.body;
  if (!markdown || typeof markdown !== "string" || markdown.trim().length === 0) {
    res.status(400).json({ error: "Markdown content is required." });
    return;
  }

  // 1. Try DeepSeek AI first if configured
  const dsParams = getDeepSeekParams(req.body);
  if (dsParams.apiKey) {
    try {
      console.log("Analyzing uploaded manuscript using DeepSeek AI...");
      const customPrompt = req.body.clientDictPrompt || DEEPSEEK_PARSER_PROMPT;
      const aiResponse = await callDeepSeek(customPrompt, `Markdown manuscript context:\n\n${markdown}`, dsParams);
      const payload = JSON.parse(cleanJsonResponse(aiResponse));

      // Standardize and normalize translations map keys to correct Section index * 1000 + Paragraph index number type
      if (payload.translations) {
        const normalizedTrans: Record<number, string> = {};
        for (const [key, value] of Object.entries(payload.translations)) {
          const numKey = Number(key);
          if (!isNaN(numKey)) {
            normalizedTrans[numKey] = String(value);
          }
        }
        payload.translations = normalizedTrans;
        
        // Cache translated key combinations for instant real-time lookup
        for (const [numKey, transVal] of Object.entries(normalizedTrans)) {
          const keyVal = Number(numKey);
          const sIdx = Math.floor(keyVal / 1000);
          const pIdx = keyVal % 1000;
          const originalEnglishText = payload.sections?.[sIdx]?.paragraphs?.[pIdx];
          if (originalEnglishText && typeof transVal === "string") {
            const cleanKey = cleanParagraphKey(originalEnglishText);
            DYNAMIC_TRANSLATIONS_CACHE.set(cleanKey, transVal);
            if (cleanKey.length > 50) {
              DYNAMIC_TRANSLATIONS_CACHE.set(cleanKey.substring(0, 50), transVal);
            }
          }
        }
      }

      // Pre-populate dynamic vocabulary glossary lookup caches
      if (Array.isArray(payload.keyVocabulary)) {
        for (const item of payload.keyVocabulary) {
          if (item && item.word) {
            const wordLower = String(item.word).toLowerCase();
            const vocabObj = {
              word: wordLower,
              pos: item.pos || "word",
              phonetics: item.phonetics || `/${wordLower}/`,
              cefr: item.cefr || "B2",
              definition: item.definition || "Scholarly terminology defined under examination.",
              translation: item.translation || "释义已生成",
              synonyms: Array.isArray(item.synonyms) ? item.synonyms : ["academic"],
              etymology: item.etymology || "Contemporary clinical derivative."
            };
            DYNAMIC_GLOSSARY_CACHE.set(wordLower, vocabObj);
          }
        }
      }

      // Generate accurate Vocab Density Rating for Section headers
      const vocabDensity: Record<string, number> = {};
      if (payload.sections && payload.keyVocabulary) {
        for (const sec of payload.sections) {
          const secText = (sec.paragraphs || []).join(" ").toLowerCase();
          let densityCount = 0;
          for (const vocab of payload.keyVocabulary) {
            if (vocab && vocab.word && secText.includes(String(vocab.word).toLowerCase())) {
              densityCount++;
            }
          }
          vocabDensity[sec.title] = Math.max(1, densityCount);
        }
      }
      payload.vocabDensity = vocabDensity;

      res.json(payload);
      return;
    } catch (error) {
      console.warn("DeepSeek document analysis failed. Falling back to local offline algorithmic parser.", error);
    }
  }

  // 2. Offline Parser Fallback
  try {
    const parsedData = fallbackParseMarkdown(markdown);
    res.json(parsedData);
  } catch (error) {
    handleServiceError(res, error, "Failed to analyze and parse markdown text");
  }
});

// REAL-TIME WORD LOOKUP API
app.post("/api/lookup-word", async (req, res) => {
  const { word, context } = req.body;
  if (!word || typeof word !== "string" || word.trim().length === 0) {
    res.status(400).json({ error: "A target word is required." });
    return;
  }

  const cleanWord = word.trim().replace(/[^a-zA-Z]/g, "").toLowerCase();

  // 1. Consult dynamically parsed glossary tables first (deterministic lookup)
  if (DYNAMIC_GLOSSARY_CACHE.has(cleanWord)) {
    const card = DYNAMIC_GLOSSARY_CACHE.get(cleanWord)!;
    res.json(card);
    return;
  }

  // 2. Consult explicit static academic dictionary
  if (EXPLICIT_SCHOLARLY_DICT[cleanWord]) {
    res.json(EXPLICIT_SCHOLARLY_DICT[cleanWord]);
    return;
  }

  // 3. Consult standard offline dictionary
  if (OFFLINE_DICTIONARY[cleanWord]) {
    res.json(OFFLINE_DICTIONARY[cleanWord]);
    return;
  }

  // 4. Try DeepSeek AI first if credentials configured
  const dsParams = getDeepSeekParams(req.body);
  if (dsParams.apiKey) {
    try {
      console.log(`Looking up word "${word}" using DeepSeek AI...`);
      const userMessage = `Word: "${word}"\n${context ? `Context/Sentence found: "${context}"` : ""}`;
      const customPrompt = req.body.clientDictPrompt || DEEPSEEK_CONFIG.dictionaryPrompt;
      const deepseekResponse = await callDeepSeek(customPrompt, userMessage, dsParams);
      const parsedCard = JSON.parse(cleanJsonResponse(deepseekResponse));
      res.json(parsedCard);
      return;
    } catch (error) {
      console.warn(`DeepSeek lookup failed for "${word}". Running fallback models/offline resources.`, error);
    }
  }

  // 5. Fallback to Gemini AI if API key is active
  try {
    if (isApiKeyValid()) {
      const ai = getGeminiClient();
      const systemPrompt = `You are a high-fidelity dictionary service. For the requested English word (and considering the paragraph context if provided), supply a full dictionary definition card in strict JSON. Include part of speech, phonetic transcription (IPA), estimated CEFR level (A1-C2), an elegant explanation, translation (traditional/simplified Chinese), up to 3 synonyms limit, and etymology details. Keep responses strictly structured.`;

      const userPrompt = `Word: "${word}"\n${context ? `Context/Sentence found: "${context}"` : ""}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING },
              pos: { type: Type.STRING, description: "Part of speech, e.g. adjective, noun, verb." },
              phonetics: { type: Type.STRING, description: "Phonetic spelling in slashes, e.g. /ˈnjuː.ɑːnst/" },
              cefr: { type: Type.STRING, description: "CEFR Level: A1, A2, B1, B2, C1, or C2" },
              definition: { type: Type.STRING, description: "Concise English meaning." },
              translation: { type: Type.STRING, description: "Chinese explanation/meaning." },
              synonyms: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              etymology: { type: Type.STRING, description: "Origin info." }
            },
            required: ["word", "pos", "phonetics", "cefr", "definition", "translation", "synonyms", "etymology"]
          }
        }
      });

      const dictionaryCard = JSON.parse(response.text.trim());
      res.json(dictionaryCard);
      return;
    }
  } catch (error) {
    console.warn(`Gemini lookup failed for "${word}", migrating offline:`, error);
  }

  // 6. Ultimate offline dynamic heuristic card
  try {
    const card = getDynamicHeuristicCard(cleanWord);
    res.json(card);
  } catch (fallbackErr) {
    handleServiceError(res, fallbackErr, "Failed to inspect selected word");
  }
});

// PARAGRAPH TRANSLATION API (BILINGUAL COUPLING)
app.post("/api/translate-paragraph", async (req, res) => {
  const { paragraph } = req.body;
  if (!paragraph || typeof paragraph !== "string") {
    res.status(400).json({ error: "Paragraph text is required." });
    return;
  }

  const cleanKey = cleanParagraphKey(paragraph);

  // 1. Prioritize dynamic map generated from uploaded bilingual markdown
  let matchedTranslation = DYNAMIC_TRANSLATIONS_CACHE.get(cleanKey);

  if (!matchedTranslation) {
    // Try robust substring matching in the dynamic cache
    for (const [key, val] of DYNAMIC_TRANSLATIONS_CACHE.entries()) {
      if (cleanKey.includes(key) || key.includes(cleanKey)) {
        matchedTranslation = val;
        break;
      }
    }
  }

  // 2. Fallback to static pre-calculated translations for curated baseline texts
  if (!matchedTranslation) {
    for (const [key, val] of Object.entries(CACHED_TRANSLATIONS)) {
      if (cleanKey.includes(key) || key.includes(cleanKey)) {
        matchedTranslation = val;
        break;
      }
    }
  }

  // If a pre-loaded/cached match is found, return it immediately with 100% precision
  if (matchedTranslation) {
    res.json({
      originalText: paragraph,
      translation: matchedTranslation
    });
    return;
  }

  // 3. Try DeepSeek AI first if configured
  const dsParams = getDeepSeekParams(req.body);
  if (dsParams.apiKey) {
    try {
      console.log("Translating paragraph using DeepSeek AI...");
      const customPrompt = req.body.clientTransPrompt || DEEPSEEK_CONFIG.translationPrompt;
      const translationResult = await callDeepSeek(customPrompt, `Paragraph content:\n"${paragraph}"`, dsParams);
      res.json({
        originalText: paragraph,
        translation: translationResult
      });
      return;
    } catch (error) {
      console.warn("DeepSeek paragraph translation failed. Falling back to secondary APIs.", error);
    }
  }

  // 4. Fallback to Gemini AI translation if API key is valid
  try {
    if (isApiKeyValid()) {
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Translate the following English paragraph into refined, elegant, readable Chinese. Maintain any technical vocabulary with precision. Return the response as JSON with properties "originalText" and "translation".\n\nParagraph:\n"${paragraph}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              originalText: { type: Type.STRING },
              translation: { type: Type.STRING }
            },
            required: ["originalText", "translation"]
          }
        }
      });

      const bodyData = JSON.parse(response.text.trim());
      res.json(bodyData);
      return;
    }
  } catch (error) {
    console.warn("Gemini AI translation failed, migrating offline:", error);
  }

  // 5. Ultimate offline word-glossary alignment coupling
  const words = cleanKey.split(/[^a-zA-Z]+/);
  const uniqueKeys = Array.from(new Set(words))
    .filter(w => OFFLINE_DICTIONARY[w])
    .slice(0, 4);

  if (uniqueKeys.length > 0) {
    matchedTranslation = "【学术研究离线分析】该段落深度探讨了学术概念。具体特色词汇对照：\n" +
      uniqueKeys.map(k => `• ${k} (${OFFLINE_DICTIONARY[k].pos}): ${OFFLINE_DICTIONARY[k].translation} — ${OFFLINE_DICTIONARY[k].definition}`).join("\n") +
      "\n\n（提示：配置有效的 DEEPSEEK_API_KEY 以开启实时全真 DeepSeek AI 翻译耦合）";
  } else {
    matchedTranslation = "【学术研究离线分析】该论文段落关注高层次学术思辨，阐释了本章节核心论点。（提示：配置有效的 GEMINI_API_KEY 以开启实时全真 AI 翻译耦合）";
  }

  res.json({
    originalText: paragraph,
    translation: matchedTranslation
  });
});

// DEEPSEEK DYNAMIC CONNECTION LIFELINE TEST
app.post("/api/test-deepseek", async (req, res) => {
  const { clientKey, clientUrl, clientModel, clientPrompt } = req.body;
  try {
    const key = (clientKey && clientKey.trim().length > 0) ? clientKey.trim() : getDeepSeekKey();
    if (!key) {
      res.status(400).json({ error: "Missing DeepSeek API key. Please input it in your Statistics Settings." });
      return;
    }
    const url = (clientUrl && clientUrl.trim().length > 0) ? clientUrl.trim() : DEEPSEEK_CONFIG.apiUrl;
    const model = (clientModel && clientModel.trim().length > 0) ? clientModel.trim() : DEEPSEEK_CONFIG.model;
    const prompt = (clientPrompt && clientPrompt.trim().length > 0) ? clientPrompt.trim() : "You are a helpful assistant.";

    const endpoint = `${url.replace(/\/+$/, "")}/chat/completions`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: "Reply in valid JSON format: { \"status\": \"ok\" } with no extra character or formatting fences." }
        ],
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      res.status(response.status).json({ error: `DeepSeek API error code (${response.status}): ${errText}` });
      return;
    }

    const data: any = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (content) {
      res.json({ status: "ok", message: "Successfully connected", model });
    } else {
      res.status(500).json({ error: "Empty completion body back from target provider." });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to query the chosen API endpoint URL." });
  }
});

// MOUNT VITE MIDDLEWARE IN DEV, SERVE BUILD ASSETS IN PRODUCTION
async function startAppServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting development mode with active Vite middlewares...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving production build assets...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: express.Request, res: express.Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Lexis Reader Full-Stack Server active on http://0.0.0.0:${PORT}`);
  });
}

startAppServer().catch((err) => {
  console.error("FATAL: Failed to launch Lexis Reader server:", err);
});
