import type { NextPage } from 'next'
import { useWallet } from '@solana/wallet-adapter-react'

import mangoStore from '../store/state'
import TopBar from '../components/TopBar'
import ExplorerLink from '../components/shared/ExplorerLink'
import SerumOrder from '../components/SerumOrder'
import { MANGO_V4_ID } from '@blockworks-foundation/mango-v4'
import ContentBox from '../components/shared/ContentBox'
import Container from '../components/shared/Container'

const Index: NextPage = () => {
  const group = mangoStore((s) => s.group)
  const { connected } = useWallet()

  const banks = group?.banksMap
    ? Array.from(group?.banksMap, ([key, value]) => ({ key, value }))
    : []

  return (
    <Container>
      <TopBar />
      <div className="mt-8 flex justify-center">
        <div className="flex">
          <div className="mx-auto rounded-xl bg-mango-600 p-6">
            Program: <ExplorerLink address={MANGO_V4_ID.toString()} />
          </div>
        </div>
      </div>
      <div className="flex justify-center">
        <div className="mt-8 flex space-x-8">
          <ContentBox>
            Group:{' '}
            {group ? (
              <ExplorerLink address={group?.publicKey.toString()} />
            ) : (
              'Loading...'
            )}
            {banks.map((bank) => {
              return (
                <div
                  key={bank.key}
                  className="mt-2 rounded border border-mango-500 p-4"
                >
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
          </ContentBox>
          {connected ? (
            <div className="w-96">
              <SerumOrder />{' '}
            </div>
          ) : null}
        </div>
      </div>
    </Container>
  )
}

export default Index
