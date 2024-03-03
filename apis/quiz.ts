export const getQuizCompleted = async (
  mangoAccount: string,
  quizId: number,
) => {
  try {
    const result = await fetch(
      `https://api.mngo.cloud/data/v4/user-data/complete-quiz?mango-account=${mangoAccount}&quiz-id=${quizId}`,
    )
    const isSolved = await result.json()
    return isSolved
  } catch (e) {
    console.log(e)
    return false
  }
}
