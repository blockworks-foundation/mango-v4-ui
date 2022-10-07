import { HealthType } from '@blockworks-foundation/mango-v4'
import {
  ChevronDownIcon,
  CurrencyDollarIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/20/solid'
import Decimal from 'decimal.js'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import React, { useCallback, useMemo, useState } from 'react'
import NumberFormat, { NumberFormatValues } from 'react-number-format'
import mangoStore from '@store/mangoStore'
import { ModalProps } from '../../types/modal'
import { INPUT_TOKEN_DEFAULT } from '../../utils/constants'
import { notify } from '../../utils/notifications'
import { floorToDecimal, formatFixedDecimals } from '../../utils/numbers'
import ActionTokenList from '../account/ActionTokenList'
import ButtonGroup from '../forms/ButtonGroup'
import Label from '../forms/Label'
import Button, { LinkButton } from '../shared/Button'
import HealthImpact from '../shared/HealthImpact'
import InlineNotification from '../shared/InlineNotification'
import Loading from '../shared/Loading'
import Modal from '../shared/Modal'
import { EnterBottomExitBottom, FadeInFadeOut } from '../shared/Transitions'
import { withValueLimit } from '../swap/SwapForm'
import { getMaxWithdrawForBank } from '../swap/useTokenMax'
import MaxAmountButton from '@components/shared/MaxAmountButton'

interface BorrowModalProps {
  token?: string
}

type ModalCombinedProps = BorrowModalProps & ModalProps

function BorrowModal({ isOpen, onClose, token }: ModalCombinedProps) {
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
  }, [jupiterTokens, bank])

  const mangoAccount = mangoStore((s) => s.mangoAccount.current)

  const tokenMax = useMemo(() => {
    const group = mangoStore.getState().group
    if (!group || !bank || !mangoAccount) return new Decimal(0)
    return getMaxWithdrawForBank(group, bank, mangoAccount, true)
  }, [mangoAccount, bank])

  const setMax = useCallback(() => {
    setInputAmount(tokenMax.toFixed())
  }, [tokenMax])

  const handleSizePercentage = useCallback(
    (percentage: string) => {
      if (!bank) return
      setSizePercentage(percentage)
      const amount = (Number(percentage) / 100) * (tokenMax.toNumber() || 0)
      setInputAmount(floorToDecimal(amount, bank.mintDecimals).toFixed())
    },
    [tokenMax, bank]
  )

  const handleSelectToken = (token: string) => {
    setSelectedToken(token)
    setShowTokenList(false)
  }

  const handleWithdraw = async () => {
    const client = mangoStore.getState().client
    const group = mangoStore.getState().group
    const mangoAccount = mangoStore.getState().mangoAccount.current
    const actions = mangoStore.getState().actions
    if (!mangoAccount || !group) return
    setSubmitting(true)
    try {
      const tx = await client.tokenWithdraw(
        group,
        mangoAccount,
        bank!.mint,
        parseFloat(inputAmount),
        true
      )
      notify({
        title: 'Transaction confirmed',
        type: 'success',
        txid: tx,
      })
      actions.reloadMangoAccount()
    } catch (e: any) {
      console.error(e)
      notify({
        title: 'Transaction failed',
        description: e.message,
        txid: e?.txid,
        type: 'error',
      })
    } finally {
      setSubmitting(false)
      onClose()
    }
  }

  const banks = useMemo(() => {
    if (mangoAccount) {
      return group?.banksMapByName
        ? Array.from(group?.banksMapByName, ([key, value]) => {
            const bank = value[0]
            const maxAmount = getMaxWithdrawForBank(
              group,
              bank,
              mangoAccount,
              true
            )
            return { key, value, maxAmount: maxAmount.toNumber() }
          })
        : []
    }
    return []
  }, [mangoAccount, group])

  const initHealth = useMemo(() => {
    return group && mangoAccount
      ? mangoAccount.getHealthRatioUi(group, HealthType.init)
      : 100
  }, [mangoAccount])

  const showInsufficientBalance = Number(inputAmount)
    ? tokenMax.lt(inputAmount)
    : false

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <EnterBottomExitBottom
        className="absolute bottom-0 left-0 z-20 h-full w-full overflow-auto bg-th-bkg-1 p-6"
        show={showTokenList}
      >
        <h2 className="mb-4 text-center">{t('select-token')}</h2>
        <div className="grid auto-cols-fr grid-flow-col  px-4 pb-2">
          <div className="">
            <p className="text-xs">{t('token')}</p>
          </div>
          <div className="text-right">
            <p className="text-xs">{t('borrow-rate')}</p>
          </div>
          <div className="text-right">
            <p className="whitespace-nowrap text-xs">{t('max-borrow')}</p>
          </div>
        </div>
        <ActionTokenList
          banks={banks}
          onSelect={handleSelectToken}
          showBorrowRates
          sortByKey="maxAmount"
          valueKey="maxAmount"
        />
      </EnterBottomExitBottom>
      <FadeInFadeOut
        className="flex h-[420px] flex-col justify-between"
        show={isOpen}
      >
        <div>
          <h2 className="mb-4 text-center">{t('borrow')}</h2>
          {initHealth && initHealth <= 0 ? (
            <div className="mb-4">
              <InlineNotification
                type="error"
                desc="You have no available collateral to borrow against."
              />
            </div>
          ) : null}
          <div className="grid grid-cols-2 pb-6">
            <div className="col-span-2 flex justify-between">
              <Label text={t('token')} />
              <MaxAmountButton
                className="mb-2"
                label={t('max')}
                onClick={setMax}
                value={tokenMax.toFixed()}
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
                onValueChange={(e: NumberFormatValues) =>
                  setInputAmount(e.value)
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
                amount={parseFloat(inputAmount) || 0}
                tokenMax={tokenMax}
                onChange={(x) => setInputAmount(x)}
              />
            </div> */}
          </div>
          <div className="space-y-2 border-y border-th-bkg-3 px-2 py-4">
            <HealthImpact
              mintPk={bank!.mint}
              uiAmount={parseFloat(inputAmount)}
            />
            <div className="flex justify-between">
              <p>{t('borrow-value')}</p>
              <p className="font-mono text-th-fgd-1">
                {formatFixedDecimals(
                  bank?.uiPrice! * Number(inputAmount),
                  true
                )}
              </p>
            </div>
          </div>
        </div>
        <Button
          onClick={handleWithdraw}
          className="flex w-full items-center justify-center"
          disabled={!inputAmount || showInsufficientBalance}
          size="large"
        >
          {submitting ? (
            <Loading className="mr-2 h-5 w-5" />
          ) : showInsufficientBalance ? (
            <div className="flex items-center">
              <ExclamationCircleIcon className="mr-2 h-5 w-5 flex-shrink-0" />
              {t('swap:insufficient-collateral')}
            </div>
          ) : (
            <div className="flex items-center">
              <CurrencyDollarIcon className="mr-2 h-5 w-5" />
              {t('borrow')}
            </div>
          )}
        </Button>
      </FadeInFadeOut>
    </Modal>
  )
}

export default BorrowModal
