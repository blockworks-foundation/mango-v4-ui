import { MANGO_V4_ID } from '@blockworks-foundation/mango-v4'
import { useWallet } from '@solana/wallet-adapter-react'

import mangoStore from '../store/state'
import SerumOrder from '../components/SerumOrder'
import ExplorerLink from '../components/shared/ExplorerLink'
import MangoAccount from '../components/MangoAccount'
import Swap from './Swap'

const Home = () => {
  const group = mangoStore((s) => s.group)
  const { connected } = useWallet()

  const banks = group?.banksMap
    ? Array.from(group?.banksMap, ([key, value]) => ({ key, value }))
    : []

  return (
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
        <div className="flex space-x-6">
          <div className="mx-auto rounded border-8 p-4">
            Group:{' '}
            {group ? (
              <ExplorerLink address={group?.publicKey.toString()} />
            ) : (
              'Loading...'
            )}
            {banks.map((bank) => {
              return (
                <div key={bank.key} className="mt-2 rounded border p-4">
                  <div>{bank.key}</div>
                  <div className="flex">
                    Mint: <ExplorerLink address={bank.value.mint.toString()} />
                  </div>
                  <div className="flex">
                    Oracle:{' '}
                    <ExplorerLink address={bank.value.oracle.toString()} />
                    {/* Oracle Price: {bank.value.oraclePrice} */}
                  </div>
                  <div className="flex">
                    Vault:{' '}
                    <ExplorerLink address={bank.value.vault.toString()} />
                  </div>
                  <div>
                    Indexed Total Deposits:{' '}
                    {bank.value.indexedTotalDeposits.toString()}
                  </div>
                  <div>
                    Indexed Total Borrows:{' '}
                    {bank.value.indexedTotalDeposits.toString()}
                  </div>
                  <div>Deposit Index: {bank.value.depositIndex.toString()}</div>
                  <div>Borrow Index: {bank.value.borrowIndex.toString()}</div>
                </div>
              )
            })}
          </div>
          {connected ? (
            <div className="w-full space-y-6">
              <MangoAccount />
              <Swap />
            </div>
          ) : null}

          {connected ? (
            <div className="mx-auto w-full">
              <SerumOrder />{' '}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default Home
