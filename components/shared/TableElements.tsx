import dayjs from 'dayjs'
import { ReactNode } from 'react'

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
}: {
  children: ReactNode
  className?: string
}) => <tr className={`border-b border-th-bkg-3 ${className}`}>{children}</tr>

export const Th = ({
  children,
  className,
  id,
}: {
  children?: ReactNode
  className?: string
  id?: string
}) => (
  <th
    className={`whitespace-nowrap px-2 py-3 text-xs font-normal text-th-fgd-3 first:pl-6 last:pr-6 xl:px-4 ${className}`}
    id={id}
    scope="col"
  >
    {children}
  </th>
)

export const TrBody = ({
  children,
  className,
  onClick,
}: {
  children: ReactNode
  className?: string
  onClick?: () => void
}) => (
  <tr className={`border-y border-th-bkg-3 ${className}`} onClick={onClick}>
    {children}
  </tr>
)

export const Td = ({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) => (
  <td className={`px-2 py-3 md:first:pl-6 md:last:pr-6 xl:px-4 ${className}`}>
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
