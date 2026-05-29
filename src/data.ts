import { Article } from "./types";

export const defaultArticles: Article[] = [
  {
    id: "remote-revolution",
    title: "The Remote Revolution",
    category: "Technology & Society",
    readTime: "15 min read",
    summary: "How decentralized work environments are fundamentally reshaping cognitive labor and societal structures.",
    sections: [
      {
        title: "Intro",
        paragraphs: [
          "The paradigm shift from localized, synchronized office attendance to distributed, asynchronous work models represents one of the most significant socioeconomic transformations of the 21st century. This is not merely a geographic relocation of labor; it is a fundamental restructuring of how cognitive tasks are organized, evaluated, and executed.",
          "Historically, the architectural construct of the office served as a proxy for productivity. Presence was conflated with performance. However, the contemporary landscape demands a more nuanced understanding of output, one decoupled from physical proximity to management."
        ]
      },
      {
        title: "Impact",
        paragraphs: [
          "A critical component of this evolution is the move towards asynchronous communication. When teams are distributed across multiple time zones, expecting immediate responses becomes not just impractical, but detrimental to deep, focused work. The reliance on written documentation and clear, explicit directives mitigates the ambiguity often found in synchronous, conversational environments.",
          "Furthermore, the elimination of the daily commute reclaims millions of hours globally, presenting an opportunity to redistribute temporal resources towards personal well-being, family, or continued education. Yet, this newfound autonomy requires a corresponding increase in individual discipline and self-regulation."
        ]
      },
      {
        title: "Future",
        paragraphs: [
          "As we venture further into this decentralized era, the boundary fields between work and life demand active calibration. The organizations that thrive will not be those that replicate physical office oversight in digital mediums, but those that foster deliberate, trust-anchored productivity frameworks.",
          "Cognitive labor is no longer synchronous. By reclaiming temporal sovereignty, modern academics and professional professionals are entering a new phase of output, where cognitive quality and persistent focus matter far more than visual presentation inside standard physical headquarters."
        ]
      }
    ],
    keyVocabulary: [
      {
        word: "paradigm",
        pos: "noun",
        phonetics: "/ˈpær.ə.daɪm/",
        cefr: "C1",
        definition: "A typical example or pattern of something; a model.",
        translation: "范式，典范",
        synonyms: ["model", "pattern", "exemplar"],
        etymology: "Late 15th century: via late Latin from Greek paradeigma, from paradeiknunai 'show side by side'."
      },
      {
        word: "nuanced",
        pos: "adjective",
        phonetics: "/ˈnjuː.ɑːnst/",
        cefr: "C1",
        definition: "Characterized by subtle shades of meaning or expression; not simple or black-and-white.",
        translation: "有细微差别的，微妙的",
        synonyms: ["subtle", "refined", "complex"],
        etymology: "Late 18th century: from French, from nuancer 'to shade', from nuance 'shade, hue'."
      },
      {
        word: "proximity",
        pos: "noun",
        phonetics: "/prɒkˈsɪm.ə.ti/",
        cefr: "B2",
        definition: "Closeness in space, time, or relationship.",
        translation: "接近，邻近",
        synonyms: ["nearness", "closeness", "adjacency"],
        etymology: "Late 15th century: from French proximité, from Latin proximitas, from proximus 'nearest'."
      },
      {
        word: "mitigates",
        pos: "verb",
        phonetics: "/ˈmɪt.ɪ.ɡeɪts/",
        cefr: "C1",
        definition: "Make (something bad) less severe, serious, or painful.",
        translation: "缓和，减轻",
        synonyms: ["alleviates", "reduces", "assuages"],
        etymology: "Late Middle English: via Latin mitigatus 'softened, alleviated', from mitis 'mild'."
      }
    ],
    vocabDensity: {
      "Intro": 4,
      "Impact": 12,
      "Future": 2
    }
  },
  {
    id: "cognitive-surplus",
    title: "Cognitive Surplus in the Digital Age",
    category: "Sociological Science",
    readTime: "12 min read",
    summary: "How intellectual surplus is channeled into collaborative knowledge commons and cultural capital.",
    sections: [
      {
        title: "Intro",
        paragraphs: [
          "The modern digital landscape presents an unprecedented accumulation of intellectual resources, described by sociological researchers as a cognitive surplus. Under this environment, the billions of joint hours previously absorbed by passive media consumption are being reallocated towards constructive knowledge commons.",
          "This paradigm transition is characterized by a collective volition to produce, collaborate, and share. Rather than isolated information consumers, citizens act as active contributors to universal archives."
        ]
      },
      {
        title: "Impact",
        paragraphs: [
          "The manifestation of communal wiki channels, crowdsourced code repositories, and decentralized tutoring networks represents a significant democratization of expertise. Knowledge becomes free from proprietary locks, alleviating historic barriers to academic engagement.",
          "However, this proliferation of public channels poses cognitive challenges. The ubiquity of unregulated publications might trigger informational disorientation. Consequently, academic literacy demands robust critical-thinking methodologies to distinguish curated scholarship from spurious data."
        ]
      },
      {
        title: "Future",
        paragraphs: [
          "In the long term, fostering scholarly communities that encourage rigorous peer contribution is essential for cognitive preservation. These communities will establish dynamic, self-regulatory ecosystems where collaborative intelligence and empirical truth triumph over sensationalist discourse."
        ]
      }
    ],
    keyVocabulary: [
      {
        word: "surplus",
        pos: "noun",
        phonetics: "/ˈsɜː.pləs/",
        cefr: "B2",
        definition: "An amount that is extra or more than what is needed.",
        translation: "盈余，过剩",
        synonyms: ["excess", "abundance", "relevance"],
        etymology: "Late Middle English: from Old French sourplus, from sour- 'above' + plus 'more'."
      },
      {
        word: "volition",
        pos: "noun",
        phonetics: "/vəˈlɪʃ.ən/",
        cefr: "C2",
        definition: "The faculty or power of using one's will; an act of making a conscious choice.",
        translation: "意志力，自愿选择",
        synonyms: ["free will", "choice", "determination"],
        etymology: "Early 17th century: from French, from medieval Latin volitio(n-), from volo 'I wish'."
      },
      {
        word: "proliferation",
        pos: "noun",
        phonetics: "/prəˌlɪf.ərˈeɪ.ʃən/",
        cefr: "C1",
        definition: "Rapid increase in numbers; rapid reproduction of a cell, part, or organism.",
        translation: "激增，扩散",
        synonyms: ["exponential growth", "spread", "multiplication"],
        etymology: "Mid 19th century: from French prolifération, from proliférer 'reproduce rapidly'."
      },
      {
        word: "ubiquity",
        pos: "noun",
        phonetics: "/juːˈbɪk.wə.ti/",
        cefr: "C2",
        definition: "The state of being everywhere at once; omnipresence.",
        translation: "无处不在",
        synonyms: ["omnipresence", "pervasiveness", "universality"],
        etymology: "Late 16th century: from modern Latin ubiquitas, from ubique 'everywhere'."
      },
      {
        word: "spurious",
        pos: "adjective",
        phonetics: "/ˈspjʊə.ri.əs/",
        cefr: "C2",
        definition: "Not being what it purports to be; false or fake.",
        translation: "虚假的，欺骗性的",
        synonyms: ["counterfeit", "bogus", "fraudulent"],
        etymology: "Late 16th century: from Latin spurius 'false, illegitimate' + -ous."
      }
    ],
    vocabDensity: {
      "Intro": 6,
      "Impact": 14,
      "Future": 3
    }
  }
];
