import mangoStore from '@store/mangoStore'
import { useMemo } from 'react'
import useMangoAccount from './useMangoAccount'

const useOpenPerpPositions = () => {
  const { mangoAccountAddress, mangoAccountPk } = useMangoAccount()
  const client = mangoStore((s) => s.client)
  const perpPositions = mangoStore((s) => s.mangoAccount.perpPositions)

  const poolIsPerpReadyForRefresh = async (
    successCallback: () => void,
    timeoutCallback?: () => void,
  ): Promise<'ready' | 'timeout'> => {
    const timeout = 15000
    let interval: NodeJS.Timeout
    let isTimeout = false

    const checkPerps = async (): Promise<boolean> => {
      const newMangoAccount = await client.getMangoAccount(mangoAccountPk!)
      return newMangoAccount.perps.every((x) => x.takerBaseLots.isZero())
    }

    const poll = async (
      resolve: (value: 'ready') => void,
      reject: (reason: 'timeout') => void,
    ): Promise<void> => {
      if (await checkPerps()) {
        clearInterval(interval)
        resolve('ready')
      } else if (isTimeout) {
        clearInterval(interval)
        reject('timeout')
      }
    }

    const pollPromise = new Promise<'ready' | 'timeout'>((resolve, reject) => {
      interval = setInterval(() => poll(resolve, reject), 700)
      setTimeout(() => {
        isTimeout = true
      }, timeout)
    })

    try {
      const resp = await pollPromise
      successCallback()
      return resp
    } catch (error) {
      console.error(error)
      if (timeoutCallback) {
        timeoutCallback()
      }

      return 'timeout'
    }
  }

  const openPerpPositions = useMemo(() => {
    const group = mangoStore.getState().group
    if (!mangoAccountAddress || !group) return []
    return Object.values(perpPositions)
      .filter((p) => p.basePositionLots.toNumber())
      .sort((a, b) => {
        const aMarket = group.getPerpMarketByMarketIndex(a.marketIndex)
        const bMarket = group.getPerpMarketByMarketIndex(b.marketIndex)
        const aBasePosition = a.getBasePositionUi(aMarket)
        const bBasePosition = b.getBasePositionUi(bMarket)
        const aNotional = aBasePosition * aMarket._uiPrice
        const bNotional = bBasePosition * bMarket._uiPrice
        return Math.abs(bNotional) - Math.abs(aNotional)
      })
  }, [mangoAccountAddress, perpPositions])

  return { openPerpPositions, poolIsPerpReadyForRefresh }
}

export default useOpenPerpPositions
