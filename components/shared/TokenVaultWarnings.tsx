import { Bank } from '@blockworks-foundation/mango-v4'
import useMangoAccount from 'hooks/useMangoAccount'
import useMangoGroup from 'hooks/useMangoGroup'
import Link from 'next/link'
import { useMemo } from 'react'
import { floorToDecimal } from 'utils/numbers'
import InlineNotification from './InlineNotification'

const TokenVaultWarnings = ({ bank }: { bank: Bank }) => {
  const { mangoAccount } = useMangoAccount()
  const { group } = useMangoGroup()

  const balance = useMemo(() => {
    if (!mangoAccount || !group) return 0
    const maxBorrow = mangoAccount.getMaxWithdrawWithBorrowForTokenUi(
      group,
      bank.mint
    )
    console.log('xyx', maxBorrow / bank.minVaultToDepositsRatio)

    return maxBorrow
  }, [bank, mangoAccount, group])

  const vaultBalance = useMemo(() => {
    if (!group) return 0
    return floorToDecimal(
      group.getTokenVaultBalanceByMintUi(bank.mint),
      bank.mintDecimals
    ).toNumber()
  }, [bank, group])

  // return !vaultBalance ? (
  //   <InlineNotification
  //     type="warning"
  //     desc={`${bank.name} vault is too low or fully utilized`}
  //   />
  // ) : mangoAccount && balance! > vaultBalance ? (
  //   <InlineNotification
  //     type="warning"
  //     desc={`Available ${bank.name} vault balance is lower than your balance`}
  //   />
  // ) : null

  return mangoAccount &&
    balance / bank.minVaultToDepositsRatio > vaultBalance ? (
    <InlineNotification
      type="warning"
      desc={
        <div>
          The Mango {bank.name} vault balance is low which is impacting the
          maximum amount you may borrow. View the{' '}
          <Link href="/stats" className="underline hover:no-underline">
            Stats page
          </Link>{' '}
          to see vault balances.
        </div>
      }
    />
  ) : null
}

export default TokenVaultWarnings
