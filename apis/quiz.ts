export const getCompletedQuizzes = async (wallet: string) => {
  try {
    const result = await fetch(
      `https://api.mngo.cloud/data/v4/user-data/all-completed-quizzes?wallet-pk=${wallet}`,
    )
    const solved = await result.json()
    return solved?.length
      ? (solved as {
          wallet_pk: string
          mango_account: string
          quiz_id: number
          points: number
        }[])
      : []
  } catch (e) {
    console.log(e)
    return []
  }
}
