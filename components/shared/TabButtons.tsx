import { useTranslation } from 'next-i18next'

type Values = string
interface TabButtonsProps<T extends Values> {
  activeValue: T
  onChange: (x: T) => void
  values: [T, number][]
  showBorders?: boolean
  rounded?: boolean
  fillWidth?: boolean
}

const TabButtons = <T extends Values>({
  activeValue,
  values,
  onChange,
  showBorders = false,
  rounded = false,
  fillWidth = false,
}: TabButtonsProps<T>) => {
  const { t } = useTranslation(['common', 'swap', 'token', 'trade', 'borrow'])

  return (
    <div className="flex w-full bg-th-bkg-1 text-th-fgd-4">
      {values.map(([label, count], i) => (
        <div className={fillWidth ? 'flex-1' : ''} key={`${label}` + i}>
          <button
            className={`flex h-12 w-full items-center justify-center px-4 focus-visible:bg-th-bkg-2 focus-visible:text-th-fgd-1 md:px-6 ${
              rounded ? 'rounded-md' : 'rounded-none'
            } ${
              showBorders
                ? fillWidth && i === values.length - 1
                  ? 'border-r-0'
                  : 'border-r border-th-bkg-3'
                : ''
            } ${
              label === activeValue
                ? label === 'buy'
                  ? 'bg-th-up-dark font-display text-th-fgd-1'
                  : label === 'sell'
                  ? 'bg-th-down-dark font-display text-th-fgd-1'
                  : 'bg-th-bkg-3 text-th-active'
                : 'hover:cursor-pointer hover:text-th-fgd-2'
            }`}
            key={`${label}${i}`}
            onClick={() => onChange(label)}
          >
            <span
              className={`${
                label === 'buy' || label === 'sell'
                  ? 'font-display'
                  : 'font-bold'
              } whitespace-nowrap`}
            >
              {t(label)}
            </span>
            {count ? (
              <div
                className={`ml-1.5 rounded ${
                  label === activeValue ? 'bg-th-bkg-1' : 'bg-th-bkg-3'
                } px-1.5 font-mono text-xxs text-th-fgd-2`}
              >
                {count}
              </div>
            ) : null}
            {label === 'trade:trigger-order' ? (
              <span className="ml-2 rounded bg-th-active px-1 py-0.5 text-xxs font-bold uppercase leading-none text-th-bkg-1">
                beta
              </span>
            ) : null}
          </button>
        </div>
      ))}
    </div>
  )
}

export default TabButtons
