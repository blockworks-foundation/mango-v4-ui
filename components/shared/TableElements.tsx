/* eslint-disable @typescript-eslint/no-explicit-any */
import dayjs from 'dayjs'
import { MouseEventHandler, ReactNode, forwardRef } from 'react'
import { LinkButton } from './Button'
import { ArrowSmallDownIcon } from '@heroicons/react/20/solid'
import { SortConfig } from 'hooks/useSortableData'

export const Table = ({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) => <table className={`m-0 min-w-full p-0 ${className}`}>{children}</table>

export const TrHead = ({
  children,
  className,
  style,
}: {
  children: ReactNode
  className?: string
  style?: object
}) => (
  <tr style={style} className={`border-b border-th-bkg-3 ${className}`}>
    {children}
  </tr>
)

export const Th = ({
  style,
  children,
  className,
  id,
  xBorder = false,
}: {
  style?: object
  children?: ReactNode
  className?: string
  id?: string
  xBorder?: boolean
}) => (
  <th
    style={style}
    className={`whitespace-nowrap px-2 py-3 text-xs font-normal text-th-fgd-3 first:pl-6 last:pr-6 xl:px-4 ${
      xBorder ? 'border-x border-th-bkg-3' : ''
    } ${className}`}
    id={id}
    scope="col"
  >
    {children}
  </th>
)

interface TrBodyProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  onMouseEnter?: (x: any) => void
  onMouseLeave?: MouseEventHandler
}

export const TrBody = forwardRef<HTMLTableRowElement, TrBodyProps>(
  (props, ref) => {
    const { children, className, onClick, onMouseEnter, onMouseLeave } = props
    return (
      <tr
        className={`border-y border-th-bkg-3 ${className}`}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        ref={ref}
      >
        {children}
      </tr>
    )
  },
)

TrBody.displayName = 'TrBody'

export const Td = ({
  children,
  className,
  xBorder = false,
}: {
  children: ReactNode
  className?: string
  xBorder?: boolean
}) => (
  <td
    className={`px-2 py-3 first:pl-6 last:pr-6 xl:px-4 ${
      xBorder ? 'border-x border-th-bkg-3' : ''
    } ${className}`}
  >
    {children}
  </td>
)

export const TableDateDisplay = ({
  date,
  showSeconds,
}: {
  date: string | number
  showSeconds?: boolean
}) => (
  <>
    <p className="tracking-normal text-th-fgd-2">
      {dayjs(date).format('DD MMM YYYY')}
    </p>
    <p className="text-xs text-th-fgd-4">
      {dayjs(date).format(showSeconds ? 'h:mm:ssa' : 'h:mma')}
    </p>
  </>
)

export const SortableColumnHeader = ({
  sort,
  sortConfig,
  sortKey,
  title,
  titleClass,
}: {
  sort: (key: string) => void
  sortConfig: SortConfig | null
  sortKey: string
  title: string
  titleClass?: string
}) => {
  return (
    <LinkButton
      className="flex items-center font-normal"
      onClick={() => sort(sortKey)}
    >
      <span className={`text-th-fgd-3 ${titleClass}`}>{title}</span>
      <ArrowSmallDownIcon
        className={`default-transition ml-1 h-4 w-4 shrink-0 ${
          sortConfig?.key === sortKey
            ? sortConfig?.direction === 'ascending'
              ? 'rotate-180'
              : 'rotate-0'
            : null
        }`}
      />
    </LinkButton>
  )
}
