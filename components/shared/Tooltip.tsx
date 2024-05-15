import React, { HTMLAttributes, ReactNode } from 'react'
import Tippy, { TippyProps } from '@tippyjs/react'
import 'tippy.js/animations/scale.css'
import mangoStore from '@store/mangoStore'

type TooltipProps = {
  content: ReactNode
  placement?: TippyProps['placement']
  className?: string
  children?: ReactNode
  delay?: number
  show?: boolean
  maxWidth?: string
  wrapperClassName?: string
}

const Tooltip = ({
  children,
  content,
  className,
  placement = 'top',
  delay = 0,
  show = true,
  maxWidth = '20rem',
  wrapperClassName,
}: TooltipProps) => {
  const themeData = mangoStore((s) => s.themeData)
  if (show) {
    return (
      <Tippy
        animation="scale"
        placement={placement}
        appendTo={() => document.body}
        maxWidth={maxWidth}
        interactive
        delay={[delay, 0]}
        content={
          content ? (
            <div
              className={`${themeData.fonts.body.variable} ${themeData.fonts.display.variable} ${themeData.fonts.mono.variable} font-sans rounded-md bg-th-bkg-2 p-3 font-body text-xs leading-4 text-th-fgd-3 outline-none focus:outline-none ${className}`}
              style={{ boxShadow: '0px 0px 8px 0px rgba(0,0,0,0.25)' }}
            >
              {content}
            </div>
          ) : null
        }
      >
        <div className={`outline-none focus:outline-none ${wrapperClassName}`}>
          {children}
        </div>
      </Tippy>
    )
  } else {
    return <>{children}</>
  }
}

const Content = ({
  className,
  children,
}: {
  className?: string
} & HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={`inline-block cursor-help border-b border-dashed border-th-fgd-3 border-opacity-20 hover:border-th-bkg-2 ${className}`}
    >
      {children}
    </div>
  )
}

Tooltip.Content = Content

export default Tooltip
