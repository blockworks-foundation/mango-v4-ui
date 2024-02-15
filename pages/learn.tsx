import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { NextPage } from 'next'
import { Quiz, QuizQuestion, quizzes } from 'utils/quiz'
import { useMemo, useState } from 'react'
import Button, { IconButton } from '@components/shared/Button'
import { Disclosure } from '@headlessui/react'
import {
  ArrowLeftIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  InformationCircleIcon,
  XCircleIcon,
} from '@heroicons/react/20/solid'
import Image from 'next/image'
import { formatNumericValue } from 'utils/numbers'
import { useRouter } from 'next/router'

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

const Learn: NextPage = () => {
  // const { t } = useTranslation('common')
  const router = useRouter()
  const { quiz } = router.query

  const goToQuiz = (quiz: string) => {
    const query = { ...router.query, ['quiz']: quiz }
    router.push({ pathname: router.pathname, query }, undefined, {
      shallow: true,
    })
  }

  const quizToShow = useMemo(() => {
    if (!quiz) return
    return quizzes.find((q) => q.slug === quiz)
  }, [quiz])

  return !quizToShow ? (
    <div
      className="mx-auto flex max-w-xl flex-col items-center justify-center py-12 text-center"
      style={{ minHeight: 'calc(100vh - 104px)' }}
    >
      <h1 className="mb-1">Learn to Earn</h1>
      <p className="text-base">Earn tokens for learning about Mango</p>
      <div className="w-full space-y-2 pt-6">
        {quizzes.map((quiz) => (
          <button
            className="flex w-full items-center justify-between rounded-xl bg-th-bkg-2 p-4 pl-6 text-left md:hover:bg-th-bkg-3"
            key={quiz.name}
            onClick={() => goToQuiz(quiz.slug)}
          >
            <div>
              <h3>{quiz.name}</h3>
              <p>{quiz.description}</p>
              <div className="mt-3 w-max rounded-full border border-th-fgd-4 px-3 py-1">
                <p className="text-xs">{quiz.questions.length} questions</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 pl-4">
              <div className="flex w-max items-center rounded-full bg-th-bkg-1 px-3 py-1">
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
              </div>
              <ChevronRightIcon className="h-6 w-6" />
            </div>
          </button>
        ))}
      </div>
    </div>
  ) : (
    <div className="mx-auto flex flex-col items-center pb-12 text-center">
      <Quiz quiz={quizToShow} />
    </div>
  )
}

export default Learn

type RESULT = {
  correctAnswers: number
  wrongAnswers: QuizQuestion[]
}

const DEFAULT_RESULT = {
  correctAnswers: 0,
  wrongAnswers: [],
}

const Quiz = ({ quiz }: { quiz: Quiz }) => {
  const router = useRouter()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answerIndex, setAnswerIndex] = useState<number | null>(null)
  const [isCorrectAnswer, setIsCorrectAnswer] = useState<boolean | null>(null)
  const [result, setResult] = useState<RESULT>(DEFAULT_RESULT)
  const [showIntro, setShowIntro] = useState(true)
  const [showResult, setShowResult] = useState(false)
  const { questions, intro } = quiz
  const { question, choices, description, correctAnswer } =
    questions[currentQuestion]

  const handleAnswer = (answer: string, index: number) => {
    setAnswerIndex(index)
    if (answer === correctAnswer) {
      setIsCorrectAnswer(true)
    } else {
      setIsCorrectAnswer(false)
    }
  }

  const handleNext = () => {
    setAnswerIndex(null)
    setResult((prev) =>
      isCorrectAnswer
        ? {
            ...prev,
            correctAnswers: prev.correctAnswers + 1,
          }
        : {
            ...prev,
            wrongAnswers: [...prev.wrongAnswers, questions[currentQuestion]],
          },
    )

    if (currentQuestion !== questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1)
    } else {
      setCurrentQuestion(0)
      setShowResult(true)
    }
  }

  const handleTryAgain = () => {
    setResult(DEFAULT_RESULT)
    setShowResult(false)
  }

  return (
    <>
      <div className="flex h-12 w-full items-center justify-between bg-th-bkg-2 px-4 md:px-6">
        <div className="flex items-center">
          <IconButton
            className="text-th-fgd-3"
            hideBg
            size="medium"
            onClick={() => router.push('/learn', undefined, { shallow: true })}
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </IconButton>
          <p className="text-th-fgd-2">{quiz.name} Quiz</p>
        </div>
        {showIntro || showResult ? null : (
          <div className="rounded-full bg-th-bkg-1 px-3 py-1 font-mono">
            <span>{currentQuestion + 1}</span>
            <span>/{quiz.questions.length}</span>
          </div>
        )}
      </div>
      <div className="flex h-0.5 w-full grow bg-th-bkg-1">
        <div
          style={{
            width:
              showIntro || showResult
                ? '0%'
                : `${(currentQuestion + 1 / quiz.questions.length) * 100}%`,
            opacity: showResult ? 0 : 100,
          }}
          className="flex bg-th-active transition-all duration-700 ease-out"
        />
      </div>
      <div className="mt-12 w-full max-w-xl rounded-xl bg-th-bkg-2 p-8">
        {showIntro ? (
          <>
            <h2 className="mb-2">{intro.title}</h2>
            <p className="text-base">{intro.description}</p>
            {intro?.docs ? (
              <a className="mt-2 block text-base" href={intro.docs.url}>
                {intro.docs.linkText}
              </a>
            ) : null}
            <Button className="mt-6" onClick={() => setShowIntro(false)}>
              Let&apos;s Go
            </Button>
          </>
        ) : !showResult ? (
          <>
            <h2 className="leading-tight">{question}</h2>
            {description ? <p className="mt-2"></p> : null}
            <div className="space-y-1 pt-6">
              {choices.map((choice, index) => (
                <button
                  className={`flex w-full items-center justify-between rounded-md bg-th-bkg-3 p-3 text-th-fgd-1 ${
                    answerIndex === index
                      ? 'border border-th-active'
                      : 'border border-transparent md:hover:bg-th-bkg-4'
                  }`}
                  key={choice}
                  onClick={() => handleAnswer(choice, index)}
                >
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                      answerIndex === index
                        ? 'bg-th-active text-th-bkg-1'
                        : 'bg-th-bkg-1 text-th-fgd-3'
                    }`}
                  >
                    <span className="font-bold">
                      {String.fromCharCode(97 + index).toUpperCase()}
                    </span>
                  </div>
                  <span>{choice}</span>
                  <div className="h-6 w-6" />
                </button>
              ))}
            </div>
            <div className="mt-8 flex justify-end">
              <Button disabled={answerIndex === null} onClick={handleNext}>
                {currentQuestion === questions.length - 1 ? 'Finish' : 'Next'}
              </Button>
            </div>
          </>
        ) : (
          <>
            <h2 className="mb-4">Results</h2>
            <div className="mb-6 border-b border-th-bkg-4">
              <div className="flex justify-between border-t border-th-bkg-4 p-4">
                <p>Score</p>
                <p className="font-mono text-th-fgd-1">
                  {(result.correctAnswers / questions.length) * 100}%
                </p>
              </div>
              <div className="flex justify-between border-t border-th-bkg-4 p-4">
                <p>Correct Answers</p>
                <p className="font-mono text-th-fgd-1">
                  {result.correctAnswers}
                </p>
              </div>
              {result.wrongAnswers?.length ? (
                <Disclosure>
                  {({ open }) => (
                    <>
                      <Disclosure.Button
                        className={`w-full border-t border-th-bkg-4 p-4 text-left focus:outline-none`}
                      >
                        <div className="flex items-center justify-between">
                          <p>Wrong Answers</p>
                          <div className="flex items-center space-x-2">
                            <p className="font-mono text-th-fgd-1">
                              {result.wrongAnswers.length}
                            </p>
                            <ChevronDownIcon
                              className={`${
                                open ? 'rotate-180' : 'rotate-0'
                              } h-6 w-6 shrink-0 text-th-fgd-3`}
                            />
                          </div>
                        </div>
                      </Disclosure.Button>
                      <Disclosure.Panel className="pb-2">
                        {result.wrongAnswers.map((answer) => (
                          <div className="mb-2" key={answer.id}>
                            <Disclosure>
                              {({ open }) => (
                                <>
                                  <div
                                    className={`flex items-center justify-between rounded-lg bg-th-bkg-1 p-4 text-left ${
                                      open ? 'rounded-b-none' : ''
                                    }`}
                                  >
                                    <div className="flex items-start">
                                      <XCircleIcon className="mr-1.5 mt-0.5 h-4 w-4 shrink-0 text-th-error" />
                                      <p className="font-bold text-th-fgd-1">
                                        {answer.question}
                                      </p>
                                    </div>
                                    <Disclosure.Button className="ml-4">
                                      <span className="whitespace-nowrap text-xs">
                                        {open ? 'Hide Answer' : 'Reveal Answer'}
                                      </span>
                                    </Disclosure.Button>
                                  </div>
                                  <Disclosure.Panel className="rounded-b-lg bg-th-bkg-1 p-4">
                                    {answer.explanation ? (
                                      <div className="mb-4 rounded-lg bg-th-up-muted p-4 text-left">
                                        <div className="flex items-start">
                                          <InformationCircleIcon className="mr-1 mt-0.5 h-4 w-4 shrink-0 text-th-fgd-1" />
                                          <p className="text-th-fgd-1">
                                            {answer.explanation}
                                          </p>
                                        </div>
                                      </div>
                                    ) : null}
                                    {answer.choices.map((choice, index) => (
                                      <div
                                        key={choice}
                                        className={`mb-2 flex w-full items-center justify-between rounded-md p-3 text-th-fgd-1 ${
                                          answer.correctAnswer === choice
                                            ? 'border border-th-success'
                                            : 'border border-th-bkg-4'
                                        }`}
                                      >
                                        <div
                                          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                                            answer.correctAnswer === choice
                                              ? 'bg-th-success text-th-bkg-1'
                                              : 'bg-th-bkg-2 text-th-fgd-3'
                                          }`}
                                        >
                                          <span className="font-bold">
                                            {String.fromCharCode(
                                              97 + index,
                                            ).toUpperCase()}
                                          </span>
                                        </div>
                                        <span>{choice}</span>
                                        <div className="h-6 w-6" />
                                      </div>
                                    ))}
                                  </Disclosure.Panel>
                                </>
                              )}
                            </Disclosure>
                          </div>
                        ))}
                      </Disclosure.Panel>
                    </>
                  )}
                </Disclosure>
              ) : (
                <div className="flex justify-between border-t border-th-bkg-4 p-4">
                  <p>Wrong Answers</p>
                  <p className="font-mono text-th-fgd-1">0</p>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-3">
              <Button onClick={handleTryAgain} secondary>
                Redo
              </Button>
              <Button
                onClick={() =>
                  router.push('/learn', undefined, { shallow: true })
                }
              >
                Exit
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
