import React, { useState } from 'react'

import mangoStore from '../store/state'
import Button from './shared/Button'
import Loading from './shared/Loading'
import Modal from './shared/Modal'

type DepositModalProps = {
  isOpen: boolean
  onClose: () => void
}

function DepositModal({ isOpen, onClose }: DepositModalProps) {
  const [inputAmount, setInputAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [selectedToken, setSelectedToken] = useState('USDC')

  const handleDeposit = async () => {
    const client = mangoStore.getState().client
    const group = mangoStore.getState().group
    const actions = mangoStore.getState().actions
    const mangoAccount = mangoStore.getState().mangoAccount
    console.log('hi', mangoAccount, group)

    if (!mangoAccount || !group) return

    try {
      setSubmitting(true)
      const tx = await client.tokenDeposit(
        group,
        mangoAccount,
        selectedToken,
        parseFloat(inputAmount)
      )
      console.log('Success depositing:', tx)

      await actions.reloadAccount()
      setSubmitting(false)
    } catch (e) {
      console.log('Error depositing:', e)
    }

    onClose()
  }

  const handleTokenSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedToken(e.target.value)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div>
        <div className="relative mt-1 rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 flex items-center">
            <label htmlFor="token" className="sr-only">
              Token
            </label>
            <select
              id="token"
              name="token"
              autoComplete="token"
              className="h-full rounded-md border-transparent bg-transparent py-0 pl-3 pr-7 text-gray-500 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              onChange={handleTokenSelect}
            >
              <option>USDC</option>
              <option>BTC</option>
              <option>SOL</option>
            </select>
          </div>
          <input
            type="text"
            name="deposit"
            id="deposit"
            className="block w-full rounded-md border-gray-300 pl-24 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="0.00"
            value={inputAmount}
            onChange={(e) => setInputAmount(e.target.value)}
          />
        </div>
      </div>
      <div className="mt-4 flex justify-center">
        <Button onClick={handleDeposit} className="flex items-center">
          {submitting ? <Loading className="mr-2 h-5 w-5" /> : null} Deposit
        </Button>
      </div>
    </Modal>
  )
}

export default DepositModal
