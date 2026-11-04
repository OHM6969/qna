# Inquiry Engine — Curated Assessment & Reactions (TypeScript)

A minimal, editorial quiz platform built with **TypeScript**, **Node.js**, **Express**, and vanilla web technologies. Features an **Author / Owner System** allowing creators to compose custom question sets, distribute them via unique share codes, and monitor participant scores, accuracy, and live reactions in real time.

---

## TypeScript Project Structure

```
project/
├── tsconfig.json          # TypeScript compiler configuration
├── package.json           # Scripts (dev, build, start) and dependencies
├── src/
│   ├── types.ts           # Strongly-typed models (Quiz, Question, Submission, Analytics)
│   ├── seed.ts            # Default pre-seeded quiz data
│   └── server.ts          # Express API server written in TypeScript
├── dist/                  # Compiled JavaScript output
├── public/
│   └── index.html         # Frontend client (Vanilla JS, CSS, responsive SPA)
└── data/
    └── quizzes.json       # JSON file database (auto-persisted)
```

---

## Commands

* **Development (instant TS execution with live hot-reload)**:
  ```bash
  npm run dev
  ```

* **Build (compile TypeScript to `/dist`)**:
  ```bash
  npm run build
  ```

* **Production Start**:
  ```bash
  npm start
  ```
  *(Automatically executes `npm run build` beforehand)*

Open your browser at **[http://localhost:3000](http://localhost:3000)**.

---

## Key Features

### 1. Owner & Author System
* **Draft Inquiries**: Compose questions with customized prompts and option sets.
* **Flexible Answers**: Supports both **single-choice** and **multi-choice** questions (just check the box next to any correct option).
* **Share Codes**: Each quiz gets an instant 6-character access code (e.g. `INQ-482`) and a direct participant URL (`http://localhost:3000/?code=INQ-482`).
* **Private Management Key**: Authors receive a private management link (e.g. `http://localhost:3000/?manage=INQ-482&key=...`) to access real-time analytics.

### 2. Participant Experience
* **Enter Code**: Join with any code from the home screen or via direct URL.
* **Calm Magazine Aesthetic**: Dark off-black theme (`#0c0d0e`), Fraunces serif typography, warm amber accents, SVG checkmark tick animations, and keyboard navigation (<kbd>1</kbd>–<kbd>4</kbd>, <kbd>Enter</kbd>, <kbd>←</kbd> / <kbd>→</kbd>).
* **Cheating Prevention**: Correct answer keys remain securely on the server and are never sent to the client until after grading.
* **Reaction & Reflection**: On completion, participants can submit their sentiment (✨ Thought-Provoking, 🧠 Challenging, 🎯 Masterful, 💡 Eye-Opening, 🌿 Delightful) along with an optional reflection note.

### 3. Owner Dashboard & Reactions Analytics
* **Total Submissions & Average Score**: Live metrics on participation and accuracy rate.
* **Reactions Tally**: Visual breakdown of audience sentiments and emoji reactions.
* **Participant Feedback Stream**: Wall of participant reflections with their scores and timestamps.
* **Question-by-Question Difficulty**: Percentage accuracy bars for every question to identify which inquiries challenged participants the most.
* **Full Submissions Log**: Tabular record of each participant's name, score, and reaction.

---

## Included Sample Quiz

A pre-seeded quiz is ready to test immediately:
* **Code**: `ARCHIVE`
* **Direct Participant Link**: `http://localhost:3000/?code=ARCHIVE`
* **Owner Management Dashboard**: `http://localhost:3000/?manage=ARCHIVE&key=key_archive_master`
* **Topic**: *Aesthetic Foundations & Design Theory* (pre-loaded with sample submissions and reflections).
