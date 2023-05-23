import { useTranslation } from 'next-i18next'
import { useTheme } from 'next-themes'
import ThemesIcon from './icons/ThemesIcon'
import { THEMES } from './settings/DisplaySettings'
import { LinkButton } from './shared/Button'
import IconDropMenu from './shared/IconDropMenu'

const ThemeSwitcher = () => {
  const { t } = useTranslation('settings')
  const { theme, setTheme } = useTheme()
  return (
    <IconDropMenu
      icon={<ThemesIcon className="h-5 w-5" />}
      panelClassName="rounded-t-none"
    >
      {THEMES.map((value) => (
        <LinkButton
          className={`whitespace-nowrap font-normal ${
            t(value) === theme ? 'text-th-active' : ''
          }`}
          onClick={() => setTheme(t(value))}
          key={value}
        >
          {t(value)}
        </LinkButton>
      ))}
    </IconDropMenu>
  )
}

export default ThemeSwitcher
