import { toUiDecimalsForQuote } from '@blockworks-foundation/mango-v4'
import {
  ArrowDownTrayIcon,
  ChevronDownIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/20/solid'
import { Wallet } from '@project-serum/anchor'
import { useWallet } from '@solana/wallet-adapter-react'
import Decimal from 'decimal.js'
import { useTranslation } from 'next-i18next'
import Image from 'next/legacy/image'
import React, { useCallback, useMemo, useState } from 'react'
import NumberFormat, { NumberFormatValues } from 'react-number-format'
import mangoStore from '@store/mangoStore'
import { ModalProps } from '../../types/modal'
import { ALPHA_DEPOSIT_LIMIT, INPUT_TOKEN_DEFAULT } from '../../utils/constants'
import { notify } from '../../utils/notifications'
import { floorToDecimal, formatFixedDecimals } from '../../utils/numbers'
import { TokenAccount } from '../../utils/tokens'
import ActionTokenList from '../account/ActionTokenList'
import ButtonGroup from '../forms/ButtonGroup'
import Label from '../forms/Label'
import Button from '../shared/Button'
import InlineNotification from '../shared/InlineNotification'
import Loading from '../shared/Loading'
import Modal from '../shared/Modal'
import { EnterBottomExitBottom, FadeInFadeOut } from '../shared/Transitions'
import { withValueLimit } from '../swap/SwapForm'
import MaxAmountButton from '@components/shared/MaxAmountButton'
import Tooltip from '@components/shared/Tooltip'
import HealthImpactTokenChange from '@components/HealthImpactTokenChange'
import useSolBalance from 'hooks/useSolBalance'
import SolBalanceWarnings from '@components/shared/SolBalanceWarnings'
import useJupiterMints from 'hooks/useJupiterMints'

interface DepositModalProps {
  token?: string
}

type ModalCombinedProps = DepositModalProps & ModalProps

export const walletBalanceForToken = (
  walletTokens: TokenAccount[],
  token: string
): { maxAmount: number; maxDecimals: number } => {
  const group = mangoStore.getState().group
  const bank = group?.banksMapByName.get(token)![0]

  let walletToken
  if (bank) {
    const tokenMint = bank?.mint
    walletToken = tokenMint
      ? walletTokens.find((t) => t.mint.toString() === tokenMint.toString())
      : null
  }

  return {
    maxAmount: walletToken ? walletToken.uiAmount : 0,
    maxDecimals: bank?.mintDecimals || 6,
  }
}

function DepositModal({ isOpen, onClose, token }: ModalCombinedProps) {
  const { t } = useTranslation('common')
  const group = mangoStore((s) => s.group)
  const [inputAmount, setInputAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [selectedToken, setSelectedToken] = useState(
    token || INPUT_TOKEN_DEFAULT
  )
  const [showTokenList, setShowTokenList] = useState(false)
  const [sizePercentage, setSizePercentage] = useState('')
  const { mangoTokens } = useJupiterMints()

  const bank = useMemo(() => {
    const group = mangoStore.getState().group
    return group?.banksMapByName.get(selectedToken)![0]
  }, [selectedToken])

  const logoUri = useMemo(() => {
    let logoURI
    if (mangoTokens.length) {
      logoURI = mangoTokens.find(
        (t) => t.address === bank?.mint.toString()
      )!.logoURI
    }
    return logoURI
  }, [bank?.mint, mangoTokens])

  const { wallet } = useWallet()
  const walletTokens = mangoStore((s) => s.wallet.tokens)
  const { maxSolDeposit } = useSolBalance()

  const tokenMax = useMemo(() => {
    return walletBalanceForToken(walletTokens, selectedToken)
  }, [walletTokens, selectedToken])

  const setMax = useCallback(() => {
    setInputAmount(tokenMax.maxAmount.toString())
    setSizePercentage('100')
  }, [tokenMax, selectedToken])

  const handleSizePercentage = useCallback(
    (percentage: string) => {
      setSizePercentage(percentage)

      let amount = new Decimal(tokenMax.maxAmount).mul(percentage).div(100)
      amount = floorToDecimal(amount, tokenMax.maxDecimals)

      setInputAmount(amount.toString())
    },
    [tokenMax, selectedToken]
  )

  const handleSelectToken = (token: string) => {
    setSelectedToken(token)
    setShowTokenList(false)
  }

  const handleDeposit = async () => {
    const client = mangoStore.getState().client
    const group = mangoStore.getState().group
    const actions = mangoStore.getState().actions
    const mangoAccount = mangoStore.getState().mangoAccount.current

    if (!mangoAccount || !group) return

    try {
      setSubmitting(true)
      const tx = await client.tokenDeposit(
        group,
        mangoAccount,
        bank!.mint,
        parseFloat(inputAmount)
      )
      notify({
        title: 'Transaction confirmed',
        type: 'success',
        txid: tx,
      })

      await actions.reloadMangoAccount()
      actions.fetchWalletTokens(wallet!.adapter as unknown as Wallet)
      setSubmitting(false)
    } catch (e: any) {
      notify({
        title: 'Transaction failed',
        description: e.message,
        txid: e?.signature,
        type: 'error',
      })
      console.error('Error depositing:', e)
    }

    onClose()
  }

  // TODO extract into a shared hook for UserSetup.tsx
  const banks = useMemo(() => {
    const banks = group?.banksMapByName
      ? Array.from(group?.banksMapByName, ([key, value]) => {
          const walletBalance = walletBalanceForToken(walletTokens, key)
          return {
            key,
            value,
            walletBalance: floorToDecimal(
              walletBalance.maxAmount,
              walletBalance.maxDecimals
            ).toNumber(),
            walletBalanceValue: walletBalance.maxAmount * value[0].uiPrice!,
          }
        })
      : []
    return banks
  }, [group?.banksMapByName, walletTokens])

  const exceedsAlphaMax = useMemo(() => {
    const mangoAccount = mangoStore.getState().mangoAccount.current
    if (!group || !mangoAccount) return
    if (
      mangoAccount.owner.toString() ===
      '8SSLjXBEVk9nesbhi9UMCA32uijbVBUqWoKPPQPTekzt'
    )
      return false
    const accountValue = toUiDecimalsForQuote(
      mangoAccount.getEquity(group)!.toNumber()
    )
    return (
      parseFloat(inputAmount) > ALPHA_DEPOSIT_LIMIT ||
      accountValue > ALPHA_DEPOSIT_LIMIT
    )
  }, [inputAmount])

  const showInsufficientBalance = tokenMax.maxAmount < Number(inputAmount)

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <EnterBottomExitBottom
        className="absolute bottom-0 left-0 z-20 h-full w-full overflow-auto rounded-lg bg-th-bkg-1 p-6"
        show={showTokenList}
      >
        <h2 className="mb-4 text-center">{t('select-token')}</h2>
        <div className="grid auto-cols-fr grid-flow-col px-4 pb-2">
          <div className="">
            <p className="text-xs">{t('token')}</p>
          </div>
          <div className="text-right">
            <p className="text-xs">{t('deposit-rate')}</p>
          </div>
          <div className="text-right">
            <p className="whitespace-nowrap text-xs">{t('wallet-balance')}</p>
          </div>
        </div>
        <ActionTokenList
          banks={banks}
          onSelect={handleSelectToken}
          showDepositRates
          sortByKey="walletBalanceValue"
          valueKey="walletBalance"
        />
      </EnterBottomExitBottom>
      <FadeInFadeOut
        className="flex h-full flex-col justify-between"
        show={isOpen}
      >
        <div>
          <h2 className="mb-2 text-center">{t('deposit')}</h2>
          <InlineNotification
            type="info"
            desc={`There is a $${ALPHA_DEPOSIT_LIMIT} deposit limit during alpha
            testing.`}
          />
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
                label={t('wallet-balance')}
                onClick={setMax}
                value={floorToDecimal(
                  tokenMax.maxAmount,
                  tokenMax.maxDecimals
                ).toFixed()}
              />
            </div>
            <div className="col-span-1 rounded-lg rounded-r-none border border-r-0 border-th-bkg-4 bg-th-bkg-1">
              <button
                onClick={() => setShowTokenList(true)}
                className="default-transition flex h-full w-full items-center rounded-lg rounded-r-none py-2 px-3 text-th-fgd-2 hover:cursor-pointer hover:bg-th-bkg-2 hover:text-th-fgd-1"
              >
                <div className="mr-2.5 flex min-w-[24px] items-center">
                  <Image
                    alt=""
                    width="24"
                    height="24"
                    src={logoUri || `/icons/${selectedToken.toLowerCase()}.svg`}
                  />
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
                className="w-full rounded-lg rounded-l-none border border-th-bkg-4 bg-th-bkg-1 p-3 text-right font-mono text-xl tracking-wider text-th-fgd-1 focus:outline-none"
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
            <HealthImpactTokenChange
              mintPk={bank!.mint}
              uiAmount={Number(inputAmount)}
              isDeposit
            />
            <div className="flex justify-between">
              <p>{t('deposit-value')}</p>
              <p className="font-mono">
                {formatFixedDecimals(
                  bank?.uiPrice! * Number(inputAmount),
                  true
                )}
              </p>
            </div>
            <div className="flex justify-between">
              <div className="flex items-center">
                <Tooltip content={t('asset-weight-desc')}>
                  <p className="tooltip-underline">{t('asset-weight')}</p>
                </Tooltip>
              </div>
              <p className="font-mono">{bank!.initAssetWeight.toFixed(2)}x</p>
            </div>
            <div className="flex justify-between">
              <p>{t('collateral-value')}</p>
              <p className="font-mono">
                {formatFixedDecimals(
                  bank!.uiPrice! *
                    Number(inputAmount) *
                    Number(bank!.initAssetWeight),
                  true
                )}
              </p>
            </div>
          </div>
          <Button
            onClick={handleDeposit}
            className="flex w-full items-center justify-center"
            disabled={
              !inputAmount || exceedsAlphaMax || showInsufficientBalance
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
                <ArrowDownTrayIcon className="mr-2 h-5 w-5" />
                {t('deposit')}
              </div>
            )}
          </Button>
        </div>
      </FadeInFadeOut>
    </Modal>
  )
}

export default DepositModal
