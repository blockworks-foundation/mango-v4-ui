import { PerpOrder } from '@blockworks-foundation/mango-v4'
import mangoStore from '@store/mangoStore'
import { useQuery } from '@tanstack/react-query'
import { fetchFilledOrders } from 'utils/account'
import useMangoAccount from './useMangoAccount'

export default function useFilledOrders() {
  const { mangoAccount, mangoAccountAddress } = useMangoAccount()
  const openOrders = mangoStore((s) => s.mangoAccount.openOrders)
  if (!mangoAccount) {
    return {
      filledOrders: undefined,
      isFetching: false,
    }
  }

  const perpIds = mangoAccount.perpOpenOrders
    .filter((o) => o.orderMarket !== 65535)
    .map((p) => p.clientId.toString())
  const spotIds = Object.values(openOrders)
    .flat()
    .filter((o) => !(o instanceof PerpOrder))
    .map((s) => s.orderId.toString())
  const orderIds = spotIds.concat(perpIds)
  if (orderIds.length === 0) {
    return {
      filledOrders: undefined,
      isFetching: false,
    }
  }

  const {
    data: filledOrders,
    isFetching: fetchingFilledOrders,
    refetch,
  } = useQuery(
    ['filled-orders', mangoAccountAddress],
    () => fetchFilledOrders(mangoAccountAddress, orderIds),
    {
      cacheTime: 1000 * 60 * 10,
      staleTime: 30,
      retry: 3,
      refetchOnWindowFocus: false,
      enabled: !!mangoAccountAddress,
    },
  )

  return {
    filledOrders,
    fetchingFilledOrders,
    refetch,
  }
}
