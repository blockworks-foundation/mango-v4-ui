import { PublicKey } from '@solana/web3.js'

export const getQuizCompleted = async (
  mangoAccount: PublicKey,
  quizId: number,
) => {
  try {
    const result = await fetch(
      `https://api.mngo.cloud/data/v4/user-data/complete-quiz?mango-account=${mangoAccount.toBase58()}&quiz-id=${quizId}`,
    )
    const isSolved = await result.json()
    return isSolved
  } catch (e) {
    console.log(e)
    return false
  }
}
