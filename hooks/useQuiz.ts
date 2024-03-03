import { useQuery } from '@tanstack/react-query'
import { getCompletedQuizzes } from 'apis/quiz'

export const useQuizCompleted = (wallet?: string) => {
  return useQuery(
    ['quiz-completed', wallet],
    () => getCompletedQuizzes(wallet!),
    {
      cacheTime: 1000 * 60 * 10,
      staleTime: 1000 * 60,
      retry: 3,
      refetchOnWindowFocus: false,
      enabled: !!wallet,
    },
  )
}
