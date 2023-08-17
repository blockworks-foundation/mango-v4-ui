import { useTranslation } from 'next-i18next'
import { useMemo, useState } from 'react'
import mangoStore from '@store/mangoStore'
import { PerpStatsItem } from 'types'
import DetailedAreaOrBarChart from '@components/shared/DetailedAreaOrBarChart'
import { formatYAxis } from 'utils/formatting'

interface OiValueItem {
  date: string
  openInterest: number
}

interface FeeValueItem {
  date: string
  feeValue: number
}

interface VolumeValueItem {
  date: string
  volume: number
}

interface PerpStatsData {
  feeValues: FeeValueItem[]
  openInterestValues: OiValueItem[]
  volumeValues: VolumeValueItem[]
}

const MangoPerpStatsCharts = () => {
  const { t } = useTranslation(['common', 'stats', 'token', 'trade'])
  const loadingPerpStats = mangoStore((s) => s.perpStats.loading)
  const perpStats = mangoStore((s) => s.perpStats.data)
  const [feesDaysToShow, setFeesDaysToShow] = useState('30')
  const [oiDaysToShow, setOiDaysToShow] = useState('30')
  const [volumeDaysToShow, setVolumeDaysToShow] = useState('30')

  const [feeValues, openInterestValues, volumeValues] = useMemo(() => {
    if (!perpStats || !perpStats.length) return [[], [], []]
    const data = perpStats.reduce(
      (a: PerpStatsData, c: PerpStatsItem) => {
        const hasDateFee = a.feeValues.find(
          (d: FeeValueItem) => d.date === c.date_hour,
        )

        const hasDateOpenInterest = a.openInterestValues.find(
          (d: OiValueItem) => d.date === c.date_hour,
        )

        const hasDateVolume = a.volumeValues.find(
          (d: VolumeValueItem) => d.date === c.date_hour,
        )

        if (!hasDateFee) {
          a.feeValues.push({
            date: c.date_hour,
            feeValue: c.total_fees,
          })
        } else {
          hasDateFee.feeValue += c.total_fees
        }

        if (!hasDateOpenInterest) {
          a.openInterestValues.push({
            date: c.date_hour,
            openInterest: Math.floor(c.open_interest * c.price),
          })
        } else {
          hasDateOpenInterest.openInterest += Math.floor(
            c.open_interest * c.price,
          )
        }

        if (!hasDateVolume) {
          a.volumeValues.push({
            date: c.date_hour,
            volume: c.cumulative_quote_volume,
          })
        } else {
          hasDateVolume.volume += c.cumulative_quote_volume
        }

        return a
      },
      { feeValues: [], openInterestValues: [], volumeValues: [] },
    )

    const { feeValues, openInterestValues, volumeValues } = data

    const sortedFeeValues = feeValues.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    )
    const sortedOpenInterestValues = openInterestValues.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    )
    const sortedVolumeValues = volumeValues.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    )

    return [sortedFeeValues, sortedOpenInterestValues, sortedVolumeValues]
  }, [perpStats])

  return (
    <>
      {feeValues.length ? (
        <div className="col-span-2 border-b border-th-bkg-3 px-6 py-4 md:col-span-1 md:pl-6">
          <DetailedAreaOrBarChart
            data={feeValues}
            daysToShow={feesDaysToShow}
            setDaysToShow={setFeesDaysToShow}
            heightClass="h-64"
            loading={loadingPerpStats}
            loaderHeightClass="h-[350px]"
            prefix="$"
            tickFormat={(x) => `$${formatYAxis(x)}`}
            title="Perp Fees"
            xKey="date"
            yKey={'feeValue'}
          />
        </div>
      ) : null}
      {openInterestValues.length ? (
        <div className="col-span-2 border-b border-th-bkg-3 px-6 py-4 md:col-span-1 md:border-r">
          <DetailedAreaOrBarChart
            data={openInterestValues}
            daysToShow={oiDaysToShow}
            setDaysToShow={setOiDaysToShow}
            heightClass="h-64"
            loading={loadingPerpStats}
            loaderHeightClass="h-[350px]"
            prefix="$"
            tickFormat={(x) => `$${formatYAxis(x)}`}
            title={t('stats:perp-open-interest')}
            xKey="date"
            yKey={'openInterest'}
          />
        </div>
      ) : null}
      {volumeValues.length ? (
        <div className="col-span-2 border-b border-th-bkg-3 px-6 py-4 md:col-span-1 md:pl-6">
          <DetailedAreaOrBarChart
            data={volumeValues}
            daysToShow={volumeDaysToShow}
            setDaysToShow={setVolumeDaysToShow}
            heightClass="h-64"
            loading={loadingPerpStats}
            loaderHeightClass="h-[350px]"
            prefix="$"
            tickFormat={(x) => `$${formatYAxis(x)}`}
            title={t('stats:perp-volume')}
            xKey="date"
            yKey={'volume'}
          />
        </div>
      ) : null}
    </>
  )
}

export default MangoPerpStatsCharts
