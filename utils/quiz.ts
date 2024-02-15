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

const collateralQuiz = [
  {
    id: 1,
    question: 'True or false? All tokens can be used as collateral on Mango.',
    choices: ['True', 'False'],
    correctAnswer: 'False',
  },
]

export const quizzes = [
  {
    name: 'Health',
    description: 'Understand how account health works on Mango.',
    earn: { amount: 100, token: 'MNGO' },
    questions: healthQuiz,
    slug: 'health',
  },
  {
    name: 'Collateral',
    description: 'Learn essential concepts for trading on Mango.',
    earn: { amount: 1000, token: 'MNGO' },
    questions: collateralQuiz,
    slug: 'collateral',
  },
]
