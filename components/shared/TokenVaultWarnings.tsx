import { Bank } from '@blockworks-foundation/mango-v4'
import {
  getMaxBorrowForBank,
  getMaxWithdrawForBank,
  useTokenMax,
} from '@components/swap/useTokenMax'
import useMangoAccount from 'hooks/useMangoAccount'
import useMangoGroup from 'hooks/useMangoGroup'
import Link from 'next/link'
import { useMemo } from 'react'
import InlineNotification from './InlineNotification'

const TokenVaultWarnings = ({
  bank,
  type,
}: {
  bank: Bank
  type: 'borrow' | 'swap' | 'withdraw'
}) => {
  const { mangoAccount } = useMangoAccount()
  const { group } = useMangoGroup()

  const { amountWithBorrow: swapBorrowMax } = useTokenMax()

  const [maxWithdraw, maxBorrow] = useMemo(() => {
    if (!mangoAccount || !group) return [0, 0]
    const maxWithdraw = getMaxWithdrawForBank(
      group,
      bank,
      mangoAccount,
    ).toNumber()
    const maxBorrow = getMaxBorrowForBank(group, bank, mangoAccount).toNumber()

    return [maxWithdraw, maxBorrow]
  }, [bank, mangoAccount, group])

  const [availableVaultBalance, vaultBalance] = useMemo(() => {
    if (!bank || !group) return [0, 0]
    const vaultBalance = group.getTokenVaultBalanceByMintUi(bank.mint)
    const vaultDeposits = bank.uiDeposits()
    const available =
      vaultBalance - vaultDeposits * bank.minVaultToDepositsRatio
    return [available, vaultBalance]
  }, [bank, group])

  const showWarning = useMemo(() => {
    if (!bank || !group) return false
    if (
      (type === 'borrow' && maxBorrow > availableVaultBalance) ||
      (type === 'swap' && swapBorrowMax.toNumber() > vaultBalance) ||
      (type === 'withdraw' && maxWithdraw > availableVaultBalance)
    ) {
      return true
    }
    return false
  }, [bank, group, type])

  return showWarning ? (
    <div className="mb-4">
      <InlineNotification
        type="warning"
        desc={
          <div>
            The available {bank.name}{' '}
            <Link href="/stats" className="underline hover:no-underline">
              vault balance
            </Link>{' '}
            is low and impacting the maximum amount you can <span>{type}</span>
          </div>
        }
      />
    </div>
  ) : null
}

export default TokenVaultWarnings
