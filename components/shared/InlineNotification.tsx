import { FunctionComponent, ReactElement } from 'react'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/20/solid'

interface InlineNotificationProps {
  desc?: string | ReactElement
  title?: string | ReactElement
  type: 'error' | 'info' | 'success' | 'warning'
  hideBorder?: boolean
  hidePadding?: boolean
}

const InlineNotification: FunctionComponent<InlineNotificationProps> = ({
  desc,
  title,
  type,
  hideBorder,
  hidePadding,
}) => {
  const iconClasses = `mr-1.5 ${hidePadding ? 'h-4 w-4' : 'h-5 w-5'} shrink-0`
  return (
    <div
      className={`${
        !hideBorder
          ? `border text-th-fgd-3 ${
              type === 'error'
                ? 'border-th-error'
                : type === 'success'
                ? 'border-th-success'
                : type === 'info'
                ? 'border-th-bkg-4'
                : 'border-th-warning'
            }`
          : type === 'error'
          ? 'text-th-error'
          : type === 'success'
          ? 'text-th-success'
          : type === 'info'
          ? 'text-th-bkg-4'
          : 'text-th-warning'
      } flex items-center rounded-md ${!hidePadding ? 'p-2' : ''}`}
    >
      {type === 'error' ? (
        <ExclamationCircleIcon className={`${iconClasses} text-th-error`} />
      ) : null}
      {type === 'success' ? (
        <CheckCircleIcon className={`${iconClasses} text-th-success`} />
      ) : null}
      {type === 'warning' ? (
        <ExclamationTriangleIcon className={`${iconClasses} text-th-warning`} />
      ) : null}
      {type === 'info' ? (
        <InformationCircleIcon className={`${iconClasses} text-th-fgd-1`} />
      ) : null}
      <div>
        <div className="text-th-fgd-2">{title}</div>
        <div
          className={`${title && desc && 'pt-1'} text-left text-xs font-normal`}
        >
          {desc}
        </div>
      </div>
    </div>
  )
}

export default InlineNotification
