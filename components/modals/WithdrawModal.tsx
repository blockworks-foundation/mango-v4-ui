import { ChevronDownIcon } from '@heroicons/react/solid'
import { PublicKey } from '@solana/web3.js'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import { ChangeEvent, useCallback, useMemo, useState } from 'react'

import mangoStore from '../../store/state'
import { ModalProps } from '../../types/modal'
import { notify } from '../../utils/notifications'
import { floorToDecimal } from '../../utils/numbers'
import ActionTokenList from '../account/ActionTokenList'
import ButtonGroup from '../forms/ButtonGroup'
import Input from '../forms/Input'
import Label from '../forms/Label'
import Button, { LinkButton } from '../shared/Button'
import HealthImpact from '../shared/HealthImpact'
import Loading from '../shared/Loading'
import Modal from '../shared/Modal'
import { EnterBottomExitBottom, FadeInFadeOut } from '../shared/Transitions'

interface WithdrawModalProps {
  token?: string
}

type ModalCombinedProps = WithdrawModalProps & ModalProps

function WithdrawModal({ isOpen, onClose }: ModalCombinedProps) {
  const { t } = useTranslation('common')
  const group = mangoStore((s) => s.group)
  const [inputAmount, setInputAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [selectedToken, setSelectedToken] = useState('USDC')
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

  const mangoAccount = mangoStore((s) => s.mangoAccount.current)

  const tokenMax = useMemo(() => {
    if (!bank) return 0
    const amount = mangoAccount?.getTokenBalanceUi(bank)
    return amount ? floorToDecimal(amount, bank.mintDecimals) : 0
  }, [mangoAccount, bank])

  const handleSizePercentage = useCallback(
    (percentage: string) => {
      setSizePercentage(percentage)
      const amount = (Number(percentage) / 100) * (tokenMax || 0)
      setInputAmount(amount.toString())
    },
    [tokenMax]
  )

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

  const banks = useMemo(() => {
    if (mangoAccount) {
      return group?.banksMapByName
        ? Array.from(group?.banksMapByName, ([key, value]) => {
            const accountBalance = mangoAccount?.getTokenBalanceUi(value[0])
            return {
              key,
              value,
              accountBalance: accountBalance ? accountBalance : 0,
            }
          })
        : []
    }
    return []
  }, [mangoAccount, group?.banksMapByName])

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="h-96">
        <EnterBottomExitBottom
          className="absolute bottom-0 left-0 z-20 h-full w-full overflow-auto bg-th-bkg-1 p-6"
          show={showTokenList}
        >
          <h2 className="mb-4 text-center">{t('select-token')}</h2>
          <div className="grid grid-cols-2 px-4 pb-2">
            <div className="col-span-1">
              <p className="text-xs">{t('token')}</p>
            </div>
            <div className="col-span-1 flex justify-end">
              <p className="text-xs">{t('available-balance')}</p>
            </div>
          </div>
          <ActionTokenList
            banks={banks}
            onSelect={handleSelectToken}
            sortByKey="accountBalance"
          />
        </EnterBottomExitBottom>
        <FadeInFadeOut
          className="flex h-full flex-col justify-between"
          show={isOpen}
        >
          <div>
            <h2 className="mb-4 text-center">{t('withdraw')}</h2>
            <div className="grid grid-cols-2 pb-6">
              <div className="col-span-2 flex justify-between">
                <Label text={t('token')} />
                <LinkButton
                  className="mb-2 no-underline"
                  onClick={() => handleSizePercentage('100')}
                >
                  <span className="mr-1 font-normal text-th-fgd-3">
                    {t('available-balance')}
                  </span>
                  <span className="text-th-fgd-1 underline">{tokenMax}</span>
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
            <HealthImpact
              mintPk={bank!.mint}
              uiAmount={parseFloat(inputAmount)}
            />
          </div>
          <div className="mt-4 flex justify-center">
            <Button
              onClick={handleWithdraw}
              className="flex w-full items-center justify-center"
              size="large"
              disabled={!inputAmount}
            >
              {submitting ? (
                <Loading className="mr-2 h-5 w-5" />
              ) : (
                t('withdraw')
              )}
            </Button>
          </div>
        </FadeInFadeOut>
      </div>
    </Modal>
  )
}

export default WithdrawModal
