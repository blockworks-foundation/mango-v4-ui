import { useTranslation } from 'next-i18next'

const TabUnderline = ({
  activeValue,
  values,
  onChange,
  small,
}: {
  activeValue: string
  onChange: (x: any) => void
  values: string[]
  small?: boolean
}) => {
  const { t } = useTranslation('common')
  return (
    <div
      className={`relative mb-3 pb-1 md:-mt-2.5 md:border-b md:border-th-bkg-3`}
    >
      <div
        className={`default-transition absolute bottom-[-1px] left-0 h-0.5 ${
          activeValue === 'buy'
            ? 'bg-th-green'
            : activeValue === 'sell'
            ? 'bg-th-red'
            : 'bg-th-primary'
        }`}
        style={{
          maxWidth: '176px',
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
            cursor-pointer items-center justify-center whitespace-nowrap rounded py-1 font-bold md:h-auto md:rounded-none md:hover:opacity-100 ${
              small ? 'text-sm' : 'text-sm lg:text-base'
            }
            ${
              activeValue === value
                ? activeValue === 'buy'
                  ? 'text-th-green'
                  : activeValue === 'sell'
                  ? 'text-th-red'
                  : 'text-th-primary'
                : 'text-th-fgd-4 hover:text-th-fgd-3'
            }
          `}
            key={value + i}
          >
            {t(value)}
          </button>
        ))}
      </nav>
    </div>
  )
}

export default TabUnderline
