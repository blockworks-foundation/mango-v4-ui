import {
  HealthType,
  MangoAccount,
  toUiDecimalsForQuote,
} from '@blockworks-foundation/mango-v4'
import { PublicKey } from '@solana/web3.js'
import mangoStore from '@store/mangoStore'
import { useMemo } from 'react'
import useMangoGroup from './useMangoGroup'
import transactionStore from '@store/transactionStore'

export default function useMangoAccount(): {
  mangoAccount: MangoAccount | undefined
  initialLoad: boolean
  mangoAccountPk: PublicKey | undefined
  mangoAccountAddress: string
  lastSlot: number
  accountValue: number
  accountPnl: number
  freeCollateral: number
  health: number
} {
  const { group } = useMangoGroup()
  const mangoAccount = mangoStore((s) => s.mangoAccount.current)
  const lastSlot = mangoStore((s) => s.mangoAccount.lastSlot)
  const initialLoad = mangoStore((s) => s.mangoAccount.initialLoad)
  const pendingDeposits = [
    ...transactionStore((s) => s.transactions).values(),
  ].filter((x) => x.type === 'deposit')

  const totalPendingDepositValues = pendingDeposits
    .map((x) => x.data)
    .reduce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (accumulator: number, currentValue: any) =>
        accumulator + currentValue.bank.uiPrice * currentValue.amount,
      0,
    )

  const mangoAccountPk = useMemo(() => {
    return mangoAccount?.publicKey
  }, [mangoAccount?.publicKey])

  const mangoAccountAddress = useMemo(() => {
    return mangoAccountPk?.toString() || ''
  }, [mangoAccountPk])

  const [accountPnl, accountValue, freeCollateral, health] = useMemo(() => {
    if (!group || !mangoAccount) return [0, 0, 0, 0]
    const accountPnl = toUiDecimalsForQuote(
      mangoAccount.getPnl(group).toNumber(),
    )
    const accountValue =
      toUiDecimalsForQuote(mangoAccount.getEquity(group).toNumber()) +
      totalPendingDepositValues
    const freeCollateral =
      toUiDecimalsForQuote(mangoAccount.getCollateralValue(group).toNumber()) +
      totalPendingDepositValues
    const health = mangoAccount.getHealthRatioUi(group, HealthType.maint)
    return [accountPnl, accountValue, freeCollateral, health]
  }, [group, mangoAccount, totalPendingDepositValues])

  return {
    mangoAccount,
    lastSlot,
    initialLoad,
    mangoAccountAddress,
    mangoAccountPk,
    accountValue,
    accountPnl,
    freeCollateral,
    health,
  }
}
