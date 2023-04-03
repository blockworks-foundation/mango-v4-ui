import { useInfiniteQuery } from '@tanstack/react-query'
import {
  EmptyObject,
  PerpTradeHistory,
  SpotTradeHistory,
  TradeHistoryApiResponseType,
} from 'types'
import { MANGO_DATA_API_URL, PAGINATION_PAGE_LENGTH } from 'utils/constants'
import useMangoAccount from './useMangoAccount'

const isTradeHistory = (
  response: null | EmptyObject | TradeHistoryApiResponseType[]
): response is TradeHistoryApiResponseType[] => {
  if (
    response &&
    Array.isArray(response) &&
    'activity_details' in response[0]
  ) {
    return true
  }
  return false
}

const fetchTradeHistory = async (
  mangoAccountAddress: string,
  offset = 0
): Promise<Array<PerpTradeHistory | SpotTradeHistory>> => {
  const response = await fetch(
    `${MANGO_DATA_API_URL}/stats/trade-history?mango-account=${mangoAccountAddress}&limit=${PAGINATION_PAGE_LENGTH}&offset=${offset}`
  )
  const jsonResponse: null | EmptyObject | TradeHistoryApiResponseType[] =
    await response.json()

  let data
  if (isTradeHistory(jsonResponse)) {
    data = jsonResponse.map((h) => h.activity_details)
  }

  return data ?? []
}

export default function useTradeHistory() {
  const { mangoAccountAddress } = useMangoAccount()

  const response = useInfiniteQuery(
    ['trade-history', mangoAccountAddress],
    ({ pageParam }) => fetchTradeHistory(mangoAccountAddress, pageParam),
    {
      cacheTime: 1000 * 60 * 10,
      staleTime: 1000 * 60,
      retry: 3,
      enabled: !!mangoAccountAddress,
      keepPreviousData: true,
      refetchInterval: 1000 * 60 * 5,
      getNextPageParam: (_lastPage, pages) =>
        pages.length * PAGINATION_PAGE_LENGTH,
    }
  )

  return { ...response, data: response.data }
}
