import { EXPLORERS } from '@components/settings/PreferredExplorerSettings'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import Tooltip from '@components/shared/Tooltip'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import { SpotTradeActivity } from 'types'
import { PREFERRED_EXPLORER_KEY } from 'utils/constants'
import { getDecimalCount } from 'utils/numbers'
import { formatFee } from './ActivityFeedTable'
import SideBadge from '@components/shared/SideBadge'
import Decimal from 'decimal.js'

const SpotTradeActivityDetails = ({
  activity,
}: {
  activity: SpotTradeActivity
}) => {
  const { t } = useTranslation(['common', 'activity', 'settings', 'trade'])
  const [preferredExplorer] = useLocalStorageState(
    PREFERRED_EXPLORER_KEY,
    EXPLORERS[0],
  )
  const {
    base_symbol,
    fee_cost,
    maker,
    price,
    quote_symbol,
    side,
    signature,
    size,
  } = activity.activity_details

  const sizeDecimal = new Decimal(size)
  const notional = sizeDecimal.mul(new Decimal(price))
  const totalPrice = notional.plus(new Decimal(fee_cost)).div(sizeDecimal)

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <div className="col-span-1">
        <p className="mb-0.5 font-body text-sm text-th-fgd-3">{t('market')}</p>
        <p className="font-body text-th-fgd-1">{`${base_symbol}/${quote_symbol}`}</p>
      </div>
      <div className="col-span-1">
        <p className="mb-0.5 font-body text-sm text-th-fgd-3">
          {t('trade:side')}
        </p>
        <SideBadge side={side} />
      </div>
      <div className="col-span-1">
        <p className="mb-0.5 font-body text-sm text-th-fgd-3">
          {t('trade:size')}
        </p>
        <p className="font-mono text-th-fgd-1">
          {size} <span className="font-body text-th-fgd-3">{base_symbol}</span>
        </p>
      </div>
      <div className="col-span-1">
        <p className="mb-0.5 font-body text-sm text-th-fgd-3">
          {t('activity:execution-price')}
        </p>
        <p className="font-mono text-th-fgd-1">
          <FormatNumericValue value={price} />{' '}
          <span className="font-body text-th-fgd-3">{quote_symbol}</span>
        </p>
      </div>
      <div className="col-span-1">
        <p className="mb-0.5 font-body text-sm text-th-fgd-3">{t('value')}</p>
        <p className="font-mono text-th-fgd-1">
          <FormatNumericValue value={notional} isUsd />
        </p>
      </div>
      <div className="col-span-1">
        <p className="mb-0.5 font-body text-sm text-th-fgd-3">{t('fee')}</p>
        <p className="font-mono text-th-fgd-1">
          {formatFee(fee_cost)}{' '}
          <span className="font-body text-th-fgd-3">{quote_symbol}</span>
        </p>
        <p className="font-body text-xs text-th-fgd-3">
          {maker ? t('trade:maker') : t('trade:taker')}
        </p>
      </div>
      <div className="col-span-1">
        <Tooltip content={t('activity:net-price-desc')} placement="top-start">
          <p className="tooltip-underline mb-0.5 font-body text-sm text-th-fgd-3">
            {t('activity:net-price')}
          </p>
        </Tooltip>
        <p className="font-mono text-th-fgd-1">
          <FormatNumericValue
            value={totalPrice}
            decimals={Math.max(getDecimalCount(price), 3)}
          />{' '}
          <span className="font-body text-th-fgd-3">{quote_symbol}</span>
        </p>
      </div>
      <div className="col-span-1">
        <p className="mb-0.5 font-body text-sm text-th-fgd-3">
          {t('transaction')}
        </p>
        <a
          className="flex items-center"
          href={`${preferredExplorer.url}${signature}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            alt=""
            width="20"
            height="20"
            src={`/explorer-logos/${preferredExplorer.name}.png`}
          />
          <span className="ml-2 text-sm">
            {t(`settings:${preferredExplorer.name}`)}
          </span>
        </a>
      </div>
    </div>
  )
}

export default SpotTradeActivityDetails
