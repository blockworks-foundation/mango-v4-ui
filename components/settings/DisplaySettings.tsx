import ButtonGroup from '@components/forms/ButtonGroup'
import Select from '@components/forms/Select'
import mangoStore from '@store/mangoStore'
import dayjs from 'dayjs'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { useTranslation } from 'next-i18next'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo } from 'react'
import {
  NOTIFICATION_POSITION_KEY,
  SAVED_CURRENCY_KEY,
  SIZE_INPUT_UI_KEY,
} from 'utils/constants'

const NOTIFICATION_POSITIONS = [
  'bottom-left',
  'bottom-right',
  'top-left',
  'top-right',
]

const LANGS = [
  { locale: 'en', name: 'english', description: 'english' },
  { locale: 'ru', name: 'russian', description: 'russian' },
  { locale: 'es', name: 'spanish', description: 'spanish' },
  {
    locale: 'zh_tw',
    name: 'chinese-traditional',
    description: 'traditional chinese',
  },
  { locale: 'zh', name: 'chinese', description: 'simplified chinese' },
]

export const CURRENCIES = [
  {
    locale: 'en-US',
    currency: 'USD',
    id: 'FX.USD',
  },
  {
    locale: 'en-IE',
    currency: 'EUR',
    id: 'FX.EUR/USD',
  },
  {
    locale: 'en-GB',
    currency: 'GBP',
    id: 'FX.GBP/USD',
  },
  {
    locale: 'zh-CN',
    currency: 'CNY',
    id: 'FX.USD/CNH',
  },
  {
    locale: 'ja-JP',
    currency: 'JPY',
    id: 'FX.USD/JPY',
  },
  {
    locale: 'en-CA',
    currency: 'CAD',
    id: 'FX.USD/CAD',
  },
  {
    locale: 'en-AU',
    currency: 'AUD',
    id: 'FX.AUD/USD',
  },
  {
    locale: 'en-NZ',
    currency: 'NZD',
    id: 'FX.NZD/USD',
  },
]

const DisplaySettings = () => {
  const { t } = useTranslation(['common', 'settings'])
  const actions = mangoStore((s) => s.actions)
  const { theme, setTheme } = useTheme()
  const [savedLanguage, setSavedLanguage] = useLocalStorageState('language', '')
  const [savedCurrency, setSavedCurrency] = useLocalStorageState(
    SAVED_CURRENCY_KEY,
    JSON.stringify(CURRENCIES[0])
  )
  const router = useRouter()
  const { pathname, asPath, query } = router
  const [notificationPosition, setNotificationPosition] = useLocalStorageState(
    NOTIFICATION_POSITION_KEY,
    'bottom-left'
  )
  const [tradeFormUi, setTradeFormUi] = useLocalStorageState(
    SIZE_INPUT_UI_KEY,
    'Slider'
  )
  const themes = useMemo(() => {
    return [
      t('settings:light'),
      t('settings:medium'),
      t('settings:dark'),
      t('settings:high-contrast'),
      t('settings:mango-classic'),
      t('settings:avocado'),
      t('settings:banana'),
      t('settings:blueberry'),
      t('settings:lychee'),
      t('settings:olive'),
    ]
  }, [t])

  useEffect(() => {
    actions.fetchCurrencyData()
  }, [])

  const handleLangChange = useCallback(
    (l: string) => {
      setSavedLanguage(l)
      router.push({ pathname, query }, asPath, { locale: l })
      dayjs.locale(l == 'zh_tw' ? 'zh-tw' : l)
    },
    [router]
  )

  const handleSaveCurrency = (currency: string) => {
    const currencyInfo = CURRENCIES.find((c) => c.currency === currency)
    setSavedCurrency(JSON.stringify(currencyInfo))
  }

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
            {themes.map((t) => (
              <Select.Option key={t} value={t}>
                <div className="flex w-full items-center justify-between">
                  {t}
                </div>
              </Select.Option>
            ))}
          </Select>
        </div>
      </div>
      <div className="flex flex-col border-t border-th-bkg-3 py-4 md:flex-row md:items-center md:justify-between md:px-4">
        <p className="mb-2 md:mb-0">{t('settings:language')}</p>
        <div className="w-full min-w-[330px] md:w-[480px] md:pl-4">
          <ButtonGroup
            activeValue={savedLanguage}
            onChange={(l) => handleLangChange(l)}
            values={LANGS.map((val) => val.locale)}
            names={LANGS.map((val) => t(`settings:${val.name}`))}
          />
        </div>
      </div>
      <div className="flex flex-col border-t border-th-bkg-3 py-4 md:flex-row md:items-center md:justify-between md:px-4">
        <p className="mb-2 md:mb-0">{t('settings:currency')}</p>
        <div className="w-full min-w-[140px] md:w-auto">
          <Select
            value={JSON.parse(savedCurrency).currency}
            onChange={(t) => handleSaveCurrency(t)}
            className="w-full"
          >
            {CURRENCIES.map((t) => (
              <Select.Option key={t.id} value={t.currency}>
                <div className="flex w-full items-center justify-between">
                  {t.currency}
                </div>
              </Select.Option>
            ))}
          </Select>
        </div>
      </div>
      <div className="flex flex-col border-t border-th-bkg-3 py-4 md:flex-row md:items-center md:justify-between md:px-4">
        <p className="mb-2 md:mb-0">{t('settings:notification-position')}</p>
        <div className="w-full min-w-[330px] md:w-[480px] md:pl-4">
          <ButtonGroup
            activeValue={notificationPosition}
            onChange={(p) => setNotificationPosition(p)}
            values={NOTIFICATION_POSITIONS}
            names={NOTIFICATION_POSITIONS.map((val) => t(`settings:${val}`))}
          />
        </div>
      </div>
      <div className="flex flex-col border-t border-th-bkg-3 py-4 md:flex-row md:items-center md:justify-between md:px-4">
        <p className="mb-2 md:mb-0">{t('settings:swap-trade-size-selector')}</p>
        <div className="w-full min-w-[160px] md:w-auto">
          <ButtonGroup
            activeValue={tradeFormUi}
            onChange={(v) => setTradeFormUi(v)}
            values={[t('settings:slider'), t('settings:buttons')]}
          />
        </div>
      </div>
    </>
  )
}

export default DisplaySettings
