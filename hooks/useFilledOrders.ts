import { PerpOrder } from '@blockworks-foundation/mango-v4'
import mangoStore from '@store/mangoStore'
import { useQuery } from '@tanstack/react-query'
import { fetchFilledOrders } from 'utils/account'
import useMangoAccount from './useMangoAccount'
import { useMemo } from 'react'

export default function useFilledOrders() {
  const { mangoAccount, mangoAccountAddress } = useMangoAccount()
  const openOrders = mangoStore((s) => s.mangoAccount.openOrders)

  const orderIds = useMemo(() => {
    if (!mangoAccount || !Object.values(openOrders).flat().length) return []
    const perpIds = mangoAccount.perpOpenOrders
      .filter((o) => o.orderMarket !== 65535)
      .map((p) => p.clientId.toString())
    const spotIds = Object.values(openOrders)
      .flat()
      .filter((o) => !(o instanceof PerpOrder))
      .map((s) => s.orderId.toString())
    const ids = spotIds.concat(perpIds)
    return ids
  }, [mangoAccount, openOrders])

  const {
    data: filledOrders,
    isFetching: fetchingFilledOrders,
    refetch,
  } = useQuery(
    ['filled-orders', mangoAccountAddress, orderIds],
    () => fetchFilledOrders(mangoAccountAddress, orderIds),
    {
      cacheTime: 1000 * 60 * 10,
      staleTime: 30,
      retry: 3,
      refetchOnWindowFocus: false,
      enabled: !!mangoAccountAddress && !!orderIds.length,
    },
  )

  return {
    filledOrders,
    fetchingFilledOrders,
    refetch,
  }
}
