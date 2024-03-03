import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { NextPage } from 'next'
import { Quiz as QuizType, quizzes } from 'utils/quiz'
import { useMemo } from 'react'
import { CheckCircleIcon, ChevronRightIcon } from '@heroicons/react/20/solid'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { useCompletedQuizzes } from 'hooks/useQuiz'
import Quiz from '@components/quiz/Quiz'
import { useWallet } from '@solana/wallet-adapter-react'

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        'account',
        'close-account',
        'common',
        'notifications',
        'onboarding',
        'profile',
        'search',
        'settings',
      ])),
      // Will be passed to the page component as props
    },
  }
}

const shuffleQuiz = (quiz: QuizType) => {
  for (let i = quiz.questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[quiz.questions[i], quiz.questions[j]] = [
      quiz.questions[j],
      quiz.questions[i],
    ]
  }
  return quiz
}

const Learn: NextPage = () => {
  // const { t } = useTranslation('common')
  const router = useRouter()
  const { quiz } = router.query

  const quizToShow = useMemo(() => {
    if (!quiz) return
    const index = quizzes.findIndex((q) => q.slug === quiz)
    const result = quizzes.find((q) => q.slug === quiz)
    return {
      quiz: result,
      index,
    }
  }, [quiz])

  return !quizToShow?.quiz ? (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-12 text-center">
      <h1 className="mb-1">Learn 2 Earn</h1>
      <p className="text-base">
        Earn rewards points for becoming a quiz master.
      </p>
      <div className="w-full space-y-2 pt-6">
        {[...quizzes].reverse().map((quiz, index) => (
          <QuizCard key={index} quiz={quiz} />
        ))}
      </div>
    </div>
  ) : (
    <div className="mx-auto flex flex-col items-center pb-12 text-center">
      <Quiz quiz={shuffleQuiz(quizToShow.quiz)} />
    </div>
  )
}

const QuizCard = ({ quiz }: { quiz: QuizType }) => {
  const { publicKey } = useWallet()
  const { data: solved } = useCompletedQuizzes(publicKey?.toBase58())
  const router = useRouter()
  const goToQuiz = (quiz: string) => {
    const query = { ...router.query, ['quiz']: quiz }
    router.push({ pathname: router.pathname, query }, undefined, {
      shallow: true,
    })
  }

  return (
    <button
      className="flex w-full items-center justify-between rounded-xl bg-th-bkg-2 p-4 text-left md:p-6 md:hover:bg-th-bkg-3"
      key={quiz.name}
      onClick={() => goToQuiz(quiz.slug)}
    >
      <div>
        <div className="flex items-center">
          {quiz.imagePath ? (
            <Image
              className="mr-2.5"
              src={quiz.imagePath}
              height={40}
              width={40}
              alt="Quiz Image"
            />
          ) : null}
          <div>
            <h3>{quiz.name}</h3>
            <p>{quiz.description}</p>
          </div>
        </div>
        <div className="mt-3 w-max rounded-full border border-th-fgd-4 px-3 py-1">
          <p className="text-xs">{quiz.questions.length} questions</p>
        </div>
      </div>

      <div className="flex items-center space-x-2 pl-4">
        {solved?.find((x) => x.quiz_id === quiz.id) ? (
          <div className="flex w-max items-center rounded-full bg-th-up-muted py-1 pl-1.5 pr-3">
            <CheckCircleIcon className="mr-1 h-4 w-4 text-th-fgd-1" />
            <p className="text-th-fgd-1">Completed</p>
          </div>
        ) : null}
        {/* <div className="flex w-max items-center rounded-full bg-th-bkg-1 px-3 py-1">
      <p className="mr-0.5">
        Earn:{' '}
        <span className="font-mono text-th-fgd-1">
          {formatNumericValue(quiz.earn.amount)}
        </span>
      </p>
      <Image
        alt="Mango Logo"
        src="/icons/mngo.svg"
        height={16}
        width={16}
      />
    </div> */}
        <ChevronRightIcon className="h-6 w-6" />
      </div>
    </button>
  )
}

export default Learn
