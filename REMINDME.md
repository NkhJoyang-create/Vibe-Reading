# Developer Runbook & Reminders: Lexis Reader

This document serves as a developer-oriented runbook and quick reference guide as you prepare to publish and organize the **Lexis Reader** repository on GitHub.

---

## 🚀 Quick Start Checklist

Follow these steps to deploy and run the applet locally from a clean clone:

```bash
# 1. Install all required dependencies
npm install

# 2. Configure environment credentials
cp .env.example .env
# Edit '.env' and fill in your GEMINI_API_KEY and DEEPSEEK_API_KEY!

# 3. Start the developmental hot-rebuilding server
npm run dev

# 4. Compile, bundle and build the application for production
npm run build

# 5. Start the production backend server
npm run start
```

---

## 🛠 Project Architecture & File System

An overview of how the codebase is structured for streamlined maintenance:

```text
├── .gitignore               # Excludes node_modules/ and personal keys (.env) from Git
├── .env.example             # Template for API credentials and host configs 
├── README.md                # General introduction and features explanation
├── package.json             # NPM package scripts and modular dependencies 
├── tsconfig.json            # Strict-mode TypeScript configuration
├── vite.config.ts           # Vite + Tailwind CSS build engine plug-ins
├── server.ts                # Express backend routing, Gemini API & DeepSeek clients
├── deepseek-config.ts       # Global fallback prompts & model configurations
│
└── src/                     # React Single Page Application (SPA) Front-end
    ├── main.tsx             # Application element bootstrap loader
    ├── App.tsx              # Main UI flow orchestrator & tab container
    ├── data.ts              # Pre-packaged curriculum markdown resources
    ├── types.ts             # Shared structured TypeScript interface models
    ├── index.css            # Tailwind dynamic stylistic theme styles
    │
    └── components/          # Reusable aesthetic component layouts
        ├── Library.tsx      # Multi-source document selector and markdown importer
        ├── Reader.tsx       # Dual-column interactive manuscript & translation pane
        ├── InsightPanel.tsx # Side-docked AI Dictionary, CEFR tags, and Grammatical coach
        └── StatisticsDashboard.tsx   # Learner analytical dashboard & API prompt settings
```

---

## 🔍 Core Linguistic Logic Reminders

### 1. Unified Suffix & Stem Vocabulary Matching
To ensure flawless interaction even when complex or irregular academic stems are used, the reader leverages a suffix-stripping fuzzy match inside `/src/components/Reader.tsx`:
- Corrects for common inflections like plurals (`-s`, `-es`), past tense / participial stems (`-ed`/`-d`), and continuous participles (`-ing`).
- Allows dynamic clicking on any variant to successfully query the root dictionary definitions.

### 2. Automatic Markdown Bold Vocabulary Synchronicity
- The application automatically coordinates key vocabulary items defined in loaded or custom standard documents.
- Any bold text (enclosed in markdown `**` or `*` delimiters) in default or custom imported markdown manuscripts will be scrubbed of raw markdown punctuation, highlighted cleanly, and integrated as an interactively look-up-ready dictionary item.

---

## 📤 Publishing Safely to GitHub

To publish the code to GitHub securely without accidentally committing your active credentials, execute these steps:

```bash
# Initialize safety checks
git init

# Verify .gitignore exists and blocks your .env files
git status --ignored

# Stage your files safely
git add .

# Create the first repository milestone
git commit -m "feat: complete initial high-fidelity Lexis Reader applet release"

# Point to your remote repository and push
git branch -M main
git remote add origin https://github.com/your-username/lexis-reader.git
git push -u origin main
```
