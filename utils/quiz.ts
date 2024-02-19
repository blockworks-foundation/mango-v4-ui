export type Quiz = {
  name: string
  description: string
  points?: number
  imagePath?: string
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
    id: 0,
    question:
      'Which of the following is NOT factored in the account health calculation',
    choices: ['Collateral', 'Borrows', 'Perp Positions', 'Account Value'],
    explanation:
      "All variants of account health are calculated as a weighted sum of an accounts assets minus liabilities. Account value is the notional value of an account's equity",
    correctAnswer: 'Account Value',
  },
  {
    id: 1,
    question: 'How many types of account health are there?',
    choices: ['1', '2', '3', '4'],
    explanation:
      'There are three types of health: Initial Health is used to check if new positions can be openend, Maintenance Health controls when liquidation starts and Liquidation End Health determines when liquidation ends.',
    correctAnswer: '3',
  },
  {
    id: 2,
    question: 'Which of the following is NOT a type of account health?',
    choices: [
      'Initial Health',
      'Liquidation End Health',
      'Maintenance Health',
      'Collateral Health',
    ],
    explanation:
      'There are three types of health: Initial Health is used to check if new positions can be openend, Maintenance Health controls when liquidation starts and Liquidation End Health determines when liquidation ends.',
    correctAnswer: 'Collateral Health',
  },
  {
    id: 3,
    question: 'What is Initial Health used for?',
    choices: [
      'Liquidations',
      'Free Collateral',
      'Account Value',
      'Funding Rates',
    ],
    explanation:
      "Initial Health essentially represents your free collateral. If this value reaches 0 you won't be able to enter new positions or withdraw collateral",
    correctAnswer: 'Free Collateral',
  },
  {
    id: 4,
    question:
      'True or false? Assets and liabilities are weighted equally across health types.',
    choices: ['True', 'False'],
    explanation:
      'Initial Health is weighted more conservatively than Maintenance Health and the weights are dynamicly determined by the risk engine.',
    correctAnswer: 'False',
  },
  {
    id: 5,
    question: 'What happens when your account health ratio reaches 0%?',
    choices: [
      "New positions can't be opened",
      'Account will be liquidated',
      'Account withdrawals will be locked',
      'Account will get an airdrop',
    ],
    explanation:
      'Your account health ratio percentage is a representation of Maintenance Health. If it reaches 0% your account will be liquidated.',
    correctAnswer: 'Account will be liquidated',
  },
  {
    id: 6,
    question: 'What is the Stable Price?',
    choices: [
      'A special price just for stablecoins',
      'The average between the spot best bid and ask prices minus the oracle price',
      "A safety mechanism that smooths the oracle price when it's changing rapidly",
      'The oracle price from 1 hour ago',
    ],
    explanation:
      'Stable price is a safety mechanism that limits your ability to enter risky positions when the oracle price is changing rapidly.',
    correctAnswer:
      "A safety mechanism that smooths the oracle price when it's changing rapidly",
  },
  {
    id: 7,
    question: 'How are assets valued for Maintenance Health?',
    choices: [
      'Maint asset weight multiplied by stable price',
      'Maint asset weight multiplied by oracle price',
      'Init asset weight multiplied by oracle price',
      'Maint asset weight multiplied by the lesser of oracle price and stable price',
    ],
    explanation:
      'Maintenance Health determines if an account can be liquidated. The value of assets in this case is the maintenance asset weight multiplied by the oracle price.',
    correctAnswer: 'Maint asset weight multiplied by oracle price',
  },
  {
    id: 8,
    question: 'How are liabilities valued for Initial Health?',
    choices: [
      'Maint liability weight multiplied by stable price',
      'Maint liability weight multiplied by oracle price',
      'Init liability weight multiplied by oracle price',
      'Init liability weight multiplied by the greater of oracle price and stable price',
    ],
    explanation:
      'Initial Health determines if new positions can be opened. The value of liabilities in this case is the init liability weight multiplied by the greater of oracle price and stable price. Including stable price prevents new overly risky positions.',
    correctAnswer:
      'Init liability weight multiplied by the greater of oracle price and stable price',
  },
]

const nosanaQuiz = [
  {
    id: 0,
    question: 'What is the primary purpose of the Nosana Network?',
    choices: [
      'To offer a decentralized cryptocurrency exchange',
      'To provide a distributed GPU grid for rent',
      'To serve as a gaming platform',
      'To act as a digital wallet for cryptocurrencies',
    ],
    correctAnswer: 'To provide a distributed GPU grid for rent',
  },
  {
    id: 1,
    question:
      'What unique advantage does Nosana offer to AI users and GPU owners?',
    choices: [
      'Exclusive access to online gaming',
      'High-speed internet services',
      'Affordable GPUs for AI users and income for GPU owners',
      'Free cryptocurrency mining software',
    ],
    correctAnswer: 'Affordable GPUs for AI users and income for GPU owners',
  },
  {
    id: 2,
    question: "What is Nosana's ultimate vision for the future of computing?",
    choices: [
      'To centralize all computing power under one corporation',
      'To decentralize essential computations using blockchain technology',
      'To monopolize the GPU market',
      'To replace all traditional computing hardware',
    ],
    correctAnswer:
      'To decentralize essential computations using blockchain technology',
  },
  {
    id: 3,
    question: 'Which blockchain powers the Nosana programs?',
    choices: ['Ethereum', 'Bitcoin', 'Solana', 'Cardano'],
    correctAnswer: 'Solana',
  },
  {
    id: 4,
    question: 'What can users do with the Nosana Token (NOS)?',
    choices: [
      'Only trade it for other cryptocurrencies',
      'Use it to run AI workloads on the network',
      'Use it as a voting right in governance decisions',
      'Convert it directly into fiat currency',
    ],
    correctAnswer: 'Use it as a voting right in governance decisions',
  },
  {
    id: 5,
    question: 'What is the total supply of Nosana Tokens (NOS)?',
    choices: ['1,000,000', '10,000,000', '50,000,000', '100,000,000'],
    correctAnswer: '100,000,000',
  },
  {
    id: 6,
    question:
      'How are the mining tokens distributed to nodes within the Nosana Network?',
    choices: [
      'Equally to all participants',
      'Based on the computational power provided',
      'In a linear fashion over 24 months',
      'As a lump sum at the start of their participation',
    ],
    correctAnswer: 'In a linear fashion over 24 months',
  },
  {
    id: 7,
    question:
      'What percentage of the total NOS tokens are allocated to team members?',
    choices: ['5%', '10%', '20%', '25%'],
    correctAnswer: '20%',
  },
  {
    id: 8,
    question:
      'Which of the following is NOT a use case for company tokens within the Nosana Network?',
    choices: [
      'Marketing',
      'Engineering',
      'Business Development',
      'Personal expenses of team members',
    ],
    correctAnswer: 'Personal expenses of team members',
  },
  {
    id: 9,
    question: 'Over what period are backers tokens released?',
    choices: ['9 months', '12 months', '24 months', '36 months'],
    correctAnswer: '9 months',
  },
]

export const quizzes = [
  {
    name: 'Know Nosana',
    description: 'Think you know Nosana?',
    points: 10,
    imagePath: '/icons/nos.svg',
    intro: {
      title: 'Know Nosana',
      description:
        'Test your knowledge on the basics of the Nosana Network and the NOS token.',
    },
    questions: nosanaQuiz,
    slug: 'nosana',
  },
  {
    name: 'Account Health',
    description: 'Learn how account health works on Mango.',
    points: 10,
    intro: {
      title: 'Health is Wealth',
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
