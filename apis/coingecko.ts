import { Bank } from '@blockworks-foundation/mango-v4'

type CoingeckoOhlcv = [
  time: number,
  open: number,
  high: number,
  low: number,
  close: number,
][]

export type ChartDataItem = {
  time: number
  price: number
  inputTokenPrice: number
  outputTokenPrice: number
}

export const fetchChartData = async (
  baseTokenId: string | undefined,
  inputBank: Bank | undefined,
  quoteTokenId: string | undefined,
  outputBank: Bank | undefined,
  daysToShow: string,
  flipPrices: boolean,
): Promise<ChartDataItem[]> => {
  if (!baseTokenId || !quoteTokenId) return []
  const baseId = flipPrices ? baseTokenId : quoteTokenId
  const quoteId = flipPrices ? quoteTokenId : baseTokenId
  try {
    const [inputResponse, outputResponse] = await Promise.all([
      fetch(
        `https://api.coingecko.com/api/v3/coins/${baseId}/ohlc?vs_currency=usd&days=${daysToShow}`,
      ),
      fetch(
        `https://api.coingecko.com/api/v3/coins/${quoteId}/ohlc?vs_currency=usd&days=${daysToShow}`,
      ),
    ])

    const [inputTokenData, outputTokenData]: [CoingeckoOhlcv, CoingeckoOhlcv] =
      await Promise.all([inputResponse.json(), outputResponse.json()])

    if (Array.isArray(inputTokenData) && Array.isArray(outputTokenData)) {
      const parsedData: ChartDataItem[] = []
      for (const inputTokenCandle of inputTokenData) {
        const outputTokenCandle = outputTokenData.find(
          (outputTokenCandle) => outputTokenCandle[0] === inputTokenCandle[0],
        )
        if (outputTokenCandle) {
          parsedData.push({
            time: inputTokenCandle[0],
            price: outputTokenCandle[4] / inputTokenCandle[4],
            inputTokenPrice: inputTokenCandle[4],
            outputTokenPrice: outputTokenCandle[4],
          })
        }
      }
      if (inputBank && outputBank) {
        const latestPrice = flipPrices
          ? outputBank.uiPrice / inputBank.uiPrice
          : inputBank.uiPrice / outputBank.uiPrice
        const item: ChartDataItem[] = [
          {
            price: latestPrice,
            time: Date.now(),
            inputTokenPrice: inputBank.uiPrice,
            outputTokenPrice: outputBank.uiPrice,
          },
        ]
        return parsedData.concat(item)
      } else return parsedData
    } else {
      return []
    }
  } catch {
    return []
  }
}
