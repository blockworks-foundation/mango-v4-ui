/* eslint-disable @typescript-eslint/no-explicit-any */
import { EXPLORERS } from '@components/settings/PreferredExplorerSettings'
import { IconButton, LinkButton } from '@components/shared/Button'
import ConnectEmptyState from '@components/shared/ConnectEmptyState'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import SheenLoader from '@components/shared/SheenLoader'
import SideBadge from '@components/shared/SideBadge'
import { Table, Td, Th, TrBody, TrHead } from '@components/shared/TableElements'
import Tooltip from '@components/shared/Tooltip'
import PerpSideBadge from '@components/trade/PerpSideBadge'
import { Transition } from '@headlessui/react'
import {
  ChevronDownIcon,
  ChevronRightIcon,
  NoSymbolIcon,
} from '@heroicons/react/20/solid'
import { useWallet } from '@solana/wallet-adapter-react'
import mangoStore from '@store/mangoStore'
import dayjs from 'dayjs'
import useLocalStorageState from 'hooks/useLocalStorageState'
import useMangoAccount from 'hooks/useMangoAccount'
import { useViewport } from 'hooks/useViewport'
import { useTranslation } from 'next-i18next'
import Image from 'next/legacy/image'
import { Fragment, useCallback, useState } from 'react'
import { ActivityFeed, isLiquidationFeedItem, LiquidationActivity } from 'types'
import { PAGINATION_PAGE_LENGTH, PREFERRED_EXPLORER_KEY } from 'utils/constants'
import { formatNumericValue } from 'utils/numbers'
import { breakpoints } from 'utils/theme'

const formatFee = (value: number) => {
  return value.toLocaleString(undefined, {
    minimumSignificantDigits: 1,
    maximumSignificantDigits: 1,
  })
}

const getFee = (activity: any, mangoAccountAddress: string) => {
  const { activity_type } = activity
  let fee = { value: '0', symbol: '' }
  if (activity_type === 'swap') {
    const { loan_origination_fee, swap_in_symbol } = activity.activity_details
    fee = loan_origination_fee
      ? { value: formatFee(loan_origination_fee), symbol: swap_in_symbol }
      : { value: '0', symbol: '' }
  }
  if (activity_type === 'perp_trade') {
    const { maker_fee, taker_fee, maker } = activity.activity_details
    fee = {
      value: formatFee(mangoAccountAddress === maker ? maker_fee : taker_fee),
      symbol: 'USDC',
    }
  }
  if (activity_type === 'openbook_trade') {
    const { fee_cost, quote_symbol } = activity.activity_details
    fee = { value: fee_cost, symbol: quote_symbol }
  }
  return fee
}

const getCreditAndDebit = (activity: any) => {
  const { activity_type } = activity
  let credit = { value: '0', symbol: '' }
  let debit = { value: '0', symbol: '' }
  if (activity_type === 'liquidate_token_with_token') {
    const { side, liab_amount, liab_symbol, asset_amount, asset_symbol } =
      activity.activity_details
    if (side === 'liqee') {
      credit = { value: formatNumericValue(liab_amount), symbol: liab_symbol }
      debit = {
        value: formatNumericValue(asset_amount),
        symbol: asset_symbol,
      }
    } else {
      credit = {
        value: formatNumericValue(asset_amount),
        symbol: asset_symbol,
      }
      debit = { value: formatNumericValue(liab_amount), symbol: liab_symbol }
    }
  }
  if (activity_type === 'deposit') {
    const { symbol, quantity } = activity.activity_details
    credit = { value: formatNumericValue(quantity), symbol }
    debit = { value: '0', symbol: '' }
  }
  if (activity_type === 'withdraw') {
    const { symbol, quantity } = activity.activity_details
    credit = { value: '0', symbol: '' }
    debit = { value: formatNumericValue(quantity * -1), symbol }
  }
  if (activity_type === 'swap') {
    const { swap_in_amount, swap_in_symbol, swap_out_amount, swap_out_symbol } =
      activity.activity_details
    credit = {
      value: formatNumericValue(swap_out_amount),
      symbol: swap_out_symbol,
    }
    debit = {
      value: formatNumericValue(swap_in_amount * -1),
      symbol: swap_in_symbol,
    }
  }
  if (activity_type === 'perp_trade') {
    const { perp_market_name, price, quantity } = activity.activity_details
    credit = { value: quantity, symbol: perp_market_name }
    debit = {
      value: formatNumericValue(quantity * price * -1),
      symbol: 'USDC',
    }
  }
  if (activity_type === 'openbook_trade') {
    const { side, price, size, base_symbol, quote_symbol } =
      activity.activity_details
    credit =
      side === 'buy'
        ? { value: formatNumericValue(size), symbol: base_symbol }
        : { value: formatNumericValue(size * price), symbol: quote_symbol }
    debit =
      side === 'buy'
        ? {
            value: formatNumericValue(size * price * -1),
            symbol: quote_symbol,
          }
        : { value: formatNumericValue(size * -1), symbol: base_symbol }
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
      value = asset_amount * asset_price
    } else {
      value = liab_amount * liab_price
    }
  }
  if (activity_type === 'deposit' || activity_type === 'withdraw') {
    const { usd_equivalent } = activity.activity_details
    value = activity_type === 'withdraw' ? usd_equivalent * -1 : usd_equivalent
  }
  if (activity_type === 'swap') {
    const { swap_out_amount, swap_out_price_usd } = activity.activity_details
    value = swap_out_amount * swap_out_price_usd
  }
  if (activity_type === 'perp_trade') {
    const { price, quantity } = activity.activity_details
    value = quantity * price
  }
  if (activity_type === 'openbook_trade') {
    const { price, size } = activity.activity_details
    value = price * size
  }
  return value
}

const ActivityFeedTable = ({
  activityFeed,
  handleShowActivityDetails,
}: {
  activityFeed: ActivityFeed[]
  handleShowActivityDetails: (x: LiquidationActivity) => void
}) => {
  const { t } = useTranslation(['common', 'activity'])
  const { mangoAccountAddress } = useMangoAccount()
  const actions = mangoStore((s) => s.actions)
  const loadActivityFeed = mangoStore((s) => s.activityFeed.loading)
  const queryParams = mangoStore((s) => s.activityFeed.queryParams)
  const [offset, setOffset] = useState(0)
  const { connected } = useWallet()
  const [preferredExplorer] = useLocalStorageState(
    PREFERRED_EXPLORER_KEY,
    EXPLORERS[0]
  )
  const { width } = useViewport()
  const showTableView = width ? width > breakpoints.md : false

  const handleShowMore = useCallback(() => {
    const set = mangoStore.getState().set
    set((s) => {
      s.activityFeed.loading = true
    })
    if (!mangoAccountAddress) return
    setOffset(offset + PAGINATION_PAGE_LENGTH)
    actions.fetchActivityFeed(
      mangoAccountAddress,
      offset + PAGINATION_PAGE_LENGTH,
      queryParams
    )
  }, [actions, offset, queryParams, mangoAccountAddress])

  return mangoAccountAddress && (activityFeed.length || loadActivityFeed) ? (
    <>
      {showTableView ? (
        <Table className="min-w-full">
          <thead>
            <TrHead>
              <Th className="bg-th-bkg-1 text-left">{t('date')}</Th>
              <Th className="bg-th-bkg-1 text-right">
                {t('activity:activity')}
              </Th>
              <Th className="bg-th-bkg-1 text-right">{t('activity:credit')}</Th>
              <Th className="bg-th-bkg-1 text-right">{t('activity:debit')}</Th>
              <Th className="flex justify-end bg-th-bkg-1">
                <Tooltip content={t('activity:tooltip-fee')} delay={100}>
                  <span className="tooltip-underline">{t('fee')}</span>
                </Tooltip>
              </Th>
              <Th className="bg-th-bkg-1 text-right">{t('value')}</Th>
              <Th className="bg-th-bkg-1 text-right">{t('explorer')}</Th>
            </TrHead>
          </thead>
          <tbody>
            {activityFeed.map((activity, index: number) => {
              const { activity_type, block_datetime } = activity
              const { signature } = activity.activity_details
              const isLiquidation =
                activity_type === 'liquidate_token_with_token'
              const isOpenbook = activity_type === 'openbook_trade'
              const amounts = getCreditAndDebit(activity)
              const value = getValue(activity)
              const fee = getFee(activity, mangoAccountAddress)
              return (
                <TrBody
                  key={signature + index}
                  className={`default-transition text-sm hover:bg-th-bkg-2 ${
                    isLiquidation ? 'cursor-pointer' : ''
                  }`}
                  onClick={
                    isLiquidationFeedItem(activity)
                      ? () => handleShowActivityDetails(activity)
                      : undefined
                  }
                >
                  <Td>
                    <p className="font-body">
                      {dayjs(block_datetime).format('ddd D MMM')}
                    </p>
                    <p className="text-xs text-th-fgd-3">
                      {dayjs(block_datetime).format('h:mma')}
                    </p>
                  </Td>
                  <Td className="text-right">
                    {t(`activity:${activity_type}`)}
                  </Td>
                  <Td className="text-right font-mono">
                    {amounts.credit.value}{' '}
                    <span className="font-body text-th-fgd-3">
                      {amounts.credit.symbol}
                    </span>
                  </Td>
                  <Td className="text-right font-mono">
                    {amounts.debit.value}{' '}
                    <span className="font-body text-th-fgd-3">
                      {amounts.debit.symbol}
                    </span>
                  </Td>
                  <Td className="text-right font-mono">
                    {activity_type === 'perp'
                      ? (Number(fee.value) * value).toFixed(5)
                      : fee.value}{' '}
                    <span className="font-body text-th-fgd-3">
                      {fee.symbol}
                    </span>
                  </Td>
                  <Td
                    className={`text-right font-mono ${
                      activity_type === 'swap' ||
                      activity_type === 'perp_trade' ||
                      isOpenbook
                        ? 'text-th-fgd-2'
                        : value >= 0
                        ? 'text-th-up'
                        : 'text-th-down'
                    }`}
                  >
                    {value > 0 &&
                    activity_type !== 'swap' &&
                    activity_type !== 'perp_trade' &&
                    !isOpenbook
                      ? '+'
                      : ''}
                    <FormatNumericValue value={value} isUsd />
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
          {activityFeed.map((activity: any, index: number) => (
            <MobileActivityFeedItem
              activity={activity}
              getValue={getValue}
              key={activity?.activity_details?.signature + index}
            />
          ))}
        </div>
      )}
      {loadActivityFeed ? (
        <div className="mt-4 space-y-1.5">
          {[...Array(4)].map((x, i) => (
            <SheenLoader className="mx-4 flex flex-1 md:mx-6" key={i}>
              <div className="h-16 w-full bg-th-bkg-2" />
            </SheenLoader>
          ))}
        </div>
      ) : null}
      {activityFeed.length &&
      activityFeed.length % PAGINATION_PAGE_LENGTH === 0 ? (
        <div className="flex justify-center py-6">
          <LinkButton onClick={handleShowMore}>{t('show-more')}</LinkButton>
        </div>
      ) : null}
    </>
  ) : mangoAccountAddress || connected ? (
    <div className="flex flex-col items-center p-8">
      <NoSymbolIcon className="mb-2 h-6 w-6 text-th-fgd-4" />
      <p>{t('activity:no-activity')}</p>
    </div>
  ) : (
    <div className="p-8">
      <ConnectEmptyState text={t('activity:connect-activity')} />
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
  const isSwap = activity_type === 'swap'
  const isOpenbook = activity_type === 'openbook_trade'
  const isPerp = activity_type === 'perp_trade'
  const value = getValue(activity)

  return (
    <div key={signature} className="border-b border-th-bkg-3 p-4">
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
              {t(`activity:${activity_type}`)}
            </p>
            <p className="text-right font-mono text-sm text-th-fgd-1">
              {isLiquidation ? (
                <FormatNumericValue value={value} isUsd />
              ) : isSwap ? (
                <>
                  <span className="mr-1">
                    <FormatNumericValue
                      value={activity.activity_details.swap_in_amount}
                      decimals={6}
                    />
                  </span>
                  <span className="font-body text-th-fgd-3">
                    {activity.activity_details.swap_in_symbol}
                  </span>
                  <span className="mx-1 font-body text-th-fgd-3">for</span>
                  <span className="mr-1">
                    <FormatNumericValue
                      value={activity.activity_details.swap_out_amount}
                      decimals={6}
                    />
                  </span>
                  <span className="font-body text-th-fgd-3">
                    {activity.activity_details.swap_out_symbol}
                  </span>
                </>
              ) : isPerp ? (
                <>
                  <span className="mr-1">
                    {activity.activity_details.quantity}
                  </span>
                  <span className="font-body text-th-fgd-3">
                    {activity.activity_details.perp_market_name}
                  </span>
                  <span className="font-body">
                    {' '}
                    <PerpSideBadge
                      basePosition={
                        activity.activity_details.taker_side === 'bid' ? 1 : -1
                      }
                    />
                  </span>
                </>
              ) : isOpenbook ? (
                <>
                  {/* <span
                    className={`mr-1 font-body ${
                      activity.activity_details.side === 'buy'
                        ? 'text-th-up'
                        : 'text-th-down'
                    }`}
                  >
                    {activity.activity_details.side === 'buy' ? 'BUY' : 'SELL'}
                  </span> */}
                  <span className="mr-1">{activity.activity_details.size}</span>
                  <span className="font-body text-th-fgd-3">
                    {activity.activity_details.base_symbol}
                  </span>
                  <span className="font-body">
                    {' '}
                    <SideBadge side={activity.activity_details.side} />
                  </span>
                </>
              ) : (
                <>
                  <span className="mr-1">
                    {activity.activity_details.quantity}
                  </span>
                  <span className="font-body text-th-fgd-3">
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
              <FormatNumericValue
                value={activity.activity_details.asset_amount}
              />{' '}
              <span className="font-body">
                {activity.activity_details.asset_symbol}
              </span>
              <span className="ml-2 font-body text-th-fgd-3">at</span>{' '}
              <FormatNumericValue
                value={activity.activity_details.asset_price}
                isUsd
              />
            </p>
            <p className="font-mono text-xs text-th-fgd-3">
              <FormatNumericValue
                value={
                  activity.activity_details.asset_price *
                  activity.activity_details.asset_amount
                }
                isUsd
              />
            </p>
          </div>
          <div className="col-span-1">
            <p className="mb-0.5 text-sm">{t('activity:asset-returned')}</p>
            <p className="font-mono text-sm text-th-fgd-1">
              <FormatNumericValue
                value={activity.activity_details.liab_amount}
              />{' '}
              <span className="font-body">
                {activity.activity_details.liab_symbol}
              </span>
              <span className="ml-2 font-body text-th-fgd-3">at</span>{' '}
              <FormatNumericValue
                value={activity.activity_details.liab_price}
                isUsd
              />
            </p>
            <p className="font-mono text-xs text-th-fgd-3">
              <FormatNumericValue
                value={
                  activity.activity_details.liab_price *
                  activity.activity_details.liab_amount
                }
                isUsd
              />
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
              <span className="ml-2 text-base">{t('view-transaction')}</span>
            </a>
          </div>
        </div>
      </Transition>
    </div>
  )
}
