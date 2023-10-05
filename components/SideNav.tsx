import Link from 'next/link'
import {
  EllipsisHorizontalIcon,
  BuildingLibraryIcon,
  ArrowTopRightOnSquareIcon,
  ChevronDownIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowsRightLeftIcon,
  ArrowTrendingUpIcon,
  MagnifyingGlassIcon,
  BanknotesIcon,
  NewspaperIcon,
  PlusCircleIcon,
  ArchiveBoxArrowDownIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  SparklesIcon,
} from '@heroicons/react/20/solid'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import { Fragment, ReactNode, useEffect, useMemo } from 'react'
import { Disclosure, Popover, Transition } from '@headlessui/react'
import MangoAccountSummary from './account/MangoAccountSummary'
import Tooltip from './shared/Tooltip'
import { HealthType } from '@blockworks-foundation/mango-v4'
import { useWallet } from '@solana/wallet-adapter-react'
import mangoStore from '@store/mangoStore'
import HealthHeart from './account/HealthHeart'
import useMangoAccount from 'hooks/useMangoAccount'
import { useTheme } from 'next-themes'
import LeaderboardIcon from './icons/LeaderboardIcon'
import { sideBarAnimationDuration } from './Layout'
import { CUSTOM_SKINS, breakpoints } from 'utils/theme'
import { NFT } from 'types'
import { useViewport } from 'hooks/useViewport'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { SIDEBAR_COLLAPSE_KEY } from 'utils/constants'
import { createTransferInstruction } from '@solana/spl-token'
import { PublicKey, TransactionInstruction } from '@solana/web3.js'

const set = mangoStore.getState().set

const SideNav = ({ collapsed }: { collapsed: boolean }) => {
  const { t } = useTranslation(['common', 'search'])
  const { connected, publicKey } = useWallet()
  const { theme, setTheme } = useTheme()
  const group = mangoStore.getState().group
  const themeData = mangoStore((s) => s.themeData)
  const nfts = mangoStore((s) => s.wallet.nfts.data)
  const loadingNfts = mangoStore((s) => s.wallet.nfts.initialLoad)
  const { mangoAccount } = useMangoAccount()
  const setPrependedGlobalAdditionalInstructions = mangoStore(
    (s) => s.actions.setPrependedGlobalAdditionalInstructions,
  )

  const router = useRouter()
  const { pathname } = router

  const { width } = useViewport()
  const [, setIsCollapsed] = useLocalStorageState(SIDEBAR_COLLAPSE_KEY, false)
  useEffect(() => {
    if (width !== 0 && width < breakpoints['2xl']) {
      setIsCollapsed(true)
    }
  }, [width, setIsCollapsed])

  const playAnimation = () => {
    const set = mangoStore.getState().set
    set((s) => {
      s.successAnimation.theme = true
    })
  }

  // fetch nfts when pk changes
  useEffect(() => {
    if (publicKey) {
      set((state) => {
        state.wallet.nfts.initialLoad = true
      })
      const actions = mangoStore.getState().actions
      const connection = mangoStore.getState().connection
      actions.fetchNfts(connection, publicKey)
    }
  }, [publicKey])

  // find all mango skin nfts
  const mangoNfts = useMemo(() => {
    if (!nfts.length) return []
    const mangoNfts: NFT[] = []
    for (const nft of nfts) {
      const collectionAddress = nft?.collectionAddress
      for (const themeKey in CUSTOM_SKINS) {
        if (CUSTOM_SKINS[themeKey] === collectionAddress) {
          mangoNfts.push(nft)
        }
      }
    }
    return mangoNfts
  }, [nfts])

  //mark transactions with used nfts
  useEffect(() => {
    let newInstruction: TransactionInstruction[] = []
    if (mangoNfts.length && theme) {
      const collectionAddress = CUSTOM_SKINS[theme.toLowerCase()]
      const usedNft = mangoNfts.find(
        (nft) => nft.collectionAddress === collectionAddress,
      )
      if (usedNft && publicKey && collectionAddress) {
        newInstruction = [
          createTransferInstruction(
            new PublicKey(usedNft.tokenAccount),
            new PublicKey(usedNft.tokenAccount),
            publicKey,
            1,
          ),
        ]
      }
    }
    setPrependedGlobalAdditionalInstructions(newInstruction)
  }, [mangoNfts, theme, themeData])

  // find sidebar image url from skin nft for theme
  const sidebarImageUrl = useMemo(() => {
    if (!theme) return themeData.sideImagePath
    const collectionAddress = CUSTOM_SKINS[theme.toLowerCase()]
    if (collectionAddress && mangoNfts.length) {
      const attributes = mangoNfts.find(
        (nft) => nft.collectionAddress === collectionAddress,
      )?.json?.attributes
      const sidebarImageUrl = attributes
        ? attributes[0].value || themeData.sideImagePath
        : ''
      return sidebarImageUrl
    }
    return themeData.sideImagePath
  }, [mangoNfts, theme, themeData])

  // change theme if switching to wallet without nft
  useEffect(() => {
    if (loadingNfts || !theme) return
    if (theme.toLowerCase() in CUSTOM_SKINS) {
      const hasSkin = mangoNfts.find(
        (nft) => nft.collectionAddress === CUSTOM_SKINS[theme.toLowerCase()],
      )
      if (!hasSkin) {
        setTheme(t('settings:mango-classic'))
      }
    }
  }, [loadingNfts, mangoNfts, publicKey, theme])

  return (
    <div
      className={`transition-all duration-${sideBarAnimationDuration} ${
        collapsed ? 'w-[64px]' : 'w-[200px]'
      } border-r border-th-bkg-3 bg-th-bkg-1 bg-contain`}
      style={
        collapsed
          ? { backgroundImage: `url(${themeData.sideTilePath})` }
          : { backgroundImage: `url(${themeData.sideTilePathExpanded})` }
      }
    >
      {sidebarImageUrl && !collapsed ? (
        <img
          className={`absolute bottom-16 h-auto w-full flex-shrink-0`}
          onClick={() => playAnimation()}
          src={sidebarImageUrl}
          alt="next"
        />
      ) : null}
      <div className="flex h-screen flex-col justify-between">
        <div className="mb-2">
          <Link href={'/'} shallow={true} passHref legacyBehavior>
            <div
              className={`items-center transition-all duration-${sideBarAnimationDuration} ease-in-out ${
                collapsed ? '' : 'justify-start'
              } pb-1 pl-3`}
            >
              <div
                className={`flex h-16 flex-shrink-0 cursor-pointer items-center bg-th-bkg-1`}
              >
                <img
                  className={`h-9 w-9 flex-shrink-0`}
                  src={themeData.logoPath}
                  alt="logo"
                />
                <Transition
                  show={!collapsed}
                  as={Fragment}
                  enter="transition-all ease-in duration-200"
                  enterFrom="opacity-50"
                  enterTo="opacity-100"
                  leave="transition-all ease-out duration-200"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <span className={`ml-3 font-display text-lg text-th-fgd-1`}>
                    {themeData.platformName}
                  </span>
                </Transition>
              </div>
            </div>
          </Link>
          <div className="flex flex-col items-start">
            <MenuItem
              active={pathname === '/'}
              collapsed={collapsed}
              icon={<CurrencyDollarIcon className="h-5 w-5" />}
              title={t('account')}
              pagePath="/"
            />
            <MenuItem
              active={pathname === '/swap'}
              collapsed={collapsed}
              icon={<ArrowsRightLeftIcon className="h-5 w-5" />}
              title={t('swap')}
              pagePath="/swap"
            />
            <MenuItem
              active={pathname === '/trade'}
              collapsed={collapsed}
              icon={<ArrowTrendingUpIcon className="h-5 w-5" />}
              title={t('trade')}
              pagePath="/trade"
            />
            <MenuItem
              active={pathname === '/explore'}
              collapsed={collapsed}
              icon={<SparklesIcon className="h-5 w-5" />}
              title={t('explore')}
              pagePath="/explore"
            />
            <MenuItem
              active={pathname === '/borrow'}
              collapsed={collapsed}
              icon={<BanknotesIcon className="h-5 w-5" />}
              title={t('borrow')}
              pagePath="/borrow"
            />
            <MenuItem
              active={pathname === '/stats'}
              collapsed={collapsed}
              icon={<ChartBarIcon className="h-5 w-5" />}
              title={t('stats')}
              pagePath="/stats"
            />
            <MenuItem
              active={pathname === '/leaderboard'}
              collapsed={collapsed}
              icon={<LeaderboardIcon className="h-5 w-5" />}
              title={t('leaderboard')}
              pagePath="/leaderboard"
            />
            <ExpandableMenuItem
              collapsed={collapsed}
              icon={<EllipsisHorizontalIcon className="h-5 w-5" />}
              title={t('more')}
            >
              <MenuItem
                active={pathname === '/search'}
                collapsed={false}
                icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                title={t('search:search-accounts')}
                pagePath="/search"
                hideIconBg
                showTooltip={false}
              />
              <MenuItem
                active={pathname === '/governance/list'}
                collapsed={false}
                icon={<PlusCircleIcon className="h-5 w-5" />}
                title={t('common:list-market-token')}
                pagePath="/governance/list"
                hideIconBg
                showTooltip={false}
              />
              <MenuItem
                active={pathname === '/governance/vote'}
                collapsed={false}
                icon={<ArchiveBoxArrowDownIcon className="h-5 w-5" />}
                title={t('common:vote')}
                pagePath="/governance/vote"
                hideIconBg
                showTooltip={false}
              />
              <MenuItem
                collapsed={false}
                icon={<DocumentTextIcon className="h-5 w-5" />}
                title={t('documentation')}
                pagePath="https://docs.mango.markets"
                hideIconBg
                isExternal
                showTooltip={false}
              />
              <MenuItem
                collapsed={false}
                icon={<BuildingLibraryIcon className="h-5 w-5" />}
                title={t('governance')}
                pagePath="https://dao.mango.markets"
                hideIconBg
                isExternal
                showTooltip={false}
              />
              {/* <MenuItem
                collapsed={false}
                icon={<ClipboardDocumentIcon className="h-5 w-5" />}
                title={t('feedback-survey')}
                pagePath="https://forms.gle/JgV4w7SJ2kPH89mq7"
                hideIconBg
                isExternal
                showTooltip={false}
              /> */}
              <MenuItem
                collapsed={false}
                icon={<NewspaperIcon className="h-5 w-5" />}
                title={t('terms-of-use')}
                pagePath="https://docs.mango.markets/legal"
                hideIconBg
                isExternal
                showTooltip={false}
              />
              <MenuItem
                collapsed={false}
                icon={<ExclamationTriangleIcon className="h-5 w-5" />}
                title={t('risks')}
                pagePath="https://docs.mango.markets/mango-markets/risks"
                hideIconBg
                isExternal
                showTooltip={false}
              />
            </ExpandableMenuItem>
          </div>
        </div>
        <div className="z-10 border-t border-th-bkg-3 bg-th-bkg-1">
          <ExpandableMenuItem
            collapsed={collapsed}
            icon={
              <HealthHeart
                health={
                  group && mangoAccount
                    ? mangoAccount.getHealthRatioUi(group, HealthType.maint)
                    : 0
                }
                size={32}
              />
            }
            panelTitle={mangoAccount?.name ? mangoAccount.name : t('account')}
            title={
              <div className="w-24 text-left">
                <p className="mb-0.5 whitespace-nowrap text-xs">
                  {t('account')}
                </p>
                <p className="truncate whitespace-nowrap text-sm font-bold text-th-fgd-1">
                  {mangoAccount
                    ? mangoAccount.name
                    : connected
                    ? 'No Account'
                    : 'Connect'}
                </p>
              </div>
            }
            alignBottom
            hideIconBg
          >
            <div className="px-4 py-2">
              <MangoAccountSummary />
            </div>
          </ExpandableMenuItem>
        </div>
      </div>
    </div>
  )
}

export default SideNav

const MenuItem = ({
  active,
  collapsed,
  icon,
  title,
  pagePath,
  hideIconBg,
  isExternal,
  showTooltip = true,
}: {
  active?: boolean
  collapsed: boolean
  icon?: ReactNode
  title: string
  pagePath: string
  hideIconBg?: boolean
  isExternal?: boolean
  showTooltip?: boolean
}) => {
  const { theme } = useTheme()
  return (
    <Tooltip content={title} placement="right" show={collapsed && showTooltip}>
      <Link
        href={pagePath}
        shallow={true}
        className={`flex cursor-pointer pl-4 focus:outline-none focus-visible:text-th-active md:hover:text-th-active ${
          active
            ? 'text-th-active'
            : theme === 'Light'
            ? 'text-th-fgd-3'
            : 'text-th-fgd-2'
        } ${hideIconBg ? 'py-1' : 'py-1.5 xl:py-2'}`}
        target={isExternal ? '_blank' : ''}
        rel={isExternal ? 'noopener noreferrer' : ''}
      >
        <div className="flex w-full items-center">
          <div className="flex items-center">
            {icon ? (
              <div
                className={
                  hideIconBg
                    ? ''
                    : `flex h-8 w-8 items-center justify-center rounded-full ${
                        theme === 'Light' ? 'bg-th-bkg-2' : 'bg-th-bkg-3'
                      }`
                }
              >
                {icon}
              </div>
            ) : null}
            <Transition
              show={!collapsed}
              as={Fragment}
              enter={`transition-all ease-in duration-${sideBarAnimationDuration}`}
              enterFrom="opacity-50"
              enterTo="opacity-100"
              leave={`transition-all ease-out duration-${sideBarAnimationDuration}`}
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <span className="ml-3 xl:text-base">{title}</span>
            </Transition>
          </div>
          {isExternal ? (
            <ArrowTopRightOnSquareIcon className="ml-2 h-3 w-3" />
          ) : null}
        </div>
      </Link>
    </Tooltip>
  )
}

export const ExpandableMenuItem = ({
  alignBottom,
  children,
  collapsed,
  hideIconBg,
  icon,
  panelTitle,
  title,
}: {
  alignBottom?: boolean
  children: ReactNode
  collapsed: boolean
  hideIconBg?: boolean
  icon: ReactNode
  panelTitle?: string
  title: string | ReactNode
}) => {
  const { theme } = useTheme()
  const themeData = mangoStore((s) => s.themeData)

  return collapsed ? (
    <Popover className={`relative z-30 ${alignBottom ? '' : 'py-2 pl-4'}`}>
      <Popover.Button
        className={`${theme === 'Light' ? 'text-th-fgd-3' : 'text-th-fgd-2'} ${
          alignBottom
            ? 'focus-visible:bg-th-bkg-3'
            : 'focus-visible:text-th-active'
        } md:hover:text-th-active`}
      >
        <div
          className={` ${
            hideIconBg
              ? ''
              : `flex h-8 w-8 items-center justify-center rounded-full ${
                  theme === 'Light' ? 'bg-th-bkg-2' : 'bg-th-bkg-3'
                }`
          } ${
            alignBottom
              ? 'flex h-[64px] w-[64px] items-center justify-center hover:bg-th-bkg-2'
              : ''
          }`}
        >
          {icon}
        </div>
      </Popover.Button>
      <Popover.Panel
        className={`absolute left-[64px] z-20 w-56 rounded-md rounded-l-none bg-th-bkg-1 focus:outline-none ${
          alignBottom
            ? 'bottom-0 rounded-b-none border-b-0 p-0'
            : 'top-1/2 -translate-y-1/2'
        }`}
      >
        <div
          className={`rounded-md rounded-l-none bg-th-bkg-2 ${
            alignBottom ? 'pb-2 pt-4' : 'py-2'
          }`}
        >
          <div className="flex items-center justify-between pl-4 pr-2">
            {panelTitle ? (
              <h3 className="text-sm font-bold">{panelTitle}</h3>
            ) : null}
          </div>
          {children}
        </div>
      </Popover.Panel>
    </Popover>
  ) : (
    <Disclosure>
      {({ open }) => (
        <>
          <Disclosure.Button
            className={`flex w-full items-center justify-between rounded-none px-4 py-2 focus-visible:text-th-active md:hover:text-th-active ${
              alignBottom
                ? 'h-[64px] focus-visible:bg-th-bkg-3 md:hover:bg-th-bkg-2'
                : ''
            }`}
          >
            <div className="flex items-center">
              <div
                className={
                  hideIconBg
                    ? ''
                    : 'flex h-8 w-8 items-center justify-center rounded-full bg-th-bkg-3'
                }
              >
                {icon}
              </div>
              <Transition
                appear={true}
                show={!collapsed}
                as={Fragment}
                enter={`transition-all ease-in duration-${sideBarAnimationDuration}`}
                enterFrom="opacity-50"
                enterTo="opacity-100"
                leave={`transition-all ease-out duration-${sideBarAnimationDuration}`}
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <span className="ml-3 truncate xl:text-base">{title}</span>
              </Transition>
            </div>
            <ChevronDownIcon
              className={`${
                open ? 'rotate-180' : 'rotate-360'
              } h-5 w-5 flex-shrink-0`}
            />
          </Disclosure.Button>
          <Transition
            as={Fragment}
            enter={`transition-all ease-in duration-${sideBarAnimationDuration}`}
            enterFrom="opacity-100 max-h-0"
            enterTo="opacity-100 max-h-80"
            leave={`transition-all ease-out duration-${sideBarAnimationDuration}`}
            leaveFrom="opacity-100 max-h-80"
            leaveTo="opacity-0 max-h-0"
          >
            <Disclosure.Panel
              className={`w-full overflow-hidden ${
                themeData.sideImagePath ? 'z-10 bg-th-bkg-1 py-2' : ''
              }`}
            >
              <div className={`${!alignBottom ? 'ml-1.5' : ''}`}>
                {children}
              </div>
            </Disclosure.Panel>
          </Transition>
        </>
      )}
    </Disclosure>
  )
}
