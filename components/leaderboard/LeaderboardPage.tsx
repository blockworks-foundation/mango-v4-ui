import ButtonGroup from '@components/forms/ButtonGroup'
import { LinkButton } from '@components/shared/Button'
import SheenLoader from '@components/shared/SheenLoader'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'next-i18next'
import { useState } from 'react'
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

const LeaderboardPage = () => {
  const { t } = useTranslation(['common', 'leaderboard'])
  const [daysToShow, setDaysToShow] = useState('ALLTIME')
  const [offset, setOffset] = useState(0)
  const [leaderboardData, setLeaderboardData] = useState([])

  const fetchLeaderboard = async () => {
    try {
      const data = await fetch(
        `${MANGO_DATA_API_URL}/leaderboard-pnl?over_period=${daysToShow}&offset=${offset}`
      )
      const leaderboardRes = await data.json()
      const profileData = await Promise.all(
        leaderboardRes.map((r: LeaderboardItem) =>
          fetch(
            `${MANGO_DATA_API_URL}/user-data/profile-details?wallet-pk=${r.wallet_pk}`
          )
        )
      )
      const profileRes = await Promise.all(profileData.map((d) => d.json()))
      const combinedRes = leaderboardRes.map(
        (r: LeaderboardItem, i: number) => ({
          ...r,
          ...profileRes[i],
        })
      )
      setLeaderboardData(leaderboardData.concat(combinedRes))
      return combinedRes
    } catch (e) {
      console.log('Failed to fetch leaderboard', e)
    }
  }

  const { isLoading, isFetching } = useQuery(
    ['leaderboard', daysToShow, offset],
    () => fetchLeaderboard(),
    {
      cacheTime: 1000 * 60 * 10,
      staleTime: 1000 * 60,
      retry: 3,
      refetchOnWindowFocus: false,
    }
  )

  const handleDaysToShow = (days: string) => {
    setLeaderboardData([])
    setOffset(0)
    setDaysToShow(days)
  }

  const handleShowMore = () => {
    setOffset(offset + 20)
  }

  const loading = isLoading || isFetching

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
          {leaderboardData.length ? (
            <LeaderboardTable data={leaderboardData} loading={loading} />
          ) : loading ? (
            <div className="space-y-2">
              {[...Array(20)].map((x, i) => (
                <SheenLoader className="flex flex-1" key={i}>
                  <div className="h-16 w-full rounded-md bg-th-bkg-2" />
                </SheenLoader>
              ))}
            </div>
          ) : null}
          {offset < 100 ? (
            <LinkButton className="mx-auto mt-6" onClick={handleShowMore}>
              {t('show-more')}
            </LinkButton>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default LeaderboardPage
