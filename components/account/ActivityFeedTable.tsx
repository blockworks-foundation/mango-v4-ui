/* eslint-disable @typescript-eslint/no-explicit-any */
import { EXPLORERS } from '@components/settings/PreferredExplorerSettings'
import { LinkButton } from '@components/shared/Button'
import ConnectEmptyState from '@components/shared/ConnectEmptyState'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import SheenLoader from '@components/shared/SheenLoader'
import SideBadge from '@components/shared/SideBadge'
import {
  Table,
  TableDateDisplay,
  Td,
  Th,
  TrBody,
  TrHead,
} from '@components/shared/TableElements'
import Tooltip from '@components/shared/Tooltip'
import { Disclosure, Transition } from '@headlessui/react'
import PerpSideBadge from '@components/trade/PerpSideBadge'
import { ChevronDownIcon, NoSymbolIcon } from '@heroicons/react/20/solid'
import { useWallet } from '@solana/wallet-adapter-react'
import mangoStore from '@store/mangoStore'
import useLocalStorageState from 'hooks/useLocalStorageState'
import useMangoAccount from 'hooks/useMangoAccount'
import { useViewport } from 'hooks/useViewport'
import { useTranslation } from 'next-i18next'
import Image from 'next/legacy/image'
import { useCallback, useState } from 'react'
import { PAGINATION_PAGE_LENGTH, PREFERRED_EXPLORER_KEY } from 'utils/constants'
import { formatCurrencyValue, formatNumericValue } from 'utils/numbers'
import { breakpoints } from 'utils/theme'
import LiquidationActivityDetails from './LiquidationActivityDetails'
import PerpTradeActivityDetails from './PerpTradeActivityDetails'
import {
  isLiquidationActivityFeedItem,
  isPerpTradeActivityFeedItem,
  isSpotTradeActivityFeedItem,
} from 'types'
import SpotTradeActivityDetails from './SpotTradeActivityDetails'
import { formatTokenSymbol } from 'utils/tokens'

export const formatFee = (value: number) => {
  return value.toLocaleString(undefined, {
    minimumSignificantDigits: 1,
    maximumSignificantDigits: 3,
  })
}

export const getFee = (activity: any, mangoAccountAddress: string) => {
  const { activity_type } = activity
  let fee = { value: '0', symbol: '' }
  if (activity_type === 'swap') {
    const { loan_origination_fee, swap_in_symbol } = activity.activity_details
    fee = loan_origination_fee
      ? { value: formatFee(loan_origination_fee), symbol: swap_in_symbol }
      : { value: '0', symbol: '' }
  }
  if (activity_type === 'perp_trade') {
    const { maker_fee, taker_fee, maker, price, quantity } =
      activity.activity_details
    const value = price * quantity
    fee = {
      value: formatFee(
        mangoAccountAddress === maker ? maker_fee * value : taker_fee * value,
      ),
      symbol: 'USDC',
    }
  }
  if (activity_type === 'openbook_trade') {
    const { fee_cost, quote_symbol } = activity.activity_details
    fee = { value: fee_cost, symbol: quote_symbol }
  }
  if (activity_type === 'withdraw') {
    const { borrow_fee, symbol } = activity.activity_details
    fee = { value: formatFee(borrow_fee), symbol }
  }
  if (activity_type == 'loan_origination_fee') {
    const { fee: settleFee, symbol } = activity.activity_details
    fee = { value: formatFee(settleFee), symbol }
  }
  if (activity_type === 'liquidate_token_with_token') {
    const { side, liab_transfer, liab_price, asset_transfer, asset_price } =
      activity.activity_details
    if (side === 'liqee') {
      fee = {
        value: formatCurrencyValue(
          Math.abs(liab_transfer * liab_price) -
            Math.abs(asset_transfer * asset_price),
        ),
        symbol: '',
      }
    } else {
      fee = {
        value: formatCurrencyValue(
          Math.abs(asset_transfer * asset_price) -
            Math.abs(liab_transfer * liab_price),
        ),
        symbol: '',
      }
    }
  }
  if (activity_type === 'liquidate_perp_base_position_or_positive_pnl') {
    const { base_transfer, price, quote_transfer } = activity.activity_details
    if (base_transfer > 0) {
      fee = {
        value: formatNumericValue(
          Math.abs(base_transfer * price) - Math.abs(quote_transfer),
        ),
        symbol: 'USDC',
      }
    } else {
      fee = {
        value: formatNumericValue(
          Math.abs(quote_transfer) - Math.abs(base_transfer * price),
        ),
        symbol: 'USDC',
      }
    }
  }
  return fee
}

export const getCreditAndDebit = (
  activity: any,
  mangoAccountAddress: string,
) => {
  const { activity_type } = activity
  let credit = { value: '0', symbol: '' }
  let debit = { value: '0', symbol: '' }
  if (activity_type === 'liquidate_token_with_token') {
    const { side, liab_transfer, liab_symbol, asset_transfer, asset_symbol } =
      activity.activity_details
    if (side === 'liqee') {
      credit = { value: formatNumericValue(liab_transfer), symbol: liab_symbol }
      debit = {
        value: formatNumericValue(asset_transfer),
        symbol: asset_symbol,
      }
    } else {
      credit = {
        value: formatNumericValue(asset_transfer),
        symbol: asset_symbol,
      }
      debit = { value: formatNumericValue(liab_transfer), symbol: liab_symbol }
    }
  }
  if (activity_type === 'liquidate_perp_base_position_or_positive_pnl') {
    const { base_transfer, perp_market_name, quote_transfer } =
      activity.activity_details
    if (base_transfer > 0) {
      credit = {
        value: formatNumericValue(base_transfer),
        symbol: perp_market_name,
      }
      debit = { value: formatNumericValue(quote_transfer), symbol: 'USDC' }
    } else {
      credit = { value: formatNumericValue(quote_transfer), symbol: 'USDC' }
      debit = {
        value: formatNumericValue(base_transfer),
        symbol: perp_market_name,
      }
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
    const {
      maker_fee,
      perp_market_name,
      price,
      quantity,
      taker,
      taker_fee,
      taker_side,
    } = activity.activity_details
    const side =
      taker === mangoAccountAddress
        ? taker_side
        : taker_side === 'bid'
        ? 'ask'
        : 'bid'
    const feeRatio = taker === mangoAccountAddress ? taker_fee : maker_fee
    const notional = quantity * price
    const fee = feeRatio * notional
    if (side === 'bid') {
      credit = { value: quantity, symbol: perp_market_name }
      debit = {
        value: formatNumericValue((notional + fee) * -1),
        symbol: 'USDC',
      }
    } else {
      credit = {
        value: formatNumericValue(notional - fee),
        symbol: 'USDC',
      }
      debit = { value: `-${quantity}`, symbol: perp_market_name }
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

export const getValue = (activity: any, mangoAccountAddress: string) => {
  const { activity_type } = activity
  let value = 0
  if (activity_type === 'liquidate_token_with_token') {
    const { asset_transfer, asset_price } = activity.activity_details
    value = Math.abs(asset_transfer * asset_price)
  }
  if (activity_type === 'liquidate_perp_base_position_or_positive_pnl') {
    const { base_transfer, price, quote_transfer, side } =
      activity.activity_details
    if (base_transfer > 0) {
      if (side === 'liqee') {
        value = Math.abs(quote_transfer)
      } else {
        value = Math.abs(base_transfer * price)
      }
    } else {
      if (side === 'liqee') {
        value = Math.abs(base_transfer * price)
      } else {
        value = Math.abs(quote_transfer)
      }
    }
  }
  if (activity_type === 'deposit' || activity_type === 'withdraw') {
    const { usd_equivalent } = activity.activity_details
    value = activity_type === 'withdraw' ? usd_equivalent : usd_equivalent * -1
  }
  if (activity_type === 'swap') {
    const { swap_out_amount, swap_out_price_usd } = activity.activity_details
    value = swap_out_amount * swap_out_price_usd
  }
  if (activity_type === 'perp_trade') {
    const { price, quantity, taker, taker_fee, maker_fee } =
      activity.activity_details
    const isTaker = taker === mangoAccountAddress
    const feeRatio = isTaker ? taker_fee : maker_fee
    const notional = quantity * price
    const fee = feeRatio * notional
    value = isTaker ? notional + fee : notional - fee
  }
  if (activity_type === 'openbook_trade') {
    const { price, size } = activity.activity_details
    value = price * size
  }
  if (activity_type === 'loan_origination_fee') {
    const { price, fee } = activity.activity_details
    value = price * fee
  }
  return -value
}

const ActivityFeedTable = () => {
  const { t } = useTranslation(['common', 'activity'])
  const activityFeed = mangoStore((s) => s.activityFeed.feed)
  const { mangoAccountAddress } = useMangoAccount()
  const actions = mangoStore((s) => s.actions)
  const loadActivityFeed = mangoStore((s) => s.activityFeed.loading)
  const queryParams = mangoStore((s) => s.activityFeed.queryParams)
  const [offset, setOffset] = useState(0)
  const { connected } = useWallet()
  const [preferredExplorer] = useLocalStorageState(
    PREFERRED_EXPLORER_KEY,
    EXPLORERS[0],
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
      queryParams,
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
              const isOpenbook = activity_type === 'openbook_trade'
              const amounts = getCreditAndDebit(activity, mangoAccountAddress)
              const value = getValue(activity, mangoAccountAddress)
              const fee = getFee(activity, mangoAccountAddress)
              const isExpandable =
                isLiquidationActivityFeedItem(activity) ||
                isPerpTradeActivityFeedItem(activity) ||
                isSpotTradeActivityFeedItem(activity)
              return isExpandable ? (
                <Disclosure key={`${signature}${index}`}>
                  {({ open }) => (
                    <>
                      <Disclosure.Button
                        as={TrBody}
                        className="default-transition cursor-pointer text-sm md:hover:bg-th-bkg-2"
                      >
                        <SharedTableBody
                          activity_type={activity_type}
                          amounts={amounts}
                          block_datetime={block_datetime}
                          isExpandable={true}
                          isOpenbook={isOpenbook}
                          fee={fee}
                          value={value}
                        />
                        <Td>
                          <div className="flex items-center justify-end">
                            <ChevronDownIcon
                              className={`h-6 w-6 text-th-fgd-3 ${
                                open ? 'rotate-180' : 'rotate-0'
                              }`}
                            />
                          </div>
                        </Td>
                      </Disclosure.Button>
                      <Disclosure.Panel as={TrBody}>
                        {isLiquidationActivityFeedItem(activity) ? (
                          <td className="p-6" colSpan={7}>
                            <LiquidationActivityDetails activity={activity} />
                          </td>
                        ) : isPerpTradeActivityFeedItem(activity) ? (
                          <td className="p-6" colSpan={7}>
                            <PerpTradeActivityDetails activity={activity} />
                          </td>
                        ) : isSpotTradeActivityFeedItem(activity) ? (
                          <td className="p-6" colSpan={7}>
                            <SpotTradeActivityDetails activity={activity} />
                          </td>
                        ) : null}
                      </Disclosure.Panel>
                    </>
                  )}
                </Disclosure>
              ) : (
                <TrBody key={`${signature}${index}`}>
                  <SharedTableBody
                    activity_type={activity_type}
                    amounts={amounts}
                    block_datetime={block_datetime}
                    isExpandable={false}
                    isOpenbook={isOpenbook}
                    fee={fee}
                    value={value}
                  />
                  <Td>
                    <div className="flex items-center justify-end">
                      <Tooltip
                        content={`View on ${t(
                          `settings:${preferredExplorer.name}`,
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
    <div className="flex flex-1 flex-col items-center justify-center">
      <div className="flex flex-col items-center p-8">
        <NoSymbolIcon className="mb-2 h-6 w-6 text-th-fgd-4" />
        <p>{t('activity:no-activity')}</p>
      </div>
    </div>
  ) : (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      <ConnectEmptyState text={t('activity:connect-activity')} />
    </div>
  )
}

export default ActivityFeedTable

interface SharedTableBodyProps {
  block_datetime: string
  activity_type: string
  amounts: {
    credit: { value: string; symbol: string }
    debit: { value: string; symbol: string }
  }
  isExpandable: boolean
  fee: { value: string; symbol: string }
  isOpenbook: boolean
  value: number
}

const SharedTableBody = ({
  block_datetime,
  activity_type,
  amounts,
  isExpandable,
  fee,
  isOpenbook,
  value,
}: SharedTableBodyProps) => {
  const { t } = useTranslation('activity')
  return (
    <>
      <Td>
        <TableDateDisplay date={block_datetime} showSeconds />
      </Td>
      <Td className="text-right">{t(`activity:${activity_type}`)}</Td>
      <Td className="text-right font-mono">
        {amounts.credit.value}{' '}
        <span className="font-body text-th-fgd-3">
          {formatTokenSymbol(amounts.credit.symbol)}
        </span>
      </Td>
      <Td className="text-right font-mono">
        {amounts.debit.value}{' '}
        <span className="font-body text-th-fgd-3">
          {formatTokenSymbol(amounts.debit.symbol)}
        </span>
      </Td>
      <Td className="text-right font-mono">
        {fee.value}{' '}
        <span className="font-body text-th-fgd-3">{fee.symbol}</span>
      </Td>
      <Td
        className={`text-right font-mono ${
          activity_type === 'swap' || isOpenbook || isExpandable
            ? 'text-th-fgd-2'
            : value >= 0
            ? 'text-th-up'
            : 'text-th-down'
        }`}
      >
        {value > 0 && activity_type !== 'swap' && !isOpenbook && !isExpandable
          ? '+'
          : ''}
        <FormatNumericValue value={value} isUsd />
      </Td>
    </>
  )
}

const MobileActivityFeedItem = ({
  activity,
  getValue,
}: {
  activity: any
  getValue: (a: any, m: string) => number
}) => {
  const { t } = useTranslation(['common', 'activity'])
  const [preferredExplorer] = useLocalStorageState(
    PREFERRED_EXPLORER_KEY,
    EXPLORERS[0],
  )
  const { mangoAccountAddress } = useMangoAccount()
  const { activity_type, block_datetime } = activity
  const { signature } = activity.activity_details
  const isSwap = activity_type === 'swap'
  const value = getValue(activity, mangoAccountAddress)
  const isExpandable =
    isLiquidationActivityFeedItem(activity) ||
    isPerpTradeActivityFeedItem(activity) ||
    isSpotTradeActivityFeedItem(activity)

  const isPerpTaker =
    isPerpTradeActivityFeedItem(activity) &&
    activity.activity_details.taker === mangoAccountAddress

  const perpTradeSide = isPerpTaker
    ? activity.activity_details.taker_side
    : activity.activity_details.taker_side === 'bid'
    ? 'ask'
    : 'bid'

  return (
    <div key={signature} className="border-b border-th-bkg-3">
      {isExpandable ? (
        <Disclosure>
          {({ open }) => (
            <>
              <Disclosure.Button className="w-full p-4 text-left focus:outline-none">
                <div className="flex items-center justify-between">
                  <div>
                    <TableDateDisplay date={block_datetime} showSeconds />
                  </div>
                  <div className="flex items-center space-x-6 pr-2">
                    <div>
                      <p className="text-right text-xs">
                        {t(`activity:${activity_type}`)}
                      </p>
                      {isLiquidationActivityFeedItem(activity) ? (
                        <p className="text-right font-mono text-sm text-th-fgd-1">
                          <FormatNumericValue value={value} isUsd />
                        </p>
                      ) : isPerpTradeActivityFeedItem(activity) ? (
                        <p className="font-mono text-th-fgd-1">
                          <span className="mr-1">
                            {activity.activity_details.quantity}
                          </span>
                          <span className="font-body text-th-fgd-3">
                            {activity.activity_details.perp_market_name}
                          </span>
                          <span className="font-body">
                            {' '}
                            <PerpSideBadge
                              basePosition={perpTradeSide === 'bid' ? 1 : -1}
                            />
                          </span>
                        </p>
                      ) : isSpotTradeActivityFeedItem(activity) ? (
                        <p className="font-mono text-th-fgd-1">
                          <span className="mr-1">
                            {activity.activity_details.size}
                          </span>
                          <span className="font-body text-th-fgd-3">
                            {`${activity.activity_details.base_symbol}/${activity.activity_details.quote_symbol}`}
                          </span>
                          <span className="font-body">
                            {' '}
                            <SideBadge side={activity.activity_details.side} />
                          </span>
                        </p>
                      ) : null}
                    </div>
                    <ChevronDownIcon
                      className={`${
                        open ? 'rotate-180' : 'rotate-0'
                      } h-6 w-6 shrink-0 text-th-fgd-3`}
                    />
                  </div>
                </div>
              </Disclosure.Button>
              <Transition
                enter="transition ease-in duration-200"
                enterFrom="opacity-0"
                enterTo="opacity-100"
              >
                <Disclosure.Panel>
                  <div className="border-t border-th-bkg-3 p-4">
                    {isLiquidationActivityFeedItem(activity) ? (
                      <LiquidationActivityDetails activity={activity} />
                    ) : isPerpTradeActivityFeedItem(activity) ? (
                      <PerpTradeActivityDetails activity={activity} />
                    ) : isSpotTradeActivityFeedItem(activity) ? (
                      <SpotTradeActivityDetails activity={activity} />
                    ) : null}
                  </div>
                </Disclosure.Panel>
              </Transition>
            </>
          )}
        </Disclosure>
      ) : (
        <div className="flex items-center justify-between p-4">
          <div>
            <TableDateDisplay date={block_datetime} showSeconds />
          </div>
          <div className="flex items-center space-x-4">
            <div>
              <p className="text-right text-xs">
                {t(`activity:${activity_type}`)}
              </p>
              <p className="text-right font-mono text-sm text-th-fgd-1">
                {isSwap ? (
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
          </div>
        </div>
      )}
    </div>
  )
}
