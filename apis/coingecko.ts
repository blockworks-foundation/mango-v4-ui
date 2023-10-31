import { Bank } from '@blockworks-foundation/mango-v4'

type CoingeckoOhlcv = [
  time: number,
  open: number,
  high: number,
  low: number,
  close: number,
][]

export type SwapChartDataItem = {
  time: number
  price: number
  inputTokenPrice: number
  outputTokenPrice: number
}

export const fetchSwapChartData = async (
  baseTokenId: string | undefined,
  quoteTokenId: string | undefined,
  daysToShow: string,
  flipPrices: boolean,
): Promise<SwapChartDataItem[]> => {
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
      const parsedData: SwapChartDataItem[] = []
      for (const inputTokenCandle of inputTokenData) {
        const outputTokenCandle = outputTokenData.find(
          (outputTokenCandle) => outputTokenCandle[0] === inputTokenCandle[0],
        )
        const curentTimestamp = Date.now()
        if (outputTokenCandle && inputTokenCandle[0] < curentTimestamp) {
          parsedData.push({
            time: inputTokenCandle[0],
            price: outputTokenCandle[1] / inputTokenCandle[1],
            inputTokenPrice: inputTokenCandle[1],
            outputTokenPrice: outputTokenCandle[1],
          })
        }
      }
      return parsedData
    } else {
      return []
    }
  } catch {
    return []
  }
}
