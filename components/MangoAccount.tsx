import { TokenAccount } from '@blockworks-foundation/mango-v4'
import { useWallet } from '@solana/wallet-adapter-react'
import { useState } from 'react'

import mangoStore from '../store/state'
import ExplorerLink from './shared/ExplorerLink'
import Button from './shared/Button'
import DepositModal from './DepositModal'
import WithdrawModal from './WithdrawModal'
import Loading from './shared/Loading'

const MangoAccount = () => {
  const mangoAccount = mangoStore((s) => s.mangoAccount)
  const group = mangoStore((s) => s.group)
  const { connected } = useWallet()

  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)

  const activeTokens = mangoAccount
    ? mangoAccount.tokens.filter((ta: TokenAccount) => ta.isActive())
    : []

  const banks = group?.banksMap
    ? Array.from(group?.banksMap, ([key, value]) => ({ key, value }))
    : []

  return (
    <div className="rounded-xl bg-mango-600 p-8">
      {mangoAccount ? (
        <div className="">
          Mango Account:{' '}
          <ExplorerLink address={mangoAccount?.publicKey.toString()} />
          <div className="mt-2 space-y-2 rounded border border-mango-500 p-2">
            {banks.map((bank) => {
              return (
                <div key={bank.key}>
                  <div>{bank.value.name}</div>
                  <div>Balance: {mangoAccount.getUi(bank.value)}</div>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
      <div className="mt-2 flex justify-center space-x-4">
        {connected ? (
          <>
            <Button onClick={() => setShowDepositModal(true)}>Deposit</Button>
            <Button onClick={() => setShowWithdrawModal(true)}>Withdraw</Button>
          </>
        ) : null}
      </div>

      {showDepositModal ? (
        <DepositModal
          isOpen={showDepositModal}
          onClose={() => setShowDepositModal(false)}
        />
      ) : null}
      {showWithdrawModal ? (
        <WithdrawModal
          isOpen={showWithdrawModal}
          onClose={() => setShowWithdrawModal(false)}
        />
      ) : null}
    </div>
  )
}

export default MangoAccount
