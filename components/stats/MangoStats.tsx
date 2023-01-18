import mangoStore from '@store/mangoStore'
import TotalDepositBorrowCharts from './TotalDepositBorrowCharts'
// import { useTranslation } from 'next-i18next'
// import { PerpMarket } from '@blockworks-foundation/mango-v4'

const MangoStats = () => {
  // const { t } = useTranslation(['common', 'token', 'trade'])
  const tokenStats = mangoStore((s) => s.tokenStats.data)
  const loadingStats = mangoStore((s) => s.tokenStats.loading)
  // const perpStats = mangoStore((s) => s.perpStats.data)
  // const loadingPerpStats = mangoStore((s) => s.perpStats.loading)
  // const perpMarkets = mangoStore((s) => s.perpMarkets)

  // const totalFeeValues = useMemo(() => {
  //   if (!perpStats.length) return []
  //   const values = perpStats.reduce((a, c) => {
  //     const hasDate = a.find((d: any) => d.date === c.date_hour)
  //     if (!hasDate) {
  //       a.push({
  //         date: c.date_hour,
  //         feeValue: Math.floor(c.fees_accrued),
  //       })
  //     } else {
  //       hasDate.feeValue = hasDate.feeValue + Math.floor(c.fees_accrued)
  //     }
  //     return a
  //   }, [])
  //   return values.reverse()
  // }, [perpStats])

  // const totalOpenInterestValues = useMemo(() => {
  //   if (!perpStats) return []
  //   const values = perpStats.reduce((a, c) => {
  //     const hasDate = a.find((d: any) => d.date === c.date_hour)
  //     if (!hasDate) {
  //       a.push({
  //         date: c.date_hour,
  //         openInterest: Math.floor(c.open_interest * c.price),
  //       })
  //     } else {
  //       hasDate.openInterest =
  //         hasDate.openInterest + Math.floor(c.open_interest * c.price)
  //     }
  //     return a
  //   }, [])
  //   return values.reverse()
  // }, [perpStats])

  // i think c.openInterest below needs some sort of conversion to give the correct number. then this can be added as the current value of the chart

  // const currentTotalOpenInterestValue = useMemo(() => {
  //   if (!perpMarkets.length) return 0
  //   return perpMarkets.reduce((a: number, c: PerpMarket) => {
  //     const value = a + c.openInterest.toNumber() * c.uiPrice
  //     return value
  //   }, 0)
  // }, [perpMarkets])

  return (
    <div className="grid grid-cols-2">
      <TotalDepositBorrowCharts
        tokenStats={tokenStats}
        loadingStats={loadingStats}
      />
      {/* uncomment below when perps launch */}

      {/* {loadingPerpStats ? (
        <div className="col-span-2 border-b border-th-bkg-3 py-4 px-6 md:col-span-1">
          <SheenLoader className="flex flex-1">
            <div className="h-96 w-full rounded-lg bg-th-bkg-2" />
          </SheenLoader>
        </div>
      ) : totalFeeValues.length ? (
        <div className="col-span-2 border-b border-th-bkg-3 py-4 px-6 md:col-span-1">
          <DetailedAreaChart
            data={totalOpenInterestValues}
            daysToShow={'999'}
            heightClass="h-64"
            prefix="$"
            tickFormat={(x) => `$${Math.floor(x)}`}
            title={t('trade:open-interest')}
            xKey="date"
            yKey={'openInterest'}
          />
        </div>
      ) : null}
      {loadingPerpStats ? (
        <div className="col-span-2 border-b border-th-bkg-3 py-4 px-6 md:col-span-1 md:border-l md:pl-6">
          <SheenLoader className="flex flex-1">
            <div className="h-96 w-full rounded-lg bg-th-bkg-2" />
          </SheenLoader>
        </div>
      ) : totalOpenInterestValues.length ? (
        <div className="col-span-2 border-b border-th-bkg-3 py-4 px-6 md:col-span-1 md:border-l md:pl-6">
          <DetailedAreaChart
            data={totalFeeValues}
            daysToShow={'999'}
            heightClass="h-64"
            prefix="$"
            tickFormat={(x) => `$${x.toFixed(2)}`}
            title="Perp Fees"
            xKey="date"
            yKey={'feeValue'}
          />
        </div>
      ) : null} */}
    </div>
  )
}

export default MangoStats
