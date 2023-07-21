import { Bank } from '@blockworks-foundation/mango-v4'
import { walletBalanceForToken } from '@components/DepositForm'
import { getMaxWithdrawForBank } from '@components/swap/useTokenMax'
import mangoStore from '@store/mangoStore'
import { useMemo } from 'react'
import useMangoAccount from './useMangoAccount'
import useMangoGroup from './useMangoGroup'
import { floorToDecimal } from 'utils/numbers'

export interface BankWithBalance {
  balance: number
  bank: Bank
  borrowedAmount: number
  maxBorrow: number
  maxWithdraw: number
  walletBalance: number
}

export default function useBanksWithBalances(
  sortByKey?:
    | 'balance'
    | 'borrowedAmount'
    | 'maxBorrow'
    | 'maxWithdraw'
    | 'walletBalance',
) {
  const { group } = useMangoGroup()
  const { mangoAccount } = useMangoAccount()
  const walletTokens = mangoStore((s) => s.wallet.tokens)

  const banks: BankWithBalance[] = useMemo(() => {
    if (group) {
      const banksWithBalances = Array.from(
        group?.banksMapByName,
        ([key, value]) => ({
          key,
          value,
        }),
      ).map((b) => {
        const bank = b.value[0]
        const rawBalance = mangoAccount
          ? mangoAccount.getTokenBalanceUi(bank)
          : 0
        // For some reason if you don't use an abs value in floorToDecimal it returns incorrectly
        const isBorrowMultiplier = rawBalance < 0 ? -1 : 1
        const balance =
          floorToDecimal(Math.abs(rawBalance), bank.mintDecimals).toNumber() *
          isBorrowMultiplier

        const maxBorrow = mangoAccount
          ? getMaxWithdrawForBank(group, bank, mangoAccount, true).toNumber()
          : 0
        let maxWithdraw = mangoAccount
          ? getMaxWithdrawForBank(group, bank, mangoAccount).toNumber()
          : 0
        if (maxWithdraw < balance) {
          maxWithdraw = maxWithdraw * 0.998
        }
        const borrowedAmount = mangoAccount
          ? floorToDecimal(
              mangoAccount.getTokenBorrowsUi(bank),
              bank.mintDecimals,
            ).toNumber()
          : 0
        const walletBalance =
          walletBalanceForToken(walletTokens, bank.name)?.maxAmount || 0
        return {
          bank,
          balance,
          borrowedAmount,
          maxBorrow,
          maxWithdraw,
          walletBalance,
        }
      })

      const sortedBanks = banksWithBalances.sort((a, b) => {
        if (sortByKey) {
          const aPrice = a.bank.uiPrice
          const bPrice = b.bank.uiPrice
          const aValue = Math.abs(a[sortByKey]) * aPrice
          const bValue = Math.abs(b[sortByKey]) * bPrice
          if (aValue > bValue) return -1
          if (aValue < bValue) return 1
        }

        const aName = a.bank.name
        const bName = b.bank.name
        if (aName > bName) return 1
        if (aName < bName) return -1
        return 1
      })

      return sortedBanks
    }
    return []
  }, [group, mangoAccount])

  return banks
}
