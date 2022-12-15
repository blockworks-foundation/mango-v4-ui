import {
  BanknotesIcon,
  ChevronDownIcon,
  ExclamationCircleIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/20/solid'
import { Wallet } from '@project-serum/anchor'
import { useWallet } from '@solana/wallet-adapter-react'
import Decimal from 'decimal.js'
import { useTranslation } from 'next-i18next'
import Image from 'next/legacy/image'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import NumberFormat, { NumberFormatValues } from 'react-number-format'
import mangoStore from '@store/mangoStore'
import { ModalProps } from '../../types/modal'
import { notify } from '../../utils/notifications'
import { floorToDecimal, formatFixedDecimals } from '../../utils/numbers'
import ActionTokenList from '../account/ActionTokenList'
import ButtonGroup from '../forms/ButtonGroup'
import Label from '../forms/Label'
import Button from '../shared/Button'
import Loading from '../shared/Loading'
import Modal from '../shared/Modal'
import { EnterBottomExitBottom, FadeInFadeOut } from '../shared/Transitions'
import { withValueLimit } from '../swap/SwapForm'
import MaxAmountButton from '@components/shared/MaxAmountButton'
import HealthImpactTokenChange from '@components/HealthImpactTokenChange'
import { walletBalanceForToken } from './DepositModal'
import SolBalanceWarnings from '@components/shared/SolBalanceWarnings'
import useMangoAccount from 'hooks/useMangoAccount'
import useJupiterMints from 'hooks/useJupiterMints'
import useMangoGroup from 'hooks/useMangoGroup'
import useCurrencyConversion from 'hooks/useCurrencyConversion'

interface RepayModalProps {
  token?: string
}

type ModalCombinedProps = RepayModalProps & ModalProps

function RepayModal({ isOpen, onClose, token }: ModalCombinedProps) {
  const { t } = useTranslation('common')
  const { group } = useMangoGroup()
  const { mangoAccount } = useMangoAccount()
  const [inputAmount, setInputAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [selectedToken, setSelectedToken] = useState(token)
  const [showTokenList, setShowTokenList] = useState(false)
  const [sizePercentage, setSizePercentage] = useState('')
  const { mangoTokens } = useJupiterMints()
  // const { maxSolDeposit } = useSolBalance()
  const currencyConversionPrice = useCurrencyConversion()

  const bank = useMemo(() => {
    const group = mangoStore.getState().group
    return selectedToken ? group?.banksMapByName.get(selectedToken)?.[0] : null
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

  const { wallet } = useWallet()
  const walletTokens = mangoStore((s) => s.wallet.tokens)

  const walletBalance = useMemo(() => {
    return selectedToken
      ? walletBalanceForToken(walletTokens, selectedToken)
      : { maxAmount: 0, maxDecimals: 6 }
  }, [walletTokens, selectedToken])

  const borrowAmount = useMemo(() => {
    if (!mangoAccount || !bank) return 0
    return floorToDecimal(
      mangoAccount.getTokenBorrowsUi(bank),
      bank.mintDecimals
    ).toNumber()
  }, [bank, mangoAccount])

  const setMax = useCallback(() => {
    setInputAmount(borrowAmount.toFixed(bank?.mintDecimals))
    setSizePercentage('100')
  }, [bank, borrowAmount])

  const handleSizePercentage = useCallback(
    (percentage: string) => {
      setSizePercentage(percentage)

      let amount: Decimal | number = new Decimal(borrowAmount)
        .mul(percentage)
        .div(100)
      amount = floorToDecimal(amount, bank!.mintDecimals).toNumber()

      setInputAmount(amount.toFixed(bank?.mintDecimals))
    },
    [bank, borrowAmount]
  )

  const handleSelectToken = (token: string) => {
    setSelectedToken(token)
    setShowTokenList(false)
  }

  const handleDeposit = useCallback(
    async (amount: string) => {
      const client = mangoStore.getState().client
      const group = mangoStore.getState().group
      const actions = mangoStore.getState().actions
      const mangoAccount = mangoStore.getState().mangoAccount.current

      if (!mangoAccount || !group || !bank || !wallet) return
      console.log('inputAmount: ', amount)

      try {
        setSubmitting(true)
        const tx = await client.tokenDeposit(
          group,
          mangoAccount,
          bank.mint,
          parseFloat(amount)
        )
        notify({
          title: 'Transaction confirmed',
          type: 'success',
          txid: tx,
        })

        await actions.reloadMangoAccount()
        actions.fetchWalletTokens(wallet.adapter as unknown as Wallet)
        setSubmitting(false)
      } catch (e: any) {
        notify({
          title: 'Transaction failed',
          description: e.message,
          txid: e?.txid,
          type: 'error',
        })
        console.error('Error repaying:', e)
      }

      onClose()
    },
    [bank, wallet, onClose]
  )

  const banks = useMemo(() => {
    const banks =
      group?.banksMapByName && mangoAccount
        ? Array.from(group?.banksMapByName, ([key, value]) => {
            return {
              key,
              value,
              borrowAmount: floorToDecimal(
                mangoAccount?.getTokenBorrowsUi(value[0]),
                value[0].mintDecimals
              ).toNumber(),
              borrowAmountValue:
                mangoAccount?.getTokenBorrowsUi(value[0]) * value[0].uiPrice!,
            }
          }).filter((b) => b.borrowAmount > 0)
        : []
    return banks
  }, [group?.banksMapByName, mangoAccount])

  useEffect(() => {
    if (!token && banks.length) {
      setSelectedToken(banks[0].key)
    }
  }, [token, banks])

  const showInsufficientBalance = walletBalance.maxAmount < Number(inputAmount)

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <EnterBottomExitBottom
        className="absolute bottom-0 left-0 z-20 h-full w-full overflow-auto rounded-lg bg-th-bkg-1 p-6"
        show={showTokenList}
      >
        <h2 className="mb-4 text-center">{t('select-token')}</h2>
        <div className="grid auto-cols-fr grid-flow-col px-4 pb-2">
          <div className="text-left">
            <p className="text-xs">{t('token')}</p>
          </div>
          <div className="text-right">
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
      <FadeInFadeOut
        className="flex h-full flex-col justify-between"
        show={isOpen}
      >
        <div>
          <h2 className="mb-2 text-center">{t('repay-borrow')}</h2>
          <SolBalanceWarnings
            amount={inputAmount}
            setAmount={setInputAmount}
            selectedToken={selectedToken}
          />
          <div className="mt-4 grid grid-cols-2">
            <div className="col-span-2 flex justify-between">
              <Label text={t('token')} />
              <MaxAmountButton
                className="mb-2"
                label={t('amount-owed')}
                onClick={setMax}
                value={floorToDecimal(
                  borrowAmount,
                  walletBalance.maxDecimals
                ).toFixed()}
              />
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
                className="w-full rounded-lg rounded-l-none border border-th-input-border bg-th-input-bkg p-3 text-right font-mono text-xl tracking-wider text-th-fgd-1 focus:border-th-input-border-hover focus:outline-none md:hover:border-th-input-border-hover"
                placeholder="0.00"
                value={inputAmount}
                onValueChange={(e: NumberFormatValues) => {
                  setInputAmount(!Number.isNaN(Number(e.value)) ? e.value : '')
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
          <div className="my-6 space-y-1.5 border-y border-th-bkg-3 px-2 py-4 text-sm ">
            {bank ? (
              <HealthImpactTokenChange
                mintPk={bank.mint}
                uiAmount={Number(inputAmount)}
                isDeposit
              />
            ) : null}
            <div className="flex justify-between">
              <p>{t('repayment-value')}</p>
              <p className="font-mono">
                {bank?.uiPrice
                  ? formatFixedDecimals(
                      (bank.uiPrice * Number(inputAmount)) /
                        currencyConversionPrice,
                      true
                    )
                  : '-'}
              </p>
            </div>
            <div className="flex justify-between">
              <div className="flex items-center">
                <p>{t('outstanding-balance')}</p>
              </div>
              <p className="font-mono">
                {floorToDecimal(
                  borrowAmount - Number(inputAmount),
                  walletBalance.maxDecimals
                ).toNumber()}{' '}
                <span className="font-body text-th-fgd-4">{selectedToken}</span>
              </p>
            </div>
          </div>
          <Button
            onClick={() => handleDeposit(inputAmount)}
            className="flex w-full items-center justify-center"
            disabled={!inputAmount || showInsufficientBalance}
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
                <BanknotesIcon className="mr-2 h-5 w-5" />
                {t('repay')}
              </div>
            )}
          </Button>
        </div>
      </FadeInFadeOut>
    </Modal>
  )
}

export default RepayModal
