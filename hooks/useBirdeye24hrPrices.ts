import { Group, Serum3Market } from '@blockworks-foundation/mango-v4'
import mangoStore from '@store/mangoStore'
import { useQuery } from '@tanstack/react-query'
import { makeApiRequest } from 'apis/birdeye/helpers'
import useMangoGroup from './useMangoGroup'
import { DAILY_SECONDS } from 'utils/constants'

const fetchBirdeye24hrPrices = async (
  group: Group | undefined,
  spotMarkets: Serum3Market[],
) => {
  if (!group) return []

  try {
    const queryEnd = Math.floor(Date.now() / 1000)
    const queryStart = queryEnd - DAILY_SECONDS

    // collect unique quote tokens
    const uniqueQuoteTokens = Array.from(
      new Set(
        spotMarkets.map((market) => {
          const quoteBank = group.getFirstBankByTokenIndex(
            market.quoteTokenIndex,
          )
          return quoteBank?.mint
        }),
      ),
    ).filter(Boolean) // remove any undefined values

    // fetch responses for unique quote tokens
    const quoteResponses = await Promise.all(
      uniqueQuoteTokens.map(async (quoteToken) => {
        const quoteQuery = `defi/history_price?address=${quoteToken}&address_type=token&type=1H&time_from=${queryStart}&time_to=${queryEnd}`
        const quoteResponse = await makeApiRequest(quoteQuery)
        return {
          quoteToken,
          items: quoteResponse?.data?.items?.length
            ? quoteResponse.data.items
            : [],
        }
      }),
    )

    // create a map for quick access to quote items based on quoteToken
    const quoteItemsMap = new Map(
      quoteResponses.map((response) => [response.quoteToken, response.items]),
    )

    // fetch base responses and match them with quote items
    const promises = spotMarkets.map(async (market) => {
      const baseBank = group.getFirstBankByTokenIndex(market.baseTokenIndex)
      const quoteBank = group.getFirstBankByTokenIndex(market.quoteTokenIndex)

      const baseQuery = `defi/history_price?address=${baseBank?.mint}&address_type=token&type=1H&time_from=${queryStart}&time_to=${queryEnd}`

      const baseResponse = await makeApiRequest(baseQuery)

      return {
        base: baseResponse?.data?.items?.length ? baseResponse.data.items : [],
        quote: quoteItemsMap.get(quoteBank?.mint) || [],
        marketIndex: market.marketIndex,
      }
    })

    const responses = await Promise.all(promises)

    return responses
  } catch (e) {
    console.error('error fetching 24-hour price data from birdeye', e)
    return []
  }
}

export const useBirdeye24hrPrices = () => {
  const spotMarkets = mangoStore((s) => s.serumMarkets)
  const { group } = useMangoGroup()
  return useQuery(
    ['birdeye-daily-prices'],
    () => fetchBirdeye24hrPrices(group, spotMarkets),
    {
      cacheTime: 1000 * 60 * 15,
      staleTime: 1000 * 60 * 10,
      retry: 3,
      enabled: !!(group && spotMarkets?.length),
      refetchOnWindowFocus: false,
    },
  )
}
