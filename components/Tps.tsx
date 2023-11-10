import { CLUSTER } from '@store/mangoStore'
import { formatNumericValue } from 'utils/numbers'
import { tpsAlertThreshold, tpsWarningThreshold } from './StatusBar'

const Tps = ({ tps }: { tps: number }) => {
  if (CLUSTER == 'mainnet-beta') {
    return (
      <div>
        <div className="flex items-center">
          <StatusDot
            status={tps}
            alert={tpsAlertThreshold}
            warning={tpsWarningThreshold}
            isLessThan
          />
          <span className="font-mono text-xs text-th-fgd-2">
            {formatNumericValue(tps, 0)}
          </span>
        </div>
      </div>
    )
  } else {
    return null
  }
}

export default Tps

export const StatusDot = ({
  status,
  alert,
  warning,
  isLessThan,
}: {
  status: number
  alert: number
  warning: number
  isLessThan?: boolean
}) => {
  const greaterOrLessThan = (status: number, threshold: number) => {
    if (isLessThan) {
      return status < threshold
    } else return status > threshold
  }

  const dotColor = greaterOrLessThan(status, warning)
    ? 'bg-th-error'
    : greaterOrLessThan(status, alert)
    ? 'bg-th-warning'
    : 'bg-th-success'

  return (
    <div className="relative mr-1 h-3 w-3">
      <div
        className={`absolute left-0.5 top-0.5 h-2 w-2 rounded-full ${dotColor}`}
      />
      <div className={`absolute h-3 w-3 rounded-full opacity-40 ${dotColor}`} />
    </div>
  )
}
