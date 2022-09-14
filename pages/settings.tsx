import type { NextPage } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/router'
import ButtonGroup from '../components/forms/ButtonGroup'
import useLocalStorageState from '../hooks/useLocalStorageState'
import dayjs from 'dayjs'

require('dayjs/locale/en')
require('dayjs/locale/es')
require('dayjs/locale/zh')
require('dayjs/locale/zh-tw')

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'trade'])),
    },
  }
}

const THEMES = ['Light', 'Dark', 'Mango']

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

const Settings: NextPage = () => {
  const { t } = useTranslation('common')
  const { theme, setTheme } = useTheme()
  const [savedLanguage, setSavedLanguage] = useLocalStorageState('language', '')
  const router = useRouter()
  const { pathname, asPath, query } = router

  const handleLangChange = (l: string) => {
    setSavedLanguage(l)
    router.push({ pathname, query }, asPath, { locale: l })
    dayjs.locale(l == 'zh_tw' ? 'zh-tw' : l)
  }

  return (
    <div className="p-8 pb-20 md:p-12">
      <div className="grid grid-cols-12">
        <div className="col-span-12 border-b border-th-bkg-3 lg:col-span-8 lg:col-start-3">
          <h1 className="mb-4">{t('settings')}</h1>
          <div className="flex flex-col border-t border-th-bkg-3 p-4 md:flex-row md:items-center md:justify-between">
            <p className="mb-2 lg:mb-0">{t('theme')}</p>
            <div className="w-full min-w-[220px] md:w-auto">
              <ButtonGroup
                activeValue={theme}
                onChange={(t) => setTheme(t)}
                values={THEMES}
                large
              />
            </div>
          </div>
          <div className="flex flex-col border-t border-th-bkg-3 p-4 md:flex-row md:items-center md:justify-between">
            <p className="mb-2 lg:mb-0">{t('language')}</p>
            <div className="w-full min-w-[330px] md:w-auto">
              <ButtonGroup
                activeValue={savedLanguage}
                onChange={(l) => handleLangChange(l)}
                values={LANGS.map((val) => val.locale)}
                names={LANGS.map((val) => t(val.name))}
                large
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
