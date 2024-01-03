import mangoStore from '@store/mangoStore'
import { useMemo } from 'react'
import useMangoAccount from './useMangoAccount'
import {
  PerpOo,
  PerpPosition,
  Serum3Orders,
  TokenPosition,
} from '@blockworks-foundation/mango-v4'
import { MAX_ACCOUNTS } from 'utils/constants'
import { OpenOrders } from '@project-serum/serum'
import { BN } from '@coral-xyz/anchor'

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
  const { mangoAccount } = useMangoAccount()

  const [
    usedTokens,
    usedSerum3,
    usedPerps,
    usedPerpOo,
    emptySerum3,
    emptyPerps,
    usedTcs,
  ] = useMemo(() => {
    if (!mangoAccount) return [[], [], [], [], [], [], []]

    const { tokens, serum3, perps, perpOpenOrders, tokenConditionalSwaps } =
      mangoAccount
    const usedTokens: TokenPosition[] = tokens.filter(
      (t) => t.tokenIndex !== 65535,
    )
    const usedSerum3: Serum3Orders[] = serum3.filter(
      (s) => s.marketIndex !== 65535,
    )
    const usedPerps: PerpPosition[] = perps.filter(
      (p) => p.marketIndex !== 65535,
    )
    const usedPerpOo: PerpOo[] = perpOpenOrders.filter(
      (p) => p.orderMarket !== 65535,
    )
    const usedTcs = tokenConditionalSwaps.filter((tcs) => tcs.isConfigured)

    const emptyPerps = usedPerps.filter(
      (p) =>
        p.asksBaseLots.isZero() &&
        p.bidsBaseLots.isZero() &&
        p.takerBaseLots.isZero &&
        p.takerQuoteLots.isZero() &&
        p.basePositionLots.isZero() &&
        p.quotePositionNative.isZero(),
    )

    const usedOpenOrders = usedSerum3
      .map((s) => mangoAccount.serum3OosMapByMarketIndex.get(s.marketIndex))
      .filter((o) => o !== undefined) as OpenOrders[]
    const maxFreeSlotBits = new BN(2).pow(new BN(128)).sub(new BN(1)) // 2^128 - 1
    const emptySerum3Keys = usedOpenOrders
      .filter(
        (o) =>
          o.baseTokenTotal.isZero() &&
          o.quoteTokenTotal.isZero() &&
          o.freeSlotBits.eq(maxFreeSlotBits),
      )
      .map((f) => f.address)
    const emptySerum3 = usedSerum3.filter((s) =>
      emptySerum3Keys.includes(s.openOrders),
    )

    return [
      usedTokens,
      usedSerum3,
      usedPerps,
      usedPerpOo,
      emptySerum3,
      emptyPerps,
      usedTcs,
    ]
  }, [mangoAccount])

  const [totalTokens, totalSerum3, totalPerps, totalPerpOpenOrders] =
    useMemo(() => {
      if (!mangoAccount) return [[], [], [], []]
      const { tokens, serum3, perps, perpOpenOrders } = mangoAccount
      const totalTokens = tokens
      const totalSerum3 = serum3
      const totalPerps = perps
      const totalPerpOpenOrders = perpOpenOrders
      return [totalTokens, totalSerum3, totalPerps, totalPerpOpenOrders]
    }, [mangoAccount])

  const isAccountFull = useMemo(() => {
    if (!mangoAccount) return true
    return getIsAccountSizeFull()
  }, [mangoAccount])

  return {
    usedTokens,
    usedSerum3,
    usedPerps,
    usedPerpOo,
    usedTcs,
    emptySerum3,
    emptyPerps,
    totalTokens,
    totalSerum3,
    totalPerps,
    totalPerpOpenOrders,
    isAccountFull,
  }
}
