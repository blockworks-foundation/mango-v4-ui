import DetailedAreaOrBarChart from '@components/shared/DetailedAreaOrBarChart'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { EmptyObject } from 'types'
import { MANGO_DATA_API_URL } from 'utils/constants'
import { formatYAxis } from 'utils/formatting'

type TokenLiquidations = {
  [key: string]: {
    liquidated_value: number
    num_liquidations: number
  }
}

const fetchTokenLiquidationsData = async () => {
  try {
    const response = await fetch(
      `${MANGO_DATA_API_URL}/stats/liquidations/token`,
    )
    const data: null | EmptyObject | TokenLiquidations = await response.json()
    if (data && Object.keys(data).length) {
      const foramttedData = Object.entries(data).map(([key, value]) => {
        return {
          date: `${key}Z`,
          liquidatedValue: value.liquidated_value,
          numLiquidations: value.num_liquidations,
        }
      })
      return foramttedData
    }
    return []
  } catch (e) {
    console.log('Failed to fetch token liquidations', e)
    return []
  }
}

const TokenLiquidationsChart = () => {
  const { t } = useTranslation('stats')
  const [daysToShow] = useState('30')
  const { data, isInitialLoading } = useQuery(
    ['token-liquidations-data'],
    () => fetchTokenLiquidationsData(),
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
      heightClass="h-[247px]"
      loaderHeightClass="h-[350px]"
      prefix="$"
      tickFormat={(x) => `$${formatYAxis(x)}`}
      title={t('stats:token-liquidations')}
      xKey="date"
      yKey="liquidatedValue"
      chartType="bar"
    />
  )
}

export default TokenLiquidationsChart
