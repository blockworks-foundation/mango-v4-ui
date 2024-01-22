import { Bank } from '@blockworks-foundation/mango-v4'
import { InformationCircleIcon } from '@heroicons/react/20/solid'
import { useMemo } from 'react'
import Tooltip from './Tooltip'
import { useTranslation } from 'react-i18next'
import { floorToDecimal } from 'utils/numbers'

const CollateralWeightDisplay = ({ bank }: { bank: Bank }) => {
  const { t } = useTranslation('common')
  const [scaled, init, isScaled] = useMemo(() => {
    if (!bank) return [0, 0, false]
    const scaled = floorToDecimal(
      bank.scaledInitAssetWeight(bank.price).toNumber(),
      2,
    ).toNumber()
    const init = floorToDecimal(bank.initAssetWeight.toNumber(), 2).toNumber()
    const isScaled = scaled < init
    return [scaled, init, isScaled]
  }, [bank])
  return (
    <Tooltip
      content={
        isScaled
          ? t('tooltip-scaled-collateral-weight', {
              token: bank?.name,
              init: init.toFixed(2),
            })
          : ''
      }
    >
      <div className={`flex items-center ${isScaled ? 'cursor-help' : ''}`}>
        <span>{scaled.toFixed(2)}x</span>
        {isScaled ? (
          <InformationCircleIcon className="ml-1 h-4 w-4 text-th-fgd-4" />
        ) : null}
      </div>
    </Tooltip>
  )
}

export default CollateralWeightDisplay
