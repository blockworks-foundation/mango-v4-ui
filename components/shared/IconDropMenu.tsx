import { Popover, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/20/solid'
import { Fragment, ReactNode } from 'react'

const IconDropMenu = ({
  icon,
  children,
  disabled,
  size,
  postion = 'bottomRight',
}: {
  icon: ReactNode
  children: ReactNode
  disabled?: boolean
  size?: 'small' | 'medium' | 'large'
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
    bottomLeft: size === 'large' ? 'left-0 top-14' : 'left-0 top-12',
    bottomRight: size === 'large' ? 'right-0 top-14' : 'right-0 top-12',
    topLeft: size === 'large' ? 'left-0 bottom-14' : 'left-0 bottom-12',
    topRight: size === 'large' ? 'right-0 bottom-14' : 'right-0 bottom-12',
    leftBottom: size === 'large' ? 'right-14 bottom-0' : 'right-12 bottom-0',
    leftTop: size === 'large' ? 'right-14 top-0' : 'right-12 top-0',
    rightBottom: size === 'large' ? 'left-14 bottom-0' : 'left-12 bottom-0',
    rightTop: size === 'large' ? 'left-14 top-0' : 'left-12 top-0',
  }
  return (
    <Popover>
      {({ open }) => (
        <div className="relative">
          <Popover.Button
            className={`flex ${
              size === 'large'
                ? 'h-12 w-12'
                : size === 'medium'
                ? 'h-10 w-10'
                : 'h-8 w-8'
            } default-transition items-center justify-center rounded-full border border-th-button text-th-fgd-1 md:hover:border-th-button-hover md:hover:text-th-fgd-1 ${
              disabled ? 'cursor-not-allowed opacity-60' : ''
            }`}
            disabled={disabled}
          >
            {open ? <XMarkIcon className="h-6 w-6" /> : icon}
          </Popover.Button>
          <Transition
            appear={true}
            show={open}
            as={Fragment}
            enter="transition ease-in duration-100"
            enterFrom="scale-90"
            enterTo="scale-100"
            leave="transition ease-out duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Popover.Panel
              className={`absolute ${panelPosition[postion]} z-20 w-48 space-y-3 rounded-md bg-th-bkg-2 p-4`}
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
