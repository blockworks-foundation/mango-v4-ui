import { PerpPosition } from 'mango-v4-test-pack'
import mangoStore from './mangoStore'

const perpPositionsUpdater = () => {
  const mangoAccount = mangoStore.getState().mangoAccount.current
  const group = mangoStore.getState().group
  const set = mangoStore.getState().set

  if (!mangoAccount || !group) return

  const positions: PerpPosition[] = []

  for (const perpMarket of mangoAccount.perpActive()) {
    const position = mangoAccount.getPerpPosition(perpMarket.marketIndex)
    if (position) {
      positions.push(position)
    }
  }

  set((s) => {
    s.mangoAccount.perpPositions = positions
  })
}

export default perpPositionsUpdater
