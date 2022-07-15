import Link from 'next/link'
import BtcMonoIcon from '../icons/BtcMonoIcon'
import TradeIcon from '../icons/TradeIcon'
import {
  CashIcon,
  ChartBarIcon,
  DotsHorizontalIcon,
  LibraryIcon,
  LightBulbIcon,
  ExternalLinkIcon,
  ChevronDownIcon,
  ReceiptTaxIcon,
  ChatIcon,
  HomeIcon,
} from '@heroicons/react/solid'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import { Fragment, ReactNode, useEffect, useState } from 'react'
import { Disclosure, Popover, Transition } from '@headlessui/react'
import Chat from '../chat/Chat'

const SideNav = ({ collapsed }: { collapsed: boolean }) => {
  const { t } = useTranslation('common')
  const router = useRouter()
  const { pathname } = router

  return (
    <div
      className={`flex flex-col justify-between transition-all duration-500 ease-in-out ${
        collapsed ? 'w-20' : 'w-44 lg:w-56'
      } min-h-screen border-r border-th-bkg-3 bg-th-bkg-1`}
    >
      <div className="my-2">
        <Link href={'/'} shallow={true}>
          <div
            className={`h-14 items-center transition-all duration-500 ease-in-out ${
              collapsed ? 'justify-center' : 'justify-start'
            } px-5 py-2`}
          >
            <div className={`flex flex-shrink-0 cursor-pointer items-center`}>
              <img
                className={`h-9 w-auto`}
                src="/logos/logo-mark.svg"
                alt="next"
              />
              <Transition
                show={!collapsed}
                as={Fragment}
                enter="transition-all ease-in duration-200"
                enterFrom="opacity-50"
                enterTo="opacity-100"
                leave="transition ease-out duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <span className="ml-4 text-lg font-bold text-th-fgd-1">
                  Mango
                </span>
              </Transition>
            </div>
          </div>
        </Link>
        <div className={`mt-3 flex flex-col items-start`}>
          <MenuItem
            active={pathname === '/'}
            collapsed={collapsed}
            icon={<HomeIcon className="h-6 w-6" />}
            title={t('portfolio')}
            pagePath="/"
          />
          <MenuItem
            active={pathname === '/trade'}
            collapsed={collapsed}
            icon={<TradeIcon className="h-6 w-6" />}
            title={t('trade')}
            pagePath="/trade"
          />
          <MenuItem
            active={pathname === '/stats'}
            collapsed={collapsed}
            icon={<ChartBarIcon className="h-6 w-6" />}
            title={t('stats')}
            pagePath="/stats"
          />
          <ExpandableMenuItem
            collapsed={collapsed}
            icon={<DotsHorizontalIcon className="h-6 w-6" />}
            pathname={pathname}
            title={t('more')}
          >
            <MenuItem
              active={pathname === '/fees'}
              collapsed={false}
              icon={<ReceiptTaxIcon className="h-4 w-4" />}
              title={t('fees')}
              pagePath="/fees"
              hideIconBg
            />
            <MenuItem
              collapsed={false}
              icon={<LightBulbIcon className="h-4 w-4" />}
              title={t('learn')}
              pagePath="https://docs.mango.markets"
              hideIconBg
              isExternal
            />
            <MenuItem
              collapsed={false}
              icon={<LibraryIcon className="h-4 w-4" />}
              title={t('governance')}
              pagePath="https://dao.mango.markets"
              hideIconBg
              isExternal
            />
          </ExpandableMenuItem>
        </div>
      </div>
      <div className="border-t border-th-bkg-3">
        <ExpandableMenuItem
          collapsed={collapsed}
          icon={<ChatIcon className="h-6 w-6" />}
          title="Trollbox"
          alignBottom
          hideIconBg
        >
          <Chat />
        </ExpandableMenuItem>
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
}: {
  active?: boolean
  collapsed: boolean
  icon: ReactNode
  title: string
  pagePath: string
  hideIconBg?: boolean
  isExternal?: boolean
}) => {
  return (
    <Link href={pagePath} shallow={true}>
      <a
        className={`flex cursor-pointer px-5 py-2 hover:brightness-[1.1] ${
          active ? 'text-th-primary' : 'text-th-fgd-1'
        }`}
      >
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center">
            <div
              className={
                hideIconBg
                  ? ''
                  : 'flex h-10 w-10 items-center justify-center rounded-full bg-th-bkg-3'
              }
            >
              {icon}
            </div>
            <Transition
              show={!collapsed}
              as={Fragment}
              enter="transition-all ease-in duration-300"
              enterFrom="opacity-50"
              enterTo="opacity-100"
              leave="transition ease-out duration-300"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <span className="ml-3 lg:text-base">{title}</span>
            </Transition>
          </div>
          {isExternal ? <ExternalLinkIcon className="h-4 w-4" /> : null}
        </div>
      </a>
    </Link>
  )
}

const ExpandableMenuItem = ({
  alignBottom,
  children,
  collapsed,
  hideIconBg,
  icon,
  pathname,
  title,
}: {
  alignBottom?: boolean
  children: ReactNode
  collapsed: boolean
  hideIconBg?: boolean
  icon: ReactNode
  pathname?: string
  title: string | ReactNode
}) => {
  const [showMenu, setShowMenu] = useState(false)

  const onHoverMenu = (open: boolean, action: string) => {
    if (
      (!open && action === 'onMouseEnter') ||
      (open && action === 'onMouseLeave')
    ) {
      setShowMenu(!open)
    }
  }

  useEffect(() => {
    if (collapsed) {
      setShowMenu(false)
    }
  }, [collapsed])

  const toggleMenu = () => {
    setShowMenu(!showMenu)
  }

  return collapsed ? (
    <Popover>
      <div
        onMouseEnter={
          !alignBottom ? () => onHoverMenu(showMenu, 'onMouseEnter') : undefined
        }
        onMouseLeave={
          !alignBottom ? () => onHoverMenu(showMenu, 'onMouseLeave') : undefined
        }
        className="relative z-30 px-5 py-2"
        onClick={() => toggleMenu()}
        role="button"
      >
        <Popover.Button
          className="hover:text-th-primary"
          onClick={() => toggleMenu()}
        >
          <div
            className={` ${
              hideIconBg
                ? ''
                : 'flex h-10 w-10 items-center justify-center rounded-full bg-th-bkg-3'
            } ${
              alignBottom
                ? 'flex h-14 w-14 items-center justify-center hover:bg-th-bkg-2'
                : ''
            }`}
          >
            {icon}
          </div>
        </Popover.Button>
        <Transition
          show={showMenu}
          as={Fragment}
          enter="transition-all ease-in duration-300"
          enterFrom="opacity-0 transform scale-90"
          enterTo="opacity-100 transform scale-100"
          leave="transition ease-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Popover.Panel
            className={`absolute z-20 rounded-md rounded-l-none border border-th-bkg-3 bg-th-bkg-1 px-5 py-2 ${
              alignBottom
                ? 'bottom-0 left-[55px] w-72 rounded-b-none p-0'
                : 'top-1/2 left-[43px] w-56 -translate-y-1/2 transform'
            }`}
          >
            {children}
          </Popover.Panel>
        </Transition>
      </div>
    </Popover>
  ) : (
    <Disclosure>
      <div
        onClick={() => setShowMenu(!showMenu)}
        role="button"
        className={`w-full px-5 py-2 ${
          alignBottom ? 'h-14 px-3 hover:bg-th-bkg-2' : ''
        }`}
      >
        <Disclosure.Button
          className={`flex h-full w-full items-center justify-between rounded-none hover:text-th-primary`}
        >
          <div className="flex items-center">
            <div
              className={
                hideIconBg
                  ? ''
                  : 'flex h-10 w-10 items-center justify-center rounded-full bg-th-bkg-3'
              }
            >
              {icon}
            </div>
            <Transition
              appear={true}
              show={!collapsed}
              as={Fragment}
              enter="transition-all ease-in duration-300"
              enterFrom="opacity-50"
              enterTo="opacity-100"
              leave="transition ease-out duration-300"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <span className="ml-3 lg:text-base">{title}</span>
            </Transition>
          </div>
          <ChevronDownIcon
            className={`${
              showMenu ? 'rotate-180 transform' : 'rotate-360 transform'
            } h-5 w-5 flex-shrink-0`}
          />
        </Disclosure.Button>
      </div>
      <Transition
        appear={true}
        show={showMenu}
        as={Fragment}
        enter="transition-all ease-in duration-500"
        enterFrom="opacity-100 max-h-0"
        enterTo="opacity-100 max-h-80"
        leave="transition-all ease-out duration-500"
        leaveFrom="opacity-100 max-h-80"
        leaveTo="opacity-0 max-h-0"
      >
        <Disclosure.Panel className="w-full overflow-hidden">
          <div className={`${!alignBottom ? 'ml-4' : ''}`}>{children}</div>
        </Disclosure.Panel>
      </Transition>
    </Disclosure>
  )
}
