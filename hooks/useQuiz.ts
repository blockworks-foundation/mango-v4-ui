import { useQuery } from '@tanstack/react-query'
import { getCompletedQuizzes } from 'apis/quiz'

export const useCompletedQuizzes = (wallet?: string) => {
  return useQuery(
    ['completed-quizzes', wallet],
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
