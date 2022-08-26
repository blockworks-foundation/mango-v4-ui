import { FunctionComponent } from 'react'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationIcon,
  InformationCircleIcon,
} from '@heroicons/react/solid'

interface InlineNotificationProps {
  desc?: string
  title?: string
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
}) => (
  <div
    className={`${
      !hideBorder
        ? `border text-th-fgd-3 ${
            type === 'error'
              ? 'border-th-red'
              : type === 'success'
              ? 'border-th-green'
              : type === 'info'
              ? 'border-th-bkg-4'
              : 'border-th-orange'
          }`
        : type === 'error'
        ? 'text-th-red'
        : type === 'success'
        ? 'text-th-green'
        : type === 'info'
        ? 'text-th-bkg-4'
        : 'text-th-orange'
    } flex items-center rounded-md ${!hidePadding ? 'p-2' : ''}`}
  >
    {type === 'error' ? (
      <ExclamationCircleIcon className="mr-1.5 h-5 w-5 flex-shrink-0 text-th-red" />
    ) : null}
    {type === 'success' ? (
      <CheckCircleIcon className="mr-1.5 h-5 w-5 flex-shrink-0 text-th-green" />
    ) : null}
    {type === 'warning' ? (
      <ExclamationIcon className="mr-1.5 h-5 w-5 flex-shrink-0 text-th-orange" />
    ) : null}
    {type === 'info' ? (
      <InformationCircleIcon className="mr-1.5 h-5 w-5 flex-shrink-0 text-th-fgd-4" />
    ) : null}
    <div>
      <div>{title}</div>
      <div
        className={`${title && desc && 'pt-1'} text-left text-xs font-normal`}
      >
        {desc}
      </div>
    </div>
  </div>
)

export default InlineNotification
