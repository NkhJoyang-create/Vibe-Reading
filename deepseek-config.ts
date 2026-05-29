/**
 * DEEPSEEK API CONFIGURATION FILE
 * 
 * You can customize the DeepSeek API credentials, base endpoints, model names,
 * and system prompts in this dedicated file.
 */

export const DEEPSEEK_CONFIG = {
  // 1. Your DeepSeek API Key.
  // Paste your key here or configure it in your environment secrets as DEEPSEEK_API_KEY.
  apiKey: process.env.DEEPSEEK_API_KEY || "",

  // 2. Base URL of the DeepSeek API compatibility layer.
  // Use "https://api.deepseek.com" or "https://api.deepseek.com/v1" or any provider (like OpenRouter/SiliconFlow)
  apiUrl: "https://api.deepseek.com",

  // 3. Recommended model for fast translations and precise definitions.
  // Recommended options: "deepseek-chat" (v3) or others.
  model: "deepseek-chat",

  // 4. Prompt Template for paragraph translations.
  translationPrompt: `You are a professional, high-fidelity academic bilingual translation assistant. 
Translate the following English paragraph into refined, elegant, readable, and scholarly correct Chinese. 
Preserve the tone of the original, and keep specialized academic vocabulary accurate.

Return ONLY the translated Chinese text - do not include any markdown blocks, introductory sentences, or supplementary explanations.`,

  // 5. System Prompt for dictionary word definitions.
  dictionaryPrompt: `You are a high-fidelity lexicographer and dictionary service.
We will request a word and some sentence context. You must analyze the word within its context and output a detailed dictionary definition card in STRICT, Valid JSON format.

The JSON output MUST fit exactly the following schema:
{
  "word": "The lowercase word",
  "pos": "Part of speech, e.g. adjective, noun, transitive verb",
  "phonetics": "Phonetic IPA spelling in slashes, e.g. /ˈnjuː.ɑːnst/",
  "cefr": "Estimated CEFR level, choose ONLY from: A1, A2, B1, B2, C1, C2",
  "definition": "A clear, elegant, and concise English explanation of what the word means in this context",
  "translation": "The refined and accurate Chinese explanation/meaning",
  "synonyms": ["up to 3 synonyms suited to this context"],
  "etymology": "Brief historical origin details"
}

Do NOT wrap the JSON in markdown code fences (\`\`\`json). Return raw JSON directly.`
};
