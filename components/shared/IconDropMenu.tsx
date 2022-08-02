import { Popover, Transition } from '@headlessui/react'
import { XIcon } from '@heroicons/react/solid'
import { Fragment, ReactNode } from 'react'

const IconDropMenu = ({
  icon,
  children,
  disabled,
  large,
  postion = 'bottomRight',
}: {
  icon: ReactNode
  children: ReactNode
  disabled?: boolean
  large?: boolean
  postion?:
    | 'bottomLeft'
    | 'bottomRight'
    | 'topLeft'
    | 'topRight'
    | 'leftBottom'
    | 'leftTop'
    | 'rightBottom'
    | 'rightTop'
}) => {
  const panelPosition = {
    bottomLeft: large ? 'left-0 top-14' : 'left-0 top-12',
    bottomRight: large ? 'right-0 top-14' : 'right-0 top-12',
    topLeft: large ? 'left-0 bottom-14' : 'left-0 bottom-12',
    topRight: large ? 'right-0 bottom-14' : 'right-0 bottom-12',
    leftBottom: large ? 'right-14 bottom-0' : 'right-12 bottom-0',
    leftTop: large ? 'right-14 top-0' : 'right-12 top-0',
    rightBottom: large ? 'left-14 bottom-0' : 'left-12 bottom-0',
    rightTop: large ? 'left-14 top-0' : 'left-12 top-0',
  }

  return (
    <Popover>
      {({ open }) => (
        <div className="relative">
          <Popover.Button
            className={`flex ${
              large ? 'h-12 w-12' : 'h-10 w-10'
            } items-center justify-center rounded-full border border-th-bkg-button hover:text-th-primary ${
              disabled ? 'cursor-not-allowed opacity-60' : ''
            }`}
            disabled={disabled}
          >
            {open ? <XIcon className="h-5 w-5" /> : icon}
          </Popover.Button>
          <Transition
            appear={true}
            show={open}
            as={Fragment}
            enter="transition-all ease-in duration-100"
            enterFrom="opacity-0 transform scale-90"
            enterTo="opacity-100 transform scale-100"
            leave="transition ease-out duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Popover.Panel
              className={`absolute ${panelPosition[postion]} z-20 w-48 space-y-3 rounded-md border border-th-bkg-3 bg-th-bkg-2 p-4`}
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
