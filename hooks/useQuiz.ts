import { PublicKey } from '@metaplex-foundation/js'
import { useQuery } from '@tanstack/react-query'
import { getQuizCompleted } from 'apis/quiz'

export const useQuizCompleted = (mangoAccount?: PublicKey, quizId?: number) => {
  return useQuery(
    ['quiz-completed', mangoAccount?.toBase58(), quizId],
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
