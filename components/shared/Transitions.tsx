import { Transition } from '@headlessui/react'
import { CSSProperties, ElementType, ReactNode } from 'react'

const transitionEnterStyle = 'transition-all ease-out duration-300'
const transitionExitStyle = 'transition-all ease-in duration-300'

export const EnterRightExitLeft = ({
  children,
  className,
  show,
  style,
}: {
  children: ReactNode
  className?: string
  show: boolean
  style?: CSSProperties
}) => (
  <Transition
    appear={true}
    className={className}
    show={show}
    enter={transitionEnterStyle}
    enterFrom="translate-x-full"
    enterTo="translate-x-0"
    leave={transitionExitStyle}
    leaveFrom="translate-x-0"
    leaveTo="-translate-x-full"
    style={style}
  >
    {children}
  </Transition>
)

export const EnterBottomExitBottom = ({
  children,
  className,
  show,
}: {
  children: ReactNode
  className?: string
  show: boolean
}) => (
  <Transition
    appear={true}
    className={`thin-scroll ${className}`}
    show={show}
    enter={transitionEnterStyle}
    enterFrom="max-h-0"
    enterTo="max-h-full"
    leave={transitionExitStyle}
    leaveFrom="max-h-full"
    leaveTo="max-h-0"
  >
    {children}
  </Transition>
)

export const FadeInFadeOut = ({
  children,
  className,
  show,
}: {
  children: ReactNode
  className?: string
  show: boolean
}) => (
  <Transition
    appear={true}
    className={className}
    show={show}
    enter={transitionEnterStyle}
    enterFrom="opacity-0"
    enterTo="opacity-100"
    leave={transitionExitStyle}
    leaveFrom="opacity-100"
    leaveTo="opacity-0"
  >
    {children}
  </Transition>
)

export const FadeInList = ({
  as = 'div',
  children,
  index,
}: {
  as?: ElementType
  children: ReactNode
  index: number
}) => (
  <Transition
    appear={true}
    as={as}
    show={true}
    enter={transitionEnterStyle}
    enterFrom="opacity-0 border-0"
    enterTo="opacity-100"
    leave={transitionExitStyle}
    leaveFrom="opacity-100"
    leaveTo="opacity-0"
    style={{ transitionDelay: `${index * 25}ms` }}
  >
    {children}
  </Transition>
)
