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
  Squares2X2Icon,
  BookOpenIcon,
  QueueListIcon,
  LockClosedIcon,
  ChartPieIcon,
} from '@heroicons/react/20/solid'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import React, {
  Fragment,
  ReactNode,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Disclosure, Popover, Transition } from '@headlessui/react'
import MangoAccountSummary from './account/MangoAccountSummary'
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
import CoinIcon from './icons/CoinIcon'
import PerpIcon from './icons/PerpIcon'
//import { useIsWhiteListed } from 'hooks/useIsWhiteListed'

const set = mangoStore.getState().set

const SideNav = ({ collapsed }: { collapsed: boolean }) => {
  const { t } = useTranslation(['common', 'search'])
  const { connected, publicKey } = useWallet()
  const { theme } = useTheme()
  const group = mangoStore.getState().group
  const activeAccountTab = mangoStore((s) => s.accountPageTab)
  const themeData = mangoStore((s) => s.themeData)
  const nfts = mangoStore((s) => s.wallet.nfts.data)
  const { mangoAccount } = useMangoAccount()
  //const { data: isWhiteListed } = useIsWhiteListed()
  const setPrependedGlobalAdditionalInstructions = mangoStore(
    (s) => s.actions.setPrependedGlobalAdditionalInstructions,
  )

  const router = useRouter()
  const { pathname, query } = router

  const { width } = useViewport()
  const [, setIsCollapsed] = useLocalStorageState(SIDEBAR_COLLAPSE_KEY, false)

  useEffect(() => {
    if (width !== 0 && width < breakpoints['xl']) {
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

  return (
    <>
      <div
        className={`transition-all duration-${sideBarAnimationDuration} ${
          collapsed ? 'w-[64px]' : 'hide-scroll w-[200px] overflow-y-auto'
        } border-r border-th-bkg-3 bg-th-bkg-1 bg-contain`}
        // style={
        //   collapsed
        //     ? { backgroundImage: `url(${themeData.sideTilePath})` }
        //     : { backgroundImage: `url(${themeData.sideTilePathExpanded})` }
        // }
      >
        {sidebarImageUrl && !collapsed ? (
          <img
            className={`absolute bottom-16 h-auto w-full shrink-0`}
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
                  className={`flex h-16 shrink-0 cursor-pointer items-center bg-th-bkg-1`}
                >
                  <img
                    className={`h-9 w-9 shrink-0`}
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
              {/* <MenuItem
                active={pathname === '/'}
                collapsed={collapsed}
                icon={<CurrencyDollarIcon className="h-5 w-5" />}
                title={t('account')}
                pagePath="/"
              /> */}
              <ExpandableMenuItem
                active={pathname === '/'}
                collapsed={collapsed}
                icon={<ChartPieIcon className="h-5 w-5" />}
                title={t('account')}
              >
                <MenuItem
                  active={
                    pathname === '/' &&
                    ((!!query?.view && query.view.includes('overview')) ||
                      (activeAccountTab === 'overview' && !query?.view))
                  }
                  collapsed={false}
                  icon={<Squares2X2Icon className="h-4 w-4" />}
                  title={t('overview')}
                  pagePath="/?view=overview"
                  hideIconBg
                />
                <MenuItem
                  active={
                    pathname === '/' &&
                    ((!!query?.view && query.view.includes('balances')) ||
                      (activeAccountTab === 'balances' && !query?.view))
                  }
                  collapsed={false}
                  icon={<CurrencyDollarIcon className="h-4 w-4" />}
                  title={t('balances')}
                  pagePath="/?view=balances"
                  hideIconBg
                />
                <MenuItem
                  active={
                    pathname === '/' &&
                    ((!!query?.view && query.view.includes('positions')) ||
                      (activeAccountTab === 'trade:positions' && !query?.view))
                  }
                  collapsed={false}
                  icon={<PerpIcon className="h-4 w-4" />}
                  title={t('trade:positions')}
                  pagePath="/?view=positions"
                  hideIconBg
                />
                <MenuItem
                  active={
                    pathname === '/' &&
                    ((!!query?.view && query.view.includes('orders')) ||
                      (activeAccountTab === 'trade:orders' && !query?.view))
                  }
                  collapsed={false}
                  icon={<QueueListIcon className="h-4 w-4" />}
                  title={t('trade:orders')}
                  pagePath="/?view=orders"
                  hideIconBg
                />
                <MenuItem
                  active={
                    pathname === '/' &&
                    ((!!query?.view && query.view.includes('unsettled')) ||
                      (activeAccountTab === 'trade:unsettled' && !query?.view))
                  }
                  collapsed={false}
                  icon={<LockClosedIcon className="h-4 w-4" />}
                  title={t('trade:unsettled')}
                  pagePath="/?view=unsettled"
                  hideIconBg
                />
                <MenuItem
                  active={
                    pathname === '/' &&
                    ((!!query?.view && query.view.includes('history')) ||
                      (activeAccountTab === 'history' && !query?.view))
                  }
                  collapsed={false}
                  icon={<BookOpenIcon className="h-4 w-4" />}
                  title={t('history')}
                  pagePath="/?view=history"
                  hideIconBg
                />
              </ExpandableMenuItem>
              <MenuItem
                active={pathname === '/swap'}
                collapsed={collapsed}
                icon={<ArrowsRightLeftIcon className="h-5 w-5" />}
                title={t('swap')}
                pagePath="/swap"
              />
              <ExpandableMenuItem
                active={pathname === '/trade'}
                collapsed={collapsed}
                icon={<ArrowTrendingUpIcon className="h-5 w-5" />}
                title={t('trade')}
              >
                <MenuItem
                  active={
                    pathname === '/trade' &&
                    ((!!query?.name && query.name.includes('PERP')) ||
                      !query?.name)
                  }
                  collapsed={false}
                  icon={<PerpIcon className="h-4 w-4" />}
                  title={t('perp')}
                  pagePath="/trade?name=SOL-PERP"
                  hideIconBg
                />
                <MenuItem
                  active={
                    pathname === '/trade' &&
                    !!query?.name &&
                    !query.name.includes('PERP')
                  }
                  collapsed={false}
                  icon={<CoinIcon className="h-4 w-4" />}
                  title={t('spot')}
                  pagePath="/trade?name=SOL/USDC"
                  hideIconBg
                />
              </ExpandableMenuItem>
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
              {/* {isWhiteListed ? (
              <MenuItem
                active={pathname === '/nft'}
                collapsed={collapsed}
                icon={<PhotoIcon className="h-5 w-5" />}
                title={t('nft-market')}
                pagePath="/nft"
              />
            ) : null} */}
              <ExpandableMenuItem
                collapsed={collapsed}
                icon={<EllipsisHorizontalIcon className="h-5 w-5" />}
                title={t('more')}
              >
                <MenuItem
                  active={pathname === '/search'}
                  collapsed={false}
                  icon={<MagnifyingGlassIcon className="h-4 w-4" />}
                  title={t('search:search-accounts')}
                  pagePath="/search"
                  hideIconBg
                />
                <MenuItem
                  active={pathname === '/governance/list'}
                  collapsed={false}
                  icon={<PlusCircleIcon className="h-4 w-4" />}
                  title={t('common:list-market-token')}
                  pagePath="/governance/list"
                  hideIconBg
                />
                <MenuItem
                  active={pathname === '/governance/vote'}
                  collapsed={false}
                  icon={<ArchiveBoxArrowDownIcon className="h-4 w-4" />}
                  title={t('common:vote')}
                  pagePath="/governance/vote"
                  hideIconBg
                />
                <MenuItem
                  collapsed={false}
                  icon={<DocumentTextIcon className="h-4 w-4" />}
                  title={t('documentation')}
                  pagePath="https://docs.mango.markets"
                  hideIconBg
                  isExternal
                />
                <MenuItem
                  collapsed={false}
                  icon={<BuildingLibraryIcon className="h-4 w-4" />}
                  title={t('governance')}
                  pagePath="https://dao.mango.markets"
                  hideIconBg
                  isExternal
                />
                {/* <MenuItem
                collapsed={false}
                icon={<ClipboardDocumentIcon className="h-5 w-5" />}
                title={t('feedback-survey')}
                pagePath="https://forms.gle/JgV4w7SJ2kPH89mq7"
                hideIconBg
                isExternal
              /> */}
                <MenuItem
                  collapsed={false}
                  icon={<NewspaperIcon className="h-4 w-4" />}
                  title={t('terms-of-use')}
                  pagePath="https://docs.mango.markets/legal"
                  hideIconBg
                  isExternal
                />
                <MenuItem
                  collapsed={false}
                  icon={<ExclamationTriangleIcon className="h-4 w-4" />}
                  title={t('risks')}
                  pagePath="https://docs.mango.markets/mango-markets/risks"
                  hideIconBg
                  isExternal
                />
              </ExpandableMenuItem>
            </div>
          </div>
          <div className="z-10 mt-2 border-t border-th-bkg-3 bg-th-bkg-1">
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
    </>
  )
}

export default SideNav

const MenuItem = ({
  active,
  collapsed,
  icon,
  onClick,
  title,
  pagePath,
  hideIconBg,
  isExternal,
}: {
  active?: boolean
  collapsed: boolean
  icon?: ReactNode
  onClick?: () => void
  title: string
  pagePath: string
  hideIconBg?: boolean
  isExternal?: boolean
}) => {
  const { theme } = useTheme()
  return (
    <Link
      href={pagePath}
      onClick={onClick ? onClick : undefined}
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
      title={title}
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
            <span className="ml-3 whitespace-nowrap 2xl:text-base">
              {title}
            </span>
          </Transition>
        </div>
        {isExternal ? (
          <ArrowTopRightOnSquareIcon className="ml-2 h-3 w-3" />
        ) : null}
      </div>
    </Link>
  )
}

export const ExpandableMenuItem = ({
  active,
  alignBottom,
  children,
  collapsed,
  hideIconBg,
  icon,
  panelTitle,
  title,
}: {
  active?: boolean
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

  const [isOverButton, setIsOverButton] = useState(false)
  const [isOverList, setIsOverList] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isTouchInput, setIsTouchInput] = useState(false)
  const [hasClicked, setHasClicked] = useState(false)
  const button = useRef<HTMLButtonElement>(null)

  useLayoutEffect(() => {
    if (
      isOpen &&
      !isOverButton &&
      !isOverList &&
      !isTouchInput &&
      button?.current
    ) {
      button.current.click()
      setIsOpen(false)
    } else if (
      !isOpen &&
      (isOverButton || isOverList) &&
      !isTouchInput &&
      button?.current
    ) {
      button.current.click()
      setIsOpen(true)
    }
  }, [isOverButton, isOverList])

  useEffect(() => {
    setIsTouchInput(false)
    setHasClicked(false)
  }, [hasClicked])

  // hack for weird bug where isOverList is true when it shouldn't be (only in account nav => click link in menu then overview tab and quickly hover account main menu icon)
  useEffect(() => {
    if (isOverButton && isOverList) {
      setIsOverList(false)
    }
  }, [isOverButton, isOverList])

  return collapsed ? (
    <Popover className={`relative z-30 ${alignBottom ? '' : 'py-2 pl-4'}`}>
      <Popover.Button
        className={`${
          active
            ? 'text-th-active'
            : theme === 'Light'
            ? 'text-th-fgd-3'
            : 'text-th-fgd-2'
        } ${
          alignBottom
            ? 'focus-visible:bg-th-bkg-3'
            : 'w-[48px] focus-visible:text-th-active'
        } md:hover:text-th-active`}
        ref={button}
        onTouchStart={() => {
          setIsTouchInput(true)
        }}
        onMouseEnter={() => {
          setIsOverButton(true)
        }}
        onMouseLeave={() => {
          setIsOverButton(false)
        }}
        onClick={() => {
          setHasClicked(true)
          setIsOpen(!isOpen)
        }}
        onKeyDown={() => {
          setIsOpen(!isOpen)
        }}
        title={`${title}`}
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
      <Transition
        show={isOpen}
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition ease-in duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <Popover.Panel
          className={`absolute left-[64px] z-20 w-56 rounded-md rounded-l-none bg-th-bkg-1 focus:outline-none ${
            alignBottom ? 'bottom-0 rounded-b-none border-b-0 p-0' : 'top-0'
          }`}
          onMouseEnter={() => {
            setIsOverList(true)
          }}
          onMouseLeave={() => {
            setIsOverList(false)
          }}
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
            <div onClick={() => setIsOpen(false)}>{children}</div>
          </div>
        </Popover.Panel>
      </Transition>
    </Popover>
  ) : (
    <Disclosure>
      {({ open }) => (
        <>
          <Disclosure.Button
            className={`flex w-full items-center justify-between rounded-none px-4 py-2 focus-visible:text-th-active md:hover:text-th-active ${
              active ? 'text-th-active' : ''
            } ${
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
                <span className="ml-3 truncate 2xl:text-base">{title}</span>
              </Transition>
            </div>
            <ChevronDownIcon
              className={`${open ? 'rotate-180' : 'rotate-0'} h-5 w-5 shrink-0`}
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
              <div className={`${!alignBottom ? 'ml-3' : ''}`}>{children}</div>
            </Disclosure.Panel>
          </Transition>
        </>
      )}
    </Disclosure>
  )
}
