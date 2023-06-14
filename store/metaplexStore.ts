import { Metaplex } from '@metaplex-foundation/js'
import produce from 'immer'
import create from 'zustand'

type IMetaplexStore = {
  metaplex: Metaplex | null
  set: (x: (x: IMetaplexStore) => void) => void
  setMetaplexInstance: (metaplex: Metaplex) => void
}

const MetaplexStore = create<IMetaplexStore>((set, get) => ({
  metaplex: null,
  set: (fn) => set(produce(fn)),
  setMetaplexInstance: (metaplex) => {
    const set = get().set
    set((state) => {
      state.metaplex = metaplex
    })
  },
}))

export default MetaplexStore
