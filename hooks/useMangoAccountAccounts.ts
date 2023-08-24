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
import useBanksWithBalances from './useBanksWithBalances'
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
  const { mangoAccountAddress, mangoAccount } = useMangoAccount()
  const banks = useBanksWithBalances()

  const [
    usedTokens,
    usedSerum3,
    usedPerps,
    usedPerpOo,
    emptyTokens,
    emptySerum3,
    emptyPerps,
    emptyPerpOo,
  ] = useMemo(() => {
    if (!mangoAccountAddress || !mangoAccount)
      return [[], [], [], [], [], [], [], []]

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

    // const emptyPerpOo = [] // No instruction for closing perp oo
    const emptyTokens = usedTokens.filter((t) => {
      const bank = banks.find((b) => b.bank.tokenIndex === t.tokenIndex)
      if (!bank) return false
      return t.inUseCount && bank.balance === 0 && bank.borrowedAmount === 0
    })

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
    const emptySerum3 = usedOpenOrders
      .filter(
        (o) =>
          o.baseTokenTotal.isZero() &&
          o.quoteTokenTotal.isZero() &&
          o.freeSlotBits.eq(maxFreeSlotBits),
      )
      .map((f) => f.market)

    return [
      usedTokens,
      usedSerum3,
      usedPerps,
      usedPerpOo,
      emptyTokens,
      emptySerum3,
      emptyPerps,
      [],
    ]
  }, [mangoAccountAddress, mangoAccount])

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
    }, [mangoAccountAddress, mangoAccount])

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
    emptyTokens,
    emptySerum3,
    emptyPerps,
    emptyPerpOo,
    totalTokens,
    totalSerum3,
    totalPerps,
    totalPerpOpenOrders,
    isAccountFull,
  }
}
