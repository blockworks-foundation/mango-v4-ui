import {
  ArrowDownRightIcon,
  ArrowLeftIcon,
  ChevronDownIcon,
  ExclamationCircleIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/20/solid'
import { useWallet } from '@solana/wallet-adapter-react'
import Decimal from 'decimal.js'
import { useTranslation } from 'next-i18next'
import Image from 'next/legacy/image'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import NumberFormat, { NumberFormatValues } from 'react-number-format'
import mangoStore from '@store/mangoStore'
import { notify } from './../utils/notifications'
import { formatNumericValue } from './../utils/numbers'
import ActionTokenList from './account/ActionTokenList'
import ButtonGroup from './forms/ButtonGroup'
import Label from './forms/Label'
import Button from './shared/Button'
import Loading from './shared/Loading'
import { EnterBottomExitBottom, FadeInFadeOut } from './shared/Transitions'
import { withValueLimit } from './swap/SwapForm'
import MaxAmountButton from '@components/shared/MaxAmountButton'
import HealthImpactTokenChange from '@components/HealthImpactTokenChange'
import { useAlphaMax, walletBalanceForToken } from './DepositForm'
import SolBalanceWarnings from '@components/shared/SolBalanceWarnings'
import useMangoAccount from 'hooks/useMangoAccount'
import useJupiterMints from 'hooks/useJupiterMints'
import useMangoGroup from 'hooks/useMangoGroup'
import {
  ACCOUNT_ACTION_MODAL_INNER_HEIGHT,
  INPUT_TOKEN_DEFAULT,
} from 'utils/constants'
import ConnectEmptyState from './shared/ConnectEmptyState'
import BankAmountWithValue from './shared/BankAmountWithValue'

interface RepayFormProps {
  onSuccess: () => void
  token?: string
}

function RepayForm({ onSuccess, token }: RepayFormProps) {
  const { t } = useTranslation('common')
  const { group } = useMangoGroup()
  const { mangoAccount } = useMangoAccount()
  const [inputAmount, setInputAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [selectedToken, setSelectedToken] = useState(
    token || INPUT_TOKEN_DEFAULT
  )
  const [showTokenList, setShowTokenList] = useState(false)
  const [sizePercentage, setSizePercentage] = useState('')
  const { mangoTokens } = useJupiterMints()
  // const { maxSolDeposit } = useSolBalance()

  const bank = useMemo(() => {
    const group = mangoStore.getState().group
    return group?.banksMapByName.get(selectedToken)?.[0]
  }, [selectedToken])

  const logoUri = useMemo(() => {
    let logoURI
    if (mangoTokens.length && bank) {
      logoURI = mangoTokens.find(
        (t) => t.address === bank?.mint.toString()
      )?.logoURI
    }
    return logoURI
  }, [bank, mangoTokens])

  const { connected, publicKey } = useWallet()
  const walletTokens = mangoStore((s) => s.wallet.tokens)

  const walletBalance = useMemo(() => {
    return selectedToken
      ? walletBalanceForToken(walletTokens, selectedToken)
      : { maxAmount: 0, maxDecimals: 6 }
  }, [walletTokens, selectedToken])

  const borrowAmount = useMemo(() => {
    if (!mangoAccount || !bank) return new Decimal(0)
    const amount = new Decimal(
      mangoAccount.getTokenBorrowsUi(bank)
    ).toDecimalPlaces(bank.mintDecimals, Decimal.ROUND_UP)
    return amount
  }, [bank, mangoAccount])

  const setMax = useCallback(() => {
    if (!bank) return
    const amount = new Decimal(borrowAmount).toDecimalPlaces(
      bank.mintDecimals,
      Decimal.ROUND_UP
    )
    setInputAmount(amount.toString())
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

      setInputAmount(amount.toString())
    },
    [bank, borrowAmount]
  )

  const handleSelectToken = (token: string) => {
    setSelectedToken(token)
    setShowTokenList(false)
  }

  const handleDeposit = useCallback(
    async (amount: string) => {
      //to not leave some dust on account we round amount by this number
      //with reduce only set to true we take only what is needed to be
      //deposited in need to repay borrow
      const mangoAccount = mangoStore.getState().mangoAccount.current
      const client = mangoStore.getState().client
      const group = mangoStore.getState().group
      const actions = mangoStore.getState().actions

      if (!mangoAccount || !group || !bank || !publicKey) return

      //we don't want to left negative dust in account if someone wants to repay full amount
      const actualAmount =
        sizePercentage === '100'
          ? mangoAccount.getTokenBorrowsUi(bank) < parseFloat(amount)
            ? parseFloat(amount)
            : mangoAccount.getTokenBorrowsUi(bank)
          : parseFloat(amount)

      setSubmitting(true)
      try {
        const tx = await client.tokenDeposit(
          group,
          mangoAccount,
          bank.mint,
          actualAmount,
          true
        )
        notify({
          title: 'Transaction confirmed',
          type: 'success',
          txid: tx,
        })

        await actions.reloadMangoAccount()
        actions.fetchWalletTokens(publicKey)
        setSubmitting(false)
        onSuccess()
      } catch (e: any) {
        notify({
          title: 'Transaction failed',
          description: e.message,
          txid: e?.txid,
          type: 'error',
        })
        console.error('Error repaying:', e)
        setSubmitting(false)
      }
    },
    [bank, publicKey?.toBase58(), sizePercentage]
  )

  const banks = useMemo(() => {
    const banks =
      group?.banksMapByName && mangoAccount
        ? Array.from(group?.banksMapByName, ([key, value]) => {
            return {
              key,
              value,
              borrowAmount: mangoAccount.getTokenBorrowsUi(value[0]),
              borrowAmountValue:
                mangoAccount.getTokenBorrowsUi(value[0]) * value[0].uiPrice,
            }
          })
            .filter((b) => b.borrowAmount > 0)
            .sort((a, b) => a.borrowAmount - b.borrowAmount)
        : []
    return banks
  }, [group?.banksMapByName, mangoAccount])

  useEffect(() => {
    if (!selectedToken && !token && banks.length) {
      setSelectedToken(banks[0].key)
    }
  }, [token, banks, selectedToken])

  const exceedsAlphaMax = useAlphaMax(inputAmount, bank)

  const showInsufficientBalance = walletBalance.maxAmount < Number(inputAmount)

  return banks.length ? (
    <>
      <EnterBottomExitBottom
        className="absolute bottom-0 left-0 z-20 h-full w-full overflow-auto rounded-lg bg-th-bkg-1 p-6"
        show={showTokenList}
      >
        <button
          onClick={() => setShowTokenList(false)}
          className={`absolute left-4 top-4 z-40 w-6 text-th-fgd-4 focus:outline-none md:right-2 md:top-2 md:hover:text-th-active`}
        >
          <ArrowLeftIcon className={`h-6 w-6`} />
        </button>
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
          sortByKey="borrowAmountValue"
          valueKey="borrowAmount"
        />
      </EnterBottomExitBottom>
      <FadeInFadeOut show={!showTokenList}>
        <div
          className="flex flex-col justify-between"
          style={{ height: ACCOUNT_ACTION_MODAL_INNER_HEIGHT }}
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
              <div className="col-span-1 rounded-lg rounded-r-none border border-r-0 border-th-input-border bg-th-input-bkg">
                <button
                  onClick={() => setShowTokenList(true)}
                  className="default-transition flex h-full w-full items-center rounded-lg rounded-r-none py-2 px-3 text-th-fgd-2 hover:cursor-pointer hover:bg-th-bkg-2 hover:text-th-fgd-1"
                >
                  <div className="mr-2.5 flex min-w-[24px] items-center">
                    {logoUri ? (
                      <Image alt="" width="24" height="24" src={logoUri} />
                    ) : (
                      <QuestionMarkCircleIcon className="h-6 w-6 text-th-fgd-3" />
                    )}
                  </div>
                  <div className="flex w-full items-center justify-between">
                    <div className="text-xl font-bold">{selectedToken}</div>
                    <ChevronDownIcon className="h-6 w-6" />
                  </div>
                </button>
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
                  className="w-full rounded-lg rounded-l-none border border-th-input-border bg-th-input-bkg p-3 text-right font-mono text-xl text-th-fgd-1 focus:border-th-input-border-hover focus:outline-none md:hover:border-th-input-border-hover"
                  placeholder="0.00"
                  value={inputAmount}
                  onValueChange={(e: NumberFormatValues) => {
                    setInputAmount(
                      !Number.isNaN(Number(e.value)) ? e.value : ''
                    )
                  }}
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
                <div className="flex justify-between">
                  <div className="flex items-center">
                    <p>{t('outstanding-balance')}</p>
                  </div>
                  <p className="font-mono text-th-fgd-2">
                    {formatNumericValue(
                      Number(borrowAmount) - Number(inputAmount),
                      bank.mintDecimals
                    )}{' '}
                    <span className="font-body text-th-fgd-4">
                      {selectedToken}
                    </span>
                  </p>
                </div>
              </div>
            ) : null}
          </div>
          <Button
            onClick={() => handleDeposit(inputAmount)}
            className="flex w-full items-center justify-center"
            disabled={
              !inputAmount || showInsufficientBalance || exceedsAlphaMax
            }
            size="large"
          >
            {submitting ? (
              <Loading className="mr-2 h-5 w-5" />
            ) : showInsufficientBalance ? (
              <div className="flex items-center">
                <ExclamationCircleIcon className="mr-2 h-5 w-5 flex-shrink-0" />
                {t('swap:insufficient-balance', {
                  symbol: selectedToken,
                })}
              </div>
            ) : (
              <div className="flex items-center">
                <ArrowDownRightIcon className="mr-2 h-5 w-5" />
                {t('repay')}
              </div>
            )}
          </Button>
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
