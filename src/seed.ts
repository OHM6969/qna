import { Database } from './types';

export function getSeedData(): Database {
  return {
    quizzes: {
      'ARCHIVE': {
        code: 'ARCHIVE',
        ownerKey: 'key_archive_master',
        title: 'Aesthetic Foundations & Design Theory',
        description: 'An editorial inquiry into typography, architectural philosophy, and perceptual shifts.',
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        ownerName: 'Editor-in-Chief',
        revealScoreToStudents: false, // Default: Only admin can see score
        questions: [
          {
            id: 1,
            question: "Which of the following best characterizes the cognitive shift known as the 'overview effect'?",
            options: [
              "A profound sense of interconnectedness reported by space travelers viewing Earth",
              "The psychological tunnel vision induced by extreme cognitive fatigue",
              "An unconscious inclination to oversimplify multi-variable systemic problems",
              "An aesthetic preference for architectural scale and aerial perspective"
            ],
            answer: [0]
          },
          {
            id: 2,
            question: "In classical Japanese aesthetics and joinery, which elements embody the ethos of Wabi-sabi?",
            options: [
              "Preservation of natural grain asymmetries and weathered patina",
              "Precision-milled mirror chrome surfaces free from organic blemishes",
              "Embrace of visible transience, impermanence, and modest unadorned materials",
              "Interlocking joints assembled without synthetic fasteners or adhesives"
            ],
            answer: [0, 2, 3]
          },
          {
            id: 3,
            question: "In typographic design, what fundamentally distinguishes a 'true small capital' from a mathematically scaled capital?",
            options: [
              "Identical glyph outlines simply reduced by 70% font size in the text engine",
              "Carefully drawn stroke weights and proportions calibrated to match lowercase x-height",
              "A forced mechanical italic angle applied exclusively to uppercase glyphs",
              "An exaggerated baseline shift configured specifically for tabular figures"
            ],
            answer: [1]
          }
        ],
        submissions: [
          {
            id: 'sub_seed_1',
            participantName: 'Elena Rostova',
            submittedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
            score: 3,
            total: 3,
            percentage: 100,
            reaction: 'thought-provoking',
            reactionEmoji: '✨',
            feedbackNote: 'The distinction between scaled caps and optical small caps is rarely taught properly. Superb quiz!',
            answers: { 1: [0], 2: [0, 2, 3], 3: [1] },
            questionResults: { 1: true, 2: true, 3: true }
          },
          {
            id: 'sub_seed_2',
            participantName: 'Julian Thorne',
            submittedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
            score: 2,
            total: 3,
            percentage: 67,
            reaction: 'challenging',
            reactionEmoji: '🧠',
            feedbackNote: 'Tricked by the Japanese joinery fasteners question. Really appreciated the minimalist interface.',
            answers: { 1: [0], 2: [0, 2], 3: [1] },
            questionResults: { 1: true, 2: false, 3: true }
          }
        ]
      }
    }
  };
}

