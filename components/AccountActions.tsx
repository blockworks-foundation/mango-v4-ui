import { useWallet } from '@solana/wallet-adapter-react'
import { useState } from 'react'

import Button from './shared/Button'
import DepositModal from './DepositModal'
import WithdrawModal from './WithdrawModal'
import mangoStore from '../store/state'

const AccountActions = () => {
  const { connected } = useWallet()

  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)

  const handleCloseMangoAccount = async () => {
    const client = mangoStore.getState().client
    const mangoAccount = mangoStore.getState().mangoAccount
    const group = mangoStore.getState().group
    if (!mangoAccount || !group) return
    try {
      const tx = await client.closeMangoAccount(group, mangoAccount)
      console.log('success:', tx)
    } catch (e) {
      console.log(e)
    }
  }

  return (
    <>
      <div className="mt-2 flex justify-center space-x-4">
        {connected ? (
          <>
            <Button onClick={() => setShowDepositModal(true)}>Deposit</Button>
            <Button onClick={() => setShowWithdrawModal(true)}>Withdraw</Button>
            <Button onClick={handleCloseMangoAccount}>Close</Button>
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
    </>
  )
}

export default AccountActions
