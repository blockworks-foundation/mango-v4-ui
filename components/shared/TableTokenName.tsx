import { Bank } from '@blockworks-foundation/mango-v4'
import TokenLogo from './TokenLogo'
import TokenReduceOnlyDesc from './TokenReduceOnlyDesc'
import { useVaultLimits } from '@components/swap/useVaultLimits'
import { ExclamationTriangleIcon } from '@heroicons/react/20/solid'
import Tooltip from './Tooltip'
import { useTranslation } from 'react-i18next'

const TableTokenName = ({ bank, symbol }: { bank: Bank; symbol: string }) => {
  const { t } = useTranslation('common')
  const { vaultFull } = useVaultLimits(bank)
  return (
    <div className="flex items-center">
      <div className="mr-2.5 flex shrink-0 items-center">
        <TokenLogo bank={bank} showRewardsLogo />
      </div>
      <Tooltip
        content={
          vaultFull ? t('warning-deposits-full', { token: bank.name }) : ''
        }
      >
        <div className="flex items-center">
          <p className="font-body leading-none text-th-fgd-2">{symbol}</p>
          {vaultFull ? (
            <ExclamationTriangleIcon className="ml-1 h-4 w-4 text-th-warning" />
          ) : null}
        </div>
        <TokenReduceOnlyDesc bank={bank} />
      </Tooltip>
    </div>
  )
}

export default TableTokenName
