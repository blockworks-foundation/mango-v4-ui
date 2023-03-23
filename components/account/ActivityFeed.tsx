import { EXPLORERS } from '@components/settings/PreferredExplorerSettings'
import { IconButton } from '@components/shared/Button'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import { ArrowLeftIcon } from '@heroicons/react/20/solid'
import mangoStore from '@store/mangoStore'
import dayjs from 'dayjs'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { useTranslation } from 'next-i18next'
import Image from 'next/legacy/image'
import { useMemo, useState } from 'react'
import { PREFERRED_EXPLORER_KEY } from 'utils/constants'
import ActivityFeedTable from './ActivityFeedTable'
import {
  isPerpLiquidation,
  LiquidationActivity,
  SpotOrPerpLiquidationItem,
} from 'types'

const ActivityFeed = () => {
  const activityFeed = mangoStore((s) => s.activityFeed.feed)
  const [showActivityDetail, setShowActivityDetail] =
    useState<LiquidationActivity>()

  const handleShowActivityDetails = (activity: LiquidationActivity) => {
    setShowActivityDetail(activity)
  }

  return !showActivityDetail ? (
    <ActivityFeedTable
      activityFeed={activityFeed}
      handleShowActivityDetails={handleShowActivityDetails}
    />
  ) : (
    <LiquidationDetails
      activity={showActivityDetail}
      setShowActivityDetail={setShowActivityDetail}
    />
  )
}

export default ActivityFeed

const LiquidationDetails = ({
  activity,
  setShowActivityDetail,
}: {
  activity: LiquidationActivity
  setShowActivityDetail: (x: LiquidationActivity | undefined) => void
}) => {
  const { t } = useTranslation(['common', 'activity', 'settings'])
  const [preferredExplorer] = useLocalStorageState(
    PREFERRED_EXPLORER_KEY,
    EXPLORERS[0]
  )
  const { block_datetime } = activity

  const getAssetLiquidatedReturned = (details: SpotOrPerpLiquidationItem) => {
    const assets = {
      liquidated: { amount: 0, symbol: '', value: 0 },
      returned: { amount: 0, symbol: '', value: 0 },
    }
    if (isPerpLiquidation(details)) {
      const {
        base_transfer,
        // pnl_settle_limit_transfer,
        // pnl_transfer,
        price,
        quote_transfer,
        // side,
      } = details
      if (base_transfer > 0) {
        const liquidatedAmount = base_transfer * price
        const returnedAmount = quote_transfer
        assets.liquidated.amount = liquidatedAmount
        assets.liquidated.value = liquidatedAmount
        assets.returned.amount = returnedAmount
        assets.returned.value = returnedAmount
      } else {
        const liquidatedAmount = quote_transfer
        const returnedAmount = base_transfer * price
        assets.liquidated.amount = liquidatedAmount
        assets.liquidated.value = liquidatedAmount
        assets.returned.amount = returnedAmount
        assets.returned.value = returnedAmount
      }
    } else {
      const {
        liab_amount,
        liab_price,
        liab_symbol,
        asset_amount,
        asset_price,
        asset_symbol,
      } = details
      assets.liquidated.amount = asset_amount
      assets.liquidated.symbol = asset_symbol
      assets.liquidated.value = asset_amount * asset_price
      assets.returned.amount = liab_amount
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
  ] = useMemo(() => {
    if (!activity) return [0, 0, '', '', 0, 0]
    const values = getAssetLiquidatedReturned(activity.activity_details)
    return [
      values?.liquidated.amount,
      values?.returned.amount,
      values?.liquidated.symbol,
      values?.returned.symbol,
      values?.liquidated.value,
      values?.returned.value,
    ]
  }, [activity])

  return (
    <div className="md:pb-10">
      <div className="flex items-center p-6">
        <IconButton
          className="mr-4"
          onClick={() => setShowActivityDetail(undefined)}
          size="small"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </IconButton>
        <h2 className="text-lg">{t('activity:liquidation-details')}</h2>
      </div>
      <div className="grid grid-cols-1 gap-4 px-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isPerpLiquidation(activity.activity_details) ? (
          <>
            <div className="col-span-1">
              <p className="mb-0.5 text-sm">{t('date')}</p>
              <p className="text-th-fgd-1">
                {dayjs(block_datetime).format('ddd D MMM')}
              </p>
              <p className="text-xs text-th-fgd-3">
                {dayjs(block_datetime).format('h:mma')}
              </p>
            </div>
            <div className="col-span-1">
              <p className="mb-0.5 text-sm">{t('activity:liquidation-type')}</p>
              <p className="text-th-fgd-1">{t('perp')}</p>
            </div>
            <div className="col-span-1">
              <p className="mb-0.5 text-sm">{t('activity:asset-liquidated')}</p>
              <p className="font-mono text-th-fgd-1">
                <FormatNumericValue value={assetLiquidated} />{' '}
                <span className="font-body">{assetLiquidatedSymbol}</span>
              </p>
              <p className="font-mono text-xs text-th-fgd-3">
                <FormatNumericValue value={liquidatedValue} isUsd />
              </p>
            </div>
            <div className="col-span-1">
              <p className="mb-0.5 text-sm">{t('activity:asset-returned')}</p>
              <p className="font-mono text-th-fgd-1">
                <FormatNumericValue value={assetReturned} />{' '}
                <span className="font-body">{assetReturnedSymbol}</span>
              </p>
              <p className="font-mono text-xs text-th-fgd-3">
                <FormatNumericValue value={returnedValue} isUsd />
              </p>
            </div>
            <div className="col-span-1">
              <p className="mb-0.5 text-sm">{t('activity:counterparty')}</p>
              <a
                className="text-sm"
                href={`/?address=${activity.activity_details.counterparty}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('activity:view-account')}
              </a>
            </div>
          </>
        ) : (
          <>
            <div className="col-span-1">
              <p className="mb-0.5 text-sm">{t('date')}</p>
              <p className="text-th-fgd-1">
                {dayjs(block_datetime).format('ddd D MMM')}
              </p>
              <p className="text-xs text-th-fgd-3">
                {dayjs(block_datetime).format('h:mma')}
              </p>
            </div>
            <div className="col-span-1">
              <p className="mb-0.5 text-sm">{t('activity:liquidation-type')}</p>
              <p className="text-th-fgd-1">{t('spot')}</p>
            </div>
            <div className="col-span-1">
              <p className="mb-0.5 text-sm">{t('activity:asset-liquidated')}</p>
              <p className="font-mono text-th-fgd-1">
                <FormatNumericValue value={assetLiquidated} />{' '}
                <span className="font-body">{assetLiquidatedSymbol}</span>
                <span className="ml-2 font-body text-th-fgd-3">at</span>{' '}
                <FormatNumericValue
                  value={activity.activity_details.asset_price}
                  isUsd
                />
              </p>
              <p className="font-mono text-xs text-th-fgd-3">
                <FormatNumericValue value={liquidatedValue} isUsd />
              </p>
            </div>
            <div className="col-span-1">
              <p className="mb-0.5 text-sm">{t('activity:asset-returned')}</p>
              <p className="font-mono text-th-fgd-1">
                <FormatNumericValue value={assetReturned} />{' '}
                <span className="font-body">{assetReturnedSymbol}</span>
                <span className="ml-2 font-body text-th-fgd-3">at</span>{' '}
                <FormatNumericValue
                  value={activity.activity_details.liab_price}
                  isUsd
                />
              </p>
              <p className="font-mono text-xs text-th-fgd-3">
                <FormatNumericValue value={returnedValue} isUsd />
              </p>
            </div>
          </>
        )}
        <div className="col-span-1">
          <p className="mb-0.5 text-sm">{t('activity:liquidation-side')}</p>
          <p className="text-th-fgd-1">
            {activity.activity_details.side === 'liqor'
              ? t('activity:liquidator')
              : t('activity:liquidated')}
          </p>
        </div>
        <div className="col-span-1">
          <p className="mb-0.5 text-sm">{t('transaction')}</p>
          <a
            className="default-transition flex items-center text-th-fgd-2 hover:text-th-fgd-3"
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
    </div>
  )
}
