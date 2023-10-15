import { useTranslation } from 'next-i18next'

type Values = string | number

interface TabUnderlineProps<T extends Values> {
  activeValue: string
  onChange: (x: T) => void
  values: T[]
  names?: Array<string>
  small?: boolean
  fillWidth?: boolean
}

const TabUnderline = <T extends Values>({
  activeValue,
  values,
  names,
  onChange,
  small,
  fillWidth = true,
}: TabUnderlineProps<T>) => {
  const { t } = useTranslation('common')

  return (
    <div
      className={`relative mb-3 border-b border-th-bkg-3 ${
        values.includes('buy' as T) || values.includes('sell' as T)
          ? 'pb-1 font-display md:-mt-4'
          : 'pb-1 font-bold md:-mt-2.5'
      }`}
    >
      <div
        className={`absolute bottom-[-1px] left-0 h-0.5 ${
          activeValue === 'buy'
            ? 'bg-th-up'
            : activeValue === 'sell'
            ? 'bg-th-down'
            : 'bg-th-active'
        }`}
        style={{
          maxWidth: !fillWidth ? '176px' : '',
          transform: `translateX(${
            values.findIndex((v) => v === activeValue) * 100
          }%)`,
          width: `${100 / values.length}%`,
        }}
      />
      <nav className="-mb-px flex" aria-label="Tabs">
        {values.map((value, i) => (
          <button
            onClick={() => onChange(value)}
            className={`relative flex h-10 w-1/2 ${
              fillWidth ? '' : 'max-w-[176px]'
            }
            cursor-pointer items-center justify-center whitespace-nowrap rounded py-1 focus-visible:text-th-fgd-2 md:rounded-none md:hover:opacity-100 ${
              small ? 'text-sm' : 'text-sm lg:text-base'
            }
            ${
              activeValue === value
                ? activeValue === 'buy'
                  ? 'text-th-up'
                  : activeValue === 'sell'
                  ? 'text-th-down'
                  : 'text-th-active'
                : 'text-th-fgd-4 md:hover:text-th-fgd-3'
            }
          `}
            key={`${value}` + i}
          >
            <span className="relative">{names ? names[i] : t(`${value}`)}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

export default TabUnderline
