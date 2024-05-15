import { Quiz as QuizType, QuizQuestion } from 'utils/quiz'
import { useState } from 'react'
import Button, { IconButton } from '@components/shared/Button'
import { useRouter } from 'next/router'
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  InformationCircleIcon,
  XCircleIcon,
} from '@heroicons/react/20/solid'
import { Disclosure } from '@headlessui/react'
import Image from 'next/image'
import { useWallet } from '@solana/wallet-adapter-react'
import useMangoAccount from 'hooks/useMangoAccount'
import { bs58 } from '@project-serum/anchor/dist/cjs/utils/bytes'
import { useQueryClient } from '@tanstack/react-query'
import { useCompletedQuizzes } from 'hooks/useQuiz'

type RESULT = {
  correctAnswers: number
  wrongAnswers: QuizQuestion[]
}

const DEFAULT_RESULT = {
  correctAnswers: 0,
  wrongAnswers: [],
}

const Quiz = ({ quiz }: { quiz: QuizType }) => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { connected, publicKey, signMessage } = useWallet()
  const { mangoAccountAddress } = useMangoAccount()
  const { data: solved } = useCompletedQuizzes(publicKey?.toBase58())
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

  const getResultsHeadingText = (score: number) => {
    if (!score) {
      return 'Whoops 😲'
    } else if (score < 50) {
      return 'Try Again'
    } else if (score < 100) {
      return 'Almost There...'
    } else return 'Congratulations 🎉'
  }

  const completeQuiz = async () => {
    const message = new TextEncoder().encode(mangoAccountAddress)
    const signature = await signMessage!(message)
    const rawResponse = await fetch(
      'https://api.mngo.cloud/data/v4/user-data/complete-quiz',
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_pk: publicKey?.toBase58(),
          quiz_id: quiz.id,
          mango_account: mangoAccountAddress,
          signature: bs58.encode(signature),
        }),
      },
    )
    await rawResponse.json()
    queryClient.invalidateQueries(['completed-quizzes', publicKey?.toBase58()])
    router.push('/learn', undefined, { shallow: true })
  }

  const canClaimPoints = connected && mangoAccountAddress

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
                : `${((currentQuestion + 1) / quiz.questions.length) * 100}%`,
            opacity: showResult ? 0 : 100,
          }}
          className="flex bg-th-active transition-all duration-700 ease-out"
        />
      </div>
      <div className="w-full px-4">
        <div className="mx-auto mt-12 w-full max-w-xl rounded-xl bg-th-bkg-2 p-8">
          {showIntro ? (
            <>
              {quiz.imagePath ? (
                <Image
                  className="mx-auto mb-3"
                  src={quiz.imagePath}
                  height={48}
                  width={48}
                  alt="Quiz Image"
                />
              ) : null}
              <h2 className="mb-2">{intro.title}</h2>
              <p className="text-base">{intro.description}</p>
              {intro?.docs ? (
                <a className="mt-2 block text-base" href={intro.docs.url}>
                  {intro.docs.linkText}
                </a>
              ) : null}
              <Button
                className="mt-6"
                onClick={() => setShowIntro(false)}
                size="large"
              >
                Let&apos;s Go
              </Button>
              <div className="mx-auto mt-6 w-max rounded-full border border-th-fgd-4 px-3 py-1">
                <p className="text-th-fgd-2">
                  {!connected
                    ? 'Connect wallet to earn rewards points'
                    : solved?.find((x) => x.quiz_id === quiz.id)
                    ? 'Rewards Points Claimed'
                    : mangoAccountAddress
                    ? `Score ${quiz.questions.length}/${quiz.questions.length} to earn rewards points`
                    : 'Create a Mango Account to earn rewards points'}
                </p>
              </div>
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
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
                        answerIndex === index
                          ? 'bg-th-active text-th-bkg-1'
                          : 'bg-th-bkg-1 text-th-fgd-3'
                      }`}
                    >
                      <span className="font-bold">
                        {String.fromCharCode(97 + index).toUpperCase()}
                      </span>
                    </div>
                    <span className="mx-6 text-base">{choice}</span>
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
              <h2 className="mb-4">
                {getResultsHeadingText(
                  (result.correctAnswers / questions.length) * 100,
                )}
              </h2>
              <p>You scored</p>
              <span className="font-display text-5xl text-th-fgd-1">
                {((result.correctAnswers / questions.length) * 100).toFixed()}%
              </span>
              {result.correctAnswers !== questions.length ? (
                <div className="mx-auto mt-2 w-max rounded-full border border-th-fgd-4 px-3 py-1">
                  <p className="text-th-fgd-2">
                    Try again to earn rewards points.
                  </p>
                </div>
              ) : null}
              <div className="my-6 border-b border-th-bkg-4">
                <div className="flex justify-between border-t border-th-bkg-4 p-4">
                  <div className="flex items-center">
                    <CheckCircleIcon className="mr-1 h-4 w-4 text-th-success" />
                    <p>Correct Answers</p>
                  </div>
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
                            <div className="flex items-center">
                              <XCircleIcon className="mr-1 h-4 w-4 text-th-error" />
                              <p>Wrong Answers</p>
                            </div>
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
                            <div className="mb-2" key={answer.question}>
                              <Disclosure>
                                {({ open }) => (
                                  <>
                                    <div
                                      className={`flex items-center justify-between rounded-lg bg-th-bkg-1 p-4 text-left ${
                                        open ? 'rounded-b-none' : ''
                                      }`}
                                    >
                                      <div className="flex items-start">
                                        <XCircleIcon className="mr-1 mt-0.5 h-4 w-4 shrink-0 text-th-error" />
                                        <p className="font-bold text-th-fgd-1">
                                          {answer.question}
                                        </p>
                                      </div>
                                      <Disclosure.Button className="ml-4">
                                        <span className="whitespace-nowrap text-xs">
                                          {open
                                            ? 'Hide Answer'
                                            : 'Reveal Answer'}
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
                                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
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
                                          <span className="mx-6">{choice}</span>
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
                    <div className="flex items-center">
                      <XCircleIcon className="mr-1 h-4 w-4 text-th-error" />
                      <p>Wrong Answers</p>
                    </div>
                    <p className="font-mono text-th-fgd-1">0</p>
                  </div>
                )}
              </div>
              <div className="flex justify-center space-x-3">
                {solved?.find((x) => x.quiz_id === quiz.id) ||
                !canClaimPoints ? (
                  <Button
                    onClick={() =>
                      router.push('/learn', undefined, { shallow: true })
                    }
                    size="large"
                  >
                    Exit
                  </Button>
                ) : result.correctAnswers === questions.length ? (
                  <Button onClick={completeQuiz} size="large">
                    Claim Rewards Points
                  </Button>
                ) : (
                  <>
                    <Button onClick={handleTryAgain} secondary size="large">
                      Try Again
                    </Button>
                    <Button
                      onClick={() =>
                        router.push('/learn', undefined, { shallow: true })
                      }
                      size="large"
                    >
                      Exit
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default Quiz
