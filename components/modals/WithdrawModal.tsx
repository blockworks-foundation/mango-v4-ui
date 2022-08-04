import { ChevronDownIcon } from '@heroicons/react/solid'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import { ChangeEvent, useState } from 'react'

import mangoStore from '../../store/state'
import { ModalProps } from '../../types/modal'
import { notify } from '../../utils/notifications'
import ButtonGroup from '../forms/ButtonGroup'
import Input from '../forms/Input'
import Label from '../forms/Label'
import Button, { LinkButton } from '../shared/Button'
import Loading from '../shared/Loading'
import Modal from '../shared/Modal'
import { EnterBottomExitBottom, FadeInFadeOut } from '../shared/Transitions'
import WithdrawTokenList from '../shared/WithdrawTokenList'

interface WithdrawModalProps {
  token?: string
}

type ModalCombinedProps = WithdrawModalProps & ModalProps

function WithdrawModal({ isOpen, onClose, token }: ModalCombinedProps) {
  const { t } = useTranslation('common')
  const [inputAmount, setInputAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [selectedToken, setSelectedToken] = useState(token || 'USDC')
  const [showTokenList, setShowTokenList] = useState(false)
  const [sizePercentage, setSizePercentage] = useState('')

  const handleSizePercentage = (percentage: string) => {
    setSizePercentage(percentage)

    // TODO: calc max
    const max = 100
    const amount = (Number(percentage) / 100) * max
    setInputAmount(amount.toFixed())
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
        false
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

  const handleSelectToken = (token: string) => {
    setSelectedToken(token)
    setShowTokenList(false)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <EnterBottomExitBottom
        className="absolute bottom-0 left-0 z-20 h-full w-full overflow-auto bg-th-bkg-1 p-6 pb-0"
        show={showTokenList}
      >
        <h2 className="mb-4 text-center">{t('select-token')}</h2>
        <WithdrawTokenList onSelect={handleSelectToken} />
      </EnterBottomExitBottom>
      <FadeInFadeOut
        className="flex h-96 flex-col justify-between"
        show={isOpen}
      >
        <div>
          <h2 className="mb-4 text-center">{t('withdraw')}</h2>
          <div className="grid grid-cols-2 pb-6">
            <div className="col-span-2 flex justify-between">
              <Label text={t('token')} />
              <LinkButton
                className="mb-2 no-underline"
                onClick={() => console.log('Set max input amount')}
              >
                <span className="mr-1 font-normal text-th-fgd-3">
                  {t('available-balance')}
                </span>
                <span className="text-th-fgd-1">0</span>
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
                name="withdraw"
                id="withdraw"
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
          <div className="space-y-2 border-y border-th-bkg-3 py-4">
            <div className="flex justify-between">
              <p>{t('health-impact')}</p>
              <p className="text-th-red">-12%</p>
            </div>
            <div className="flex justify-between">
              <p>{t('withdrawal-value')}</p>
              <p className="text-th-fgd-1">$1,000.00</p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-center">
          <Button
            onClick={handleWithdraw}
            className="flex w-full items-center justify-center"
            size="large"
            disabled={!inputAmount}
          >
            {submitting ? <Loading className="mr-2 h-5 w-5" /> : t('withdraw')}
          </Button>
        </div>
      </FadeInFadeOut>
    </Modal>
  )
}

export default WithdrawModal
