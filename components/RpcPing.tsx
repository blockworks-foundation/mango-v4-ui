import { Connection } from '@solana/web3.js'
import mangoStore from '@store/mangoStore'
import { useEffect, useState } from 'react'
import useInterval from './shared/useInterval'
import { formatNumericValue } from 'utils/numbers'
import Tooltip from './shared/Tooltip'
import { useTranslation } from 'react-i18next'
import { StatusDot } from './Tps'

const rpcAlertThreshold = 250
const rpcWarningThreshold = 500

const getPingTime = async (
  connection: Connection,
  setRpcPing: (x: number) => void,
) => {
  const startTime = Date.now()
  try {
    await connection.getSlot()

    const endTime = Date.now()
    const pingTime = endTime - startTime
    setRpcPing(pingTime)
  } catch (error) {
    console.error('Error pinging the RPC:', error)
    return null
  }
}

const RpcPing = () => {
  const { t } = useTranslation('common')
  const connection = mangoStore((s) => s.connection)
  const [rpcPing, setRpcPing] = useState(0)

  useEffect(() => {
    getPingTime(connection, setRpcPing)
  }, [])

  useInterval(() => {
    getPingTime(connection, setRpcPing)
  }, 30 * 1000)

  return (
    <div>
      <div className="flex items-center">
        <StatusDot
          status={rpcPing}
          alert={rpcAlertThreshold}
          warning={rpcWarningThreshold}
        />
        <Tooltip content={t('rpc-ping')}>
          <span className="font-mono text-xs text-th-fgd-2">
            <span className="mr-1">{formatNumericValue(rpcPing, 0)}</span>
            <span className="font-normal text-th-fgd-4">MS</span>
          </span>
        </Tooltip>
      </div>
    </div>
  )
}

export default RpcPing
