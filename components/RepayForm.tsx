import { ArrowDownRightIcon } from '@heroicons/react/20/solid'
import { useWallet } from '@solana/wallet-adapter-react'
import Decimal from 'decimal.js'
import { useTranslation } from 'next-i18next'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import NumberFormat from 'react-number-format'
import mangoStore from '@store/mangoStore'
import { notify } from './../utils/notifications'
import { formatNumericValue } from './../utils/numbers'
import ActionTokenList from './account/ActionTokenList'
import ButtonGroup from './forms/ButtonGroup'
import Label from './forms/Label'
import Button from './shared/Button'
import Loading from './shared/Loading'
import { EnterBottomExitBottom, FadeInFadeOut } from './shared/Transitions'
import { withValueLimit } from './swap/MarketSwapForm'
import MaxAmountButton from '@components/shared/MaxAmountButton'
import HealthImpactTokenChange from '@components/HealthImpactTokenChange'
import SolBalanceWarnings from '@components/shared/SolBalanceWarnings'
import useMangoAccount from 'hooks/useMangoAccount'
import {
  BORROW_REPAY_MODAL_INNER_HEIGHT,
  INPUT_TOKEN_DEFAULT,
} from 'utils/constants'
import ConnectEmptyState from './shared/ConnectEmptyState'
import BankAmountWithValue from './shared/BankAmountWithValue'
import useBanksWithBalances from 'hooks/useBanksWithBalances'
import { isMangoError } from 'types'
import TokenListButton from './shared/TokenListButton'
import { ACCOUNT_ACTIONS_NUMBER_FORMAT_CLASSES, BackButton } from './BorrowForm'
import TokenLogo from './shared/TokenLogo'
import InlineNotification from './shared/InlineNotification'
import { handleInputChange } from 'utils/account'

interface RepayFormProps {
  onSuccess: () => void
  token?: string
}

function RepayForm({ onSuccess, token }: RepayFormProps) {
  const { t } = useTranslation('common')
  const { mangoAccount } = useMangoAccount()
  const walletTokens = mangoStore((s) => s.wallet.tokens)
  const [inputAmount, setInputAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [selectedToken, setSelectedToken] = useState(
    token || INPUT_TOKEN_DEFAULT,
  )
  const [showTokenList, setShowTokenList] = useState(false)
  const [sizePercentage, setSizePercentage] = useState('')
  const banks = useBanksWithBalances('borrowedAmount')
  // const { maxSolDeposit } = useSolBalance()

  const bank = useMemo(() => {
    const group = mangoStore.getState().group
    return group?.banksMapByName.get(selectedToken)?.[0]
  }, [selectedToken])

  const { connected, publicKey } = useWallet()

  const borrowAmount = useMemo(() => {
    if (!mangoAccount || !bank) return new Decimal(0)
    const amount = new Decimal(
      mangoAccount.getTokenBorrowsUi(bank),
    ).toDecimalPlaces(bank.mintDecimals, Decimal.ROUND_UP)
    return amount
  }, [bank, mangoAccount])

  const hasWalletBalanceToRepay = useMemo(() => {
    if (!bank || !inputAmount) return true
    if (!walletTokens?.length) return false
    const hasBorrowToken = walletTokens.find(
      (token) => token.mint.toString() === bank.mint.toString(),
    )
    if (hasBorrowToken) {
      return hasBorrowToken.uiAmount >= parseFloat(inputAmount)
    } else return false
  }, [bank, inputAmount, walletTokens])

  useEffect(() => {
    if (token && !borrowAmount.eq(0)) {
      setInputAmount(borrowAmount.toFixed())
    }
  }, [token, borrowAmount])

  const setMax = useCallback(() => {
    if (!bank) return
    const amount = new Decimal(borrowAmount).toDecimalPlaces(
      bank.mintDecimals,
      Decimal.ROUND_UP,
    )
    setInputAmount(amount.toFixed())
    setSizePercentage('100')
  }, [bank, borrowAmount])

  const handleSizePercentage = useCallback(
    (percentage: string) => {
      if (!bank) return
      setSizePercentage(percentage)
      const amount = new Decimal(borrowAmount)
        .mul(percentage)
        .div(100)
        .toDecimalPlaces(bank.mintDecimals, Decimal.ROUND_UP)

      setInputAmount(amount.toFixed())
    },
    [bank, borrowAmount],
  )

  const handleSelectToken = (token: string) => {
    setSelectedToken(token)
    setShowTokenList(false)
  }

  const handleDeposit = useCallback(
    async (amount: string) => {
      const mangoAccount = mangoStore.getState().mangoAccount.current
      const client = mangoStore.getState().client
      const group = mangoStore.getState().group
      const actions = mangoStore.getState().actions

      if (!mangoAccount || !group || !bank || !publicKey) return

      // we don't want to leave negative dust in the account if someone wants to repay the full amount
      const actualAmount =
        sizePercentage === '100'
          ? borrowAmount.toNumber() * 1.01
          : parseFloat(amount)

      setSubmitting(true)
      try {
        const { signature: tx, slot } = await client.tokenDeposit(
          group,
          mangoAccount,
          bank.mint,
          actualAmount,
          true,
        )
        notify({
          title: 'Transaction confirmed',
          type: 'success',
          txid: tx,
        })

        await actions.reloadMangoAccount(slot)
        actions.fetchWalletTokens(publicKey)
        setSubmitting(false)
        onSuccess()
      } catch (e) {
        console.error('Error repaying:', e)
        setSubmitting(false)
        if (!isMangoError(e)) return
        notify({
          title: 'Transaction failed',
          description: e.message,
          txid: e?.txid,
          type: 'error',
        })
      }
    },
    [bank, publicKey?.toBase58(), sizePercentage],
  )

  useEffect(() => {
    if (!selectedToken && !token && banks.length) {
      setSelectedToken(banks[0].bank.name)
    }
  }, [token, banks, selectedToken])

  const outstandingAmount = borrowAmount.toNumber() - parseFloat(inputAmount)
  const isDeposit = parseFloat(inputAmount) > borrowAmount.toNumber()

  return banks.length ? (
    <>
      <EnterBottomExitBottom
        className="absolute bottom-0 left-0 z-20 h-full w-full overflow-auto rounded-lg bg-th-bkg-1 p-6"
        show={showTokenList}
      >
        <BackButton onClick={() => setShowTokenList(false)} />
        <h2 className="mb-4 text-center text-lg">{t('select-repay-token')}</h2>
        <div className="flex items-center px-4 pb-2">
          <div className="w-1/2 text-left">
            <p className="text-xs">{t('token')}</p>
          </div>
          <div className="w-1/2 text-right">
            <p className="whitespace-nowrap text-xs">{t('amount-owed')}</p>
          </div>
        </div>
        <ActionTokenList
          banks={banks}
          onSelect={handleSelectToken}
          valueKey="borrowedAmount"
        />
      </EnterBottomExitBottom>
      <FadeInFadeOut show={!showTokenList}>
        <div
          className="flex flex-col justify-between"
          style={{ height: BORROW_REPAY_MODAL_INNER_HEIGHT }}
        >
          <div>
            <SolBalanceWarnings
              amount={inputAmount}
              className="mb-4"
              setAmount={setInputAmount}
              selectedToken={selectedToken}
            />
            <div className="grid grid-cols-2">
              <div className="col-span-2 flex justify-between">
                <Label text={`${t('repay')} ${t('token')}`} />
                {bank ? (
                  <MaxAmountButton
                    className="mb-2"
                    decimals={bank.mintDecimals}
                    label={t('amount-owed')}
                    onClick={setMax}
                    value={borrowAmount}
                  />
                ) : null}
              </div>
              <div className="col-span-1">
                <TokenListButton
                  token={selectedToken}
                  logo={<TokenLogo bank={bank} />}
                  setShowList={setShowTokenList}
                />
              </div>
              <div className="col-span-1">
                <NumberFormat
                  name="amountIn"
                  id="amountIn"
                  inputMode="decimal"
                  thousandSeparator=","
                  allowNegative={false}
                  isNumericString={true}
                  decimalScale={bank?.mintDecimals || 6}
                  className={ACCOUNT_ACTIONS_NUMBER_FORMAT_CLASSES}
                  placeholder="0.00"
                  value={inputAmount}
                  onValueChange={(values, source) =>
                    handleInputChange(
                      values,
                      source,
                      setInputAmount,
                      setSizePercentage,
                    )
                  }
                  isAllowed={withValueLimit}
                />
              </div>
              <div className="col-span-2 mt-2">
                <ButtonGroup
                  activeValue={sizePercentage}
                  className="font-mono"
                  onChange={(p) => handleSizePercentage(p)}
                  values={['10', '25', '50', '75', '100']}
                  unit="%"
                />
              </div>
            </div>
            {bank ? (
              <div className="my-6 space-y-1.5 border-y border-th-bkg-3 px-2 py-4 text-sm ">
                <HealthImpactTokenChange
                  mintPk={bank.mint}
                  uiAmount={Number(inputAmount)}
                  isDeposit
                />
                <div className="flex justify-between">
                  <p>{t('repayment-amount')}</p>
                  <BankAmountWithValue amount={inputAmount} bank={bank} />
                </div>
                {isDeposit ? (
                  <div className="flex justify-between">
                    <p>{t('deposit-amount')}</p>
                    <BankAmountWithValue
                      amount={parseFloat(inputAmount) - borrowAmount.toNumber()}
                      bank={bank}
                    />
                  </div>
                ) : null}
                <div className="flex justify-between">
                  <div className="flex items-center">
                    <p>{t('outstanding-balance')}</p>
                  </div>
                  <p className="font-mono text-th-fgd-2">
                    {outstandingAmount > 0
                      ? formatNumericValue(outstandingAmount, bank.mintDecimals)
                      : 0}{' '}
                    <span className="font-body text-th-fgd-4">
                      {selectedToken}
                    </span>
                  </p>
                </div>
              </div>
            ) : null}
          </div>
          <div>
            {!hasWalletBalanceToRepay ? (
              <div className="pb-3">
                <InlineNotification
                  desc={t('error-repay-insufficient-funds', {
                    token: bank?.name,
                  })}
                  type="error"
                />
              </div>
            ) : null}
            <Button
              onClick={() => handleDeposit(inputAmount)}
              className="flex w-full items-center justify-center"
              disabled={!inputAmount}
              size="large"
            >
              {submitting ? (
                <Loading className="mr-2 h-5 w-5" />
              ) : (
                <div className="flex items-center">
                  <ArrowDownRightIcon className="mr-2 h-5 w-5" />
                  {isDeposit ? t('repay-deposit') : t('repay')}
                </div>
              )}
            </Button>
          </div>
        </div>
      </FadeInFadeOut>
    </>
  ) : !connected ? (
    <div className="flex h-[356px] flex-col items-center justify-center">
      <ConnectEmptyState text="Connect to repay your borrows" />
    </div>
  ) : (
    <div className="flex h-[356px] flex-col items-center justify-center">
      <span className="text-2xl">😎</span>
      <p>No borrows to repay...</p>
    </div>
  )
}

export default RepayForm
