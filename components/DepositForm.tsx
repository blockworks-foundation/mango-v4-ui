import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/20/solid'
import { useWallet } from '@solana/wallet-adapter-react'
import { useTranslation } from 'next-i18next'
import React, { useCallback, useMemo, useState } from 'react'
import NumberFormat from 'react-number-format'
import mangoStore from '@store/mangoStore'
import {
  DEPOSIT_WITHDRAW_MODAL_INNER_HEIGHT,
  INPUT_TOKEN_DEFAULT,
} from './../utils/constants'
import { notify } from './../utils/notifications'
import { TokenAccount } from './../utils/tokens'
import ActionTokenList from './account/ActionTokenList'
import ButtonGroup from './forms/ButtonGroup'
import Label from './forms/Label'
import Button, { IconButton } from './shared/Button'
import Loading from './shared/Loading'
import { EnterBottomExitBottom, FadeInFadeOut } from './shared/Transitions'
import { withValueLimit } from './swap/MarketSwapForm'
import MaxAmountButton from '@components/shared/MaxAmountButton'
import Tooltip from '@components/shared/Tooltip'
import HealthImpactTokenChange from '@components/HealthImpactTokenChange'
import SolBalanceWarnings from '@components/shared/SolBalanceWarnings'
import useSolBalance from 'hooks/useSolBalance'
import FormatNumericValue from './shared/FormatNumericValue'
import Decimal from 'decimal.js'
import { floorToDecimal } from 'utils/numbers'
import BankAmountWithValue from './shared/BankAmountWithValue'
import useBanksWithBalances from 'hooks/useBanksWithBalances'
import { isMangoError } from 'types'
import TokenListButton from './shared/TokenListButton'
import { ACCOUNT_ACTIONS_NUMBER_FORMAT_CLASSES, BackButton } from './BorrowForm'
import TokenLogo from './shared/TokenLogo'
import SecondaryConnectButton from './shared/SecondaryConnectButton'
import useTokenPositionsFull from 'hooks/useAccountPositionsFull'
import AccountSlotsFullNotification from './shared/AccountSlotsFullNotification'
import { handleInputChange } from 'utils/account'
import { Bank, Group } from '@blockworks-foundation/mango-v4'
import UninsuredNotification from './shared/UninsuredNotification'
import { toUiDecimals } from '@blockworks-foundation/mango-v4'
import TokenMaxAmountWarnings from './shared/TokenMaxAmountWarnings'

interface DepositFormProps {
  onSuccess: () => void
  token?: string
}

export const walletBalanceForToken = (
  walletTokens: TokenAccount[],
  token: string,
  ignoreLimits?: boolean,
): {
  maxAmount: number
  maxDecimals: number
  walletBalance: number
  vaultLimit: number | null
} => {
  const group = mangoStore.getState().group
  const bank = group?.banksMapByName.get(token)?.[0]
  const depositLimitLeft = bank?.getRemainingDepositLimit()
  let walletToken
  let depositLimitLeftUi
  let limit = null
  if (bank) {
    const tokenMint = bank?.mint
    walletToken = tokenMint
      ? walletTokens.find((t) => t.mint.toString() === tokenMint.toString())
      : null
    if (depositLimitLeft && !ignoreLimits) {
      depositLimitLeftUi = toUiDecimals(depositLimitLeft, bank.mintDecimals)
      limit = toUiDecimals(depositLimitLeft, bank.mintDecimals)
    }
  }

  return {
    maxAmount: walletToken
      ? depositLimitLeftUi !== undefined
        ? Math.min(walletToken.uiAmount, depositLimitLeftUi)
        : walletToken.uiAmount
      : 0,
    walletBalance: walletToken ? walletToken.uiAmount : 0,
    maxDecimals: bank?.mintDecimals || 6,
    vaultLimit: limit,
  }
}

export const isTokenInsured = (
  bank: Bank | undefined,
  group: Group | undefined,
) => {
  if (!bank || !group) return true
  const mintInfo = group.mintInfosMapByMint.get(bank.mint.toString())
  const isInsured = mintInfo?.groupInsuranceFund
  return isInsured
}

function DepositForm({ onSuccess, token }: DepositFormProps) {
  const { t } = useTranslation(['common', 'account', 'swap'])
  const [inputAmount, setInputAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [selectedToken, setSelectedToken] = useState(
    token || INPUT_TOKEN_DEFAULT,
  )
  const [showTokenList, setShowTokenList] = useState(false)
  const [sizePercentage, setSizePercentage] = useState('')
  const [refreshingWalletTokens, setRefreshingWalletTokens] = useState(false)
  const { maxSolDeposit } = useSolBalance()
  const banks = useBanksWithBalances('walletBalance')

  const bank = useMemo(() => {
    const group = mangoStore.getState().group
    return group?.banksMapByName.get(selectedToken)?.[0]
  }, [selectedToken])

  const isInsured = useMemo(() => {
    const group = mangoStore.getState().group
    return isTokenInsured(bank, group)
  }, [bank])

  const tokenPositionsFull = useTokenPositionsFull([bank])

  const { connected, publicKey } = useWallet()
  const walletTokens = mangoStore((s) => s.wallet.tokens)

  const tokenMax = useMemo(() => {
    return walletBalanceForToken(walletTokens, selectedToken)
  }, [walletTokens, selectedToken])

  const setMax = useCallback(() => {
    const max = floorToDecimal(tokenMax.maxAmount, tokenMax.maxDecimals)
    setInputAmount(max.toFixed())
    setSizePercentage('100')
  }, [tokenMax])

  const handleSizePercentage = useCallback(
    (percentage: string) => {
      setSizePercentage(percentage)
      const amount = floorToDecimal(
        new Decimal(tokenMax.maxAmount).mul(percentage).div(100),
        tokenMax.maxDecimals,
      )
      setInputAmount(amount.toFixed())
    },
    [tokenMax],
  )

  const handleSelectToken = (token: string) => {
    setSelectedToken(token)
    setShowTokenList(false)
  }

  const handleRefreshWalletBalances = useCallback(async () => {
    if (!publicKey) return
    const actions = mangoStore.getState().actions
    setRefreshingWalletTokens(true)
    await actions.fetchWalletTokens(publicKey)
    setRefreshingWalletTokens(false)
  }, [publicKey])

  const handleDeposit = useCallback(async () => {
    const client = mangoStore.getState().client
    const group = mangoStore.getState().group
    const actions = mangoStore.getState().actions
    const mangoAccount = mangoStore.getState().mangoAccount.current

    if (!mangoAccount || !group || !bank || !publicKey) return

    setSubmitting(true)
    try {
      const { signature: tx, slot } = await client.tokenDeposit(
        group,
        mangoAccount,
        bank.mint,
        parseFloat(inputAmount),
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
      console.error('Error depositing:', e)
      setSubmitting(false)
      if (!isMangoError(e)) return
      notify({
        title: 'Transaction failed',
        description: e.message,
        txid: e?.txid,
        type: 'error',
      })
    }
  }, [bank, publicKey, inputAmount, onSuccess])

  const showInsufficientBalance =
    tokenMax.maxAmount < Number(inputAmount) ||
    (selectedToken === 'SOL' && maxSolDeposit <= 0)

  const depositLimitAffectingMaxAmounts =
    tokenMax.vaultLimit !== null &&
    tokenMax.maxAmount !== tokenMax.walletBalance
  return (
    <>
      <EnterBottomExitBottom
        className="absolute bottom-0 left-0 z-20 h-full w-full overflow-auto rounded-lg bg-th-bkg-1 p-6"
        show={showTokenList}
      >
        <BackButton onClick={() => setShowTokenList(false)} />
        <h2 className="mb-4 text-center text-lg">
          {t('select-deposit-token')}
        </h2>
        <div className="flex items-center px-4 pb-2">
          <div className="w-1/4 text-left">
            <p className="text-xs">{t('token')}</p>
          </div>
          <div className="w-1/4 text-right">
            <p className="text-xs">{t('deposit-rate')}</p>
          </div>
          <div className="w-1/2 text-right">
            <p className="whitespace-nowrap text-xs">{t('max')}</p>
          </div>
        </div>
        <ActionTokenList
          banks={banks}
          onSelect={handleSelectToken}
          showDepositRates
          valueKey="walletBalance"
        />
      </EnterBottomExitBottom>
      <FadeInFadeOut show={!showTokenList}>
        <div
          className="flex flex-col justify-between"
          style={{ height: DEPOSIT_WITHDRAW_MODAL_INNER_HEIGHT }}
        >
          <div>
            <SolBalanceWarnings
              amount={inputAmount}
              className="mb-4"
              setAmount={setInputAmount}
              selectedToken={selectedToken}
            />
            <TokenMaxAmountWarnings
              limitNearlyReached={depositLimitAffectingMaxAmounts}
              bank={bank}
              className="mb-4"
            />
            <div className="grid grid-cols-2">
              <div className="col-span-2 flex justify-between">
                <Label text={`${t('deposit')} ${t('token')}`} />
                <div className="mb-2 flex items-center space-x-2">
                  <MaxAmountButton
                    decimals={tokenMax.maxDecimals}
                    label={t('max')}
                    onClick={setMax}
                    value={tokenMax.maxAmount}
                  />
                  <Tooltip content={t('account:refresh-balance')}>
                    <IconButton
                      className={refreshingWalletTokens ? 'animate-spin' : ''}
                      onClick={handleRefreshWalletBalances}
                      hideBg
                    >
                      <ArrowPathIcon className="h-4 w-4" />
                    </IconButton>
                  </Tooltip>
                </div>
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
                  <p>{t('deposit-amount')}</p>
                  <BankAmountWithValue amount={inputAmount} bank={bank} />
                </div>
                <div className="flex justify-between">
                  <Tooltip content={t('tooltip-collateral-value')}>
                    <p className="tooltip-underline">{t('collateral-value')}</p>
                  </Tooltip>
                  <p className="font-mono text-th-fgd-2">
                    <FormatNumericValue
                      value={
                        bank.uiPrice *
                        Number(inputAmount) *
                        Number(bank.scaledInitAssetWeight(bank.price))
                      }
                      isUsd
                    />
                  </p>
                </div>
              </div>
            ) : null}
            {!isInsured ? <UninsuredNotification name={bank?.name} /> : null}
          </div>
          {connected ? (
            <Button
              onClick={handleDeposit}
              className="flex w-full items-center justify-center"
              disabled={connected && (!inputAmount || showInsufficientBalance)}
              size="large"
            >
              {submitting ? (
                <Loading className="mr-2 h-5 w-5" />
              ) : showInsufficientBalance ? (
                <div className="flex items-center">
                  <ExclamationCircleIcon className="mr-2 h-5 w-5 shrink-0" />
                  {t('swap:insufficient-balance', {
                    symbol: selectedToken,
                  })}
                </div>
              ) : (
                <div className="flex items-center">
                  <ArrowDownTrayIcon className="mr-2 h-5 w-5" />
                  {t('deposit')}
                </div>
              )}
            </Button>
          ) : (
            <SecondaryConnectButton
              className="flex w-full items-center justify-center"
              isLarge
            />
          )}
          {tokenPositionsFull ? (
            <div className="mt-4">
              <AccountSlotsFullNotification
                message={t('error-token-positions-full')}
              />
            </div>
          ) : null}
        </div>
      </FadeInFadeOut>
    </>
  )
}

export default DepositForm
