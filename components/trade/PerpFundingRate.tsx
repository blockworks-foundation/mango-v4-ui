import { PerpMarket } from '@blockworks-foundation/mango-v4'
import { useQuery } from '@tanstack/react-query'
import useMangoGroup from 'hooks/useMangoGroup'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { useMemo } from 'react'
import { MANGO_DATA_API_URL } from 'utils/constants'
import Tooltip from '@components/shared/Tooltip'
import { useTranslation } from 'next-i18next'
import Link from 'next/link'

const fetchFundingRate = async (groupPk: string | undefined) => {
  const res = await fetch(
    `${MANGO_DATA_API_URL}/one-hour-funding-rate?mango-group=${groupPk}`,
  )
  return await res.json()
}

export const usePerpFundingRate = () => {
  const { group } = useMangoGroup()

  const res = useQuery<
    { market_index: number; funding_rate_hourly: number }[],
    Error
  >(['funding-rate'], () => fetchFundingRate(group?.publicKey?.toString()), {
    cacheTime: 1000 * 60 * 10,
    staleTime: 1000 * 60,
    retry: 3,
    enabled: !!group,
  })

  return Array.isArray(res?.data) ? res : { isSuccess: false, data: null }
}

export const formatFunding = Intl.NumberFormat('en', {
  minimumSignificantDigits: 1,
  maximumSignificantDigits: 2,
  style: 'percent',
})

const PerpFundingRate = () => {
  const { selectedMarket } = useSelectedMarket()
  const rate = usePerpFundingRate()
  const { t } = useTranslation(['common', 'trade'])

  const fundingRate = useMemo(() => {
    if (rate.isSuccess && selectedMarket instanceof PerpMarket) {
      const marketRate = rate?.data?.find(
        (r) => r.market_index === selectedMarket.perpMarketIndex,
      )
      const funding = marketRate?.funding_rate_hourly
      return typeof funding === 'number' ? funding : undefined
    }
  }, [rate, selectedMarket])

  return (
    <>
      <div className="ml-6 flex-col whitespace-nowrap">
        <Tooltip
          content={
            <>
              <div>
                Funding is paid continuously. The 1hr rate displayed is a
                rolling average of the past 60 mins.
              </div>
              <div className="mt-2">
                When positive, longs will pay shorts and when negative shorts
                pay longs.
              </div>
              {typeof fundingRate === 'number' ? (
                <div className="mt-2">
                  The annualized funding rate is{' '}
                  <span className="font-mono text-th-fgd-2">
                    {formatFunding.format(fundingRate * 8760)}
                  </span>
                </div>
              ) : null}
              <Link
                className="mt-2 block"
                href={`/stats?market=${selectedMarket?.name}`}
                shallow={true}
              >
                View Chart
              </Link>
            </>
          }
        >
          <div className="flex items-center">
            <div className="tooltip-underline mb-0.5 text-xs text-th-fgd-4">
              {t('trade:funding-rate')}
            </div>
            {/* <InformationCircleIcon className="ml-1 h-4 w-4 text-th-fgd-4" /> */}
          </div>
        </Tooltip>
        <p className="font-mono text-xs text-th-fgd-2">
          {selectedMarket instanceof PerpMarket &&
          typeof fundingRate === 'number' ? (
            <span>{formatFunding.format(fundingRate)}</span>
          ) : (
            <span className="text-th-fgd-4">-</span>
          )}
        </p>
      </div>
    </>
  )
}

export default PerpFundingRate
