import { useTranslation } from 'next-i18next'
import { FunctionComponent } from 'react'

interface TabButtonsProps {
  activeValue: string
  onChange: (x: any) => void
  values: [string, number][]
  showBorders?: boolean
  rounded?: boolean
  fillWidth?: boolean
}

const TabButtons: FunctionComponent<TabButtonsProps> = ({
  activeValue,
  values,
  onChange,
  showBorders = false,
  rounded = false,
  fillWidth = false,
}) => {
  const { t } = useTranslation(['common', 'swap', 'token', 'trade'])

  return (
    <div className="flex w-full bg-th-bkg-1 text-th-fgd-4">
      {values.map(([label, count], i) => (
        <div className={fillWidth ? 'flex-1' : ''} key={label + i}>
          <button
            className={`default-transition flex h-12 w-full items-center justify-center px-4 font-normal md:px-6 ${
              rounded ? 'rounded-md' : 'rounded-none'
            } ${
              showBorders
                ? fillWidth && i === values.length - 1
                  ? 'border-r-0'
                  : 'border-r border-th-bkg-3'
                : ''
            } ${
              label === activeValue
                ? 'bg-th-bkg-2 text-th-active'
                : 'hover:cursor-pointer hover:text-th-fgd-2'
            }`}
            key={`${label}${i}`}
            onClick={() => onChange(label)}
          >
            <span className="font-medium leading-tight">{t(label)}</span>
            {count ? (
              <div
                className={`ml-1.5 rounded ${
                  label === activeValue ? 'bg-th-bkg-4' : 'bg-th-bkg-3'
                } px-1.5 font-mono text-xxs text-th-fgd-2`}
              >
                {count}
              </div>
            ) : null}
          </button>
        </div>
      ))}
    </div>
  )
}

export default TabButtons
