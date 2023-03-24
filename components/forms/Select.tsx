import { Listbox } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { ReactNode } from 'react'

interface SelectProps {
  value: string | ReactNode
  onChange: (x: string) => void
  children: ReactNode
  className?: string
  dropdownPanelClassName?: string
  placeholder?: string
  disabled?: boolean
}

const Select = ({
  value,
  onChange,
  children,
  className,
  dropdownPanelClassName,
  placeholder = 'Select',
  disabled = false,
}: SelectProps) => {
  return (
    <div className={`relative ${className}`}>
      <Listbox value={value} onChange={onChange} disabled={disabled}>
        {({ open }) => (
          <>
            <Listbox.Button
              className={`default-transition h-full w-full rounded-md bg-th-input-bkg py-2.5 font-normal ring-1 ring-inset ring-th-input-border focus:border-th-fgd-4 focus:outline-none md:hover:ring-th-input-border-hover`}
            >
              <div
                className={`flex items-center justify-between space-x-2 px-3 text-th-fgd-1`}
              >
                {value ? (
                  value
                ) : (
                  <span className="text-th-fgd-3">{placeholder}</span>
                )}
                <ChevronDownIcon
                  className={`default-transition h-5 w-5 flex-shrink-0 text-th-fgd-3 ${
                    open ? 'rotate-180' : 'rotate-360'
                  }`}
                />
              </div>
            </Listbox.Button>
            <Listbox.Options
              className={`thin-scroll absolute left-0 z-20 mt-1 max-h-60 w-full origin-top-left space-y-2 overflow-auto rounded-md bg-th-bkg-2 p-4 outline-none ${dropdownPanelClassName}`}
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
      className="default-transition mb-0 text-th-fgd-2 hover:cursor-pointer focus:text-th-active md:hover:text-th-fgd-1"
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
