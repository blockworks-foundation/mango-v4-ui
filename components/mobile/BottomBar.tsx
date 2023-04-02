import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import { IconButton } from '../shared/Button'
import {
  ChartBarIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronRightIcon,
  LightBulbIcon,
  ArrowsRightLeftIcon,
  CurrencyDollarIcon,
  Cog8ToothIcon,
  BuildingLibraryIcon,
  ArrowTrendingUpIcon,
  MagnifyingGlassIcon,
  BanknotesIcon,
  ArchiveBoxArrowDownIcon,
  PlusCircleIcon,
} from '@heroicons/react/20/solid'
import SolanaTps from '@components/SolanaTps'
import LeaderboardIcon from '@components/icons/LeaderboardIcon'

const StyledBarItemLabel = ({
  children,
  ...props
}: {
  children: ReactNode
}) => (
  <div style={{ fontSize: '0.6rem', lineHeight: 1 }} {...props}>
    {children}
  </div>
)

const BottomBarLink = ({
  children,
  isActive,
  pathName,
}: {
  children: ReactNode
  isActive: boolean
  pathName: string
}) => {
  return (
    <Link
      href={{
        pathname: pathName,
      }}
      className={`${
        isActive ? 'text-th-active' : 'text-th-fgd-2'
      } col-span-1 flex flex-col items-center justify-center`}
      shallow={true}
    >
      {children}
    </Link>
  )
}

const BottomBar = () => {
  const { t } = useTranslation('common')
  const { asPath } = useRouter()
  const [showPanel, setShowPanel] = useState(false)

  return (
    <>
      <div className="grid h-12 grid-cols-5 grid-rows-1 bg-th-bkg-3 shadow-bottomBar">
        <BottomBarLink isActive={asPath === '/'} pathName="/">
          <CurrencyDollarIcon className="mb-1 h-4 w-4" />
          <StyledBarItemLabel>{t('account')}</StyledBarItemLabel>
        </BottomBarLink>
        <BottomBarLink isActive={asPath === '/swap'} pathName="/swap">
          <ArrowsRightLeftIcon className="mb-1 h-4 w-4" />
          <StyledBarItemLabel>{t('swap')}</StyledBarItemLabel>
        </BottomBarLink>
        <BottomBarLink isActive={asPath === '/trade'} pathName="/trade">
          <ArrowTrendingUpIcon className="mb-1 h-4 w-4" />
          <StyledBarItemLabel>{t('trade')}</StyledBarItemLabel>
        </BottomBarLink>
        <BottomBarLink isActive={asPath === '/borrow'} pathName="/borrow">
          <BanknotesIcon className="mb-1 h-4 w-4" />
          <StyledBarItemLabel>{t('borrow')}</StyledBarItemLabel>
        </BottomBarLink>
        <button
          className={`${
            showPanel ? 'text-th-active' : 'text-th-fgd-2'
          } col-span-1 flex cursor-pointer flex-col items-center justify-center`}
          onClick={() => setShowPanel(!showPanel)}
        >
          <Bars3Icon className="mb-1 h-4 w-4" />
          <StyledBarItemLabel>{t('more')}</StyledBarItemLabel>
        </button>
      </div>
      <MoreMenuPanel showPanel={showPanel} setShowPanel={setShowPanel} />
    </>
  )
}

export default BottomBar

const MoreMenuPanel = ({
  showPanel,
  setShowPanel,
}: {
  showPanel: boolean
  setShowPanel: (showPanel: boolean) => void
}) => {
  const { t } = useTranslation(['common', 'search', 'governance'])
  return (
    <div
      className={`fixed bottom-0 z-30 h-[420px] w-full overflow-hidden rounded-t-3xl bg-th-bkg-2 px-4 transition duration-300 ease-in-out ${
        showPanel ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="flex justify-between py-4">
        <SolanaTps />
        <IconButton onClick={() => setShowPanel(false)} hideBg>
          <XMarkIcon className="h-6 w-6" />
        </IconButton>
      </div>
      <div
        className="border-b border-th-bkg-4"
        onClick={() => setShowPanel(false)}
      >
        <MoreMenuItem
          title={t('settings')}
          path="/settings"
          icon={<Cog8ToothIcon className="h-5 w-5" />}
        />
        <MoreMenuItem
          title={t('stats')}
          path="/stats"
          icon={<ChartBarIcon className="h-5 w-5" />}
        />
        <MoreMenuItem
          title={t('leaderboard')}
          path="/leaderboard"
          icon={<LeaderboardIcon className="h-5 w-5" />}
        />
        <MoreMenuItem
          title={t('leaderboard')}
          path="/leaderboard"
          icon={<LeaderboardIcon className="h-5 w-5" />}
        />
        <MoreMenuItem
          title={t('search:search-accounts')}
          path="/search"
          icon={<MagnifyingGlassIcon className="h-5 w-5" />}
        />
        <MoreMenuItem
          title={t('learn')}
          path="https://docs.mango.markets/"
          icon={<LightBulbIcon className="h-5 w-5" />}
          isExternal
        />
        <MoreMenuItem
          title={t('governance:list-token')}
          path="/governance/listToken"
          icon={<PlusCircleIcon className="h-5 w-5" />}
          isExternal
        />
        <MoreMenuItem
          title={t('governance:vote')}
          path="/governance/vote"
          icon={<ArchiveBoxArrowDownIcon className="h-5 w-5" />}
          isExternal
        />
        <MoreMenuItem
          title={t('governance')}
          path="https://dao.mango.markets/"
          icon={<BuildingLibraryIcon className="h-5 w-5" />}
          isExternal
        />
      </div>
    </div>
  )
}

const MoreMenuItem = ({
  title,
  path,
  icon,
  isExternal,
}: {
  title: string
  path: string
  icon: ReactNode
  isExternal?: boolean
}) => {
  const classNames =
    'default-transition flex w-full items-center justify-between border-t border-th-bkg-4 px-2 py-4 text-th-fgd-2 hover:text-th-fgd-1'
  return isExternal ? (
    <a
      className={classNames}
      href={path}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="flex items-center space-x-3">
        {icon}
        <span>{title}</span>
      </div>
      <ChevronRightIcon className="h-5 w-5" />
    </a>
  ) : (
    <Link href={path} shallow={true} className={classNames}>
      <div className="flex items-center space-x-3">
        {icon}
        <span>{title}</span>
      </div>
      <ChevronRightIcon className="h-5 w-5" />
    </Link>
  )
}
