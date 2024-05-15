import { useEffect, useState } from 'react'
import SwapHistoryTable from '../swap/SwapHistoryTable'
import TradeHistory from '@components/trade/TradeHistory'
import mangoStore from '@store/mangoStore'
import useMangoAccount from 'hooks/useMangoAccount'
import ActivityFeedTable, {
  getCreditAndDebit,
  getFee,
  getValue,
} from './ActivityFeedTable'
import { handleExport } from 'utils/export'
import { LinkButton } from '@components/shared/Button'
import Loading from '@components/shared/Loading'
import { ArrowDownTrayIcon } from '@heroicons/react/20/solid'
import {
  countLeadingZeros,
  floorToDecimal,
  formatCurrencyValue,
  formatNumericValue,
} from 'utils/numbers'
import { formatTokenSymbol } from 'utils/tokens'
import { fetchTradeHistory, parseApiTradeHistory } from 'hooks/useTradeHistory'
import { PublicKey } from '@solana/web3.js'
import { PerpMarket } from '@blockworks-foundation/mango-v4'
import useUnownedAccount from 'hooks/useUnownedAccount'
import SecondaryTabBar from '@components/shared/SecondaryTabBar'
import ActivityFilters from './ActivityFilters'
import { useTranslation } from 'react-i18next'
import FundingTable, { fetchMarginFunding } from './FundingTable'
import {
  MarginFundingFeed,
  isCollateralFundingItem,
  isPerpFundingItem,
} from 'types'
import dayjs from 'dayjs'

type FundingExportItem = {
  asset: string
  amount: string
  time: string
  type: string
  value?: string
}

const TABS = [
  'activity:activity-feed',
  'activity:swaps',
  'activity:trades',
  'funding',
]

const HistoryTabs = () => {
  const { t } = useTranslation(['common', 'account', 'activity', 'trade'])
  const [activeTab, setActiveTab] = useState<string>('activity:activity-feed')
  const actions = mangoStore((s) => s.actions)
  const { mangoAccountAddress } = useMangoAccount()
  const { isUnownedAccount } = useUnownedAccount()
  const [loadExportData, setLoadExportData] = useState(false)

  useEffect(() => {
    if (actions && mangoAccountAddress) {
      actions.fetchActivityFeed(mangoAccountAddress)
    }
  }, [actions, mangoAccountAddress])

  const exportActivityDataToCSV = async () => {
    setLoadExportData(true)
    await actions.fetchActivityFeed(mangoAccountAddress, 0, '', 10000)
    const activityFeed = mangoStore.getState().activityFeed.feed
    const dataToExport = activityFeed.map((row) => {
      const { activity_type, block_datetime } = row
      const { signature } = row.activity_details
      const amounts = getCreditAndDebit(row, mangoAccountAddress)
      const value = getValue(row, mangoAccountAddress)
      const fee = getFee(row, mangoAccountAddress)
      const timestamp = new Date(block_datetime)
      return {
        date: `${timestamp.toLocaleDateString()} ${timestamp.toLocaleTimeString()}`,
        activity: t(`activity:${activity_type}`),
        credit: `${amounts.credit.value} ${amounts.credit.symbol}`,
        debit: `${amounts.debit.value} ${amounts.debit.symbol}`,
        fee: `${fee.value} ${fee.symbol}`,
        value: value.toFixed(3),
        signature,
      }
    })

    const title = `${mangoAccountAddress}-Activity-${new Date().toLocaleDateString()}`

    handleExport(dataToExport, title)
    setLoadExportData(false)
  }

  const exportSwapsDataToCSV = async () => {
    setLoadExportData(true)
    await actions.fetchSwapHistory(mangoAccountAddress, 0, 0, 10000)
    const swapHistory = mangoStore.getState().mangoAccount.swapHistory.data
    const dataToExport = swapHistory.map((row) => {
      const {
        block_datetime,
        signature,
        swap_in_amount,
        swap_in_loan_origination_fee,
        swap_in_symbol,
        swap_out_amount,
        loan,
        loan_origination_fee,
        swap_out_price_usd,
        swap_out_symbol,
      } = row
      const borrowAmount =
        loan > 0 ? `${floorToDecimal(loan, countLeadingZeros(loan) + 2)}` : 0
      const borrowFee =
        swap_in_loan_origination_fee > 0
          ? swap_in_loan_origination_fee.toFixed(4)
          : loan_origination_fee > 0
          ? loan_origination_fee.toFixed(4)
          : 0

      const inSymbol = formatTokenSymbol(swap_in_symbol)
      const outSymbol = formatTokenSymbol(swap_out_symbol)

      const inDecimals = countLeadingZeros(swap_in_amount) + 2
      const outDecimals = countLeadingZeros(swap_out_amount) + 2
      const timestamp = new Date(block_datetime)

      return {
        date: `${timestamp.toLocaleDateString()} ${timestamp.toLocaleTimeString()}`,
        paid: `${formatNumericValue(swap_in_amount, inDecimals)} ${inSymbol}`,
        received: `${formatNumericValue(
          swap_out_amount,
          outDecimals,
        )} ${outSymbol}`,
        value: formatCurrencyValue(swap_out_price_usd * swap_out_amount),
        borrow: `${borrowAmount} ${inSymbol}`,
        ['borrow fee']: `${borrowFee} ${inSymbol}`,
        signature,
      }
    })

    const title = `${mangoAccountAddress}-Swaps-${new Date().toLocaleDateString()}`

    handleExport(dataToExport, title)
    setLoadExportData(false)
  }

  const exportTradesDataToCSV = async () => {
    setLoadExportData(true)
    const group = mangoStore.getState().group
    if (!group) return
    const tradeHistory = await fetchTradeHistory(mangoAccountAddress, 0, 10000)
    const dataToExport = tradeHistory.map((row) => {
      const trade = parseApiTradeHistory(mangoAccountAddress, row)
      const timestamp = new Date(trade.block_datetime)
      let market
      if ('market' in trade) {
        market = group.getSerum3MarketByExternalMarket(
          new PublicKey(trade.market),
        )
      } else if ('perp_market' in trade) {
        market = group.getPerpMarketByMarketIndex(trade.market_index)
      }
      const { side, price, size, feeCost, liquidity, signature } = trade
      return {
        date: `${timestamp.toLocaleDateString()} ${timestamp.toLocaleTimeString()}`,
        market: market?.name,
        side:
          market instanceof PerpMarket
            ? side === 'buy'
              ? t('trade:long')
              : t('trade:short')
            : t(side),
        size: size,
        price: price,
        value: (price * size).toFixed(2),
        fee: formatNumericValue(feeCost),
        type: liquidity,
        signature,
      }
    })

    const title = `${mangoAccountAddress}-Trades-${new Date().toLocaleDateString()}`

    handleExport(dataToExport, title)
    setLoadExportData(false)
  }

  const exportFundingDataToCSV = async () => {
    setLoadExportData(true)
    try {
      const fundingHistory = await fetchMarginFunding(
        mangoAccountAddress,
        0,
        true,
      )
      if (fundingHistory && fundingHistory?.length) {
        const dataToExport: FundingExportItem[] = []
        fundingHistory.forEach((item: MarginFundingFeed) => {
          const time = dayjs(item.date_time).format('DD MMM YYYY, h:mma')
          if (isPerpFundingItem(item)) {
            const asset = item.activity_details.perp_market
            const amount =
              item.activity_details.long_funding +
              item.activity_details.short_funding
            const type = 'Perp'
            const perpFundingItem = {
              time,
              asset,
              type,
              amount: formatCurrencyValue(amount),
            }
            if (Math.abs(amount) > 0) {
              dataToExport.push(perpFundingItem)
            }
          }
          if (isCollateralFundingItem(item)) {
            const asset = item.activity_details.symbol
            const amount = item.activity_details.fee_tokens * -1
            const value = item.activity_details.fee_value_usd * -1
            const type = 'Collateral'
            const collateralFundingItem = {
              time,
              asset,
              type,
              amount: formatNumericValue(amount),
              value: formatCurrencyValue(value),
            }
            dataToExport.push(collateralFundingItem)
          }
        })
        dataToExport.sort(
          (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
        )

        const title = `${mangoAccountAddress}-Funding-${new Date().toLocaleDateString()}`

        handleExport(dataToExport, title)
      }
    } catch (e) {
      console.log('failed to export funding data', e)
    } finally {
      setLoadExportData(false)
    }
  }

  const handleExportData = (dataType: string) => {
    if (dataType === 'activity:activity-feed') {
      exportActivityDataToCSV()
    } else if (dataType === 'activity:swaps') {
      exportSwapsDataToCSV()
    } else if (dataType === 'funding') {
      exportFundingDataToCSV()
    } else {
      exportTradesDataToCSV()
    }
  }

  return (
    <>
      <div className="relative">
        <SecondaryTabBar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          tabs={TABS}
        />
        <div className="flex w-full items-center justify-end border-b border-th-bkg-3 py-3 pr-4 sm:-mt-14 sm:h-14 sm:border-b-0 sm:py-0 md:pr-6">
          {!isUnownedAccount ? (
            <LinkButton
              className="flex items-center font-normal no-underline"
              disabled={loadExportData}
              onClick={() => handleExportData(activeTab)}
            >
              <span className="mr-2">
                {t('account:export', { dataType: t(activeTab) })}
              </span>
              {loadExportData ? (
                <Loading />
              ) : (
                <ArrowDownTrayIcon className="h-5 w-5" />
              )}
            </LinkButton>
          ) : null}
          {activeTab === 'activity:activity-feed' ? <ActivityFilters /> : null}
        </div>
      </div>
      <TabContent activeTab={activeTab} />
    </>
  )
}

const TabContent = ({ activeTab }: { activeTab: string }) => {
  switch (activeTab) {
    case 'activity:activity-feed':
      return <ActivityFeedTable />
    case 'activity:swaps':
      return <SwapHistoryTable />
    case 'activity:trades':
      return <TradeHistory />
    case 'funding':
      return <FundingTable />
    default:
      return <ActivityFeedTable />
  }
}

export default HistoryTabs
