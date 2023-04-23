import { EXPLORERS } from '@components/settings/PreferredExplorerSettings'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import Tooltip from '@components/shared/Tooltip'
import PerpSideBadge from '@components/trade/PerpSideBadge'
import useLocalStorageState from 'hooks/useLocalStorageState'
import useMangoAccount from 'hooks/useMangoAccount'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import { PerpTradeActivity } from 'types'
import { PREFERRED_EXPLORER_KEY } from 'utils/constants'
import { getDecimalCount } from 'utils/numbers'
import { formatFee } from './ActivityFeedTable'

const PerpTradeDetails = ({ activity }: { activity: PerpTradeActivity }) => {
  const { t } = useTranslation(['common', 'activity', 'settings', 'trade'])
  const { mangoAccountAddress } = useMangoAccount()
  const [preferredExplorer] = useLocalStorageState(
    PREFERRED_EXPLORER_KEY,
    EXPLORERS[0]
  )
  const {
    maker,
    maker_fee,
    perp_market_name,
    price,
    quantity,
    signature,
    taker,
    taker_fee,
    taker_side,
  } = activity.activity_details

  const isTaker = taker === mangoAccountAddress

  const side = isTaker ? taker_side : taker_side === 'bid' ? 'ask' : 'bid'

  const notional = quantity * price

  const fee = isTaker ? taker_fee * notional : maker_fee * notional

  const totalPrice = (notional + fee) / quantity

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <div className="col-span-1">
        <p className="mb-0.5 font-body text-sm text-th-fgd-3">
          {t('trade:side')}
        </p>
        <PerpSideBadge basePosition={side === 'bid' ? 1 : -1} />
      </div>
      <div className="col-span-1">
        <p className="mb-0.5 font-body text-sm text-th-fgd-3">
          {t('trade:size')}
        </p>
        <p className="font-mono text-th-fgd-1">
          {quantity}{' '}
          <span className="font-body text-th-fgd-3">{perp_market_name}</span>
        </p>
      </div>
      <div className="col-span-1">
        <p className="mb-0.5 font-body text-sm text-th-fgd-3">
          {t('activity:execution-price')}
        </p>
        <p className="font-mono text-th-fgd-1">
          <FormatNumericValue value={price} decimals={getDecimalCount(price)} />{' '}
          <span className="font-body text-th-fgd-3">USDC</span>
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
          {formatFee(fee)} <span className="font-body text-th-fgd-3">USDC</span>
        </p>
        <p className="font-body text-xs text-th-fgd-3">
          {isTaker ? t('trade:taker') : t('trade:maker')}
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
          <span className="font-body text-th-fgd-3">USDC</span>
        </p>
      </div>
      <div className="col-span-1">
        <p className="mb-0.5 font-body text-sm text-th-fgd-3">
          {t('activity:counterparty')}
        </p>
        <a
          className="text-sm"
          href={`/?address=${isTaker ? maker : taker}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('activity:view-account')}
        </a>
      </div>
      <div className="col-span-1">
        <p className="mb-0.5 font-body text-sm text-th-fgd-3">
          {t('transaction')}
        </p>
        <a
          className="default-transition flex items-center"
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

export default PerpTradeDetails
