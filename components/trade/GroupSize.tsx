import React, { useMemo } from 'react'
import { Listbox } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'

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
              className={`default-transition flex h-6 items-center rounded bg-th-bkg-1 py-1 font-normal text-th-fgd-2 hover:text-th-active focus:border-th-bkg-4 focus:outline-none`}
            >
              <div
                className={`flex items-center justify-between font-mono text-xs leading-none`}
              >
                <span>{value}</span>

                <ChevronDownIcon
                  className={`default-transition ml-0.5 h-5 w-5 text-th-fgd-3 ${
                    open ? 'rotate-180 transform' : 'rotate-360 transform'
                  }`}
                />
              </div>
            </Listbox.Button>
            {open ? (
              <Listbox.Options
                static
                className={`thin-scroll absolute right-0 top-7 z-20 w-20 space-y-2 overflow-auto rounded bg-th-bkg-2 p-2 text-th-fgd-2 outline-none`}
              >
                {sizes.map((size) => (
                  <Listbox.Option key={size} value={size}>
                    {({ selected }) => (
                      <div
                        className={`default-transition text-right font-mono text-xs text-th-fgd-2 hover:cursor-pointer hover:text-th-active ${
                          selected && `text-th-active`
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

export default React.memo(GroupSize)
