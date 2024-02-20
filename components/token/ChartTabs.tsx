import { Bank } from '@blockworks-foundation/mango-v4'
import TabButtons from '@components/shared/TabButtons'
import mangoStore from '@store/mangoStore'
import { useTranslation } from 'next-i18next'
import { useEffect, useMemo, useState } from 'react'
import { TokenStatsItem } from 'types'
import { formatYAxis } from 'utils/formatting'
import DetailedAreaOrBarChart from '@components/shared/DetailedAreaOrBarChart'
import TokenRatesChart from './TokenRatesChart'
import Switch from '@components/forms/Switch'

const SWITCH_WRAPPER_CLASSES =
  'mt-4 flex justify-end space-x-4 border-t border-th-bkg-3 px-4 py-2 md:px-6'

interface GroupedTokenDataItem extends TokenStatsItem {
  intervalStartMillis: number
}

const groupTokenByHourlyInterval = (
  data: TokenStatsItem[],
  daysToShow: string,
  dataKey: 'total_deposits' | 'total_borrows',
) => {
  let intervalDurationHours
  if (daysToShow === '30') {
    intervalDurationHours = 24
  } else if (daysToShow === '7') {
    intervalDurationHours = 4
  } else {
    intervalDurationHours = 1
  }
  const intervalMillis = intervalDurationHours * 60 * 60 * 1000
  const groupedData = []
  let currentGroup: GroupedTokenDataItem | null = null
  for (let i = 0; i < data.length; i++) {
    const obj = data[i]
    const date = new Date(obj.date_hour)
    const intervalStartMillis =
      Math.floor(date.getTime() / intervalMillis) * intervalMillis
    if (
      !currentGroup ||
      currentGroup.intervalStartMillis !== intervalStartMillis
    ) {
      currentGroup = {
        ...obj,
        intervalStartMillis: intervalStartMillis,
      }
      groupedData.push(currentGroup)
    } else {
      currentGroup[dataKey] += obj[dataKey]
    }
  }
  return groupedData
}

const ChartTabs = ({ bank }: { bank: Bank }) => {
  const { t } = useTranslation('token')
  const [showDepositsRelativeChange, setShowDepositsRelativeChange] =
    useState(true)
  const [showDepositsNotional, setShowDepositsNotional] = useState(false)
  const [showBorrowsRelativeChange, setShowBorrowsRelativeChange] =
    useState(true)
  const [showBorrowsNotional, setShowBorrowsNotional] = useState(false)
  const [activeDepositsTab, setActiveDepositsTab] = useState(
    'token:total-deposits',
  )
  const [activeBorrowsTab, setActiveBorrowsTab] = useState(
    'token:total-borrows',
  )
  const [depositDaysToShow, setDepositDaysToShow] = useState('30')
  const [borrowDaysToShow, setBorrowDaysToShow] = useState('30')
  const [depositRateDaysToShow, setDepositRateDaysToShow] = useState('30')
  const [borrowRateDaysToShow, setBorrowRateDaysToShow] = useState('30')
  const tokenStats = mangoStore((s) => s.tokenStats.data)
  const loadingTokenStats = mangoStore((s) => s.tokenStats.loading)
  const tokenStatsInitialLoad = mangoStore((s) => s.tokenStats.initialLoad)

  useEffect(() => {
    if (!tokenStatsInitialLoad) {
      const actions = mangoStore.getState().actions
      actions.fetchTokenStats()
    }
  }, [tokenStatsInitialLoad])

  const formattedStats = useMemo(() => {
    if (!tokenStats?.length) return []
    return tokenStats
      .filter((c) => c.token_index === bank.tokenIndex)
      .sort(
        (a, b) =>
          new Date(a.date_hour).getTime() - new Date(b.date_hour).getTime(),
      )
  }, [bank, tokenStats])

  const depositsStats = useMemo(() => {
    if (!formattedStats.length) return []

    if (showDepositsRelativeChange) {
      if (!showDepositsNotional) return formattedStats
      return formattedStats.map((currentStat) => {
        currentStat = {
          ...currentStat,
          total_deposits: currentStat.total_deposits * bank.uiPrice,
        }
        return currentStat
      })
    }

    return formattedStats
      .map((currentStat, index, array) => {
        const previousStat = array[index - 1]

        if (previousStat) {
          const isNotionalMultiplier = showDepositsNotional ? bank.uiPrice : 1
          currentStat = {
            ...currentStat,
            total_deposits:
              (currentStat.total_deposits - previousStat.total_deposits) *
              isNotionalMultiplier,
          }
        }

        return currentStat
      })
      .slice(1)
  }, [bank, formattedStats, showDepositsNotional, showDepositsRelativeChange])

  const borrowsStats = useMemo(() => {
    if (!formattedStats.length) return []

    if (showBorrowsRelativeChange) {
      if (!showBorrowsNotional) return formattedStats
      return formattedStats.map((currentStat) => {
        currentStat = {
          ...currentStat,
          total_borrows: currentStat.total_borrows * bank.uiPrice,
        }
        return currentStat
      })
    }

    return formattedStats
      .map((currentStat, index, array) => {
        const previousStat = array[index - 1]

        if (previousStat) {
          const isNotionalMultiplier = showBorrowsNotional ? bank.uiPrice : 1
          currentStat = {
            ...currentStat,
            total_borrows:
              (currentStat.total_borrows - previousStat.total_borrows) *
              isNotionalMultiplier,
          }
        }

        return currentStat
      })
      .slice(1)
  }, [bank, formattedStats, showBorrowsNotional, showBorrowsRelativeChange])

  return (
    <div className="grid grid-cols-1 overflow-x-hidden md:grid-cols-2">
      <div className="col-span-1 border-b border-th-bkg-3 md:border-b-0 md:border-r">
        <div className="w-full">
          <TabButtons
            activeValue={activeDepositsTab}
            onChange={(v) => setActiveDepositsTab(v)}
            showBorders
            values={[
              ['token:total-deposits', 0],
              ['token:deposit-rates', 0],
            ]}
          />
          <div className="border-t border-th-bkg-3">
            {activeDepositsTab === 'token:total-deposits' ? (
              <>
                <div className="px-4 pt-4 md:px-6 lg:pt-6">
                  <DetailedAreaOrBarChart
                    changeAsPercent
                    hideChange={!showDepositsRelativeChange}
                    data={
                      showDepositsRelativeChange
                        ? depositsStats
                        : groupTokenByHourlyInterval(
                            depositsStats,
                            depositDaysToShow,
                            'total_deposits',
                          )
                    }
                    daysToShow={depositDaysToShow}
                    setDaysToShow={setDepositDaysToShow}
                    heightClass="h-64"
                    loaderHeightClass="h-[334px]"
                    domain={[0, 'dataMax']}
                    loading={loadingTokenStats}
                    small
                    tickFormat={(x) => formatYAxis(x)}
                    title={`${t('token:deposits')}`}
                    xKey="date_hour"
                    yKey={'total_deposits'}
                    chartType={showDepositsRelativeChange ? 'area' : 'bar'}
                    prefix={showDepositsNotional ? '$' : ''}
                  />
                </div>
                <div className={SWITCH_WRAPPER_CLASSES}>
                  <Switch
                    checked={showDepositsRelativeChange}
                    onChange={() =>
                      setShowDepositsRelativeChange(!showDepositsRelativeChange)
                    }
                    small
                  >
                    {t('stats:show-relative')}
                  </Switch>
                  <Switch
                    checked={showDepositsNotional}
                    onChange={() =>
                      setShowDepositsNotional(!showDepositsNotional)
                    }
                    small
                  >
                    {t('stats:notional')}
                  </Switch>
                </div>
              </>
            ) : (
              <div className="px-4 pt-4 md:px-6 lg:pt-6">
                <TokenRatesChart
                  data={formattedStats}
                  dataKey="deposit_apr"
                  daysToShow={depositRateDaysToShow}
                  loading={loadingTokenStats}
                  setDaysToShow={setDepositRateDaysToShow}
                  title={`${t('token:average-deposit-rate')} (APR)`}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="col-span-1">
        <div className="w-full">
          <TabButtons
            activeValue={activeBorrowsTab}
            onChange={(v) => setActiveBorrowsTab(v)}
            showBorders
            values={[
              ['token:total-borrows', 0],
              ['token:borrow-rates', 0],
            ]}
          />
          <div className="border-t border-th-bkg-3">
            {activeBorrowsTab === 'token:total-borrows' ? (
              <>
                <div className="px-4 pt-4 md:px-6 lg:pt-6">
                  <DetailedAreaOrBarChart
                    changeAsPercent
                    hideChange={!showBorrowsRelativeChange}
                    data={
                      showBorrowsRelativeChange
                        ? borrowsStats
                        : groupTokenByHourlyInterval(
                            borrowsStats,
                            borrowDaysToShow,
                            'total_borrows',
                          )
                    }
                    daysToShow={borrowDaysToShow}
                    setDaysToShow={setBorrowDaysToShow}
                    heightClass="h-64"
                    loaderHeightClass="h-[334px]"
                    domain={[0, 'dataMax']}
                    loading={loadingTokenStats}
                    small
                    tickFormat={(x) => formatYAxis(x)}
                    title={`${t('token:borrows')}`}
                    xKey="date_hour"
                    yKey={'total_borrows'}
                    chartType={showBorrowsRelativeChange ? 'area' : 'bar'}
                    prefix={showBorrowsNotional ? '$' : ''}
                  />
                </div>
                <div className={SWITCH_WRAPPER_CLASSES}>
                  <Switch
                    checked={showBorrowsRelativeChange}
                    onChange={() =>
                      setShowBorrowsRelativeChange(!showBorrowsRelativeChange)
                    }
                    small
                  >
                    {t('stats:show-relative')}
                  </Switch>
                  <Switch
                    checked={showBorrowsNotional}
                    onChange={() =>
                      setShowBorrowsNotional(!showBorrowsNotional)
                    }
                    small
                  >
                    {t('stats:notional')}
                  </Switch>
                </div>
              </>
            ) : (
              <div className="px-4 pt-4 md:px-6 lg:pt-6">
                <TokenRatesChart
                  data={formattedStats}
                  dataKey="borrow_apr"
                  daysToShow={borrowRateDaysToShow}
                  loading={loadingTokenStats}
                  setDaysToShow={setBorrowRateDaysToShow}
                  title={`${t('token:average-borrow-rate')} (APR)`}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChartTabs
