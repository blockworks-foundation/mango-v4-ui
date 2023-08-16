import mangoStore from '@store/mangoStore'
import { useMemo } from 'react'
import useMangoAccount from './useMangoAccount'
import { MAX_ACCOUNTS } from '@components/modals/MangoAccountSizeModal'
import {
  PerpOo,
  PerpPosition,
  Serum3Orders,
  TokenPosition,
} from '@blockworks-foundation/mango-v4'

export const getAvaialableAccountsColor = (used: number, total: number) => {
  const remaining = total - used
  return remaining >= 4
    ? 'text-th-up'
    : remaining >= 2
    ? 'text-th-warning'
    : 'text-th-down'
}

const isAccountSlotFull = (slots: number, max: string) => {
  const numberMax = Number(max)
  return slots >= numberMax
}

const getIsAccountSizeFull = () => {
  const mangoAccount = mangoStore.getState().mangoAccount.current
  if (!mangoAccount) return true
  return (
    isAccountSlotFull(
      mangoAccount.tokens.length,
      MAX_ACCOUNTS.tokenAccounts!,
    ) &&
    isAccountSlotFull(
      mangoAccount.serum3.length,
      MAX_ACCOUNTS.spotOpenOrders!,
    ) &&
    isAccountSlotFull(mangoAccount.perps.length, MAX_ACCOUNTS.perpAccounts!) &&
    isAccountSlotFull(
      mangoAccount.perpOpenOrders.length,
      MAX_ACCOUNTS.perpOpenOrders!,
    )
  )
}

export default function useMangoAccountAccounts() {
  const { mangoAccountAddress } = useMangoAccount()

  const [usedTokens, usedSerum3, usedPerps, usedPerpOo] = useMemo(() => {
    const mangoAccount = mangoStore.getState().mangoAccount.current
    if (!mangoAccountAddress || !mangoAccount) return [[], [], [], []]
    const { tokens, serum3, perps, perpOpenOrders } = mangoAccount
    const usedTokens: TokenPosition[] = tokens.filter((t) => t.inUseCount)
    const usedSerum3: Serum3Orders[] = serum3.filter(
      (s) => s.marketIndex !== 65535,
    )
    const usedPerps: PerpPosition[] = perps.filter(
      (p) => p.marketIndex !== 65535,
    )
    const usedPerpOo: PerpOo[] = perpOpenOrders.filter(
      (p) => p.orderMarket !== 65535,
    )
    return [usedTokens, usedSerum3, usedPerps, usedPerpOo]
  }, [mangoAccountAddress])

  const [totalTokens, totalSerum3, totalPerps, totalPerpOpenOrders] =
    useMemo(() => {
      const mangoAccount = mangoStore.getState().mangoAccount.current
      if (!mangoAccountAddress || !mangoAccount) return [[], [], [], []]
      const { tokens, serum3, perps, perpOpenOrders } = mangoAccount
      const totalTokens = tokens
      const totalSerum3 = serum3
      const totalPerps = perps
      const totalPerpOpenOrders = perpOpenOrders
      return [totalTokens, totalSerum3, totalPerps, totalPerpOpenOrders]
    }, [mangoAccountAddress])

  //   const [availableTokens, availableSerum3, availablePerps, availablePerpOo] =
  //     useMemo(() => {
  //       const [usedTokens, usedSerum3, usedPerps, usedPerpOo] =
  //         getUsedMangoAccountAccounts(mangoAccountAddress)
  //       const [totalTokens, totalSerum3, totalPerps, totalPerpOpenOrders] =
  //         getTotalMangoAccountAccounts(mangoAccountAddress)
  //       return [
  //         `${usedTokens}/${totalTokens}`,
  //         `${usedSerum3}/${totalSerum3}`,
  //         `${usedPerps}/${totalPerps}`,
  //         `${usedPerpOo}/${totalPerpOpenOrders}`,
  //       ]
  //     }, [mangoAccountAddress])

  const isAccountFull = useMemo(() => {
    if (!mangoAccountAddress) return true
    return getIsAccountSizeFull()
  }, [mangoAccountAddress])

  return {
    usedTokens,
    usedSerum3,
    usedPerps,
    usedPerpOo,
    totalTokens,
    totalSerum3,
    totalPerps,
    totalPerpOpenOrders,
    isAccountFull,
  }
}
