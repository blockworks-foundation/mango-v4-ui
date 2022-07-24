import { Popover, Transition } from '@headlessui/react'
import { XIcon } from '@heroicons/react/solid'
import { Fragment, ReactNode } from 'react'

const IconDropMenu = ({
  icon,
  children,
  large,
}: {
  icon: ReactNode
  children: ReactNode
  large?: boolean
}) => {
  return (
    <Popover>
      {({ open }) => (
        <div className="relative">
          <Popover.Button
            className={`flex ${
              large ? 'h-12 w-12' : 'h-10 w-10'
            } items-center justify-center rounded-full border border-th-bkg-button hover:text-th-primary`}
          >
            {open ? <XIcon className="h-5 w-5" /> : icon}
          </Popover.Button>
          <Transition
            appear={true}
            show={open}
            as={Fragment}
            enter="transition-all ease-in duration-300"
            enterFrom="opacity-0 transform scale-90"
            enterTo="opacity-100 transform scale-100"
            leave="transition ease-out duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Popover.Panel
              className={`absolute right-0 ${
                large ? 'top-14' : 'top-12'
              } z-20 w-48 space-y-2 rounded-md border border-th-bkg-3 bg-th-bkg-1 p-4`}
            >
              {children}
            </Popover.Panel>
          </Transition>
        </div>
      )}
    </Popover>
  )
}

export default IconDropMenu
