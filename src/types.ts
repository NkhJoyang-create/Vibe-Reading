export interface VocabularyWord {
  word: string;
  pos: string;
  phonetics: string;
  cefr: string; // e.g. "B2", "C1", "C2"
  definition: string;
  translation?: string;
  synonyms: string[];
  etymology: string;
  saved?: boolean;
}

export interface ArticleSection {
  title: string;
  paragraphs: string[];
}

export interface Article {
  id: string;
  title: string;
  category: string;
  readTime: string;
  summary: string;
  sections: ArticleSection[];
  keyVocabulary: VocabularyWord[]; // pre-parsed words
  vocabDensity: Record<string, number>; // maps section title to count of words
  isUserUploaded?: boolean;
  translations?: Record<number, string>; // maps SectionIndex * 1000 + ParagraphIndex to the translated string
}
