import { EXPLORERS } from '@components/settings/PreferredExplorerSettings'
import { IconButton } from '@components/shared/Button'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import { ArrowLeftIcon } from '@heroicons/react/20/solid'
import mangoStore, { LiquidationFeedItem } from '@store/mangoStore'
import dayjs from 'dayjs'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { useTranslation } from 'next-i18next'
import Image from 'next/legacy/image'
import { useState } from 'react'
import { PREFERRED_EXPLORER_KEY } from 'utils/constants'
import ActivityFeedTable from './ActivityFeedTable'

const ActivityFeed = () => {
  const activityFeed = mangoStore((s) => s.activityFeed.feed)
  const [showActivityDetail, setShowActivityDetail] = useState(null)

  const handleShowActivityDetails = (activity: any) => {
    setShowActivityDetail(activity)
  }

  return !showActivityDetail ? (
    <ActivityFeedTable
      activityFeed={activityFeed}
      handleShowActivityDetails={handleShowActivityDetails}
    />
  ) : (
    <ActivityDetails
      activity={showActivityDetail}
      setShowActivityDetail={setShowActivityDetail}
    />
  )
}

export default ActivityFeed

const ActivityDetails = ({
  activity,
  setShowActivityDetail,
}: {
  activity: LiquidationFeedItem
  setShowActivityDetail: (x: any) => void
}) => {
  const { t } = useTranslation(['common', 'activity', 'settings'])
  const [preferredExplorer] = useLocalStorageState(
    PREFERRED_EXPLORER_KEY,
    EXPLORERS[0]
  )
  const { block_datetime, activity_type } = activity
  const {
    asset_amount,
    asset_price,
    asset_symbol,
    liab_amount,
    liab_price,
    liab_symbol,
    signature,
  } = activity.activity_details
  return (
    <div>
      <div className="flex items-center p-6">
        <IconButton
          className="mr-4"
          onClick={() => setShowActivityDetail(null)}
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </IconButton>
        <h2 className="text-lg">{t('activity:liquidation-details')}</h2>
      </div>
      <div className="grid grid-cols-1 gap-4 px-6 md:grid-cols-2">
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
          <p className="text-th-fgd-1">
            {activity_type === 'liquidate_token_with_token'
              ? t('spot')
              : t('perp')}
          </p>
        </div>
        <div className="col-span-1">
          <p className="mb-0.5 text-sm">{t('activity:asset-liquidated')}</p>
          <p className="font-mono text-th-fgd-1">
            <FormatNumericValue value={asset_amount} />{' '}
            <span className="font-body">{asset_symbol}</span>
            <span className="ml-2 font-body text-th-fgd-3">at</span>{' '}
            <FormatNumericValue value={asset_price} isUsd />
          </p>
          <p className="font-mono text-xs text-th-fgd-3">
            <FormatNumericValue value={asset_price * asset_amount} isUsd />
          </p>
        </div>
        <div className="col-span-1">
          <p className="mb-0.5 text-sm">{t('activity:asset-returned')}</p>
          <p className="font-mono text-th-fgd-1">
            <FormatNumericValue value={liab_amount} />{' '}
            <span className="font-body">{liab_symbol}</span>
            <span className="ml-2 font-body text-th-fgd-3">at</span>{' '}
            <FormatNumericValue value={liab_price} isUsd />
          </p>
          <p className="font-mono text-xs text-th-fgd-3">
            <FormatNumericValue value={liab_price * liab_amount} isUsd />
          </p>
        </div>
      </div>
      <div className="col-span-3 mt-8 flex justify-center border-y border-th-bkg-3 py-3">
        <a
          className="default-transition flex items-center text-th-fgd-2 hover:text-th-fgd-3"
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
          <span className="ml-2 text-base">{t('view-transaction')}</span>
        </a>
      </div>
    </div>
  )
}
