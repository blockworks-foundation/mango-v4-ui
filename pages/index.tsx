import { useEffect, useMemo } from 'react'
import type { NextPage } from 'next'
import { MANGO_V4_ID } from '@blockworks-foundation/mango-v4'
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import {
  GlowWalletAdapter,
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { clusterApiUrl } from '@solana/web3.js'
import mangoStore from '../store/state'
import TopBar from '../components/TopBar'
import WalletListener from '../components/wallet/WalletListener'
import SerumOrder from '../components/SerumOrder'
import ExplorerLink from '../components/shared/ExplorerLink'
import MangoAccount from '../components/MangoAccount'

const hydrateStore = async () => {
  const actions = mangoStore.getState().actions
  actions.fetchGroup()
}

const Home: NextPage = () => {
  const group = mangoStore((s) => s.group)

  const network = WalletAdapterNetwork.Devnet
  const endpoint = useMemo(() => clusterApiUrl(network), [network])
  const banks = group?.banksMap
    ? Array.from(group?.banksMap, ([key, value]) => ({ key, value }))
    : []

  useEffect(() => {
    hydrateStore()
  }, [])

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new GlowWalletAdapter(),
      new SolflareWalletAdapter({ network }),
    ],
    [network]
  )

  if (!group) return <div>Loading...</div>

  return (
    <div className="">
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <WalletListener />
            <TopBar />

            <div className="">
              <div className="my-2 flex text-lg">
                <div className="mx-auto">Mango V4 Devnet</div>
              </div>
              <div className="flex-col space-y-4">
                <div className="flex">
                  <div className="mx-auto rounded border p-4">
                    Program: <ExplorerLink address={MANGO_V4_ID.toString()} />
                  </div>
                </div>
                <div className="flex">
                  <div className="mx-auto rounded border p-4">
                    Group:{' '}
                    <ExplorerLink address={group?.publicKey.toString()} />
                    {banks.map((bank) => {
                      return (
                        <div key={bank.key} className="mt-2 rounded border p-4">
                          <div>{bank.key}</div>
                          <div className="flex">
                            Mint:{' '}
                            <ExplorerLink
                              address={bank.value.mint.toString()}
                            />
                          </div>
                          <div className="flex">
                            Oracle:{' '}
                            <ExplorerLink
                              address={bank.value.oracle.toString()}
                            />
                            {/* Oracle Price: {bank.value.oraclePrice} */}
                          </div>
                          <div className="flex">
                            Vault:{' '}
                            <ExplorerLink
                              address={bank.value.vault.toString()}
                            />
                          </div>
                          <div>
                            Vault Balance: {bank.value.depositIndex.toString()}
                          </div>
                          <div>
                            Deposit Index: {bank.value.depositIndex.toString()}
                          </div>
                          <div>
                            Borrow Index: {bank.value.borrowIndex.toString()}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <MangoAccount />

                  <div className="mx-auto">
                    <SerumOrder />
                  </div>
                </div>
              </div>
            </div>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </div>
  )
}

export default Home
