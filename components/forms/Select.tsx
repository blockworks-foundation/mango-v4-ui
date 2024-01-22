/* eslint-disable @typescript-eslint/no-explicit-any */
import { Listbox } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { ReactNode } from 'react'
import { TradeForm } from 'types'

type Values = TradeForm['tradeType'] | ReactNode

interface SelectProps<T extends Values> {
  value: T | string
  onChange: (x: T) => void
  children: ReactNode
  className?: string
  buttonClassName?: string
  dropdownPanelClassName?: string
  icon?: ReactNode
  placeholder?: string
  disabled?: boolean
  renderValue?: (value: T | string) => ReactNode
}

const Select = <T extends Values>({
  value,
  onChange,
  children,
  className,
  buttonClassName,
  dropdownPanelClassName,
  icon,
  placeholder = 'Select',
  disabled = false,
  renderValue,
}: SelectProps<T>) => {
  return (
    <div className={`relative ${className}`}>
      <Listbox value={value} onChange={onChange} disabled={disabled}>
        {({ open }) => (
          <>
            <Listbox.Button
              className={`h-full w-full rounded-md bg-th-input-bkg py-2.5 font-normal ring-1 ring-inset ring-th-input-border focus:outline-none focus-visible:ring-th-fgd-4 md:hover:ring-th-input-border-hover ${buttonClassName}`}
            >
              <div
                className={`flex items-center justify-between space-x-2 px-3 text-th-fgd-1`}
              >
                <div className="flex items-center">
                  {icon ? icon : null}
                  {value ? (
                    renderValue ? (
                      renderValue(value)
                    ) : (
                      value
                    )
                  ) : (
                    <span className="text-th-fgd-3">{placeholder}</span>
                  )}
                </div>
                <ChevronDownIcon
                  className={`ml-1 h-5 w-5 shrink-0 text-th-fgd-3 ${
                    open ? 'rotate-180' : 'rotate-0'
                  }`}
                />
              </div>
            </Listbox.Button>
            <Listbox.Options
              className={`thin-scroll absolute left-0 z-20 mt-1 max-h-60 w-full origin-top-left overflow-auto rounded-md bg-th-bkg-2 p-2 outline-none ${dropdownPanelClassName}`}
            >
              {children}
            </Listbox.Options>
          </>
        )}
      </Listbox>
    </div>
  )
}

interface OptionProps {
  value: string
  children: string | ReactNode
  className?: string
}

const Option = ({ value, children, className }: OptionProps) => {
  return (
    <Listbox.Option
      className="default-transition mb-0 rounded-md p-2 text-th-fgd-2 hover:cursor-pointer focus-visible:text-th-active md:hover:bg-th-bkg-3 md:hover:text-th-fgd-1"
      value={value}
    >
      {({ selected }) => (
        <div className={` ${selected ? 'text-th-active' : ''} ${className}`}>
          {children}
        </div>
      )}
    </Listbox.Option>
  )
}

Select.Option = Option

export default Select
