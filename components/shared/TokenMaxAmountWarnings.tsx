import { Bank } from 'mango-v4-test-pack'
import InlineNotification from './InlineNotification'
import { useVaultLimits } from '@components/swap/useVaultLimits'

const TokenMaxAmountWarnings = ({
  bank,
  limitNearlyReached,
}: {
  bank: Bank | undefined
  limitNearlyReached?: boolean
}) => {
  const { vaultFull } = useVaultLimits(bank)
  return limitNearlyReached ? (
    <div className="py-4">
      <InlineNotification
        type="warning"
        desc={`Deposit limits nearly reached, affecting max amount`}
      />
    </div>
  ) : vaultFull ? (
    <div className="py-4">
      <InlineNotification type="error" desc={`Vault full`} />
    </div>
  ) : null
}

export default TokenMaxAmountWarnings
