import { useEffect, useState } from 'react'
import sumBy from 'lodash/sumBy'
import { Connection } from '@solana/web3.js'
import mangoStore, { CLUSTER } from '@store/mangoStore'
import useInterval from './shared/useInterval'
import { formatNumericValue } from 'utils/numbers'
import Tooltip from './shared/Tooltip'
import { useTranslation } from 'react-i18next'

const tpsAlertThreshold = 1000
const tpsWarningThreshold = 1300

const getRecentPerformance = async (
  connection: Connection,
  setTps: (x: number) => void,
) => {
  try {
    const samples = 2
    const response = await connection.getRecentPerformanceSamples(samples)
    const totalSecs = sumBy(response, 'samplePeriodSecs')
    const totalTransactions = sumBy(response, 'numTransactions')
    const tps = totalTransactions / totalSecs

    setTps(tps)
  } catch {
    console.warn('Unable to fetch TPS')
  }
}

const Tps = () => {
  const { t } = useTranslation('common')
  const connection = mangoStore((s) => s.connection)
  const [tps, setTps] = useState(0)

  useEffect(() => {
    getRecentPerformance(connection, setTps)
  }, [])

  useInterval(() => {
    getRecentPerformance(connection, setTps)
  }, 60 * 1000)

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
          <Tooltip content={t('solana-tps-desc')}>
            <span className="font-mono text-xs text-th-fgd-2">
              <span className="mr-1">{formatNumericValue(tps, 0)}</span>
              <span className="font-normal text-th-fgd-4">TPS</span>
            </span>
          </Tooltip>
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

  const dotColor = isLessThan
    ? greaterOrLessThan(status, alert)
      ? 'bg-th-warning'
      : greaterOrLessThan(status, warning)
      ? 'bg-th-error'
      : 'bg-th-success'
    : greaterOrLessThan(status, warning)
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
