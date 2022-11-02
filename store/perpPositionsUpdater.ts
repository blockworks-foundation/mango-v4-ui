import {
  Group,
  MangoAccount,
  PerpMarket,
  PerpPosition,
  toUiI80F48,
} from '@blockworks-foundation/mango-v4'
import mangoStore from './mangoStore'

const perpPositionsUpdater = (_newState: any, _prevState: any) => {
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
