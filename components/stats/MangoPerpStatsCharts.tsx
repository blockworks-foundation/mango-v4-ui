import { useTranslation } from 'next-i18next'
import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import mangoStore from '@store/mangoStore'
import { PerpStatsItem } from 'types'
const DetailedAreaChart = dynamic(
  () => import('@components/shared/DetailedAreaChart'),
  { ssr: false }
)

interface OiValueItem {
  date: string
  openInterest: number
}

interface FeeValueItem {
  date: string
  feeValue: number
}

const MangoPerpStatsCharts = () => {
  const { t } = useTranslation(['common', 'token', 'trade'])
  const loadingPerpStats = mangoStore((s) => s.perpStats.loading)
  const perpStats = mangoStore((s) => s.perpStats.data)
  const [oiDaysToShow, setOiDaysToShow] = useState('30')
  const [feesDaysToShow, setFeesDaysToShow] = useState('30')
  // const perpMarkets = mangoStore((s) => s.perpMarkets)

  // const currentTotalOpenInterestValue = useMemo(() => {
  //   if (!perpMarkets.length) return 0
  //   return perpMarkets.reduce((a: number, c: PerpMarket) => {
  //     const value = a + c.openInterest.toNumber() * c.uiPrice
  //     return value
  //   }, 0)
  // }, [perpMarkets])

  const totalFeeValues = useMemo(() => {
    if (!perpStats || !perpStats.length) return []
    const values = perpStats.reduce((a: FeeValueItem[], c: PerpStatsItem) => {
      const hasDate = a.find((d: FeeValueItem) => d.date === c.date_hour)
      if (!hasDate) {
        a.push({
          date: c.date_hour,
          feeValue: c.fees_accrued,
        })
      } else {
        hasDate.feeValue = hasDate.feeValue + c.fees_accrued
      }
      return a
    }, [])
    return values.reverse()
  }, [perpStats])

  const totalOpenInterestValues = useMemo(() => {
    if (!perpStats || !perpStats.length) return []
    const values = perpStats.reduce((a: OiValueItem[], c: PerpStatsItem) => {
      const hasDate = a.find((d: OiValueItem) => d.date === c.date_hour)
      if (!hasDate) {
        a.push({
          date: c.date_hour,
          openInterest: Math.floor(c.open_interest * c.price),
        })
      } else {
        hasDate.openInterest =
          hasDate.openInterest + Math.floor(c.open_interest * c.price)
      }
      return a
    }, [])
    return values.reverse()
  }, [perpStats])

  return (
    <>
      {totalOpenInterestValues.length ? (
        <div className="col-span-2 border-b border-th-bkg-3 py-4 px-6 md:col-span-1">
          <DetailedAreaChart
            data={totalOpenInterestValues}
            daysToShow={oiDaysToShow}
            setDaysToShow={setOiDaysToShow}
            heightClass="h-64"
            loading={loadingPerpStats}
            loaderHeightClass="h-[350px]"
            prefix="$"
            tickFormat={(x) => `$${Math.floor(x)}`}
            title={t('trade:open-interest')}
            xKey="date"
            yKey={'openInterest'}
          />
        </div>
      ) : null}
      {totalFeeValues.length ? (
        <div className="col-span-2 border-b border-th-bkg-3 py-4 px-6 md:col-span-1 md:border-l md:pl-6">
          <DetailedAreaChart
            data={totalFeeValues}
            daysToShow={feesDaysToShow}
            setDaysToShow={setFeesDaysToShow}
            heightClass="h-64"
            loading={loadingPerpStats}
            loaderHeightClass="h-[350px]"
            prefix="$"
            tickFormat={(x) => `$${x.toFixed(2)}`}
            title="Perp Fees"
            xKey="date"
            yKey={'feeValue'}
          />
        </div>
      ) : null}
    </>
  )
}

export default MangoPerpStatsCharts
