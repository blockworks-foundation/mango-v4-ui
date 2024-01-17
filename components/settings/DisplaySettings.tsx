import ButtonGroup from '@components/forms/ButtonGroup'
import Select from '@components/forms/Select'
import ChartMiddleOBLeft from '@components/icons/ChartMiddleOBLeft'
import ChartMiddleOBRight from '@components/icons/ChartMiddleOBRight'
import ChartOnLeft from '@components/icons/ChartOnLeft'
import ChartOnRight from '@components/icons/ChartOnRight'
import Tooltip from '@components/shared/Tooltip'
import { TradeLayout } from '@components/trade/TradeAdvancedPage'
// import dayjs from 'dayjs'
import { ReactNode, useEffect, useState } from 'react'
// import { useRouter } from 'next/router'
// import { useCallback } from 'react'
import dayjs from 'dayjs'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { useTranslation } from 'next-i18next'
import { useTheme } from 'next-themes'
import { useCallback } from 'react'
import { useRouter } from 'next/router'
import {
  NOTIFICATION_POSITION_KEY,
  SIZE_INPUT_UI_KEY,
  TRADE_CHART_UI_KEY,
  TRADE_LAYOUT_KEY,
} from 'utils/constants'
import mangoStore from '@store/mangoStore'
import { CUSTOM_SKINS } from 'utils/theme'
import { SETTINGS_BUTTON_TITLE_CLASSES } from './AccountSettings'

const NOTIFICATION_POSITIONS = [
  'bottom-left',
  'bottom-right',
  'top-left',
  'top-right',
]

const TRADING_CHARTS = ['custom', 'trading-view']
const TRADE_FORM_UI = ['slider', 'buttons']

const LANGS = [
  { locale: 'en', name: 'english', description: 'english' },
  { locale: 'pt', name: 'Português', description: 'portuguese' },
  // { locale: 'ru', name: 'russian', description: 'russian' },
  // { locale: 'es', name: 'spanish', description: 'spanish' },
  {
    locale: 'zh_tw',
    name: 'chinese-traditional',
    description: 'traditional chinese',
  },
  // { locale: 'zh', name: 'chinese', description: 'simplified chinese' },
]

const DEFAULT_THEMES = [
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
  const [themes, setThemes] = useState(DEFAULT_THEMES)
  const nfts = mangoStore((s) => s.wallet.nfts.data)

  const [savedLanguage, setSavedLanguage] = useLocalStorageState(
    'language',
    'en',
  )
  const router = useRouter()
  const { pathname, asPath, query } = router
  const [notificationPosition, setNotificationPosition] = useLocalStorageState(
    NOTIFICATION_POSITION_KEY,
    'bottom-left',
  )
  const [tradeFormUi, setTradeFormUi] = useLocalStorageState(
    SIZE_INPUT_UI_KEY,
    'slider',
  )
  const [tradeChartUi, setTradeChartUi] = useLocalStorageState(
    TRADE_CHART_UI_KEY,
    'trading-view',
  )

  const [, setTradeLayout] = useLocalStorageState(TRADE_LAYOUT_KEY, 'chartLeft')

  // add nft skins to theme selection list
  useEffect(() => {
    if (nfts.length) {
      const customThemes = []
      const ownedCollections = [
        ...new Set(nfts.map((x) => x.collectionAddress)),
      ]
      for (const collection of ownedCollections) {
        for (const themeKey in CUSTOM_SKINS) {
          if (CUSTOM_SKINS[themeKey] === collection) {
            customThemes.push(themeKey)
          }
        }
      }
      setThemes(
        customThemes.length
          ? [...customThemes, ...DEFAULT_THEMES]
          : [...DEFAULT_THEMES],
      )
    } else {
      setThemes([...DEFAULT_THEMES])
    }
  }, [nfts])

  const handleLangChange = useCallback(
    (l: string) => {
      setSavedLanguage(l)
      router.push({ pathname, query }, asPath, { locale: l })
      dayjs.locale(l == 'zh_tw' ? 'zh-tw' : l)
    },
    [router, pathname, query, asPath, setSavedLanguage],
  )

  return (
    <div className="border-b border-th-bkg-3">
      <div className="flex flex-col border-t border-th-bkg-3 py-4 md:flex-row md:items-center md:justify-between md:px-4">
        <p className={`mb-2 md:mb-0 ${SETTINGS_BUTTON_TITLE_CLASSES}`}>
          {t('settings:theme')}
        </p>
        <div className="w-full min-w-[140px] md:w-auto">
          <Select
            value={theme || DEFAULT_THEMES[0]}
            onChange={(t: string) => {
              setTheme(t)
            }}
            className="w-full"
          >
            {themes.map((theme) => (
              <Select.Option key={theme} value={t(`settings:${theme}`)}>
                {t(`settings:${theme}`)}
              </Select.Option>
            ))}
          </Select>
        </div>
      </div>
      <div className="flex flex-col border-t border-th-bkg-3 py-4 md:flex-row md:items-center md:justify-between md:px-4">
        <p className={`mb-2 md:mb-0 ${SETTINGS_BUTTON_TITLE_CLASSES}`}>
          {t('settings:language')}
        </p>
        <div className="w-full min-w-[280px] md:w-auto md:pl-4">
          <ButtonGroup
            activeValue={savedLanguage}
            onChange={(l) => handleLangChange(l)}
            values={LANGS.map((val) => val.locale)}
            names={LANGS.map((val) => t(`settings:${val.name}`))}
          />
        </div>
      </div>
      <div className="hidden border-t border-th-bkg-3 py-4 md:flex md:flex-row md:items-center md:justify-between md:px-4">
        <p className={`mb-2 md:mb-0 ${SETTINGS_BUTTON_TITLE_CLASSES}`}>
          {t('settings:notification-position')}
        </p>
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
        <p className={`mb-2 md:mb-0 ${SETTINGS_BUTTON_TITLE_CLASSES}`}>
          {t('settings:trade-layout')}
        </p>
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
        <p className={`mb-2 md:mb-0 ${SETTINGS_BUTTON_TITLE_CLASSES}`}>
          {t('settings:swap-trade-size-selector')}
        </p>
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
        <p className={`mb-2 md:mb-0 ${SETTINGS_BUTTON_TITLE_CLASSES}`}>
          {t('settings:trade-chart')}
        </p>
        <div className="w-full min-w-[220px] md:w-auto">
          <ButtonGroup
            activeValue={tradeChartUi}
            onChange={(v) => setTradeChartUi(v)}
            values={TRADING_CHARTS}
            names={TRADING_CHARTS.map((val) => t(`settings:${val}`))}
          />
        </div>
      </div>
    </div>
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
      } p-0.5 focus-visible:border-th-fgd-4`}
      onClick={() => onClick(position)}
    >
      {icon}
    </button>
  )
}
