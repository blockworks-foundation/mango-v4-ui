import { useQuery } from '@tanstack/react-query'
import { getQuizCompleted } from 'apis/quiz'

export const useQuizCompleted = (mangoAccount?: string, quizId?: number) => {
  return useQuery(
    ['quiz-completed', mangoAccount, quizId],
    () => getQuizCompleted(mangoAccount!, quizId!),
    {
      cacheTime: 1000 * 60 * 10,
      staleTime: 1000 * 60,
      retry: 3,
      refetchOnWindowFocus: false,
      enabled: !!mangoAccount && quizId !== undefined,
    },
  )
}
