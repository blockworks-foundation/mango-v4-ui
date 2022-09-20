import React, { useMemo } from 'react'
import { Listbox } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { isEqual } from '../../utils'

const GroupSize = ({
  tickSize,
  value,
  onChange,
  className,
}: {
  tickSize: number
  value: number
  onChange: (x: number) => void
  className?: string
}) => {
  const sizes = useMemo(
    () => [
      tickSize,
      tickSize * 5,
      tickSize * 10,
      tickSize * 50,
      tickSize * 100,
    ],
    [tickSize]
  )

  return (
    <div className={`relative ${className}`}>
      <Listbox value={value} onChange={onChange}>
        {({ open }) => (
          <>
            <Listbox.Button
              className={`default-transition flex h-6 items-center rounded border border-th-bkg-3 bg-th-bkg-1 py-1 font-normal hover:bg-th-bkg-2 focus:border-th-bkg-4 focus:outline-none`}
            >
              <div
                className={`flex items-center justify-between space-x-1 pr-1 pl-2 font-mono text-xs leading-none`}
              >
                <span className="text-th-fgd-2">{value}</span>

                <ChevronDownIcon
                  className={`default-transition h-4 w-4 text-th-fgd-3 ${
                    open ? 'rotate-180 transform' : 'rotate-360 transform'
                  }`}
                />
              </div>
            </Listbox.Button>
            {open ? (
              <Listbox.Options
                static
                className={`thin-scroll absolute left-0 top-7 z-20 w-full space-y-2 overflow-auto rounded border border-th-bkg-3 bg-th-bkg-1 p-2 text-th-fgd-2 outline-none`}
              >
                {sizes.map((size) => (
                  <Listbox.Option key={size} value={size}>
                    {({ selected }) => (
                      <div
                        className={`default-transition text-right font-mono text-xs text-th-fgd-2 hover:cursor-pointer hover:text-th-primary ${
                          selected && `text-th-primary`
                        }`}
                      >
                        {size}
                      </div>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            ) : null}
          </>
        )}
      </Listbox>
    </div>
  )
}

export default React.memo(GroupSize, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps, ['tickSize', 'value'])
)
