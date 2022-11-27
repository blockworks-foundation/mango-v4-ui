import { Bank } from '@blockworks-foundation/mango-v4'
import useMangoAccount from 'hooks/useMangoAccount'
import useMangoGroup from 'hooks/useMangoGroup'
import { useMemo } from 'react'
import { floorToDecimal } from 'utils/numbers'
import InlineNotification from './InlineNotification'

const TokenVaultWarnings = ({ bank }: { bank: Bank }) => {
  const { mangoAccount } = useMangoAccount()
  const { group } = useMangoGroup()

  const balance = useMemo(() => {
    if (!mangoAccount) return
    return mangoAccount.getTokenBalanceUi(bank)
  }, [bank, mangoAccount])

  const vaultBalance = useMemo(() => {
    if (!group) return
    return floorToDecimal(
      group.getTokenVaultBalanceByMintUi(bank.mint),
      bank.mintDecimals
    ).toNumber()
  }, [bank, group])

  return !vaultBalance ? (
    <InlineNotification
      type="warning"
      desc={`${bank.name} vault is too low or fully utilized`}
    />
  ) : mangoAccount && balance! > vaultBalance ? (
    <InlineNotification
      type="warning"
      desc={`Available ${bank.name} vault balance is lower than your balance`}
    />
  ) : null
}

export default TokenVaultWarnings
