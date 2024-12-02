import { useEffect, useState } from 'react'

const useCountdown = (targetDate: string | undefined) => {
  const [countDown, setCountDown] = useState<number[]>([0, 0, 0, 0])

  useEffect(() => {
    if (targetDate) {
      const countDownDate = new Date(targetDate).getTime()

      const interval = setInterval(() => {
        setCountDown(getReturnValues(countDownDate - new Date().getTime()))
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [targetDate])

  return countDown
}

const getReturnValues = (countDown: number) => {
  // calculate time left
  const days = Math.floor(countDown / (1000 * 60 * 60 * 24))
  const hours = Math.floor(
    (countDown % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
  )
  const minutes = Math.floor((countDown % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((countDown % (1000 * 60)) / 1000)

  return [days, hours, minutes, seconds]
}

export { useCountdown }
