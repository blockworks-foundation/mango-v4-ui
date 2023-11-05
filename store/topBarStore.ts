import produce from 'immer'
import create from 'zustand'

type ItopBarStore = {
  showSettingsModal: boolean
  set: (x: (x: ItopBarStore) => void) => void
  setShowSettingsModal: (val: boolean) => void
}

const TopBarStore = create<ItopBarStore>((set, get) => ({
  showSettingsModal: false,
  set: (fn) => set(produce(fn)),
  setShowSettingsModal: (val: boolean) => {
    const set = get().set
    set((state) => {
      state.showSettingsModal = val
    })
  },
}))

export default TopBarStore
