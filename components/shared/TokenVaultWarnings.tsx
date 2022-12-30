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
    <div className="mb-4">
      <InlineNotification
        type="warning"
        desc={
          <div>
            The available {bank.name}{' '}
            <Link href="/stats" className="underline hover:no-underline">
              vault balance
            </Link>{' '}
            is low and impacting the maximum amount you can withdraw/borrow.
          </div>
        }
      />
    </div>
  ) : null
}

export default TokenVaultWarnings
