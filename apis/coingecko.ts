export const fetchChartData = async (
  baseTokenId: string,
  quoteTokenId: string,
  daysToShow: number
) => {
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
          found.price = found.inputPrice / c[4]
        } else {
          found.price = c[4] / found.inputPrice
        }
      } else {
        a.push({ time: c[0], inputPrice: c[4] })
      }
      return a
    }, [])
    formattedData[formattedData.length - 1].time = Date.now()
    return formattedData.filter((d: any) => d.price)
  } catch {
    return []
  }
}
