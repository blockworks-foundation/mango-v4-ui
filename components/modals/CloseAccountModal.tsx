import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'
import mangoStore from '@store/mangoStore'
import { notify } from '../../utils/notifications'
import Button from '../shared/Button'
import { useTranslation } from 'next-i18next'
import { useEffect, useState } from 'react'
import BounceLoader from '../shared/BounceLoader'
import { MangoAccount } from '@blockworks-foundation/mango-v4'
import { TrashIcon } from '@heroicons/react/20/solid'
import useUnsettledPerpPositions from 'hooks/useUnsettledPerpPositions'

const CloseAccountModal = ({ isOpen, onClose }: ModalProps) => {
  const { t } = useTranslation('common')
  const [loading, setLoading] = useState(false)
  const set = mangoStore((s) => s.set)
  const openOrders = Object.values(mangoStore((s) => s.mangoAccount.openOrders))
  const hasOpenOrders =
    openOrders.length && openOrders.filter((x) => x.length).length > 0
  const mangoAccount = mangoStore((s) => s.mangoAccount)
  const perpPositions = mangoStore((s) => s.mangoAccount.perpPositions)
  const openPerpPositions = Object.values(perpPositions).filter((p) =>
    p.basePositionLots.toNumber()
  )
  const group = mangoStore.getState().group
  const unsettledBalances = Object.values(mangoAccount.spotBalances).filter(
    (x) => x.unsettled && x.unsettled > 0
  )
  const unsettledPerpPositions = useUnsettledPerpPositions()
  const [hasBorrows, setHasBorrows] = useState(false)
  const [hasOpenPositions, setHasOpenPositions] = useState(false)

  const handleCloseMangoAccount = async () => {
    const client = mangoStore.getState().client
    const mangoAccount = mangoStore.getState().mangoAccount.current
    const mangoAccounts = mangoStore.getState().mangoAccounts

    if (!mangoAccount || !group) return
    setLoading(true)
    try {
      const tx = await client.closeMangoAccount(group, mangoAccount)
      if (tx) {
        const newMangoAccounts = mangoAccounts.filter(
          (ma) => !ma.publicKey.equals(mangoAccount.publicKey)
        )
        let newCurrentAccount: MangoAccount
        if (newMangoAccounts[0]) {
          newCurrentAccount = await newMangoAccounts[0].reload(client)
        }

        setLoading(false)
        onClose()
        notify({
          title: t('account-closed'),
          type: 'success',
          txid: tx,
        })
        set((state) => {
          state.mangoAccounts = newMangoAccounts
          state.mangoAccount.current = newCurrentAccount
        })
      }
    } catch (e) {
      setLoading(false)
      console.error(e)
    }
  }

  useEffect(() => {
    if (mangoAccount && group) {
      if (
        mangoAccount.current
          ?.tokensActive()
          .filter(
            (token) =>
              token.balanceUi(
                group.getFirstBankByTokenIndex(token.tokenIndex)
              ) < 0
          ).length
      ) {
        console.log(
          mangoAccount.current
            ?.tokensActive()
            .map((token) => ({
              ...token,
              balance: token.balanceUi(
                group.getFirstBankByTokenIndex(token.tokenIndex)
              ),
            }))
        )
        setHasBorrows(true)
      }
      if (openPerpPositions.length || unsettledPerpPositions.length) {
        setHasOpenPositions(true)
      }
    }
  }, [mangoAccount, group])

  const isDisabled =
    hasOpenOrders ||
    hasBorrows ||
    hasOpenPositions ||
    !!unsettledBalances.length
  console.log({
    hasOpenOrders,
    hasBorrows,
    hasOpenPositions,
    unsettle: !!unsettledBalances.length,
  })
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="h-[300px]">
        {loading ? (
          <BounceLoader loadingMessage={t('closing-account')} />
        ) : (
          <div className="flex h-full flex-col justify-between">
            <div className="space-y-4 pb-6">
              <h2 className="mb-1">{t('close-account')}</h2>
              <p>
                You can close your Mango account and recover the small amount
                amount of SOL used to cover rent exemption.{' '}
              </p>
              <p>To close account you must:</p>
              <ul>
                <li>Close all borrows</li>
                <li>Close and settle all Perp positions </li>
                <li>Close all open orders</li>
              </ul>
            </div>
            <Button
              className="w-full"
              disabled={isDisabled}
              onClick={handleCloseMangoAccount}
              size="large"
            >
              <div className="flex items-center justify-center">
                <TrashIcon className="mr-2 h-5 w-5" />
                {t('close-account')}
              </div>
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default CloseAccountModal
