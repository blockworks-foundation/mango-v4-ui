import { EXPLORERS } from '@components/settings/PreferredExplorerSettings'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import Tooltip from '@components/shared/Tooltip'
import PerpSideBadge from '@components/trade/PerpSideBadge'
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/20/solid'
import { PublicKey } from '@solana/web3.js'
import useLocalStorageState from 'hooks/useLocalStorageState'
import useMangoAccount from 'hooks/useMangoAccount'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import { PerpTradeActivity } from 'types'
import { PREFERRED_EXPLORER_KEY } from 'utils/constants'
import { abbreviateAddress } from 'utils/formatting'
import { getDecimalCount } from 'utils/numbers'
import { formatFee } from './ActivityFeedTable'
import Decimal from 'decimal.js'

const PerpTradeActivityDetails = ({
  activity,
}: {
  activity: PerpTradeActivity
}) => {
  const { t } = useTranslation(['common', 'activity', 'settings', 'trade'])
  const { mangoAccountAddress } = useMangoAccount()
  const [preferredExplorer] = useLocalStorageState(
    PREFERRED_EXPLORER_KEY,
    EXPLORERS[0],
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

  const quantityDecimal = new Decimal(quantity)
  const notional = quantityDecimal.mul(new Decimal(price))
  const fee = isTaker
    ? notional.mul(new Decimal(taker_fee))
    : notional.mul(new Decimal(maker_fee))
  const totalPrice = notional.plus(fee).div(quantityDecimal)

  const counterpartyPk = isTaker ? maker : taker

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <div className="col-span-1">
        <p className="mb-0.5 font-body text-sm text-th-fgd-3">{t('market')}</p>
        <p className="font-body text-th-fgd-1">{perp_market_name}</p>
      </div>
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
          {formatFee(fee.toNumber())}{' '}
          <span className="font-body text-th-fgd-3">USDC</span>
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
          className="flex items-center text-sm"
          href={`/?address=${counterpartyPk}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="mr-1.5">
            {abbreviateAddress(new PublicKey(counterpartyPk))}
          </span>
          <ArrowTopRightOnSquareIcon className="h-3 w-3" />
        </a>
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

export default PerpTradeActivityDetails
