// Default styles that can be overridden by your app
require('@solana/wallet-adapter-react-ui/styles.css')
import { useWallet } from '@solana/wallet-adapter-react'
import {
  WalletDisconnectButton,
  WalletMultiButton,
} from '@solana/wallet-adapter-react-ui'
import { useState } from 'react'
import Button from './shared/Button'
import DepositModal from './DepositModal'
import WithdrawModal from './WithdrawModal'

const TopBar = () => {
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const { connected } = useWallet()

  return (
    <>
      <div className="flex w-full p-2">
        <div className="ml-auto">
          <div className="flex space-x-2">
            {connected ? (
              <>
                <Button onClick={() => setShowDepositModal(true)}>
                  Deposit
                </Button>
                <Button onClick={() => setShowWithdrawModal(true)}>
                  Withdraw
                </Button>
              </>
            ) : null}
            {connected ? <WalletDisconnectButton /> : <WalletMultiButton />}
          </div>
        </div>
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

export default TopBar
