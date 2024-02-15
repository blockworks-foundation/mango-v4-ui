export type Quiz = {
  name: string
  description: string
  earn: { amount: number; token: string }
  intro: {
    title: string
    description: string
    docs?: {
      url: string
      linkText: string
    }
  }
  questions: QuizQuestion[]
  slug: string
}

export type QuizQuestion = {
  id: number
  question: string
  description?: string
  explanation?: string // explanation of the correct answer
  choices: string[]
  correctAnswer: string
}

const healthQuiz = [
  {
    id: 1,
    question:
      'True or false? When my initial health reaches 0 my account will be liquidated.',
    choices: ['True', 'False'],
    explanation:
      'Initial health only affects your ability to open new positions and withdraw collateral.',
    correctAnswer: 'False',
  },
  {
    id: 2,
    question:
      'If you deposit a token with 0x asset weight what will happen to your account health?',
    choices: ['No change', 'Increase', 'Decrease'],
    correctAnswer: 'No change',
  },
]

export const quizzes = [
  {
    name: 'Health',
    description: 'Learn how account health works on Mango.',
    earn: { amount: 10, token: 'MNGO' },
    intro: {
      title: 'Health Quiz',
      description:
        'Understanding account health is very important. Take a few minutes to check out the Docs before taking the quiz.',
      docs: {
        url: 'https://docs.mango.markets/mango-markets/health-overview',
        linkText: 'Read the Health Docs',
      },
    },
    questions: healthQuiz,
    slug: 'health',
  },
]
