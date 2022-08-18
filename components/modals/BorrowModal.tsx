import { toUiDecimals } from '@blockworks-foundation/mango-v4'
import { ChevronDownIcon } from '@heroicons/react/solid'
import Decimal from 'decimal.js'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import React, { ChangeEvent, useCallback, useMemo, useState } from 'react'
import mangoStore from '../../store/state'
import { ModalProps } from '../../types/modal'
import { notify } from '../../utils/notifications'
import { formatFixedDecimals } from '../../utils/numbers'
import ButtonGroup from '../forms/ButtonGroup'
// import { notify } from '../../utils/notifications'
import Input from '../forms/Input'
import Label from '../forms/Label'
import Button, { LinkButton } from '../shared/Button'
import DepositTokenList from '../shared/DepositTokenList'
import HealthImpact from '../shared/HealthImpact'
import Loading from '../shared/Loading'
import Modal from '../shared/Modal'
import { EnterBottomExitBottom, FadeInFadeOut } from '../shared/Transitions'
import { BorrowLeverageSlider } from '../swap/LeverageSlider'

interface BorrowModalProps {
  token?: string
}

type ModalCombinedProps = BorrowModalProps & ModalProps

function BorrowModal({ isOpen, onClose, token }: ModalCombinedProps) {
  const { t } = useTranslation('common')
  const [inputAmount, setInputAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [selectedToken, setSelectedToken] = useState(token || 'USDC')
  const [showTokenList, setShowTokenList] = useState(false)
  const [sizePercentage, setSizePercentage] = useState('')

  const mangoAccount = mangoStore((s) => s.mangoAccount.current)

  const bank = useMemo(() => {
    const group = mangoStore.getState().group
    return group?.banksMap.get(selectedToken)
  }, [selectedToken])

  const tokenMax = useMemo(() => {
    const group = mangoStore.getState().group
    if (!group || !bank) return 0
    const amount = mangoAccount
      ?.getMaxWithdrawWithBorrowForToken(group, selectedToken)
      .toNumber()
    return amount && amount > 0 ? toUiDecimals(amount, bank.mintDecimals) : 0
  }, [mangoAccount, bank, selectedToken])

  const setMax = useCallback(() => {
    setInputAmount(tokenMax.toString())
  }, [tokenMax])

  const handleSizePercentage = useCallback(
    (percentage: string) => {
      setSizePercentage(percentage)
      const amount = (Number(percentage) / 100) * (tokenMax || 0)
      setInputAmount(amount.toString())
    },
    [tokenMax]
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
        selectedToken,
        parseFloat(inputAmount),
        true
      )
      notify({
        title: 'Transaction confirmed',
        type: 'success',
        txid: tx,
      })
      actions.reloadAccount()
    } catch (e: any) {
      console.log(e)

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

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <EnterBottomExitBottom
        className="absolute bottom-0 left-0 z-20 h-full w-full overflow-auto bg-th-bkg-1 p-6 pb-0"
        show={showTokenList}
      >
        <h2 className="mb-4 text-center">{t('select-token')}</h2>
        <DepositTokenList onSelect={handleSelectToken} />
      </EnterBottomExitBottom>
      <FadeInFadeOut
        className="flex h-[440px] flex-col justify-between"
        show={isOpen}
      >
        <div>
          <h2 className="mb-4 text-center">{t('borrow')}</h2>
          <div className="grid grid-cols-2 pb-6">
            <div className="col-span-2 flex justify-between">
              <Label text={t('token')} />
              <LinkButton className="mb-2 no-underline" onClick={setMax}>
                <span className="mr-1 font-normal text-th-fgd-3">
                  {t('max')}:
                </span>
                <span className="mx-1 text-th-fgd-1 underline">
                  {formatFixedDecimals(tokenMax)}
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
                    src={`/icons/${selectedToken.toLowerCase()}.svg`}
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
                name="borrow"
                id="borrow"
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
            <div className="col-span-2 mt-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-th-fgd-3">{t('leverage')}</p>
                <p className="text-th-fgd-3">0.00x</p>
              </div>
              <BorrowLeverageSlider
                amount={new Decimal(inputAmount)}
                tokenMax={tokenMax}
                onChange={(x) => setInputAmount(x)}
              />
            </div>
          </div>
          <HealthImpact
            tokenName={selectedToken}
            amount={parseFloat(inputAmount)}
          />
        </div>
        <Button
          onClick={handleWithdraw}
          className="flex w-full items-center justify-center"
          disabled={!inputAmount}
          size="large"
        >
          {submitting ? <Loading className="mr-2 h-5 w-5" /> : t('borrow')}
        </Button>
      </FadeInFadeOut>
    </Modal>
  )
}

export default BorrowModal
