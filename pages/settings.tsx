import type { NextPage } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/router'
import ButtonGroup from '../components/forms/ButtonGroup'
import useLocalStorageState from '../hooks/useLocalStorageState'
import dayjs from 'dayjs'
import { ORDERBOOK_FLASH_KEY, PREFERRED_EXPLORER_KEY } from 'utils/constants'
import Switch from '@components/forms/Switch'
import { useCallback, useMemo } from 'react'
import { CheckCircleIcon } from '@heroicons/react/20/solid'
import Image from 'next/image'

require('dayjs/locale/en')
require('dayjs/locale/es')
require('dayjs/locale/zh')
require('dayjs/locale/zh-tw')

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        'common',
        'profile',
        'settings',
      ])),
    },
  }
}

export const LANGS = [
  { locale: 'en', name: 'english', description: 'english' },
  { locale: 'es', name: 'spanish', description: 'spanish' },
  {
    locale: 'zh_tw',
    name: 'chinese-traditional',
    description: 'traditional chinese',
  },
  { locale: 'zh', name: 'chinese', description: 'simplified chinese' },
]

export const EXPLORERS = [
  { name: 'solana-explorer', url: 'https://explorer.solana.com/tx/' },
  { name: 'solscan', url: 'https://solscan.io/tx/' },
  { name: 'solana-beach', url: 'https://solanabeach.io/transaction/' },
  { name: 'solanafm', url: 'https://solana.fm/tx/' },
]

const Settings: NextPage = () => {
  const { t } = useTranslation('common')
  const { theme, setTheme } = useTheme()
  const [savedLanguage, setSavedLanguage] = useLocalStorageState('language', '')
  const router = useRouter()
  const { pathname, asPath, query } = router
  const [showOrderbookFlash, setShowOrderbookFlash] = useLocalStorageState(
    ORDERBOOK_FLASH_KEY,
    true
  )
  const [preferredExplorer, setPreferredExplorer] = useLocalStorageState(
    PREFERRED_EXPLORER_KEY,
    EXPLORERS[0]
  )
  const themes = useMemo(() => {
    return [t('settings:light'), t('settings:dark'), t('settings:mango')]
  }, [t])

  const handleLangChange = useCallback(
    (l: string) => {
      setSavedLanguage(l)
      router.push({ pathname, query }, asPath, { locale: l })
      dayjs.locale(l == 'zh_tw' ? 'zh-tw' : l)
    },
    [router]
  )

  return (
    <div className="p-8 pb-20 md:pb-16 lg:p-10">
      <div className="grid grid-cols-12">
        <div className="col-span-12 border-b border-th-bkg-3 lg:col-span-8 lg:col-start-3">
          <h2 className="mb-4 text-base">{t('settings:display')}</h2>
          <div className="flex flex-col border-t border-th-bkg-3 p-4 md:flex-row md:items-center md:justify-between">
            <p className="mb-2 lg:mb-0">{t('settings:theme')}</p>
            <div className="w-full min-w-[220px] md:w-auto">
              <ButtonGroup
                activeValue={theme}
                onChange={(t) => setTheme(t)}
                values={themes}
                large
              />
            </div>
          </div>
          <div className="flex flex-col border-t border-th-bkg-3 p-4 md:flex-row md:items-center md:justify-between">
            <p className="mb-2 lg:mb-0">{t('settings:language')}</p>
            <div className="w-full min-w-[330px] md:w-auto">
              <ButtonGroup
                activeValue={savedLanguage}
                onChange={(l) => handleLangChange(l)}
                values={LANGS.map((val) => val.locale)}
                names={LANGS.map((val) => t(`settings:${val.name}`))}
                large
              />
            </div>
          </div>
          <div className="flex flex-col border-t border-th-bkg-3 p-4 md:flex-row md:items-center md:justify-between">
            <p className="mb-2 lg:mb-0">{t('settings:orderbook-flash')}</p>
            <Switch
              checked={showOrderbookFlash}
              onChange={(checked) => setShowOrderbookFlash(checked)}
            />
          </div>
        </div>
        <div className="col-span-12 border-b border-th-bkg-3 pt-8 lg:col-span-8 lg:col-start-3">
          <h2 className="mb-4 text-base">{t('settings:preferred-explorer')}</h2>
          <div className="space-y-2">
            {EXPLORERS.map((ex) => (
              <button
                className="default-transition flex w-full items-center justify-between rounded-md bg-th-bkg-2 p-4 hover:bg-th-bkg-3"
                onClick={() => setPreferredExplorer(ex)}
                key={ex.name}
              >
                <div className="flex items-center space-x-2">
                  <Image
                    alt=""
                    width="24"
                    height="24"
                    src={`/explorer-logos/${ex.name}.png`}
                  />
                  <p>{t(`settings:${ex.name}`)}</p>
                </div>
                {preferredExplorer.url === ex.url ? (
                  <CheckCircleIcon className="h-5 w-5 text-th-green" />
                ) : null}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
