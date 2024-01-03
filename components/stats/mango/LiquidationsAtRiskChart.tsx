import DetailedAreaOrBarChart from '@components/shared/DetailedAreaOrBarChart'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MANGO_DATA_API_URL } from 'utils/constants'
import { formatYAxis } from 'utils/formatting'

type LiquidationsAtRiskDataItem = {
  percentage_price_change: number
  usdc_shortfall: number
}

type LiquidationsAtRisk = {
  data: LiquidationsAtRiskDataItem[]
  simulation_time_utc: string
}

const fetchLiquidationsAtRiskData = async () => {
  try {
    const response = await fetch(
      `${MANGO_DATA_API_URL}/stats/liquidations/risk-simulation`,
    )
    const data: null | LiquidationsAtRisk = await response.json()
    if (data && data?.data.length) {
      return data.data
    }
    return []
  } catch (e) {
    console.log('Failed to fetch liquidations at risk', e)
    return []
  }
}

const LiquidationsAtRiskChart = () => {
  const { t } = useTranslation('stats')
  const [daysToShow] = useState('30')
  const { data, isInitialLoading } = useQuery(
    ['liquidations-at-risk-data'],
    () => fetchLiquidationsAtRiskData(),
    {
      cacheTime: 1000 * 60 * 10,
      staleTime: 1000 * 60,
      retry: 3,
      refetchOnWindowFocus: false,
    },
  )

  return (
    <DetailedAreaOrBarChart
      hideChange
      data={data}
      daysToShow={daysToShow}
      loading={isInitialLoading}
      heightClass="h-64"
      loaderHeightClass="h-[350px]"
      prefix="$"
      tickFormat={(x) => `$${formatYAxis(x)}`}
      title={t('stats:liquidations-at-risk')}
      xKey="percentage_price_change"
      formatXKeyHeading={(k) => `${t('stats:price-change')}: ${k}%`}
      xAxisLabel={t('stats:price-change-percentage')}
      xAxisType="number"
      yKey="usdc_shortfall"
    />
  )
}

export default LiquidationsAtRiskChart
