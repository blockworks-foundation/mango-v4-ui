import Checkbox from '@components/forms/Checkbox'
import Button, { IconButton, LinkButton } from '@components/shared/Button'
import { ArrowLeftIcon } from '@heroicons/react/20/solid'
import mangoStore, { LiquidationFeedItem } from '@store/mangoStore'
import dayjs from 'dayjs'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import { EXPLORERS } from 'pages/settings'
import { ChangeEvent, useCallback, useState } from 'react'
import { PREFERRED_EXPLORER_KEY } from 'utils/constants'
import { formatDecimal, formatFixedDecimals } from 'utils/numbers'
import ActivityFeedTable from './ActivityFeedTable'

const DEFAULT_FILTERS = {
  deposit: true,
  liquidate_token_with_token: true,
  withdraw: true,
}

const DEFAULT_PARAMS = ['deposit', 'liquidate_token_with_token', 'withdraw']

const ActivityFeed = () => {
  const activityFeed = mangoStore((s) => s.activityFeed.feed)
  const [showActivityDetail, setShowActivityDetail] = useState(null)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [params, setParams] = useState<string[]>(DEFAULT_PARAMS)

  const handleShowActivityDetails = (activity: any) => {
    setShowActivityDetail(activity)
  }

  const updateFilters = (e: ChangeEvent<HTMLInputElement>, filter: string) => {
    setFilters({ ...filters, [filter]: e.target.checked })

    let newParams: string[] = DEFAULT_PARAMS

    if (params.includes(filter)) {
      newParams = params.filter((p) => p !== filter)
    } else {
      newParams = [...params, filter]
    }
    setParams(newParams)
  }

  return !showActivityDetail ? (
    <>
      <ActivityFilters
        filters={filters}
        updateFilters={updateFilters}
        params={params}
      />
      <ActivityFeedTable
        activityFeed={activityFeed}
        handleShowActivityDetails={handleShowActivityDetails}
        params={params}
      />
    </>
  ) : (
    <ActivityDetails
      activity={showActivityDetail}
      setShowActivityDetail={setShowActivityDetail}
    />
  )
}

export default ActivityFeed

const ActivityFilters = ({
  filters,
  updateFilters,
  params,
}: {
  filters: any
  updateFilters: any
  params: any
}) => {
  const actions = mangoStore((s) => s.actions)

  const handleUpdateResults = useCallback(() => {
    const mangoAccount = mangoStore.getState().mangoAccount.current
    const set = mangoStore.getState().set
    set((s) => {
      s.activityFeed.feed = []
      s.activityFeed.loading = true
    })
    if (mangoAccount) {
      actions.fetchActivityFeed(
        mangoAccount.publicKey.toString(),
        0,
        'activity-type=' + params.toString()
      )
    }
  }, [actions, filters])

  return (
    <div className="flex items-center justify-between border-b border-th-bkg-3 pl-6">
      <div className="grid flex-1 grid-cols-5">
        <h3 className="col-span-1 flex items-center text-sm">Filter Results</h3>
        <div className="col-span-1 flex h-12 items-center border-l border-th-bkg-4 p-4">
          <Checkbox
            checked={filters.deposit}
            onChange={(e) => updateFilters(e, 'deposit')}
          >
            <span className="text-sm">Deposits</span>
          </Checkbox>
        </div>
        <div className="col-span-1 flex h-12 items-center border-l border-th-bkg-4 p-4">
          <Checkbox
            checked={filters.withdraw}
            onChange={(e) => updateFilters(e, 'withdraw')}
          >
            <span className="text-sm">Withdrawals</span>
          </Checkbox>
        </div>
        <div className="col-span-1 flex h-12 items-center border-l border-th-bkg-4 p-4">
          <Checkbox
            checked={filters.liquidate_token_with_token}
            onChange={(e) => updateFilters(e, 'liquidate_token_with_token')}
          >
            <span className="text-sm">Liquidations</span>
          </Checkbox>
        </div>
        <div className="col-span-1 flex h-12 items-center border-l border-th-bkg-4 p-4">
          <LinkButton className="text-sm">Advanced Filters</LinkButton>
        </div>
      </div>
      <Button className="h-12 rounded-none" onClick={handleUpdateResults}>
        Update
      </Button>
    </div>
  )
}

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
  const { block_datetime } = activity
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
      <div className="grid grid-cols-1 gap-4 px-6 lg:grid-cols-3">
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
          <p className="mb-0.5 text-sm">{t('activity:asset-liquidated')}</p>
          <p className="font-mono text-th-fgd-1">
            {formatDecimal(asset_amount)}{' '}
            <span className="font-body tracking-wide">{asset_symbol}</span>
            <span className="ml-2 font-body tracking-wide text-th-fgd-3">
              at
            </span>{' '}
            {formatFixedDecimals(asset_price, true)}
          </p>
          <p className="font-mono text-xs text-th-fgd-3">
            {formatFixedDecimals(asset_price * asset_amount, true)}
          </p>
        </div>
        <div className="col-span-1">
          <p className="mb-0.5 text-sm">{t('activity:asset-returned')}</p>
          <p className="font-mono text-th-fgd-1">
            {formatDecimal(liab_amount)}{' '}
            <span className="font-body tracking-wide">{liab_symbol}</span>
            <span className="ml-2 font-body tracking-wide text-th-fgd-3">
              at
            </span>{' '}
            {formatFixedDecimals(liab_price, true)}
          </p>
          <p className="font-mono text-xs text-th-fgd-3">
            {formatFixedDecimals(liab_price * liab_amount, true)}
          </p>
        </div>
      </div>
      <div className="col-span-3 mt-8 flex justify-center border-y border-th-bkg-3 py-3">
        <a
          className="default-transition flex items-center text-th-fgd-1 hover:text-th-fgd-3"
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
          <span className="ml-2 text-base">{`View on ${t(
            `settings:${preferredExplorer.name}`
          )}`}</span>
        </a>
      </div>
    </div>
  )
}
