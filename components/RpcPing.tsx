import { formatNumericValue } from 'utils/numbers'
import { StatusDot } from './Tps'
import { rpcAlertThreshold, rpcWarningThreshold } from './StatusBar'

const RpcPing = ({ rpcPing }: { rpcPing: number }) => {
  return (
    <div>
      <div className="flex items-center">
        <StatusDot
          status={rpcPing ? rpcPing : 1000}
          alert={rpcAlertThreshold}
          warning={rpcWarningThreshold}
        />
        <span className="font-mono text-xs text-th-fgd-2">
          <span className="mr-1">{formatNumericValue(rpcPing, 0)}</span>
          <span className="font-normal text-th-fgd-4">MS</span>
        </span>
      </div>
    </div>
  )
}

export default RpcPing
