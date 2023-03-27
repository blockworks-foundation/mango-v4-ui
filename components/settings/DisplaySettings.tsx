import ButtonGroup from '@components/forms/ButtonGroup'
import Select from '@components/forms/Select'
import ChartMiddleOBLeft from '@components/icons/ChartMiddleOBLeft'
import ChartMiddleOBRight from '@components/icons/ChartMiddleOBRight'
import ChartOnLeft from '@components/icons/ChartOnLeft'
import ChartOnRight from '@components/icons/ChartOnRight'
import Tooltip from '@components/shared/Tooltip'
import { TradeLayout } from '@components/trade/TradeAdvancedPage'
// import dayjs from 'dayjs'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { useTranslation } from 'next-i18next'
import { useTheme } from 'next-themes'
import { ReactNode } from 'react'
// import { useRouter } from 'next/router'
// import { useCallback } from 'react'
import {
  NOTIFICATION_POSITION_KEY,
  SIZE_INPUT_UI_KEY,
  TRADE_CHART_UI_KEY,
  TRADE_LAYOUT_KEY,
} from 'utils/constants'

const NOTIFICATION_POSITIONS = [
  'bottom-left',
  'bottom-right',
  'top-left',
  'top-right',
]

const TRADING_CHARTS = ['custom', 'trading-view']
const TRADE_FORM_UI = ['slider', 'buttons']

// const LANGS = [
// { locale: 'en', name: 'english', description: 'english' },
// { locale: 'ru', name: 'russian', description: 'russian' },
// { locale: 'es', name: 'spanish', description: 'spanish' },
// {
//   locale: 'zh_tw',
//   name: 'chinese-traditional',
//   description: 'traditional chinese',
// },
// { locale: 'zh', name: 'chinese', description: 'simplified chinese' },
// ]

export const THEMES = [
  'light',
  'medium',
  'dark',
  'high-contrast',
  'mango-classic',
  'avocado',
  'banana',
  'blueberry',
  'lychee',
  'olive',
]

const DisplaySettings = () => {
  const { t } = useTranslation(['common', 'settings'])
  const { theme, setTheme } = useTheme()
  // const [savedLanguage, setSavedLanguage] = useLocalStorageState('language', '')
  // const router = useRouter()
  // const { pathname, asPath, query } = router
  const [notificationPosition, setNotificationPosition] = useLocalStorageState(
    NOTIFICATION_POSITION_KEY,
    'bottom-left'
  )
  const [tradeFormUi, setTradeFormUi] = useLocalStorageState(
    SIZE_INPUT_UI_KEY,
    'slider'
  )
  const [tradeChartUi, setTradeChartUi] = useLocalStorageState(
    TRADE_CHART_UI_KEY,
    'trading-view'
  )
  const [, setTradeLayout] = useLocalStorageState(TRADE_LAYOUT_KEY, 'chartLeft')

  // const handleLangChange = useCallback(
  //   (l: string) => {
  //     setSavedLanguage(l)
  //     router.push({ pathname, query }, asPath, { locale: l })
  //     dayjs.locale(l == 'zh_tw' ? 'zh-tw' : l)
  //   },
  //   [router]
  // )

  return (
    <>
      <h2 className="mb-4 text-base">{t('settings:display')}</h2>
      <div className="flex flex-col border-t border-th-bkg-3 py-4 md:flex-row md:items-center md:justify-between md:px-4">
        <p className="mb-2 md:mb-0">{t('settings:theme')}</p>
        <div className="w-full min-w-[140px] md:w-auto">
          <Select
            value={theme}
            onChange={(t) => setTheme(t)}
            className="w-full"
          >
            {THEMES.map((theme) => (
              <Select.Option key={theme} value={t(`settings:${theme}`)}>
                {t(`settings:${theme}`)}
              </Select.Option>
            ))}
          </Select>
        </div>
      </div>
      {/* <div className="flex flex-col border-t border-th-bkg-3 py-4 md:flex-row md:items-center md:justify-between md:px-4">
        <p className="mb-2 md:mb-0">{t('settings:language')}</p>
        <div className="w-full min-w-[330px] md:w-[480px] md:pl-4">
          <ButtonGroup
            activeValue={savedLanguage}
            onChange={(l) => handleLangChange(l)}
            values={LANGS.map((val) => val.locale)}
            names={LANGS.map((val) => t(`settings:${val.name}`))}
          />
        </div>
      </div> */}
      <div className="hidden border-t border-th-bkg-3 py-4 md:flex md:flex-row md:items-center md:justify-between md:px-4">
        <p className="mb-2 md:mb-0">{t('settings:notification-position')}</p>
        <div className="w-full min-w-[140px] md:w-auto">
          <Select
            value={t(`settings:${notificationPosition}`)}
            onChange={(p) => setNotificationPosition(p)}
            className="w-full"
          >
            {NOTIFICATION_POSITIONS.map((val) => (
              <Select.Option key={val} value={t(`settings:${val}`)}>
                {t(`settings:${val}`)}
              </Select.Option>
            ))}
          </Select>
        </div>
      </div>
      <div className="hidden border-t border-th-bkg-3 py-4 md:px-4 lg:flex lg:items-center lg:justify-between">
        <p className="mb-2 md:mb-0">{t('settings:trade-layout')}</p>
        <div className="flex space-x-3">
          <Tooltip content={t('settings:chart-left')}>
            <ChartLayoutButton
              icon={<ChartOnLeft className="h-auto w-32" />}
              position="chartLeft"
              onClick={() => setTradeLayout('chartLeft')}
            />
          </Tooltip>
          <Tooltip content={t('settings:chart-middle-ob-right')}>
            <ChartLayoutButton
              icon={<ChartMiddleOBRight className="h-auto w-32" />}
              position="chartMiddleOBRight"
              onClick={() => setTradeLayout('chartMiddleOBRight')}
            />
          </Tooltip>
          <Tooltip content={t('settings:chart-middle-ob-left')}>
            <ChartLayoutButton
              icon={<ChartMiddleOBLeft className="h-auto w-32" />}
              position="chartMiddleOBLeft"
              onClick={() => setTradeLayout('chartMiddleOBLeft')}
            />
          </Tooltip>
          <Tooltip content={t('settings:chart-right')}>
            <ChartLayoutButton
              icon={<ChartOnRight className="h-auto w-32" />}
              position="chartRight"
              onClick={() => setTradeLayout('chartRight')}
            />
          </Tooltip>
        </div>
      </div>
      <div className="flex flex-col border-t border-th-bkg-3 py-4 md:flex-row md:items-center md:justify-between md:px-4">
        <p className="mb-2 md:mb-0">{t('settings:swap-trade-size-selector')}</p>
        <div className="w-full min-w-[160px] md:w-auto">
          <ButtonGroup
            activeValue={tradeFormUi}
            onChange={(v) => setTradeFormUi(v)}
            values={TRADE_FORM_UI}
            names={TRADE_FORM_UI.map((val) => t(`settings:${val}`))}
          />
        </div>
      </div>
      <div className="flex flex-col border-t border-th-bkg-3 py-4 md:flex-row md:items-center md:justify-between md:px-4">
        <p className="mb-2 lg:mb-0">{t('settings:trade-chart')}</p>
        <div className="w-full min-w-[220px] md:w-auto">
          <ButtonGroup
            activeValue={tradeChartUi}
            onChange={(v) => setTradeChartUi(v)}
            values={TRADING_CHARTS}
            names={TRADING_CHARTS.map((val) => t(`settings:${val}`))}
          />
        </div>
      </div>
    </>
  )
}

export default DisplaySettings

const ChartLayoutButton = ({
  onClick,
  icon,
  position,
}: {
  onClick: (l: TradeLayout) => void
  icon: ReactNode
  position: TradeLayout
}) => {
  const [tradeLayout] = useLocalStorageState(TRADE_LAYOUT_KEY, 'chartLeft')
  return (
    <button
      className={`flex h-max items-center justify-center rounded border ${
        tradeLayout === position
          ? 'border-th-active'
          : 'border-th-bkg-4 md:hover:border-th-fgd-4'
      } p-0.5 focus:border-th-fgd-4`}
      onClick={() => onClick(position)}
    >
      {icon}
    </button>
  )
}
