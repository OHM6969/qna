import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Database, Quiz, Question, Submission, QuestionReviewItem, QuestionStat, ReactionCount, PublicQuestion } from './types';
import { getSeedData } from './seed';

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'quizzes.json');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

app.use(express.json());
app.use(express.static(PUBLIC_DIR));

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadDatabase(): Database {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      const initialData = getSeedData();
      fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
      return initialData;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw) as Database;
  } catch (err) {
    console.error('Error loading database, resetting to seed data:', err);
    return getSeedData();
  }
}

function saveDatabase(data: Database): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save database:', err);
  }
}

function generateQuizCode(existingCodes: Set<string>): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let attempt = 0; attempt < 50; attempt++) {
    const suffix = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const code = `INQ-${suffix}`;
    if (!existingCodes.has(code)) return code;
  }
  return 'INQ-' + Date.now().toString(36).slice(-4).toUpperCase();
}

const db: Database = loadDatabase();

// ============================================================================
// API ROUTES
// ============================================================================

// 1. Create a new Quiz (Owner)
app.post('/api/quizzes', (req: Request, res: Response) => {
  const { title, description, questions, ownerName, revealScoreToStudents } = req.body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'Quiz title is required.' });
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: 'At least one question is required.' });
  }

  // Validate questions structure
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (!q.question || typeof q.question !== 'string' || !q.question.trim()) {
      return res.status(400).json({ error: `Question ${i + 1} has an empty prompt.` });
    }
    if (!Array.isArray(q.options) || q.options.length < 2) {
      return res.status(400).json({ error: `Question ${i + 1} must have at least 2 options.` });
    }
    if (!Array.isArray(q.answer) || q.answer.length === 0) {
      return res.status(400).json({ error: `Question ${i + 1} must have at least one marked correct answer.` });
    }
  }

  const existingCodes = new Set(Object.keys(db.quizzes));
  const code = generateQuizCode(existingCodes);
  const ownerKey = 'key_' + crypto.randomBytes(16).toString('hex');

  const cleanQuestions: Question[] = questions.map((q: any, idx: number) => ({
    id: q.id || idx + 1,
    question: q.question.trim(),
    options: q.options.map((opt: any) => String(opt).trim()),
    answer: Array.from(new Set(q.answer)).map(Number).sort((a, b) => a - b)
  }));

  const newQuiz: Quiz = {
    code,
    ownerKey,
    title: title.trim(),
    description: typeof description === 'string' ? description.trim() : '',
    ownerName: typeof ownerName === 'string' && ownerName.trim() ? ownerName.trim() : 'Anonymous Creator',
    createdAt: new Date().toISOString(),
    revealScoreToStudents: Boolean(revealScoreToStudents), // Default false: Only admin sees score!
    questions: cleanQuestions,
    submissions: []
  };

  db.quizzes[code] = newQuiz;
  saveDatabase(db);

  return res.status(201).json({
    success: true,
    code,
    ownerKey,
    title: newQuiz.title,
    questionCount: cleanQuestions.length
  });
});

// 2. Fetch public Quiz for participant (Hides correct answers!)
app.get('/api/quizzes/:code', (req: Request, res: Response) => {
  const code = String(req.params.code).trim().toUpperCase();
  const quiz = db.quizzes[code];

  if (!quiz) {
    return res.status(404).json({ error: `No quiz found with code "${code}". Please verify the code.` });
  }

  const publicQuestions: PublicQuestion[] = quiz.questions.map(q => ({
    id: q.id,
    question: q.question,
    options: q.options,
    isMulti: q.answer.length > 1
  }));

  return res.json({
    code: quiz.code,
    title: quiz.title,
    description: quiz.description,
    ownerName: quiz.ownerName,
    createdAt: quiz.createdAt,
    questionCount: publicQuestions.length,
    questions: publicQuestions
  });
});

// 3. Submit Participant Answers & Grade
app.post('/api/quizzes/:code/submit', (req: Request, res: Response) => {
  const code = String(req.params.code).trim().toUpperCase();
  const quiz = db.quizzes[code];

  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found.' });
  }

  const { participantName, userAnswers, reaction, reactionEmoji, feedbackNote } = req.body;

  let score = 0;
  const review: QuestionReviewItem[] = [];
  const questionResults: Record<string | number, boolean> = {};

  quiz.questions.forEach((q) => {
    const rawSelections = userAnswers ? userAnswers[q.id] : [];
    const userSelections = Array.isArray(rawSelections) ? rawSelections.map(Number) : [];
    const correctAnswers = q.answer;

    const isCorrect =
      userSelections.length === correctAnswers.length &&
      userSelections.every(val => correctAnswers.includes(val));

    if (isCorrect) score++;
    questionResults[q.id] = isCorrect;

    review.push({
      id: q.id,
      question: q.question,
      options: q.options,
      correctAnswers: q.answer,
      userSelections,
      isCorrect
    });
  });

  const total = quiz.questions.length;
  const percentage = Math.round((score / total) * 100);
  const submissionId = 'sub_' + crypto.randomBytes(8).toString('hex');

  const submission: Submission = {
    id: submissionId,
    participantName: typeof participantName === 'string' && participantName.trim() ? participantName.trim() : 'Anonymous Participant',
    submittedAt: new Date().toISOString(),
    score,
    total,
    percentage,
    reaction: typeof reaction === 'string' ? reaction : 'thought-provoking',
    reactionEmoji: typeof reactionEmoji === 'string' ? reactionEmoji : '✨',
    feedbackNote: typeof feedbackNote === 'string' ? feedbackNote.trim() : '',
    answers: userAnswers || {},
    questionResults
  };

  quiz.submissions.push(submission);
  saveDatabase(db);

  // If score is set to private (default), do not reveal score or correct answers to student!
  if (!quiz.revealScoreToStudents) {
    return res.json({
      success: true,
      submissionId,
      revealScore: false,
      participantName: submission.participantName,
      message: 'Your responses have been recorded and securely submitted to the administrator.'
    });
  }

  return res.json({
    success: true,
    submissionId,
    revealScore: true,
    score,
    total,
    percentage,
    review
  });
});

// 4. Update Reaction / Feedback note after quiz completion
app.post('/api/quizzes/:code/reaction', (req: Request, res: Response) => {
  const code = String(req.params.code).trim().toUpperCase();
  const quiz = db.quizzes[code];

  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found.' });
  }

  const { submissionId, reaction, reactionEmoji, feedbackNote } = req.body;
  const sub = quiz.submissions.find(s => s.id === submissionId);

  if (!sub) {
    return res.status(404).json({ error: 'Submission not found.' });
  }

  if (typeof reaction === 'string') sub.reaction = reaction;
  if (typeof reactionEmoji === 'string') sub.reactionEmoji = reactionEmoji;
  if (typeof feedbackNote === 'string') sub.feedbackNote = feedbackNote.trim();

  saveDatabase(db);
  return res.json({ success: true, submission: sub });
});

// 5. Owner Analytics & Reactions Dashboard
app.get('/api/quizzes/:code/owner', (req: Request, res: Response) => {
  const code = String(req.params.code).trim().toUpperCase();
  const ownerKey = (req.headers['x-owner-key'] as string) || (req.query.key as string);
  const quiz = db.quizzes[code];

  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found.' });
  }

  if (quiz.ownerKey !== ownerKey) {
    return res.status(403).json({ error: 'Invalid or missing owner access key for this quiz.' });
  }

  const submissions = quiz.submissions || [];
  const totalSubmissions = submissions.length;

  let averageScore = '0.0';
  let averagePercentage = 0;
  const scoreDistribution: Record<string, number> = { '0-25%': 0, '26-50%': 0, '51-75%': 0, '76-100%': 0 };
  const reactionCounts: Record<string, ReactionCount> = {};

  const questionStats: QuestionStat[] = quiz.questions.map((q, idx) => {
    let correctCount = 0;
    submissions.forEach(sub => {
      if (sub.questionResults && sub.questionResults[q.id]) {
        correctCount++;
      }
    });
    const accuracy = totalSubmissions > 0 ? Math.round((correctCount / totalSubmissions) * 100) : 0;
    return {
      id: q.id,
      index: idx + 1,
      question: q.question,
      options: q.options,
      correctAnswers: q.answer,
      correctCount,
      accuracy
    };
  });

  if (totalSubmissions > 0) {
    const sumScores = submissions.reduce((acc, s) => acc + s.score, 0);
    averageScore = (sumScores / totalSubmissions).toFixed(1);
    averagePercentage = Math.round((sumScores / (totalSubmissions * quiz.questions.length)) * 100);

    submissions.forEach(sub => {
      if (sub.percentage <= 25) scoreDistribution['0-25%']++;
      else if (sub.percentage <= 50) scoreDistribution['26-50%']++;
      else if (sub.percentage <= 75) scoreDistribution['51-75%']++;
      else scoreDistribution['76-100%']++;

      const rKey = sub.reaction || 'thought-provoking';
      if (!reactionCounts[rKey]) {
        reactionCounts[rKey] = {
          label: rKey,
          emoji: sub.reactionEmoji || '✨',
          count: 0
        };
      }
      reactionCounts[rKey].count++;
    });
  }

  return res.json({
    quiz: {
      code: quiz.code,
      title: quiz.title,
      description: quiz.description,
      ownerName: quiz.ownerName,
      createdAt: quiz.createdAt,
      revealScoreToStudents: Boolean(quiz.revealScoreToStudents),
      questionCount: quiz.questions.length
    },
    analytics: {
      totalSubmissions,
      averageScore,
      averagePercentage,
      questionStats,
      scoreDistribution,
      reactions: Object.values(reactionCounts),
      submissions: submissions.map(s => ({
        id: s.id,
        participantName: s.participantName,
        submittedAt: s.submittedAt,
        score: s.score,
        total: s.total,
        percentage: s.percentage,
        reaction: s.reaction,
        reactionEmoji: s.reactionEmoji,
        feedbackNote: s.feedbackNote
      })).reverse()
    }
  });
});

// 6. Owner Toggle: Release / Hide Score from Students
app.post('/api/quizzes/:code/toggle-reveal', (req: Request, res: Response) => {
  const code = String(req.params.code).trim().toUpperCase();
  const ownerKey = (req.headers['x-owner-key'] as string) || (req.body.ownerKey as string) || (req.query.key as string);
  const quiz = db.quizzes[code];

  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found.' });
  }

  if (quiz.ownerKey !== ownerKey) {
    return res.status(403).json({ error: 'Unauthorized.' });
  }

  if (typeof req.body.revealScoreToStudents === 'boolean') {
    quiz.revealScoreToStudents = req.body.revealScoreToStudents;
  } else {
    quiz.revealScoreToStudents = !quiz.revealScoreToStudents;
  }

  saveDatabase(db);
  return res.json({ success: true, revealScoreToStudents: quiz.revealScoreToStudents });
});

// Fallback to SPA index.html for client-side routing
app.use((_req: Request, res: Response) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`  Curated Inquiry Quiz Engine [TypeScript] running on http://localhost:${PORT}`);
  console.log(`  Sample Quiz Code: ARCHIVE (Owner Key: key_archive_master)`);
  console.log(`==================================================\n`);
});

export default app;

