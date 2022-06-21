import { useWallet } from '@solana/wallet-adapter-react'
import { useState } from 'react'

import Button from './shared/Button'
import DepositModal from './DepositModal'
import WithdrawModal from './WithdrawModal'
import ContentBox from './shared/ContentBox'

const AccountActions = () => {
  const { connected } = useWallet()

  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)

  return (
    <ContentBox>
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
    </ContentBox>
  )
}

export default AccountActions
