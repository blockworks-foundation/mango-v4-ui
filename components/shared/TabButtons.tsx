import { useTranslation } from 'next-i18next'
import { FunctionComponent } from 'react'

interface TabButtonsProps {
  activeValue: string
  onChange: (x: any) => void
  values: Array<any>
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
  const { t } = useTranslation(['common', 'swap'])

  return (
    <div
      className={`flex bg-th-bkg-1 text-th-fgd-4 ${
        showBorders ? 'border-b border-th-bkg-3' : ''
      }`}
    >
      {values.map((v, i) => (
        <div className={fillWidth ? 'flex-1' : ''} key={v + i}>
          <button
            className={`default-transition h-12 w-full px-6 font-bold ${
              rounded ? 'rounded-md' : 'rounded-none'
            } ${showBorders ? 'border-r border-th-bkg-3' : ''} ${
              v === activeValue
                ? 'bg-th-bkg-3 text-th-primary'
                : 'hover:cursor-pointer hover:text-th-fgd-2'
            }`}
            key={`${v}${i}`}
            onClick={() => onChange(v)}
          >
            {t(v)}
          </button>
        </div>
      ))}
    </div>
  )
}

export default TabButtons
