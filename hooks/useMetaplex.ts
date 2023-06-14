import { Metaplex, walletAdapterIdentity } from '@metaplex-foundation/js'
import { useWallet } from '@solana/wallet-adapter-react'
import mangoStore from '@store/mangoStore'
import metaplexStore from '@store/metaplexStore'
import { useEffect } from 'react'

export default function useMetaplex() {
  const connection = mangoStore((s) => s.connection)
  const wallet = useWallet()
  const setMetaplexInstance = metaplexStore((s) => s.setMetaplexInstance)

  useEffect(() => {
    let meta = new Metaplex(connection)
    if (wallet?.publicKey) {
      meta = meta.use(walletAdapterIdentity(wallet))
    }
    setMetaplexInstance(meta)
  }, [connection, setMetaplexInstance, wallet])
}
