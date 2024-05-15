import { Bank } from '@blockworks-foundation/mango-v4'
import TokenLogo from './TokenLogo'
import TokenReduceOnlyDesc from './TokenReduceOnlyDesc'
import { useVaultLimits } from '@components/swap/useVaultLimits'
import { ExclamationTriangleIcon } from '@heroicons/react/20/solid'
import Tooltip from './Tooltip'
import { useTranslation } from 'react-i18next'
import { floorToDecimal } from 'utils/numbers'
import { LeverageBadge } from '@components/trade/MarketSelectDropdown'

const TableTokenName = ({
  bank,
  symbol,
  showLeverage,
}: {
  bank: Bank
  symbol: string
  showLeverage?: boolean
}) => {
  const { t } = useTranslation(['common', 'trade'])
  const { vaultFull } = useVaultLimits(bank)
  const weight = bank.scaledInitAssetWeight(bank.price)
  const leverageFactor = 1 / (1 - weight.toNumber())

  const leverageMax = floorToDecimal(leverageFactor, 1).toNumber()
  return (
    <div className="flex items-center">
      <div className="mr-2.5 flex shrink-0 items-center">
        <TokenLogo bank={bank} showRewardsLogo />
      </div>
      <div>
        <div className="flex items-center">
          <p className="font-body leading-none text-th-fgd-2">{symbol}</p>
          {showLeverage && leverageMax > 1 && leverageMax < Infinity ? (
            <div className="ml-1">
              <Tooltip content={t('trade:max-leverage')}>
                <LeverageBadge leverage={leverageMax} />
              </Tooltip>
            </div>
          ) : null}
          {vaultFull ? (
            <Tooltip content={t('warning-deposits-full', { token: bank.name })}>
              <ExclamationTriangleIcon className="ml-1 h-4 w-4 text-th-warning" />
            </Tooltip>
          ) : null}
        </div>
        <TokenReduceOnlyDesc bank={bank} />
      </div>
    </div>
  )
}

export default TableTokenName
