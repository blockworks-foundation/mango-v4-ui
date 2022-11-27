import { EXPLORERS } from '@components/settings/PreferredExplorerSettings'
import { IconButton, LinkButton } from '@components/shared/Button'
import SheenLoader from '@components/shared/SheenLoader'
import { Table, Td, Th, TrBody, TrHead } from '@components/shared/TableElements'
import Tooltip from '@components/shared/Tooltip'
import { Transition } from '@headlessui/react'
import {
  BoltIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  LinkIcon,
} from '@heroicons/react/20/solid'
import mangoStore, { LiquidationFeedItem } from '@store/mangoStore'
import dayjs from 'dayjs'
import useLocalStorageState from 'hooks/useLocalStorageState'
import useMangoAccount from 'hooks/useMangoAccount'
import { useViewport } from 'hooks/useViewport'
import { useTranslation } from 'next-i18next'
import Image from 'next/legacy/image'
import { Fragment, useCallback, useState } from 'react'
import { PREFERRED_EXPLORER_KEY } from 'utils/constants'
import { formatDecimal, formatFixedDecimals } from 'utils/numbers'
import { breakpoints } from 'utils/theme'

const ActivityFeedTable = ({
  activityFeed,
  handleShowActivityDetails,
  params,
}: {
  activityFeed: any
  handleShowActivityDetails: (x: LiquidationFeedItem) => void
  params: string
}) => {
  const { t } = useTranslation(['common', 'activity'])
  const { mangoAccount } = useMangoAccount()
  const actions = mangoStore((s) => s.actions)
  const loadActivityFeed = mangoStore((s) => s.activityFeed.loading)
  const [offset, setOffset] = useState(0)
  const [preferredExplorer] = useLocalStorageState(
    PREFERRED_EXPLORER_KEY,
    EXPLORERS[0]
  )
  const { width } = useViewport()
  const showTableView = width ? width > breakpoints.md : false

  const handleShowMore = useCallback(() => {
    const mangoAccount = mangoStore.getState().mangoAccount.current
    const set = mangoStore.getState().set
    set((s) => {
      s.activityFeed.loading = true
    })
    if (!mangoAccount) return
    setOffset(offset + 25)
    actions.fetchActivityFeed(
      mangoAccount.publicKey.toString(),
      offset + 25,
      params
    )
  }, [actions, offset, params])

  const getCreditAndDebit = (activity: any) => {
    const { activity_type } = activity
    let credit = { value: '0', symbol: '' }
    let debit = { value: '0', symbol: '' }
    if (activity_type === 'liquidate_token_with_token') {
      const { side, liab_amount, liab_symbol, asset_amount, asset_symbol } =
        activity.activity_details
      if (side === 'liqee') {
        credit = { value: formatDecimal(liab_amount), symbol: liab_symbol }
        debit = {
          value: formatDecimal(asset_amount * -1),
          symbol: asset_symbol,
        }
      } else {
        credit = { value: formatDecimal(asset_amount), symbol: asset_symbol }
        debit = { value: formatDecimal(liab_amount * -1), symbol: liab_symbol }
      }
    }
    if (activity_type === 'deposit') {
      const { symbol, quantity } = activity.activity_details
      credit = { value: formatDecimal(quantity), symbol }
      debit = { value: '0', symbol: '' }
    }
    if (activity_type === 'withdraw') {
      const { symbol, quantity } = activity.activity_details
      credit = { value: '0', symbol: '' }
      debit = { value: formatDecimal(quantity * -1), symbol }
    }
    return { credit, debit }
  }

  const getValue = (activity: any) => {
    const { activity_type } = activity
    let value = 0
    if (activity_type === 'liquidate_token_with_token') {
      const { side, liab_amount, liab_price, asset_amount, asset_price } =
        activity.activity_details
      if (side === 'liqee') {
        value = asset_amount * asset_price - liab_amount * liab_price
      } else {
        value = liab_amount * liab_price - asset_amount * asset_price
      }
    }
    if (activity_type === 'deposit' || activity_type === 'withdraw') {
      const { usd_equivalent } = activity.activity_details
      value =
        activity_type === 'withdraw' ? usd_equivalent * -1 : usd_equivalent
    }
    return value
  }

  return mangoAccount ? (
    activityFeed.length || loadActivityFeed ? (
      <>
        {showTableView ? (
          <Table className="min-w-full">
            <thead>
              <TrHead className="sticky top-0 z-10">
                <Th className="bg-th-bkg-1 text-left">{t('date')}</Th>
                <Th className="bg-th-bkg-1 text-right">
                  {t('activity:activity')}
                </Th>
                <Th className="bg-th-bkg-1 text-right">
                  {t('activity:credit')}
                </Th>
                <Th className="bg-th-bkg-1 text-right">
                  {t('activity:debit')}
                </Th>
                <Th className="bg-th-bkg-1 text-right">
                  {t('activity:activity-value')}
                </Th>
                <Th className="bg-th-bkg-1 text-right">{t('explorer')}</Th>
              </TrHead>
            </thead>
            <tbody>
              {activityFeed.map((activity: any) => {
                const { activity_type, block_datetime } = activity
                const { signature } = activity.activity_details
                const isLiquidation =
                  activity_type === 'liquidate_token_with_token'
                const activityName = isLiquidation
                  ? 'liquidation'
                  : activity_type
                const amounts = getCreditAndDebit(activity)
                const value = getValue(activity)
                return (
                  <TrBody
                    key={signature}
                    className={`default-transition text-sm hover:bg-th-bkg-2 ${
                      isLiquidation ? 'cursor-pointer' : ''
                    }`}
                    onClick={
                      isLiquidation
                        ? () => handleShowActivityDetails(activity)
                        : undefined
                    }
                  >
                    <Td>
                      <p className="font-body tracking-wide">
                        {dayjs(block_datetime).format('ddd D MMM')}
                      </p>
                      <p className="text-xs text-th-fgd-3">
                        {dayjs(block_datetime).format('h:mma')}
                      </p>
                    </Td>
                    <Td className="text-right">
                      {t(`activity:${activityName}`)}
                    </Td>
                    <Td className="text-right font-mono">
                      {amounts.credit.value}{' '}
                      <span className="font-body tracking-wide text-th-fgd-3">
                        {amounts.credit.symbol}
                      </span>
                    </Td>
                    <Td className="text-right font-mono">
                      {amounts.debit.value}{' '}
                      <span className="font-body tracking-wide text-th-fgd-3">
                        {amounts.debit.symbol}
                      </span>
                    </Td>
                    <Td
                      className={`text-right font-mono ${
                        value >= 0 ? 'text-th-green' : 'text-th-red'
                      }`}
                    >
                      {value > 0 ? '+' : ''}
                      {formatFixedDecimals(value, true)}
                    </Td>
                    <Td>
                      {activity_type !== 'liquidate_token_with_token' ? (
                        <div className="flex items-center justify-end">
                          <Tooltip
                            content={`View on ${t(
                              `settings:${preferredExplorer.name}`
                            )}`}
                            placement="top-end"
                          >
                            <a
                              href={`${preferredExplorer.url}${signature}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <div className="h-6 w-6">
                                <Image
                                  alt=""
                                  width="24"
                                  height="24"
                                  src={`/explorer-logos/${preferredExplorer.name}.png`}
                                />
                              </div>
                            </a>
                          </Tooltip>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end">
                          <ChevronRightIcon className="h-6 w-6 text-th-fgd-3" />
                        </div>
                      )}
                    </Td>
                  </TrBody>
                )
              })}
            </tbody>
          </Table>
        ) : (
          <div>
            {activityFeed.map((activity: any) => (
              <MobileActivityFeedItem
                activity={activity}
                getValue={getValue}
                key={activity.activity_details.signature}
              />
            ))}
          </div>
        )}
        {loadActivityFeed ? (
          <div className="mt-2 space-y-0.5">
            {[...Array(4)].map((x, i) => (
              <SheenLoader className="flex flex-1" key={i}>
                <div className="h-16 w-full bg-th-bkg-2" />
              </SheenLoader>
            ))}
          </div>
        ) : null}
        {activityFeed.length && activityFeed.length % 25 === 0 ? (
          <div className="flex justify-center pt-6">
            <LinkButton onClick={handleShowMore}>Show More</LinkButton>
          </div>
        ) : null}
      </>
    ) : (
      <div className="flex flex-col items-center p-8">
        <BoltIcon className="mb-2 h-6 w-6 text-th-fgd-4" />
        <p>No account activity found...</p>
      </div>
    )
  ) : (
    <div className="flex flex-col items-center p-8">
      <LinkIcon className="mb-2 h-6 w-6 text-th-fgd-4" />
      <p>Connect to view your account activity</p>
    </div>
  )
}

export default ActivityFeedTable

const MobileActivityFeedItem = ({
  activity,
  getValue,
}: {
  activity: any
  getValue: (x: any) => number
}) => {
  const { t } = useTranslation(['common', 'activity'])
  const [expandActivityDetails, setExpandActivityDetails] = useState(false)
  const [preferredExplorer] = useLocalStorageState(
    PREFERRED_EXPLORER_KEY,
    EXPLORERS[0]
  )
  const { activity_type, block_datetime } = activity
  const { signature } = activity.activity_details
  const isLiquidation = activity_type === 'liquidate_token_with_token'
  const activityName = isLiquidation ? 'liquidation' : activity_type
  const value = getValue(activity)
  return (
    <div key={signature} className="border-b border-th-bkg-3 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-th-fgd-1">
            {dayjs(block_datetime).format('ddd D MMM')}
          </p>
          <p className="text-xs text-th-fgd-3">
            {dayjs(block_datetime).format('h:mma')}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div>
            <p className="text-right text-xs">
              {t(`activity:${activityName}`)}
            </p>
            <p className="text-right font-mono text-sm text-th-fgd-1">
              {isLiquidation ? (
                formatFixedDecimals(value, true)
              ) : (
                <>
                  <span className="mr-1">
                    {activity.activity_details.quantity}
                  </span>
                  <span className="font-body tracking-wide text-th-fgd-3">
                    {activity.activity_details.symbol}
                  </span>
                </>
              )}
            </p>
          </div>
          {isLiquidation ? (
            <IconButton
              onClick={() => setExpandActivityDetails((prev) => !prev)}
            >
              <ChevronDownIcon
                className={`${
                  expandActivityDetails ? 'rotate-180' : 'rotate-360'
                } h-6 w-6 flex-shrink-0 text-th-fgd-1`}
              />
            </IconButton>
          ) : (
            <a
              href={`${preferredExplorer.url}${signature}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="flex h-10 w-10 items-center justify-center">
                <Image
                  alt=""
                  width="24"
                  height="24"
                  src={`/explorer-logos/${preferredExplorer.name}.png`}
                />
              </div>
            </a>
          )}
        </div>
      </div>
      <Transition
        appear={true}
        show={expandActivityDetails}
        as={Fragment}
        enter="transition ease-in duration-200"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition ease-out"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-th-bkg-3 pt-4">
          <div className="col-span-1">
            <p className="mb-0.5 text-sm">{t('activity:asset-liquidated')}</p>
            <p className="font-mono text-sm text-th-fgd-1">
              {formatDecimal(activity.activity_details.asset_amount)}{' '}
              <span className="font-body tracking-wide">
                {activity.activity_details.asset_symbol}
              </span>
              <span className="ml-2 font-body tracking-wide text-th-fgd-3">
                at
              </span>{' '}
              {formatFixedDecimals(activity.activity_details.asset_price, true)}
            </p>
            <p className="font-mono text-xs text-th-fgd-3">
              {formatFixedDecimals(
                activity.activity_details.asset_price *
                  activity.activity_details.asset_amount,
                true
              )}
            </p>
          </div>
          <div className="col-span-1">
            <p className="mb-0.5 text-sm">{t('activity:asset-returned')}</p>
            <p className="font-mono text-sm text-th-fgd-1">
              {formatDecimal(activity.activity_details.liab_amount)}{' '}
              <span className="font-body tracking-wide">
                {activity.activity_details.liab_symbol}
              </span>
              <span className="ml-2 font-body tracking-wide text-th-fgd-3">
                at
              </span>{' '}
              {formatFixedDecimals(activity.activity_details.liab_price, true)}
            </p>
            <p className="font-mono text-xs text-th-fgd-3">
              {formatFixedDecimals(
                activity.activity_details.liab_price *
                  activity.activity_details.liab_amount,
                true
              )}
            </p>
          </div>
          <div className="col-span-2 flex justify-center pt-3">
            <a
              className="default-transition flex items-center text-sm text-th-fgd-1 hover:text-th-fgd-3"
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
      </Transition>
    </div>
  )
}
