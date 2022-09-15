import { useTranslation } from 'next-i18next'
import { FunctionComponent } from 'react'

interface TabButtonsProps {
  activeValue: string
  className?: string
  onChange: (x: string) => void
  values: Array<any>
  large?: boolean
}

const TabButtons: FunctionComponent<TabButtonsProps> = ({
  activeValue,
  className,
  values,
  onChange,
  large,
}) => {
  const { t } = useTranslation(['common', 'swap'])

  return (
    <div className="flex w-max space-x-8">
      {values.map((v, i) => (
        <div className="relative" key={v + i}>
          <div
            className={`absolute top-9 h-[2px] w-full bg-th-primary transition-all duration-200 ease-in`}
            style={
              v === activeValue
                ? { transform: 'scale3d(1,1,1)', opacity: 1 }
                : { transform: 'scale3d(0,1,1)', opacity: 0 }
            }
          />
          <button
            className={`${className} relative cursor-pointer rounded-md text-center font-bold ${
              large ? 'text-xl' : 'text-base'
            } 
              ${
                v === activeValue
                  ? `text-th-fgd-1`
                  : `text-th-fgd-4 md:hover:text-th-fgd-1`
              }
            `}
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
