import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ChartBarIcon, HomeIcon, MenuIcon, XIcon } from '@heroicons/react/solid'
import TradeIcon from '../icons/TradeIcon'
import { useTranslation } from 'next-i18next'
import { IconButton } from '../shared/Button'
import {
  CashIcon,
  ChevronRightIcon,
  CurrencyDollarIcon as FeesIcon,
  LightBulbIcon,
} from '@heroicons/react/solid'

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

const BottomBar = () => {
  const { t } = useTranslation('common')
  const { asPath } = useRouter()
  const [showPanel, setShowPanel] = useState(false)

  return (
    <>
      <div className="grid grid-cols-4 grid-rows-1 bg-th-bkg-2 py-2.5">
        <Link
          href={{
            pathname: '/',
          }}
        >
          <a
            className={`${
              asPath === '/' ? 'text-th-primary' : 'text-th-fgd-3'
            } col-span-1 flex cursor-pointer flex-col items-center`}
          >
            <HomeIcon className="mb-1 h-4 w-4" />
            <StyledBarItemLabel>{t('account')}</StyledBarItemLabel>
          </a>
        </Link>
        <Link
          href={{
            pathname: '/trade',
          }}
          shallow={true}
        >
          <a
            className={`${
              asPath === '/trade' ? 'text-th-primary' : 'text-th-fgd-3'
            } col-span-1 flex cursor-pointer flex-col items-center`}
          >
            <TradeIcon className="mb-1 h-4 w-4" />
            <StyledBarItemLabel>{t('trade')}</StyledBarItemLabel>
          </a>
        </Link>
        <Link href="/stats" shallow={true}>
          <a
            className={`${
              asPath === '/stats' ? 'text-th-primary' : 'text-th-fgd-3'
            } col-span-1 flex cursor-pointer flex-col items-center`}
          >
            <ChartBarIcon className="mb-1 h-4 w-4" />
            <StyledBarItemLabel>{t('stats')}</StyledBarItemLabel>
          </a>
        </Link>
        <a
          className={`${
            showPanel ? 'text-th-primary' : 'text-th-fgd-3'
          } col-span-1 flex cursor-pointer flex-col items-center`}
          onClick={() => setShowPanel(!showPanel)}
        >
          <MenuIcon className="mb-1 h-4 w-4" />
          <StyledBarItemLabel>{t('more')}</StyledBarItemLabel>
        </a>
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
  const { t } = useTranslation('common')
  return (
    <div
      className={`fixed bottom-0 z-30 h-96 w-full overflow-hidden bg-th-bkg-2 px-4 transition duration-500 ease-in-out ${
        showPanel ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="flex justify-end py-4">
        <IconButton onClick={() => setShowPanel(false)} hideBg>
          <XIcon className="h-5 w-5" />
        </IconButton>
      </div>
      <div
        className="border-b border-th-bkg-4"
        onClick={() => setShowPanel(false)}
      >
        <MoreMenuItem
          title={t('borrow')}
          path="/borrow"
          icon={<CashIcon className="h-5 w-5" />}
        />
        <MoreMenuItem
          title={t('fees')}
          path="/fees"
          icon={<FeesIcon className="h-5 w-5" />}
        />
        <MoreMenuItem
          title={t('learn')}
          path="https://docs.mango.markets/"
          icon={<LightBulbIcon className="h-5 w-5" />}
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
    'default-transition flex w-full items-center justify-between border-t border-th-bkg-4 px-2 py-3 text-th-fgd-2 hover:text-th-fgd-1'
  return isExternal ? (
    <a
      className={classNames}
      href={path}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="flex items-center">
        {icon}
        <span className="ml-1.5">{title}</span>
      </div>
      <ChevronRightIcon className="h-5 w-5" />
    </a>
  ) : (
    <Link href={path} shallow={true}>
      <a className={classNames}>
        <div className="flex items-center">
          {icon}
          <span className="ml-1.5">{title}</span>
        </div>
        <ChevronRightIcon className="h-5 w-5" />
      </a>
    </Link>
  )
}
