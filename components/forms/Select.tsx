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
              className={`h-full w-full rounded-md bg-th-bkg-1 font-normal ring-1 ring-inset ring-th-fgd-4 hover:ring-th-fgd-3 focus:border-th-fgd-3 focus:outline-none`}
            >
              <div
                className={`flex h-12 items-center justify-between space-x-2 px-3 text-base text-th-fgd-1`}
              >
                {value ? (
                  value
                ) : (
                  <span className="text-th-fgd-3">{placeholder}</span>
                )}
                <ChevronDownIcon
                  className={`default-transition h-5 w-5 flex-shrink-0 text-th-fgd-1 ${
                    open ? 'rotate-180' : 'rotate-360'
                  }`}
                />
              </div>
            </Listbox.Button>
            {open ? (
              <Listbox.Options
                static
                className={`thin-scroll absolute left-0 z-20 mt-1 max-h-60 w-full origin-top-left overflow-auto rounded-md bg-th-bkg-2 p-2 text-th-fgd-1 outline-none ${dropdownPanelClassName}`}
              >
                {children}
              </Listbox.Options>
            ) : null}
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
    <Listbox.Option className="mb-0" value={value}>
      {({ selected }) => (
        <div
          className={`default-transition rounded p-2 text-th-fgd-1 hover:cursor-pointer hover:bg-th-bkg-3 hover:text-th-active ${
            selected ? 'text-th-active' : ''
          } ${className}`}
        >
          {children}
        </div>
      )}
    </Listbox.Option>
  )
}

Select.Option = Option

export default Select
