import ButtonGroup from '@components/forms/ButtonGroup'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'next-i18next'
import { useEffect, useState } from 'react'
import { MANGO_DATA_API_URL } from 'utils/constants'
import LeaderboardTable from './LeaderboardTable'

export interface LeaderboardItem {
  date_hour: string
  mango_account: string
  pnl: number
  start_date_hour: string
  wallet_pk: string
  profile_image_url?: string
  profile_name?: string
  trader_category?: string
}

const fetchLeaderboard = async (period: string) => {
  try {
    const leaderboardData = await fetch(
      `${MANGO_DATA_API_URL}/leaderboard-pnl?over_period=${period}`
    )
    const leaderboardRes = await leaderboardData.json()
    const profileData = await Promise.all(
      leaderboardRes.map((r: LeaderboardItem) =>
        fetch(
          `${MANGO_DATA_API_URL}/user-data/profile-details?wallet-pk=${r.wallet_pk}`
        )
      )
    )
    const profileRes = await Promise.all(profileData.map((d) => d.json()))
    return leaderboardRes
      .map((r: LeaderboardItem, i: number) => ({
        ...r,
        ...profileRes[i],
      }))
      .slice(0, 20)
  } catch (e) {
    console.log('Failed to fetch leaderboard', e)
  }
}

const LeaderboardPage = () => {
  const { t } = useTranslation(['common', 'leaderboard'])
  const [daysToShow, setDaysToShow] = useState('ALLTIME')

  const { data, isLoading, refetch, isFetching } = useQuery(
    ['leaderboard'],
    () => fetchLeaderboard(daysToShow),
    {
      cacheTime: 1000 * 60 * 10,
      staleTime: 1000 * 60,
      retry: 3,
    }
  )

  const handleDaysToShow = (days: string) => {
    setDaysToShow(days)
  }

  useEffect(() => {
    refetch()
  }, [daysToShow])

  return (
    <div className="p-4 md:p-10 lg:px-0">
      <div className="grid grid-cols-12">
        <div className="col-span-12 lg:col-span-8 lg:col-start-3">
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="mb-2">{t('leaderboard')}</h1>
              <p className="mb-4 md:mb-0">
                {t('leaderboard:leaderboard-desc')}
              </p>
            </div>
            <div className="w-full md:w-48">
              <ButtonGroup
                activeValue={daysToShow}
                disabled={isLoading}
                onChange={(v) => handleDaysToShow(v)}
                names={['24h', '7d', t('all')]}
                values={['1DAY', '1WEEK', 'ALLTIME']}
              />
            </div>
          </div>
          {data?.length ? (
            <LeaderboardTable data={data} loading={isLoading || isFetching} />
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default LeaderboardPage
