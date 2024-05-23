import { Bank } from '@blockworks-foundation/mango-v4'
import TokenLogo from './TokenLogo'
import TokenReduceOnlyDesc from './TokenReduceOnlyDesc'
import { useVaultLimits } from '@components/swap/useVaultLimits'
import { Battery100Icon } from '@heroicons/react/20/solid'
import Tooltip from './Tooltip'
import { useTranslation } from 'react-i18next'
import { floorToDecimal } from 'utils/numbers'
import { LeverageBadge } from '@components/trade/MarketSelectDropdown'

const TableTokenName = ({
  bank,
  symbol,
  showLeverage,
  hideReduceDesc,
}: {
  bank: Bank
  symbol: string
  showLeverage?: boolean
  hideReduceDesc?: boolean
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
          {showLeverage && leverageMax < Infinity ? (
            <div className="ml-1.5">
              <Tooltip content={t('trade:max-leverage')}>
                <LeverageBadge leverage={leverageMax} />
              </Tooltip>
            </div>
          ) : null}
          {vaultFull ? (
            <Tooltip content={t('warning-deposits-full', { token: bank.name })}>
              <Battery100Icon className="ml-1.5 h-5 w-5 text-th-warning" />
            </Tooltip>
          ) : null}
        </div>
        {hideReduceDesc ? null : <TokenReduceOnlyDesc bank={bank} />}
      </div>
    </div>
  )
}

export default TableTokenName
