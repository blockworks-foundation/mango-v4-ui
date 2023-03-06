import MedalIcon from '@components/icons/MedalIcon'
import ProfileImage from '@components/profile/ProfileImage'
import { ChevronRightIcon } from '@heroicons/react/20/solid'
import { useViewport } from 'hooks/useViewport'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import { formatCurrencyValue } from 'utils/numbers'
import { breakpoints } from 'utils/theme'

const LEADERBOARD_DATA = [
  {
    profile_name: 'Jonah',
    profile_image_url:
      'https://assets1.holaplex.tools/ipfs/QmPUCHf6Xz4EruKMMa24uPJQrBVQXwkNE777ypypuBhTry?width=400&path=2817.png',
    mango_account_pk: 'ADKs62FshRfYsi7KZa1dPUzUYoVRMbdkC5k62Q5vcuDR',
    mango_account_name: 'Mango v4',
    total_pnl: 5000,
    spot_pnl: 3000,
    futures_pnl: 2000,
    rank: 1,
  },
  {
    profile_name: 'John',
    profile_image_url:
      'https://assets1.holaplex.tools/ipfs/QmPUCHf6Xz4EruKMMa24uPJQrBVQXwkNE777ypypuBhTry?width=400&path=2817.png',
    mango_account_pk: 'ADKs62FshRfYsi7KZa1dPUzUYoVRMbdkC5k62Q5vcuDR',
    mango_account_name: 'Mango v4',
    total_pnl: 5000,
    spot_pnl: 3000,
    futures_pnl: 2000,
    rank: 2,
  },
  {
    profile_name: 'Jim',
    profile_image_url:
      'https://assets1.holaplex.tools/ipfs/QmPUCHf6Xz4EruKMMa24uPJQrBVQXwkNE777ypypuBhTry?width=400&path=2817.png',
    mango_account_pk: 'ADKs62FshRfYsi7KZa1dPUzUYoVRMbdkC5k62Q5vcuDR',
    mango_account_name: 'Mango v4',
    total_pnl: 5000,
    spot_pnl: 3000,
    futures_pnl: 2000,
    rank: 3,
  },
  {
    profile_name: 'Jill',
    profile_image_url: '',
    mango_account_pk: 'ADKs62FshRfYsi7KZa1dPUzUYoVRMbdkC5k62Q5vcuDR',
    mango_account_name: 'Mango v4',
    total_pnl: 5000,
    spot_pnl: 3000,
    futures_pnl: 2000,
    rank: 4,
  },
  {
    profile_name: 'Jess',
    profile_image_url:
      'https://assets1.holaplex.tools/ipfs/QmPUCHf6Xz4EruKMMa24uPJQrBVQXwkNE777ypypuBhTry?width=400&path=2817.png',
    mango_account_pk: 'ADKs62FshRfYsi7KZa1dPUzUYoVRMbdkC5k62Q5vcuDR',
    mango_account_name: 'Mango v4',
    total_pnl: 5000,
    spot_pnl: 3000,
    futures_pnl: 2000,
    rank: 5,
  },
]

const LeaderboardTable = () => {
  const { t } = useTranslation('leaderboard')
  return (
    <>
      <div className="grid grid-cols-12 px-4 pb-2">
        <div className="col-span-2 md:col-span-1">
          <p className="text-xs text-th-fgd-4">{t('rank')}</p>
        </div>
        <div className="col-span-4 md:col-span-5">
          <p className="text-xs text-th-fgd-4">{t('trader')}</p>
        </div>
        <div className="col-span-5 flex justify-end">
          <p className="text-xs text-th-fgd-4">{t('pnl')}</p>
        </div>
      </div>
      <div className="space-y-2">
        {LEADERBOARD_DATA.map((data) => (
          <LeaderboardItem item={data} key={data.profile_name} />
        ))}
      </div>
    </>
  )
}

export default LeaderboardTable

interface LeaderboardItemProps {
  profile_name: string
  profile_image_url: string
  mango_account_pk: string
  mango_account_name: string
  total_pnl: number
  spot_pnl: number
  futures_pnl: number
  rank: number
}

const LeaderboardItem = ({ item }: { item: LeaderboardItemProps }) => {
  const {
    profile_name,
    profile_image_url,
    mango_account_pk,
    // mango_account_name,
    total_pnl,
    // spot_pnl,
    // futures_pnl,
    rank,
  } = item
  const router = useRouter()
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.md : false

  const handleViewAccount = (pk: string) => {
    router.push(`/account?pubkey=${pk}`)
  }

  return (
    <button
      className="default-transition flex grid w-full grid-cols-12 items-center rounded-md border border-th-bkg-3 px-3 py-3 md:px-4 md:hover:bg-th-bkg-2"
      onClick={() => handleViewAccount(mango_account_pk)}
    >
      <div className="col-span-2 md:col-span-1">
        <div className="relative flex h-6 w-6 items-center justify-center rounded-full bg-th-bkg-3">
          <p
            className={`relative z-10 font-bold ${
              rank < 4 ? 'text-th-bkg-1' : 'text-th-fgd-3'
            }`}
          >
            {rank}
          </p>
          {rank < 4 ? (
            <MedalIcon className="absolute shadow-md" rank={rank} />
          ) : null}
        </div>
      </div>
      <div className="col-span-4 md:col-span-5">
        <div className="flex items-center space-x-2.5">
          <ProfileImage
            imageSize={isMobile ? '32' : '40'}
            imageUrl={profile_image_url}
            placeholderSize={isMobile ? '20' : '24'}
          />
          <div className="text-left">
            <p className="text-th-fgd-2 md:text-base">{profile_name}</p>
            <p className="text-xs text-th-fgd-4">
              {mango_account_pk.slice(0, 4) +
                '...' +
                mango_account_pk.slice(-4)}
            </p>
          </div>
        </div>
      </div>
      <div className="col-span-5 flex justify-end">
        <span className="text-right md:text-base">
          {formatCurrencyValue(total_pnl, 2)}
        </span>
      </div>
      <div className="col-span-1 flex justify-end">
        <ChevronRightIcon className="h-5 w-5 text-th-fgd-4" />
      </div>
    </button>
  )
}
