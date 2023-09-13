import { EXPLORERS } from '@components/settings/PreferredExplorerSettings'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/20/solid'
import { PublicKey } from '@solana/web3.js'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import { useMemo } from 'react'
import {
  isPerpLiquidation,
  LiquidationActivity,
  SpotOrPerpLiquidationItem,
} from 'types'
import { PREFERRED_EXPLORER_KEY } from 'utils/constants'
import { abbreviateAddress } from 'utils/formatting'

const LiquidationActivityDetails = ({
  activity,
}: {
  activity: LiquidationActivity
}) => {
  const { t } = useTranslation(['common', 'activity', 'settings'])
  const [preferredExplorer] = useLocalStorageState(
    PREFERRED_EXPLORER_KEY,
    EXPLORERS[0],
  )

  const getAssetLiquidatedReturned = (details: SpotOrPerpLiquidationItem) => {
    const assets = {
      liquidated: { amount: 0, symbol: '', value: 0 },
      returned: { amount: 0, symbol: '', value: 0 },
    }
    if (isPerpLiquidation(details)) {
      const { base_transfer, perp_market_name, price, quote_transfer } = details
      const isLiquidatorBase = base_transfer > 0 ? 1 : -1
      const isLiquidatorQuote = base_transfer > 0 ? -1 : 1
      const liquidatedAmount = Math.abs(base_transfer)
      const returnedAmount = Math.abs(quote_transfer)
      assets.liquidated.amount = liquidatedAmount
      assets.liquidated.value = liquidatedAmount * price * isLiquidatorBase
      assets.liquidated.symbol = perp_market_name
      assets.returned.amount = returnedAmount
      assets.returned.value = returnedAmount * isLiquidatorQuote
      assets.returned.symbol = 'USDC'
    } else {
      const {
        liab_amount,
        liab_price,
        liab_symbol,
        asset_amount,
        asset_price,
        asset_symbol,
      } = details
      assets.liquidated.amount = Math.abs(asset_amount)
      assets.liquidated.symbol = asset_symbol
      assets.liquidated.value = asset_amount * asset_price
      assets.returned.amount = Math.abs(liab_amount)
      assets.returned.symbol = liab_symbol
      assets.returned.value = liab_amount * liab_price
    }
    return assets
  }

  const [
    assetLiquidated,
    assetReturned,
    assetLiquidatedSymbol,
    assetReturnedSymbol,
    liquidatedValue,
    returnedValue,
    fee,
  ] = useMemo(() => {
    if (!activity) return [0, 0, '', '', 0, 0, 0]
    const values = getAssetLiquidatedReturned(activity.activity_details)
    const isNegativeFee = activity.activity_details.side === 'liqee' ? -1 : 1
    const fee =
      (Math.abs(values.liquidated.value) - Math.abs(values.returned.value)) *
      isNegativeFee
    return [
      values.liquidated.amount,
      values.returned.amount,
      values.liquidated.symbol,
      values.returned.symbol,
      values.liquidated.value,
      values.returned.value,
      fee,
    ]
  }, [activity])

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {isPerpLiquidation(activity.activity_details) ? (
        <>
          <div className="col-span-1">
            <p className="mb-0.5 font-body text-sm text-th-fgd-3">
              {t('activity:liquidation-type')}
            </p>
            <p className="font-body text-th-fgd-1">{t('perp')}</p>
          </div>
          <div className="col-span-1">
            <p className="mb-0.5 font-body text-sm text-th-fgd-3">
              {t('activity:asset-liquidated')}
            </p>
            <p className="text-th-fgd-1">
              <FormatNumericValue value={assetLiquidated} />{' '}
              <span className="font-body text-th-fgd-3">
                {assetLiquidatedSymbol}
              </span>
              <span className="ml-2 font-body text-th-fgd-3">at</span>{' '}
              <FormatNumericValue
                value={activity.activity_details.price}
                isUsd
              />
            </p>
            <p className="text-xs text-th-fgd-3">
              <FormatNumericValue value={liquidatedValue} isUsd />
            </p>
          </div>
          <div className="col-span-1">
            <p className="mb-0.5 font-body text-sm text-th-fgd-3">
              {t('activity:asset-returned')}
            </p>
            <p className="text-th-fgd-1">
              <FormatNumericValue value={assetReturned} />{' '}
              <span className="font-body text-th-fgd-3">
                {assetReturnedSymbol}
              </span>
            </p>
            <p className="text-xs text-th-fgd-3">
              <FormatNumericValue value={returnedValue} isUsd />
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="col-span-1">
            <p className="mb-0.5 font-body text-sm text-th-fgd-3">
              {t('activity:liquidation-type')}
            </p>
            <p className="font-body text-th-fgd-1">{t('spot')}</p>
          </div>
          <div className="col-span-1">
            <p className="mb-0.5 font-body text-sm text-th-fgd-3">
              {t('activity:asset-liquidated')}
            </p>
            <p className="text-th-fgd-1">
              <FormatNumericValue value={assetLiquidated} />{' '}
              <span className="font-body text-th-fgd-3">
                {assetLiquidatedSymbol}
              </span>
              <span className="ml-2 font-body text-th-fgd-3">at</span>{' '}
              <FormatNumericValue
                value={activity.activity_details.asset_price}
                isUsd
              />
            </p>
            <p className="text-xs text-th-fgd-3">
              <FormatNumericValue value={liquidatedValue} isUsd />
            </p>
          </div>
          <div className="col-span-1">
            <p className="mb-0.5 font-body text-sm text-th-fgd-3">
              {t('activity:asset-returned')}
            </p>
            <p className="text-th-fgd-1">
              <FormatNumericValue value={assetReturned} />{' '}
              <span className="font-body text-th-fgd-3">
                {assetReturnedSymbol}
              </span>
              <span className="ml-2 font-body text-th-fgd-3">at</span>{' '}
              <FormatNumericValue
                value={activity.activity_details.liab_price}
                isUsd
              />
            </p>
            <p className="text-xs text-th-fgd-3">
              <FormatNumericValue value={returnedValue} isUsd />
            </p>
          </div>
        </>
      )}
      <div className="col-span-1">
        <p className="mb-0.5 font-body text-sm text-th-fgd-3">
          {t('activity:liquidation-fee')}
        </p>
        <p className="text-th-fgd-1">
          <FormatNumericValue value={fee} isUsd />
        </p>
      </div>
      <div className="col-span-1">
        <p className="mb-0.5 font-body text-sm text-th-fgd-3">
          {t('activity:liquidation-side')}
        </p>
        <p className="font-body text-th-fgd-1">
          {activity.activity_details.side === 'liqor'
            ? t('activity:liquidator')
            : t('activity:liquidated')}
        </p>
      </div>
      <div className="col-span-1">
        <p className="mb-0.5 font-body text-sm text-th-fgd-3">
          {t('activity:counterparty')}
        </p>
        <a
          className="flex items-center text-sm"
          href={`/?address=${activity.activity_details.counterparty}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="mr-1.5">
            {abbreviateAddress(
              new PublicKey(activity.activity_details.counterparty),
            )}
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
          href={`${preferredExplorer.url}${activity.activity_details.signature}`}
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

export default LiquidationActivityDetails
