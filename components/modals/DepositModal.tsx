import { ChevronDownIcon } from '@heroicons/react/solid'
import { Wallet } from '@project-serum/anchor'
import { useWallet } from '@solana/wallet-adapter-react'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import React, { ChangeEvent, useCallback, useMemo, useState } from 'react'
import mangoStore from '../../store/mangoStore'
import { ModalProps } from '../../types/modal'
import { INPUT_TOKEN_DEFAULT } from '../../utils/constants'
import { notify } from '../../utils/notifications'
import { floorToDecimal } from '../../utils/numbers'
import { TokenAccount } from '../../utils/tokens'
import ActionTokenList from '../account/ActionTokenList'
import ButtonGroup from '../forms/ButtonGroup'
import Input from '../forms/Input'
import Label from '../forms/Label'
import Button, { LinkButton } from '../shared/Button'
import HealthImpact from '../shared/HealthImpact'
import Loading from '../shared/Loading'
import Modal from '../shared/Modal'
import { EnterBottomExitBottom, FadeInFadeOut } from '../shared/Transitions'

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
  const jupiterTokens = mangoStore((s) => s.jupiterTokens)

  const bank = useMemo(() => {
    const group = mangoStore.getState().group
    return group?.banksMapByName.get(selectedToken)![0]
  }, [selectedToken])

  const logoUri = useMemo(() => {
    let logoURI
    if (jupiterTokens.length) {
      logoURI = jupiterTokens.find(
        (t) => t.address === bank?.mint.toString()
      )!.logoURI
    }
    return logoURI
  }, [bank?.mint, jupiterTokens])

  const { wallet } = useWallet()
  const walletTokens = mangoStore((s) => s.wallet.tokens)

  const tokenMax = useMemo(() => {
    return walletBalanceForToken(walletTokens, selectedToken)
  }, [walletTokens, selectedToken])

  const setMax = useCallback(() => {
    setInputAmount(tokenMax.maxAmount.toString())
  }, [tokenMax])

  const handleSizePercentage = useCallback(
    (percentage: string) => {
      setSizePercentage(percentage)

      let amount = (Number(percentage) / 100) * tokenMax.maxAmount
      if (percentage !== '100') {
        amount = floorToDecimal(amount, tokenMax.maxDecimals)
      }

      setInputAmount(amount.toString())
    },
    [tokenMax]
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

      await actions.reloadAccount()
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

  // TODO extract into a shared hook for UserSetupModal.tsx
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
            ),
            walletBalanceValue: walletBalance.maxAmount * value[0]?.uiPrice,
          }
        })
      : []
    return banks.filter((b) => b.walletBalance > 0)
  }, [group?.banksMapByName, walletTokens])

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="h-[420px]">
        <EnterBottomExitBottom
          className="absolute bottom-0 left-0 z-20 h-full w-full overflow-auto bg-th-bkg-1 p-6"
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
            <h2 className="mb-4 text-center">{t('deposit')}</h2>
            <div className="grid grid-cols-2 pb-6">
              <div className="col-span-2 flex justify-between">
                <Label text={t('token')} />
                <LinkButton className="mb-2 no-underline" onClick={setMax}>
                  <span className="mr-1 text-sm font-normal text-th-fgd-4">
                    {t('wallet-balance')}:
                  </span>
                  <span className="text-th-fgd-1 underline">
                    {floorToDecimal(tokenMax.maxAmount, tokenMax.maxDecimals)}
                  </span>
                </LinkButton>
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
                      src={
                        logoUri || `/icons/${selectedToken.toLowerCase()}.svg`
                      }
                    />
                  </div>
                  <div className="flex w-full items-center justify-between">
                    <div className="text-xl font-bold">{selectedToken}</div>
                    <ChevronDownIcon className="h-6 w-6" />
                  </div>
                </button>
              </div>
              <div className="col-span-1">
                <Input
                  type="text"
                  name="deposit"
                  id="deposit"
                  className="w-full rounded-lg rounded-l-none border border-th-bkg-4 bg-th-bkg-1 p-3 text-right text-xl font-bold tracking-wider text-th-fgd-1 focus:outline-none"
                  placeholder="0.00"
                  value={inputAmount}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setInputAmount(e.target.value)
                  }
                />
              </div>
              <div className="col-span-2 mt-2">
                <ButtonGroup
                  activeValue={sizePercentage}
                  onChange={(p) => handleSizePercentage(p)}
                  values={['10', '25', '50', '75', '100']}
                  unit="%"
                />
              </div>
            </div>
            <HealthImpact
              mintPk={bank!.mint}
              uiAmount={parseFloat(inputAmount)}
              isDeposit
            />
            {/* <div className="space-y-2 border-y border-th-bkg-3 py-4">
            <div className="flex justify-between">
              <p>{t('health-impact')}</p>
              <p className="text-th-green">+12%</p>
            </div>
            <div className="flex justify-between">
              <p>{t('deposit-value')}</p>
              <p className="text-th-fgd-1">$1,000.00</p>
            </div>
            <div className="flex justify-between">
              <div className="flex items-center">
                <p>
                  {t('token-collateral-multiplier', { token: selectedToken })}
                </p>
                <InfoTooltip content={t('collateral-multiplier-desc')} />
              </div>
              <p className="text-th-fgd-1">0.8x</p>
            </div>
            <div className="flex justify-between">
              <p>{t('collateral-value')}</p>
              <p className="text-th-fgd-1">$800.00</p>
            </div>
          </div> */}
          </div>
          <Button
            onClick={handleDeposit}
            className="flex w-full items-center justify-center"
            disabled={!inputAmount}
            size="large"
          >
            {submitting ? <Loading className="mr-2 h-5 w-5" /> : t('deposit')}
          </Button>
        </FadeInFadeOut>
      </div>
    </Modal>
  )
}

export default DepositModal
