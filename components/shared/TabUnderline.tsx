import { useTranslation } from 'next-i18next'

type Values = string | number

interface TabUnderlineProps<T extends Values> {
  activeValue: string
  onChange: (x: T) => void
  values: T[]
  names?: Array<string>
  small?: boolean
}

const TabUnderline = <T extends Values>({
  activeValue,
  values,
  names,
  onChange,
  small,
}: TabUnderlineProps<T>) => {
  const { t } = useTranslation('common')

  return (
    <div
      className={`relative mb-3 border-b border-th-bkg-3 ${
        values.includes('buy' as T) || values.includes('sell' as T)
          ? 'pb-1 font-display md:pb-2.5'
          : 'pb-1 font-bold'
      } md:-mt-2.5`}
    >
      <div
        className={`default-transition absolute bottom-[-1px] left-0 h-0.5 ${
          activeValue === 'buy'
            ? 'bg-th-up'
            : activeValue === 'sell'
            ? 'bg-th-down'
            : 'bg-th-active'
        }`}
        style={{
          // maxWidth: '176px',
          transform: `translateX(${
            values.findIndex((v) => v === activeValue) * 100
          }%)`,
          width: `${100 / values.length}%`,
        }}
      />
      <nav className="-mb-px flex space-x-2" aria-label="Tabs">
        {values.map((value, i) => (
          <button
            onClick={() => onChange(value)}
            className={`default-transition relative flex h-10 w-1/2 
            cursor-pointer items-center justify-center whitespace-nowrap rounded py-1 focus:text-th-fgd-1 focus:ring-0 md:h-auto md:rounded-none md:hover:opacity-100 ${
              small ? 'text-sm' : 'text-sm lg:text-base'
            }
            ${
              activeValue === value
                ? activeValue === 'buy'
                  ? 'text-th-up'
                  : activeValue === 'sell'
                  ? 'text-th-down'
                  : 'text-th-active'
                : 'text-th-fgd-4 hover:text-th-fgd-3'
            }
          `}
            key={`${value}` + i}
          >
            {names ? names[i] : t(`${value}`)}
          </button>
        ))}
      </nav>
    </div>
  )
}

export default TabUnderline
