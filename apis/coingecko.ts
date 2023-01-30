export const fetchChartData = async (
  baseTokenId: string | undefined,
  quoteTokenId: string | undefined,
  daysToShow: string
) => {
  if (!baseTokenId || !quoteTokenId) return
  try {
    const [inputResponse, outputResponse] = await Promise.all([
      fetch(
        `https://api.coingecko.com/api/v3/coins/${baseTokenId}/ohlc?vs_currency=usd&days=${daysToShow}`
      ),
      fetch(
        `https://api.coingecko.com/api/v3/coins/${quoteTokenId}/ohlc?vs_currency=usd&days=${daysToShow}`
      ),
    ])

    const [inputData, outputData] = await Promise.all([
      inputResponse.json(),
      outputResponse.json(),
    ])

    let data: any[] = []
    if (Array.isArray(inputData)) {
      data = data.concat(inputData)
    }
    if (Array.isArray(outputData)) {
      data = data.concat(outputData)
    }

    const formattedData = data.reduce((a, c) => {
      const found = a.find((price: any) => price.time === c[0])
      if (found) {
        if (['usd-coin', 'tether'].includes(quoteTokenId)) {
          found.price = found.p1 / c[4]
          found.p2 = c[4]
        } else {
          found.price = c[4] / found.p1
          found.p2 = c[4]
        }
      } else {
        a.push({ time: c[0], p1: c[4] })
      }
      return a
    }, [])
    formattedData[formattedData.length - 1].time = Date.now()
    return formattedData.filter((d: any) => d.price)
  } catch {
    return []
  }
}
