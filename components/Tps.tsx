import { useEffect, useState } from 'react'
import sumBy from 'lodash/sumBy'
import { Connection } from '@solana/web3.js'
import mangoStore, { CLUSTER } from '@store/mangoStore'
import useInterval from './shared/useInterval'

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
          <div className="relative mr-1 h-3 w-3">
            <div
              className={`absolute top-0.5 left-0.5 h-2 w-2 rounded-full ${
                tps < tpsWarningThreshold
                  ? 'bg-th-warning'
                  : tps < tpsAlertThreshold
                  ? 'bg-th-error'
                  : 'bg-th-success'
              }`}
            />
            <div
              className={`absolute h-3 w-3 rounded-full opacity-40 ${
                tps < tpsWarningThreshold
                  ? 'bg-th-warning'
                  : tps < tpsAlertThreshold
                  ? 'bg-th-error'
                  : 'bg-th-success'
              }`}
            />
          </div>
          <span className="font-mono text-th-fgd-2 text-xs">
            {tps?.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
            <span className="font-normal text-th-fgd-4"> TPS</span>
          </span>
        </div>
      </div>
    )
  } else {
    return null
  }
}

export default Tps
