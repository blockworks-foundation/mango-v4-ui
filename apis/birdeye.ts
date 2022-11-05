export const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
export const USDT_MINT = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'

export const fetchChartData = async (
  baseTokenMint: string,
  quoteTokenMint: string,
  daysToShow: number
) => {
  try {
    const timeTo = Math.trunc(Date.now() / 1000)
    const timeFrom = timeTo - daysToShow * 86400
    const apiKey: string = process.env.NEXT_PUBLIC_BIRDEYE_KEY as string
    const requestHeader = {
      'X-API-KEY': apiKey,
    }
    const interval = daysToShow === 1 ? '30m' : '4H'
    const [inputResponse, outputResponse] = await Promise.all([
      fetch(
        `https://public-api.birdeye.so/defi/history_price?address=${baseTokenMint}&address_type=token&type=${interval}&time_from=${timeFrom}&time_to=${timeTo}`,
        {
          headers: requestHeader,
        }
      ),
      fetch(
        `https://public-api.birdeye.so/defi/history_price?address=${quoteTokenMint}&address_type=token&type=${interval}&time_from=${timeFrom}&time_to=${timeTo}`,
        {
          headers: requestHeader,
        }
      ),
    ])

    const [inputData, outputData] = await Promise.all([
      inputResponse.json(),
      outputResponse.json(),
    ])

    let data: any[] = []
    if (Array.isArray(inputData.data.items)) {
      data = data.concat(inputData.data.items)
    }
    if (Array.isArray(outputData.data.items)) {
      data = data.concat(outputData.data.items)
    }

    const formattedData = data.reduce((a, c) => {
      const found = a.find((price: any) => price.time === c.unixTime)
      if (found) {
        if ([USDC_MINT, USDT_MINT].includes(quoteTokenMint)) {
          found.price = found.inputPrice / c.value
        } else {
          found.price = c.value / found.inputPrice
        }
      } else {
        a.push({ time: c.unixTime, inputPrice: c.value })
      }
      return a
    }, [])
    formattedData[formattedData.length - 1].time = Math.trunc(Date.now() / 1000)
    return formattedData.filter((d: any) => d.price)
  } catch {
    return []
  }
}
