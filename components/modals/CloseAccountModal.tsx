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
import { ExclamationCircleIcon, TrashIcon } from '@heroicons/react/20/solid'
import useUnsettledPerpPositions from 'hooks/useUnsettledPerpPositions'
import { getMultipleAccounts } from '@project-serum/anchor/dist/cjs/utils/rpc'
import { formatCurrencyValue } from 'utils/numbers'
import TopBarStore from '@store/topBarStore'

const CloseAccountModal = ({ isOpen, onClose }: ModalProps) => {
  const { t } = useTranslation(['close-account'])
  const [loading, setLoading] = useState(false)
  const set = mangoStore((s) => s.set)
  const { setShowSettingsModal } = TopBarStore()
  const openOrders = Object.values(mangoStore((s) => s.mangoAccount.openOrders))
  const connection = mangoStore.getState().connection
  const hasOpenOrders =
    openOrders.length && openOrders.filter((x) => x.length).length > 0
  const mangoAccount = mangoStore((s) => s.mangoAccount)
  const perpPositions = mangoStore((s) => s.mangoAccount.perpPositions)
  const openPerpPositions = Object.values(perpPositions).filter((p) =>
    p.basePositionLots.toNumber(),
  )
  const group = mangoStore.getState().group
  const unsettledBalances = Object.values(mangoAccount.spotBalances).filter(
    (x) => x.unsettled && x.unsettled > 0,
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
      const { signature: tx } = await client.emptyAndCloseMangoAccount(
        group,
        mangoAccount,
      )
      if (tx) {
        const newMangoAccounts = mangoAccounts.filter(
          (ma) => !ma.publicKey.equals(mangoAccount.publicKey),
        )
        let newCurrentAccount: MangoAccount
        if (newMangoAccounts[0]) {
          newCurrentAccount = await newMangoAccounts[0].reload(client)
        }

        setLoading(false)
        onClose()
        setShowSettingsModal(false)
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
    if (!mangoAccount?.current) {
      return
    }
    const accountKeys = [
      mangoAccount.current!.publicKey,
      ...mangoAccount.openOrderAccounts.map((x) => x.address),
    ]
    const accounts = await getMultipleAccounts(connection, accountKeys)
    const lamports =
      accounts.reduce((total, account) => {
        return total + (account?.account.lamports || 0)
      }, 0) * 0.000000001

    setTotalAccountSOL(lamports)
  }, [mangoAccount])

  useEffect(() => {
    if (mangoAccount && group) {
      if (
        mangoAccount.current
          ?.tokensActive()
          .filter((token: TokenPosition) =>
            token
              .balance(group.getFirstBankByTokenIndex(token.tokenIndex))
              .isNeg(),
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
      <div className="h-[268px]">
        {loading ? (
          <BounceLoader loadingMessage={t('closing-account')} />
        ) : (
          <div className="flex h-full flex-col justify-between">
            <div>
              <h2 className="mb-2">{t('close-account')}</h2>
              {!isDisabled ? (
                <>
                  <p className="mb-3">{t('are-you-sure')}:</p>
                  <ol className="list-inside list-decimal space-y-1.5 border-y border-th-bkg-3 py-3 text-left">
                    <li>{t('delete-your-account')}</li>
                    <li>
                      {t('withdraw-assets-worth', {
                        value:
                          mangoAccount && group
                            ? formatCurrencyValue(
                                toUiDecimalsForQuote(
                                  mangoAccount!.current!.getEquity(group),
                                ),
                              )
                            : 0,
                      })}
                    </li>
                    <li>
                      {t('recover-x-sol', {
                        amount: totalAccountSOL.toFixed(4),
                      })}
                    </li>
                  </ol>
                </>
              ) : (
                <>
                  <p className="mb-3">{t('you-must')}:</p>
                  <div className="space-y-1.5 border-y border-th-bkg-3 py-3">
                    {hasBorrows ? (
                      <div className="flex items-center">
                        <ExclamationCircleIcon className="mr-1.5 h-5 w-5 text-th-down" />
                        <p>{t('close-all-borrows')}</p>
                      </div>
                    ) : null}
                    {hasOpenPositions ? (
                      <div className="flex items-center">
                        <ExclamationCircleIcon className="mr-1.5 h-5 w-5 text-th-down" />
                        <p>{t('close-perp-positions')}</p>
                      </div>
                    ) : null}
                    {hasOpenOrders ? (
                      <div className="flex items-center">
                        <ExclamationCircleIcon className="mr-1.5 h-5 w-5 text-th-down" />
                        <p>{t('close-open-orders')}</p>
                      </div>
                    ) : null}
                    {unsettledBalances.length ? (
                      <div className="flex items-center">
                        <ExclamationCircleIcon className="mr-1.5 h-5 w-5 text-th-down" />
                        <p>{t('settle-balances')}</p>
                      </div>
                    ) : null}
                  </div>
                </>
              )}
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
