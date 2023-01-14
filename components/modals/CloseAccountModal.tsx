import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'
import mangoStore from '@store/mangoStore'
import { notify } from '../../utils/notifications'
import Button from '../shared/Button'
import { useTranslation } from 'next-i18next'
import { useCallback, useEffect, useState } from 'react'
import BounceLoader from '../shared/BounceLoader'
import {
  MangoAccount,
  TokenPosition,
  toUiDecimalsForQuote,
} from '@blockworks-foundation/mango-v4'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  TrashIcon,
} from '@heroicons/react/20/solid'
import useUnsettledPerpPositions from 'hooks/useUnsettledPerpPositions'
import { getMultipleAccounts } from '@project-serum/anchor/dist/cjs/utils/rpc'
import { formatFixedDecimals } from 'utils/numbers'

const CloseAccountModal = ({ isOpen, onClose }: ModalProps) => {
  const { t } = useTranslation(['close-account'])
  const [loading, setLoading] = useState(false)
  const set = mangoStore((s) => s.set)
  const openOrders = Object.values(mangoStore((s) => s.mangoAccount.openOrders))
  const connection = mangoStore.getState().connection
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
  const [totalAccountSOL, setTotalAccountSOL] = useState(0)

  const handleCloseMangoAccount = async () => {
    const client = mangoStore.getState().client
    const mangoAccount = mangoStore.getState().mangoAccount.current
    const mangoAccounts = mangoStore.getState().mangoAccounts

    if (!mangoAccount || !group) return
    setLoading(true)
    try {
      const tx = await client.emptyAndCloseMangoAccount(group, mangoAccount)
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

  const fetchTotalAccountSOL = useCallback(async () => {
    if (!mangoAccount) {
      return
    }
    const accountKeys = [
      mangoAccount.current!.publicKey,
      ...mangoAccount.openOrderAccounts.map((x) => x.address),
    ]
    const accounts = await getMultipleAccounts(connection, accountKeys)
    const lamports =
      accounts.reduce((total, account) => {
        return total + account!.account.lamports
      }, 0) * 0.000000001

    setTotalAccountSOL(lamports)
  }, [mangoAccount])

  useEffect(() => {
    if (mangoAccount && group) {
      if (
        mangoAccount.current
          ?.tokensActive()
          .filter(
            (token: TokenPosition) =>
              token.balanceUi(
                group.getFirstBankByTokenIndex(token.tokenIndex)
              ) < 0
          ).length
      ) {
        setHasBorrows(true)
      }
      if (openPerpPositions.length || unsettledPerpPositions.length) {
        setHasOpenPositions(true)
      }
      fetchTotalAccountSOL()
    }
  }, [mangoAccount, group])

  const isDisabled =
    hasOpenOrders ||
    hasBorrows ||
    hasOpenPositions ||
    !!unsettledBalances.length
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="h-[550px]">
        {loading ? (
          <BounceLoader loadingMessage={t('closing-account')} />
        ) : (
          <div className="flex h-full flex-col justify-between">
            <div className="space-y-4">
              <h2 className="mb-1">{t('close-account')}</h2>
              <p>{t('description')}</p>
              <p>{t('you-must')}:</p>
              <div className="overflow-none space-y-2 rounded-md bg-th-bkg-4 p-2 sm:p-4">
                <div className="flex items-center text-th-fgd-2">
                  {hasBorrows ? (
                    <ExclamationCircleIcon className="mr-1.5 h-4 w-4 text-th-down" />
                  ) : (
                    <CheckCircleIcon className="mr-1.5 h-4 w-4 text-th-success"></CheckCircleIcon>
                  )}
                  {t('close-all-borrows')}
                </div>
                <div className="flex items-center text-th-fgd-2">
                  {hasOpenPositions ? (
                    <ExclamationCircleIcon className="mr-1.5 h-4 w-4 text-th-down" />
                  ) : (
                    <CheckCircleIcon className="mr-1.5 h-4 w-4 text-th-success"></CheckCircleIcon>
                  )}
                  {t('close-perp-positions')}
                </div>
                <div className="flex items-center text-th-fgd-2">
                  {hasOpenOrders ? (
                    <ExclamationCircleIcon className="mr-1.5 h-4 w-4 text-th-down" />
                  ) : (
                    <CheckCircleIcon className="mr-1.5 h-4 w-4 text-th-success"></CheckCircleIcon>
                  )}
                  {t('close-open-orders')}
                </div>
                <div className="flex items-center text-th-fgd-2">
                  {unsettledBalances.length ? (
                    <ExclamationCircleIcon className="mr-1.5 h-4 w-4 text-th-down" />
                  ) : (
                    <CheckCircleIcon className="mr-1.5 h-4 w-4 text-th-success"></CheckCircleIcon>
                  )}
                  {t('settle-balances')}
                </div>
              </div>
              <p>By closing your account you will:</p>
              <div className="overflow-none space-y-2 rounded-md bg-th-bkg-4 p-2 sm:p-4">
                <div className="flex items-center text-th-fgd-2">
                  <CheckCircleIcon className="mr-1.5 h-4 w-4 text-th-success"></CheckCircleIcon>
                  {t('delete-your-account')}
                </div>
                <div className="flex items-center text-th-fgd-2">
                  <CheckCircleIcon className="mr-1.5 h-4 w-4 text-th-success"></CheckCircleIcon>
                  {t('withdraw-assets-worth', {
                    value:
                      mangoAccount && group
                        ? formatFixedDecimals(
                            toUiDecimalsForQuote(
                              mangoAccount!.current!.getEquity(group).toNumber()
                            ),
                            false,
                            true
                          )
                        : 0,
                  })}
                </div>
                <div className="flex items-center text-th-fgd-2">
                  <CheckCircleIcon className="mr-1.5 h-4 w-4 text-th-success"></CheckCircleIcon>
                  {t('recover-x-sol', {
                    amount: totalAccountSOL.toFixed(3),
                  })}
                </div>
              </div>
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
