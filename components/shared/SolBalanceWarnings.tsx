import useSolBalance from 'hooks/useSolBalance'
import { useTranslation } from 'next-i18next'
import { useEffect, useState } from 'react'
import { MIN_SOL_BALANCE } from 'utils/constants'
import InlineNotification from './InlineNotification'

const SolBalanceWarnings = ({
  amount,
  className,
  setAmount,
  selectedToken,
}: {
  amount?: string
  className?: string
  setAmount?: (a: string) => void
  selectedToken?: string
}) => {
  const { t } = useTranslation()
  const [showMaxSolWarning, setShowMaxSolWarning] = useState(false)
  const [showLowSolWarning, setShowLowSolWarning] = useState(false)
  const { maxSolDeposit } = useSolBalance()

  useEffect(() => {
    if (
      selectedToken === 'SOL' &&
      maxSolDeposit > 0 &&
      maxSolDeposit <= Number(amount)
    ) {
      setShowMaxSolWarning(true)
      if (setAmount) {
        setAmount(maxSolDeposit.toString())
      }
    }
  }, [maxSolDeposit, amount, selectedToken])

  useEffect(() => {
    if (selectedToken !== 'SOL') {
      if (showMaxSolWarning) {
        setShowMaxSolWarning(false)
      }
    } else {
      if (showMaxSolWarning && maxSolDeposit > Number(amount)) {
        setShowMaxSolWarning(false)
      }
    }
  }, [amount, selectedToken, showMaxSolWarning])

  useEffect(() => {
    if (maxSolDeposit <= 0) {
      setShowLowSolWarning(true)
    } else {
      if (showLowSolWarning) {
        setShowLowSolWarning(false)
      }
    }
  }, [maxSolDeposit])

  return showLowSolWarning ? (
    <div className={className}>
      <InlineNotification type="warning" desc={t('deposit-more-sol')} />
    </div>
  ) : showMaxSolWarning ? (
    <div className={className}>
      <InlineNotification
        type="info"
        desc={`Max SOL deposits are reduced to leave ${MIN_SOL_BALANCE} SOL in your wallet for sending transactions`}
      />
    </div>
  ) : null
}

export default SolBalanceWarnings
