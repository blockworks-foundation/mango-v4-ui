import mangoStore from '@store/mangoStore'
import { useEffect, useMemo } from 'react'
import { PerpStatsItem } from 'types'

export interface PerpValueItem {
  date: string
  value: number
}

interface PerpStatsData {
  feeValues: PerpValueItem[]
  openInterestValues: PerpValueItem[]
  volumeValues: PerpValueItem[]
}

export default function usePerpStatsChartData() {
  const perpStats = mangoStore((s) => s.perpStats.data)

  useEffect(() => {
    if (!perpStats || !perpStats.length) {
      const actions = mangoStore.getState().actions
      actions.fetchPerpStats()
    }
  }, [perpStats])

  const [feeValues, openInterestValues, volumeValues] = useMemo(() => {
    if (!perpStats || !perpStats.length) return [[], [], []]
    const data = perpStats.reduce(
      (a: PerpStatsData, c: PerpStatsItem) => {
        const hasDateFee = a.feeValues.find(
          (d: PerpValueItem) => d.date === c.date_hour,
        )

        const hasDateOpenInterest = a.openInterestValues.find(
          (d: PerpValueItem) => d.date === c.date_hour,
        )

        const hasDateVolume = a.volumeValues.find(
          (d: PerpValueItem) => d.date === c.date_hour,
        )

        if (!hasDateFee) {
          a.feeValues.push({
            date: c.date_hour,
            value: c.total_fees,
          })
        } else {
          hasDateFee.value += c.total_fees
        }

        if (!hasDateOpenInterest) {
          a.openInterestValues.push({
            date: c.date_hour,
            value: Math.floor(c.open_interest * c.price),
          })
        } else {
          hasDateOpenInterest.value += Math.floor(c.open_interest * c.price)
        }

        if (!hasDateVolume) {
          a.volumeValues.push({
            date: c.date_hour,
            value: c.cumulative_quote_volume,
          })
        } else {
          hasDateVolume.value += c.cumulative_quote_volume
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

  return { feeValues, openInterestValues, volumeValues }
}
