import { PerpMarket, Serum3Market } from '@blockworks-foundation/mango-v4'
import { getOneDayPerpStats } from '@components/stats/PerpMarketsOverviewTable'
import mangoStore from '@store/mangoStore'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { useMemo } from 'react'
import { DAILY_SECONDS, MANGO_DATA_API_URL } from 'utils/constants'

dayjs.extend(utc)

const fetchPrices = async (market: Serum3Market | PerpMarket | undefined) => {
  if (!market || market instanceof PerpMarket) return
  const { baseTokenIndex, quoteTokenIndex } = market
  const nowTimestamp = Date.now() / 1000
  const changePriceTimestamp = nowTimestamp - DAILY_SECONDS
  const changePriceTime = dayjs
    .unix(changePriceTimestamp)
    .utc()
    .format('YYYY-MM-DDTHH:mm:ss[Z]')
  const promises = [
    fetch(
      `${MANGO_DATA_API_URL}/stats/token-price?token-index=${baseTokenIndex}&price-time=${changePriceTime}`,
    ),
    fetch(
      `${MANGO_DATA_API_URL}/stats/token-price?token-index=${quoteTokenIndex}&price-time=${changePriceTime}`,
    ),
  ]
  try {
    const data = await Promise.all(promises)
    const baseTokenPriceData = await data[0].json()
    const quoteTokenPriceData = await data[1].json()
    const baseTokenPrice = baseTokenPriceData ? baseTokenPriceData.price : 1
    const quoteTokenPrice = quoteTokenPriceData ? quoteTokenPriceData.price : 1
    return { baseTokenPrice, quoteTokenPrice }
  } catch (e) {
    console.log('failed to fetch 24hr price data', e)
    return { baseTokenPrice: 1, quoteTokenPrice: 1 }
  }
}

export default function use24HourChange(
  market: Serum3Market | PerpMarket | undefined,
) {
  const perpStats = mangoStore((s) => s.perpStats.data)
  const loadingPerpStats = mangoStore((s) => s.perpStats.loading)
  const {
    data: priceData,
    isLoading: loadingPriceData,
    isFetching: fetchingPriceData,
  } = useQuery(['token-prices', market?.name], () => fetchPrices(market), {
    cacheTime: 1000 * 60 * 10,
    staleTime: 1000 * 60,
    retry: 3,
    refetchOnWindowFocus: false,
    enabled: market && market instanceof Serum3Market,
  })

  const [currentBasePrice, currentQuotePrice] = useMemo(() => {
    const group = mangoStore.getState().group
    if (!group || !market || market instanceof PerpMarket)
      return [undefined, undefined]
    const baseBank = group.getFirstBankByTokenIndex(market.baseTokenIndex)
    const quoteBank = group.getFirstBankByTokenIndex(market.quoteTokenIndex)
    return [baseBank?.uiPrice, quoteBank?.uiPrice]
  }, [market])

  const perpChange = useMemo(() => {
    if (
      !market ||
      market instanceof Serum3Market ||
      !perpStats ||
      !perpStats.length
    )
      return
    const oneDayStats = getOneDayPerpStats(perpStats, market.name)
    const currentPrice = market.uiPrice
    const change = oneDayStats.length
      ? ((currentPrice - oneDayStats[0].price) / oneDayStats[0].price) * 100
      : undefined
    return change
  }, [market, perpStats])

  const spotChange = useMemo(() => {
    if (!market) return
    if (!currentBasePrice || !currentQuotePrice || !priceData) return
    const currentPrice = currentBasePrice / currentQuotePrice
    const oneDayPrice = priceData.baseTokenPrice / priceData.quoteTokenPrice
    const change = ((currentPrice - oneDayPrice) / oneDayPrice) * 100
    return change
  }, [market, priceData])

  const loading = useMemo(() => {
    if (!market) return false
    if (market instanceof PerpMarket) return loadingPerpStats
    return loadingPriceData || fetchingPriceData
  }, [market, loadingPerpStats, loadingPriceData, fetchingPriceData])

  return { loading, perpChange, spotChange }
}
