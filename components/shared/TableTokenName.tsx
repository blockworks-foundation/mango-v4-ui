import { Bank } from 'mango-v4-test-pack'
import TokenLogo from './TokenLogo'
import TokenReduceOnlyDesc from './TokenReduceOnlyDesc'
import { useVaultLimits } from '@components/swap/useVaultLimits'

const TableTokenName = ({ bank, symbol }: { bank: Bank; symbol: string }) => {
  const { vaultFull } = useVaultLimits(bank)
  return (
    <div className="flex items-center">
      <div className="mr-2.5 flex shrink-0 items-center">
        <TokenLogo bank={bank} showRewardsLogo />
      </div>
      <div>
        <p className="font-body leading-none text-th-fgd-2">
          {symbol} {vaultFull && <span className="text-th-error">!!</span>}
        </p>

        <TokenReduceOnlyDesc bank={bank} />
      </div>
    </div>
  )
}

export default TableTokenName
