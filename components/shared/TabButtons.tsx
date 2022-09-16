import { useTranslation } from 'next-i18next'
import { FunctionComponent } from 'react'

interface TabButtonsProps {
  activeValue: string
  onChange: (x: string) => void
  values: Array<any>
  showBorders?: boolean
  rounded?: boolean
}

const TabButtons: FunctionComponent<TabButtonsProps> = ({
  activeValue,
  values,
  onChange,
  showBorders = false,
  rounded = false,
}) => {
  const { t } = useTranslation(['common', 'swap'])

  return (
    <div
      className={`flex bg-th-bkg-1 text-th-fgd-4 ${
        showBorders ? 'md:border-b md:border-th-bkg-3' : ''
      }`}
    >
      {values.map((v, i) => (
        <div key={v + i}>
          <button
            className={`default-transition h-12 rounded-md px-6 font-bold ${
              !rounded ? 'md:rounded-none' : ''
            } ${showBorders ? 'md:border-r md:border-th-bkg-3' : ''} ${
              v === activeValue
                ? 'bg-th-bkg-2 text-th-primary'
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
