import Link from 'next/link'
import {
  EllipsisHorizontalIcon,
  BuildingLibraryIcon,
  LightBulbIcon,
  ArrowTopRightOnSquareIcon,
  ChevronDownIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  Cog8ToothIcon,
  ArrowsRightLeftIcon,
  ArrowTrendingUpIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  BanknotesIcon,
} from '@heroicons/react/20/solid'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import { Fragment, ReactNode, useState } from 'react'
import { Disclosure, Popover, Transition } from '@headlessui/react'
import MangoAccountSummary from './account/MangoAccountSummary'
import Tooltip from './shared/Tooltip'
import { HealthType } from '@blockworks-foundation/mango-v4'
import { useWallet } from '@solana/wallet-adapter-react'
import mangoStore from '@store/mangoStore'
import HealthHeart from './account/HealthHeart'
import useMangoAccount from 'hooks/useMangoAccount'
import { useTheme } from 'next-themes'
import { IconButton } from './shared/Button'

const SideNav = ({ collapsed }: { collapsed: boolean }) => {
  const { t } = useTranslation(['common', 'search'])
  const { connected } = useWallet()
  const group = mangoStore.getState().group
  const { mangoAccount } = useMangoAccount()
  const router = useRouter()
  const { pathname } = router

  return (
    <div
      className={`transition-all duration-300 ${
        collapsed ? 'w-[64px]' : 'w-44 lg:w-48 xl:w-52'
      } border-r border-th-bkg-3 bg-th-bkg-1`}
    >
      <div className="flex min-h-screen flex-col justify-between">
        <div className="my-2">
          <Link href={'/'} shallow={true} passHref legacyBehavior>
            <div
              className={`h-14 items-center transition-all duration-300 ease-in-out ${
                collapsed ? '' : 'justify-start'
              } pb-1 pt-2 pl-4`}
            >
              <div className={`flex flex-shrink-0 cursor-pointer items-center`}>
                <img
                  className={`h-8 w-8 flex-shrink-0`}
                  src="/logos/logo-mark.svg"
                  alt="next"
                />
                <Transition
                  show={!collapsed}
                  as={Fragment}
                  enter="transition ease-in duration-200"
                  enterFrom="opacity-50"
                  enterTo="opacity-100"
                  leave="transition ease-out duration-200"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <span className="ml-3 font-display text-lg text-th-fgd-1">
                    Mango
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
              active={pathname === '/settings'}
              collapsed={collapsed}
              icon={<Cog8ToothIcon className="h-5 w-5" />}
              title={t('settings')}
              pagePath="/settings"
            />
            <ExpandableMenuItem
              collapsed={collapsed}
              icon={<EllipsisHorizontalIcon className="h-5 w-5" />}
              title={t('more')}
            >
              {/* <MenuItem
              active={pathname === '/fees'}
              collapsed={false}
              icon={<ReceiptTaxIcon className="h-5 w-5" />}
              title={t('fees')}
              pagePath="/fees"
              hideIconBg
            /> */}
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
                collapsed={false}
                icon={<LightBulbIcon className="h-5 w-5" />}
                title={t('learn')}
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
            </ExpandableMenuItem>
          </div>
        </div>
        <div className="border-t border-th-bkg-3">
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
            isOpen
            panelTitle={`${mangoAccount?.name || ''} ${t('account')}`}
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
            showClose
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
  icon: ReactNode
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
        className={`default-transition flex cursor-pointer pl-4 focus:text-th-active focus:outline-none md:hover:text-th-active ${
          active
            ? 'text-th-active'
            : theme === 'Light'
            ? 'text-th-fgd-3'
            : 'text-th-fgd-2'
        } ${hideIconBg ? 'py-1' : 'py-1.5 xl:py-2'}`}
      >
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center">
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
            <Transition
              show={!collapsed}
              as={Fragment}
              enter="transition ease-in duration-300"
              enterFrom="opacity-50"
              enterTo="opacity-100"
              leave="transition ease-out duration-300"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <span className="ml-3 xl:text-base">{title}</span>
            </Transition>
          </div>
          {isExternal ? (
            <ArrowTopRightOnSquareIcon className="mr-4 h-4 w-4" />
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
  isOpen,
  showClose,
  title,
}: {
  alignBottom?: boolean
  children: ReactNode
  collapsed: boolean
  hideIconBg?: boolean
  icon: ReactNode
  panelTitle?: string
  isOpen?: boolean
  showClose?: boolean
  title: string | ReactNode
}) => {
  const [showMenu, setShowMenu] = useState(isOpen || false)
  const { theme } = useTheme()

  const toggleMenu = () => {
    setShowMenu(!showMenu)
  }

  return collapsed ? (
    <Popover>
      <div
        className={`relative z-30 ${alignBottom ? '' : 'py-2 pl-4'}`}
        role="button"
      >
        <Popover.Button
          className={`${
            theme === 'Light' ? 'text-th-fgd-3' : 'text-th-fgd-2'
          } md:hover:text-th-active`}
          onClick={() => toggleMenu()}
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
                ? 'default-transition flex h-[64px] w-[64px] items-center justify-center hover:bg-th-bkg-2'
                : ''
            }`}
          >
            {icon}
          </div>
        </Popover.Button>

        {showMenu ? (
          <Popover.Panel
            static
            className={`absolute z-20 w-56 rounded-md rounded-l-none bg-th-bkg-1  ${
              alignBottom
                ? 'bottom-0 left-[63px] rounded-b-none border-b-0 p-0'
                : 'top-1/2 left-[63px] -translate-y-1/2'
            }`}
          >
            <div className="rounded-md rounded-l-none bg-th-bkg-2 py-2">
              <div className="flex items-center justify-between pl-4 pr-2">
                {panelTitle ? (
                  <h3 className="text-sm font-bold">{panelTitle}</h3>
                ) : null}
                {showClose ? (
                  <IconButton
                    onClick={() => setShowMenu(false)}
                    hideBg
                    size="small"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </IconButton>
                ) : null}
              </div>
              {children}
            </div>
          </Popover.Panel>
        ) : null}
      </div>
    </Popover>
  ) : (
    <Disclosure>
      <div
        onClick={() => setShowMenu(!showMenu)}
        role="button"
        className={`w-full px-4 py-2 ${
          alignBottom ? 'h-[64px] hover:bg-th-bkg-2' : ''
        }`}
      >
        <Disclosure.Button
          className={`flex h-full w-full items-center justify-between rounded-none md:hover:text-th-active`}
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
              enter="transition ease-in duration-300"
              enterFrom="opacity-50"
              enterTo="opacity-100"
              leave="transition ease-out duration-300"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <span className="ml-3 truncate xl:text-base">{title}</span>
            </Transition>
          </div>
          <ChevronDownIcon
            className={`${
              showMenu ? 'rotate-180' : 'rotate-360'
            } h-5 w-5 flex-shrink-0`}
          />
        </Disclosure.Button>
      </div>
      <Transition
        appear={true}
        show={showMenu}
        as={Fragment}
        enter="transition-all ease-in duration-300"
        enterFrom="opacity-100 max-h-0"
        enterTo="opacity-100 max-h-80"
        leave="transition-all ease-out duration-300"
        leaveFrom="opacity-100 max-h-80"
        leaveTo="opacity-0 max-h-0"
      >
        <Disclosure.Panel className="w-full overflow-hidden">
          <div className={`${!alignBottom ? 'ml-2.5' : ''}`}>{children}</div>
        </Disclosure.Panel>
      </Transition>
    </Disclosure>
  )
}
