export interface Question {
  id: number | string;
  question: string;
  options: string[];
  answer: number[]; // 0-based indices of correct option(s)
}

export interface PublicQuestion {
  id: number | string;
  question: string;
  options: string[];
  isMulti: boolean;
}

export interface Submission {
  id: string;
  participantName: string;
  submittedAt: string;
  score: number;
  total: number;
  percentage: number;
  reaction: string;
  reactionEmoji: string;
  feedbackNote: string;
  answers: Record<string | number, number[]>;
  questionResults: Record<string | number, boolean>;
}

export interface Quiz {
  code: string;
  ownerKey: string;
  title: string;
  description: string;
  ownerName: string;
  createdAt: string;
  revealScoreToStudents?: boolean; // Default false: only admin sees scores
  questions: Question[];
  submissions: Submission[];
}

export interface Database {
  quizzes: Record<string, Quiz>;
}

export interface QuestionReviewItem {
  id: number | string;
  question: string;
  options: string[];
  correctAnswers: number[];
  userSelections: number[];
  isCorrect: boolean;
}

export interface QuestionStat {
  id: number | string;
  index: number;
  question: string;
  options: string[];
  correctAnswers: number[];
  correctCount: number;
  accuracy: number;
}

export interface ReactionCount {
  label: string;
  emoji: string;
  count: number;
}

export interface OwnerAnalytics {
  totalSubmissions: number;
  averageScore: string;
  averagePercentage: number;
  questionStats: QuestionStat[];
  scoreDistribution: Record<string, number>;
  reactions: ReactionCount[];
  submissions: Array<{
    id: string;
    participantName: string;
    submittedAt: string;
    score: number;
    total: number;
    percentage: number;
    reaction: string;
    reactionEmoji: string;
    feedbackNote: string;
  }>;
}

