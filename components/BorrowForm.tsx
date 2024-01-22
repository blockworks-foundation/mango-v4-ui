import { HealthType } from '@blockworks-foundation/mango-v4'
import {
  ArrowLeftIcon,
  ArrowUpLeftIcon,
  ArrowUpTrayIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/20/solid'
import Decimal from 'decimal.js'
import { useTranslation } from 'next-i18next'
import React, { useCallback, useMemo, useState } from 'react'
import NumberFormat from 'react-number-format'
import mangoStore from '@store/mangoStore'
import {
  BORROW_REPAY_MODAL_INNER_HEIGHT,
  INPUT_TOKEN_DEFAULT,
  TOKEN_REDUCE_ONLY_OPTIONS,
} from './../utils/constants'
import { notify } from './../utils/notifications'
import ActionTokenList from './account/ActionTokenList'
import ButtonGroup from './forms/ButtonGroup'
import Label from './forms/Label'
import Button from './shared/Button'
import InlineNotification from './shared/InlineNotification'
import Loading from './shared/Loading'
import { EnterBottomExitBottom, FadeInFadeOut } from './shared/Transitions'
import { withValueLimit } from './swap/MarketSwapForm'
import { getMaxWithdrawForBank } from './swap/useTokenMax'
import MaxAmountButton from '@components/shared/MaxAmountButton'
import HealthImpactTokenChange from '@components/HealthImpactTokenChange'
import Tooltip from '@components/shared/Tooltip'
import useMangoAccount from 'hooks/useMangoAccount'
import useMangoGroup from 'hooks/useMangoGroup'
import TokenVaultWarnings from '@components/shared/TokenVaultWarnings'
import { useWallet } from '@solana/wallet-adapter-react'
import FormatNumericValue from './shared/FormatNumericValue'
import { floorToDecimal } from 'utils/numbers'
import BankAmountWithValue from './shared/BankAmountWithValue'
import useBanksWithBalances from 'hooks/useBanksWithBalances'
import { isMangoError } from 'types'
import TokenListButton from './shared/TokenListButton'
import TokenLogo from './shared/TokenLogo'
import SecondaryConnectButton from './shared/SecondaryConnectButton'
import { handleInputChange } from 'utils/account'

interface BorrowFormProps {
  onSuccess: () => void
  token?: string
}

export const ACCOUNT_ACTIONS_NUMBER_FORMAT_CLASSES =
  'w-full rounded-lg rounded-l-none border border-th-input-border bg-th-input-bkg p-3 text-right font-mono text-xl text-th-fgd-1 focus-visible:border-th-fgd-4 focus:outline-none md:hover:border-th-input-border-hover md:hover:focus-visible:border-th-fgd-4'

function BorrowForm({ onSuccess, token }: BorrowFormProps) {
  const { t } = useTranslation('common')
  const { group } = useMangoGroup()
  const [inputAmount, setInputAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [selectedToken, setSelectedToken] = useState(
    token || INPUT_TOKEN_DEFAULT,
  )
  const [showTokenList, setShowTokenList] = useState(false)
  const [sizePercentage, setSizePercentage] = useState('')
  const { mangoAccount } = useMangoAccount()
  const { connected, publicKey } = useWallet()
  const banks = useBanksWithBalances('maxBorrow')

  const borrowBanks = useMemo(() => {
    if (!banks || !banks.length) return []
    return banks.filter(
      (b) => b.bank.reduceOnly === TOKEN_REDUCE_ONLY_OPTIONS.DISABLED,
    )
  }, [banks])

  const bank = useMemo(() => {
    const group = mangoStore.getState().group
    return group?.banksMapByName.get(selectedToken)?.[0]
  }, [selectedToken])

  const tokenMax = useMemo(() => {
    const group = mangoStore.getState().group
    if (!group || !bank || !mangoAccount) return new Decimal(0)
    const amount = getMaxWithdrawForBank(group, bank, mangoAccount, true)
    return amount && amount.gt(0) ? new Decimal(amount) : new Decimal(0)
  }, [mangoAccount, bank])

  const tokenBalance = useMemo(() => {
    if (!bank || !mangoAccount) return new Decimal(0)
    const balance = new Decimal(mangoAccount.getTokenBalanceUi(bank))
    return balance.gt(0) ? balance : new Decimal(0)
  }, [bank, mangoAccount])

  const isBorrow = parseFloat(inputAmount) > tokenBalance.toNumber()

  const handleSizePercentage = useCallback(
    (percentage: string) => {
      if (!bank) return
      setSizePercentage(percentage)
      const amount = floorToDecimal(
        new Decimal(percentage).div(100).mul(tokenMax),
        bank.mintDecimals,
      )
      setInputAmount(amount.toFixed())
    },
    [tokenMax, bank],
  )

  const setMax = useCallback(() => {
    if (!bank) return
    const max = floorToDecimal(tokenMax, bank.mintDecimals)
    setInputAmount(max.toFixed())
    handleSizePercentage('100')
  }, [bank, tokenMax, handleSizePercentage])

  const handleSelectToken = (token: string) => {
    setSelectedToken(token)
    setShowTokenList(false)
  }

  const handleBorrow = useCallback(async () => {
    const client = mangoStore.getState().client
    const group = mangoStore.getState().group
    const mangoAccount = mangoStore.getState().mangoAccount.current
    const actions = mangoStore.getState().actions

    if (!mangoAccount || !group || !publicKey) return
    setSubmitting(true)

    try {
      const { signature: tx, slot } = await client.tokenWithdraw(
        group,
        mangoAccount,
        bank!.mint,
        Number(inputAmount),
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
      console.error(e)
      setSubmitting(false)
      if (!isMangoError(e)) return
      notify({
        title: 'Transaction failed',
        description: e.message,
        txid: e.txid,
        type: 'error',
      })
    }
  }, [bank, inputAmount, onSuccess, publicKey])

  const initHealth = useMemo(() => {
    return group && mangoAccount
      ? mangoAccount.getHealthRatioUi(group, HealthType.init)
      : 100
  }, [mangoAccount, group])

  const showInsufficientBalance = Number(inputAmount)
    ? tokenMax.lt(inputAmount)
    : false

  return (
    <>
      <EnterBottomExitBottom
        className="absolute bottom-0 left-0 z-20 h-full w-full overflow-auto rounded-lg bg-th-bkg-1 p-6"
        show={showTokenList}
      >
        <BackButton onClick={() => setShowTokenList(false)} />
        <h2 className="mb-4 text-center text-lg">{t('select-borrow-token')}</h2>
        <div className="flex items-center px-4 pb-2">
          <div className="w-1/4">
            <p className="text-xs">{t('token')}</p>
          </div>
          <div className="w-1/4 text-right">
            <p className="text-xs">{t('borrow-rate')}</p>
          </div>
          <div className="w-1/2 text-right">
            <p className="whitespace-nowrap text-xs">{t('max-borrow')}</p>
          </div>
        </div>
        <ActionTokenList
          banks={borrowBanks}
          onSelect={handleSelectToken}
          showBorrowRates
          valueKey="maxBorrow"
        />
      </EnterBottomExitBottom>
      <FadeInFadeOut show={!showTokenList}>
        <div
          className="flex flex-col justify-between"
          style={{ height: BORROW_REPAY_MODAL_INNER_HEIGHT }}
        >
          <div>
            {initHealth <= 0 ? (
              <div className="mb-4">
                <InlineNotification
                  type="error"
                  desc="You have no available collateral to borrow against."
                />
              </div>
            ) : null}
            {bank ? <TokenVaultWarnings bank={bank} type="borrow" /> : null}
            <div className="grid grid-cols-2">
              <div className="col-span-2 flex justify-between">
                <Label text={`${t('borrow')} ${t('token')}`} />
                {bank ? (
                  <MaxAmountButton
                    className="mb-2"
                    decimals={bank.mintDecimals}
                    label={t('max')}
                    onClick={setMax}
                    value={tokenMax}
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
              {/* <div className="col-span-2 mt-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-th-fgd-3">{t('leverage')}</p>
                <p className="text-th-fgd-3">0.00x</p>
              </div>
              <BorrowLeverageSlider
                amount={Number(inputAmount) || 0}
                tokenMax={tokenMax}
                onChange={(x) => setInputAmount(x)}
              />
            </div> */}
            </div>
            {bank ? (
              <div className="my-6 space-y-1.5 border-y border-th-bkg-3 px-2 py-4">
                <HealthImpactTokenChange
                  mintPk={bank.mint}
                  uiAmount={Number(inputAmount)}
                />
                <div className="flex justify-between">
                  <p>{t('withdraw-amount')}</p>
                  {isBorrow ? (
                    <BankAmountWithValue amount={tokenBalance} bank={bank} />
                  ) : (
                    <BankAmountWithValue
                      amount={inputAmount}
                      bank={bank}
                      fixDecimals={!!inputAmount}
                    />
                  )}
                </div>
                <div className="flex justify-between">
                  <p>{t('borrow-amount')}</p>
                  <BankAmountWithValue
                    amount={
                      isBorrow
                        ? Number(inputAmount) - tokenBalance.toNumber()
                        : 0
                    }
                    bank={bank}
                    fixDecimals={isBorrow}
                  />
                </div>
                <div className="flex justify-between">
                  <Tooltip
                    content={t('loan-origination-fee-tooltip', {
                      fee: `${(
                        bank.loanOriginationFeeRate.toNumber() * 100
                      ).toFixed(3)}%`,
                    })}
                  >
                    <p className="tooltip-underline">
                      {t('loan-origination-fee')}
                    </p>
                  </Tooltip>
                  <p className="font-mono text-th-fgd-2">
                    {isBorrow ? (
                      <>
                        <FormatNumericValue
                          value={
                            bank.loanOriginationFeeRate.toNumber() *
                            (parseFloat(inputAmount) - tokenBalance.toNumber())
                          }
                          decimals={bank.mintDecimals}
                        />{' '}
                        <span className="font-body text-th-fgd-4">
                          {bank.name}
                        </span>
                      </>
                    ) : (
                      'N/A'
                    )}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
          {connected ? (
            <Button
              onClick={handleBorrow}
              className="flex w-full items-center justify-center"
              disabled={connected && (!inputAmount || showInsufficientBalance)}
              size="large"
            >
              {submitting ? (
                <Loading className="mr-2 h-5 w-5" />
              ) : showInsufficientBalance ? (
                <div className="flex items-center">
                  <ExclamationCircleIcon className="mr-2 h-5 w-5 shrink-0" />
                  {t('swap:insufficient-collateral')}
                </div>
              ) : isBorrow || !inputAmount ? (
                <div className="flex items-center">
                  <ArrowUpLeftIcon className="mr-2 h-5 w-5" />
                  {tokenBalance.toNumber()
                    ? `${t('withdraw')} & ${t('borrow')}`
                    : t('borrow')}
                </div>
              ) : (
                <div className="flex items-center">
                  <ArrowUpTrayIcon className="mr-2 h-5 w-5" />
                  {t('withdraw')}
                </div>
              )}
            </Button>
          ) : (
            <SecondaryConnectButton
              className="flex w-full items-center justify-center"
              isLarge
            />
          )}
        </div>
      </FadeInFadeOut>
    </>
  )
}

export default BorrowForm

export const BackButton = ({ onClick }: { onClick: (x: boolean) => void }) => {
  return (
    <button
      onClick={() => onClick(false)}
      className="absolute left-4 top-4 z-40 w-6 text-th-fgd-4 focus:outline-none focus-visible:text-th-active md:right-2 md:top-2 md:hover:text-th-active"
    >
      <ArrowLeftIcon className={`h-6 w-6`} />
    </button>
  )
}
