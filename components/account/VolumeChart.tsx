import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { FormattedHourlyAccountVolumeData } from 'types'
import { formatCurrencyValue } from 'utils/numbers'
import { TooltipProps } from 'recharts/types/component/Tooltip'
import {
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import { COLORS } from 'styles/colors'
import { formatDateAxis } from '@components/shared/DetailedAreaOrBarChart'
import { formatYAxis } from 'utils/formatting'
import ChartRangeButtons from '@components/shared/ChartRangeButtons'
import { useTranslation } from 'next-i18next'
import { NoSymbolIcon } from '@heroicons/react/20/solid'
import { FadeInFadeOut } from '@components/shared/Transitions'
import ContentBox from '@components/shared/ContentBox'
import SheenLoader from '@components/shared/SheenLoader'
import useAccountHourlyVolumeStats from 'hooks/useAccountHourlyVolumeStats'
import useMangoAccount from 'hooks/useMangoAccount'
import { DAILY_MILLISECONDS } from 'utils/constants'
import useThemeWrapper from 'hooks/useThemeWrapper'
import FormatNumericValue from '@components/shared/FormatNumericValue'

const VolumeChart = () => {
  const { t } = useTranslation(['account', 'common', 'stats'])
  const { mangoAccountAddress } = useMangoAccount()
  const { hourlyVolumeData: chartData, loadingHourlyVolume: loading } =
    useAccountHourlyVolumeStats()
  const [daysToShow, setDaysToShow] = useState('30')
  const { theme } = useThemeWrapper()

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const load = payload[0].payload
      return (
        <div className="rounded-md bg-th-bkg-2 p-4">
          <h3 className="mb-3 text-sm">
            {daysToShow === '30'
              ? dayjs(label).format('DD MMM YY')
              : dayjs(label).format('DD MMM YY, h:mma')}
          </h3>
          <div className="space-y-1">
            {Object.keys(load.markets)
              .filter((market) => load.markets[market] >= 0.01)
              .sort((a, b) => a.localeCompare(b))
              .map((mkt) => (
                <div className="flex items-center justify-between" key={mkt}>
                  <p>{mkt}</p>
                  <p className="pl-4 font-mono text-th-fgd-2">
                    {formatCurrencyValue(load.markets[mkt])}
                  </p>
                </div>
              ))}
          </div>
          <div className="mt-3 flex justify-between border-t border-th-bkg-4 pt-3">
            <p>{t('total')}</p>
            <p className="pl-4 font-mono text-th-fgd-2">
              {formatCurrencyValue(load['total_volume_usd'])}
            </p>
          </div>
        </div>
      )
    }

    return null
  }

  const chunkDataByDay = (data: FormattedHourlyAccountVolumeData[]) => {
    const chunkedData: FormattedHourlyAccountVolumeData[] = []

    // Iterate over the data array
    for (const entry of data) {
      const { time, total_volume_usd, markets } = entry

      // Extract the date portion from the timestamp
      const date = time.substr(0, 10)

      // Find the existing chunk for the date or create a new one
      let chunk = chunkedData.find((chunk) => chunk.time === date)
      if (!chunk) {
        chunk = {
          time: date,
          total_volume_usd: 0,
          markets: {},
        }
        chunkedData.push(chunk)
      }

      // Update the total volume for the day
      chunk.total_volume_usd += total_volume_usd

      // Update the market values for the day
      for (const market in markets) {
        if (Object.prototype.hasOwnProperty.call(markets, market)) {
          const value = markets[market]

          // Initialize the market value if it doesn't exist
          if (!chunk.markets[market]) {
            chunk.markets[market] = 0
          }

          // Add the value to the market value for the day
          chunk.markets[market] += value
        }
      }
    }

    return chunkedData
  }

  const filteredData: FormattedHourlyAccountVolumeData[] = useMemo(() => {
    if (!chartData || !chartData.length) return []
    const start = Number(daysToShow) * DAILY_MILLISECONDS
    const filtered = chartData.filter((d: FormattedHourlyAccountVolumeData) => {
      const date = new Date()
      if (daysToShow === '30') {
        date.setHours(0, 0, 0, 0)
      } else {
        date.setMinutes(0, 0, 0)
      }
      const dataTime = new Date(d.time).getTime()
      const now = date.getTime()
      const limit = now - start
      return dataTime >= limit
    })
    if (daysToShow === '30') {
      return chunkDataByDay(filtered).sort((a, b) =>
        a.time.localeCompare(b.time),
      )
    }
    return filtered
  }, [chartData, daysToShow])

  const totalForTimePeriod = useMemo(() => {
    if (!filteredData.length) return 0
    return filteredData.reduce((a, c) => a + c.total_volume_usd, 0)
  }, [filteredData])

  return (
    <FadeInFadeOut show={true}>
      <ContentBox hideBorder hidePadding>
        {loading && mangoAccountAddress ? (
          <SheenLoader className="flex flex-1">
            <div className={`h-[350px] w-full rounded-lg bg-th-bkg-2`} />
          </SheenLoader>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="mb-0.5 text-base font-normal text-th-fgd-3">
                  {t('stats:volume')}
                </h2>
                {totalForTimePeriod ? (
                  <span className="font-display text-2xl text-th-fgd-1">
                    <FormatNumericValue
                      value={totalForTimePeriod}
                      isUsd
                      isPrivate
                    />
                  </span>
                ) : null}
              </div>
              <ChartRangeButtons
                activeValue={daysToShow}
                names={['24H', '7D', '30D']}
                values={['1', '7', '30']}
                onChange={(v) => setDaysToShow(v)}
              />
            </div>
            {filteredData.find((d) => d.total_volume_usd > 0) ? (
              <div className="-mx-6 mt-6 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredData}>
                    <Tooltip
                      cursor={{
                        fill: 'var(--bkg-2)',
                        opacity: 0.5,
                      }}
                      content={<CustomTooltip />}
                    />
                    <defs>
                      <linearGradient
                        id="greenGradientBar"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor={COLORS.UP[theme]}
                          stopOpacity={1}
                        />
                        <stop
                          offset="100%"
                          stopColor={COLORS.UP[theme]}
                          stopOpacity={0.7}
                        />
                      </linearGradient>
                    </defs>
                    <Bar dataKey="total_volume_usd">
                      {filteredData.map((entry, index) => {
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill="url(#greenGradientBar)"
                          />
                        )
                      })}
                    </Bar>
                    <XAxis
                      dataKey="time"
                      axisLine={false}
                      dy={10}
                      minTickGap={20}
                      padding={{ left: 20, right: 20 }}
                      tick={{
                        fill: 'var(--fgd-4)',
                        fontSize: 10,
                      }}
                      tickLine={false}
                      tickFormatter={(v) =>
                        formatDateAxis(v, parseInt(daysToShow))
                      }
                    />
                    <YAxis
                      dataKey="total_volume_usd"
                      interval="preserveStartEnd"
                      axisLine={false}
                      dx={-10}
                      padding={{ top: 20, bottom: 20 }}
                      tick={{
                        fill: 'var(--fgd-4)',
                        fontSize: 10,
                      }}
                      tickLine={false}
                      tickFormatter={(v) => formatYAxis(v)}
                      type="number"
                    />
                    <ReferenceLine y={0} stroke={COLORS.BKG4[theme]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="mt-4 flex h-64 flex-col items-center justify-center rounded-lg border border-th-bkg-3 p-8">
                <NoSymbolIcon className="mb-2 h-6 w-6 text-th-fgd-4" />
                <p>{t('account:no-data')}</p>
              </div>
            )}
          </>
        )}
      </ContentBox>
    </FadeInFadeOut>
  )
}

export default VolumeChart
