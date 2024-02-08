import { Bank } from '@blockworks-foundation/mango-v4'
import { useQuery } from '@tanstack/react-query'
import { makeApiRequest } from 'apis/birdeye/helpers'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useMemo, useState } from 'react'
import { DAILY_SECONDS } from 'utils/constants'
import DetailedAreaOrBarChart from '@components/shared/DetailedAreaOrBarChart'
import { countLeadingZeros, formatCurrencyValue } from 'utils/numbers'
import { BirdeyePriceResponse } from 'types'
dayjs.extend(relativeTime)

interface BirdeyeResponse {
  data: { items: BirdeyePriceResponse[] }
  success: boolean
}

const fetchBirdeyePrices = async (
  daysToShow: string,
  mint: string,
): Promise<BirdeyePriceResponse[] | []> => {
  const interval = daysToShow === '1' ? '30m' : daysToShow === '7' ? '1H' : '4H'
  const queryEnd = Math.floor(Date.now() / 1000)
  const queryStart = queryEnd - parseInt(daysToShow) * DAILY_SECONDS
  const query = `defi/history_price?address=${mint}&address_type=token&type=${interval}&time_from=${queryStart}&time_to=${queryEnd}`
  const response: BirdeyeResponse = await makeApiRequest(query)

  if (response.success && response?.data?.items) {
    return response.data.items
  }
  return []
}

const PriceChart = ({ bank }: { bank: Bank }) => {
  const [daysToShow, setDaysToShow] = useState<string>('1')

  const { data: birdeyePrices, isLoading: loadingBirdeyePrices } = useQuery(
    ['birdeye-token-prices', daysToShow, bank.mint],
    () => fetchBirdeyePrices(daysToShow, bank.mint.toString()),
    {
      cacheTime: 1000 * 60 * 15,
      staleTime: 1000 * 60 * 10,
      retry: 3,
      enabled: !!bank,
      refetchOnWindowFocus: false,
    },
  )

  const chartData = useMemo(() => {
    if (!birdeyePrices || !birdeyePrices.length) return []
    return birdeyePrices.map((item) => {
      const decimals = countLeadingZeros(item.value) + 3
      const floatPrice = parseFloat(item.value.toString())
      const roundedPrice = +floatPrice.toFixed(decimals)
      return {
        unixTime: item.unixTime * 1000,
        value: roundedPrice,
      }
    })
  }, [birdeyePrices])

  return (
    <>
      <div className="p-6 pb-4">
        <DetailedAreaOrBarChart
          changeAsPercent
          data={chartData.concat([
            {
              unixTime: Date.now(),
              value: parseFloat(
                bank.uiPrice.toFixed(countLeadingZeros(bank.uiPrice) + 3),
              ),
            },
          ])}
          daysToShow={daysToShow}
          setDaysToShow={setDaysToShow}
          loading={loadingBirdeyePrices}
          heightClass="h-80"
          loaderHeightClass="h-[350px]"
          prefix="$"
          tickFormat={(x) =>
            x < 0.00001 ? x.toExponential() : formatCurrencyValue(x)
          }
          title=""
          xKey="unixTime"
          yKey="value"
          yDecimals={countLeadingZeros(bank.uiPrice) + 3}
          domain={['dataMin', 'dataMax']}
        />
      </div>
    </>
  )
}

export default PriceChart
