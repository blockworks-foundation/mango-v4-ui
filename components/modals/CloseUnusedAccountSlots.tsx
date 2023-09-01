import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'
import mangoStore from '@store/mangoStore'
import { useTranslation } from 'next-i18next'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import useMangoAccountAccounts, {
  getAvaialableAccountsColor,
} from 'hooks/useMangoAccountAccounts'
import { notify } from 'utils/notifications'
import { isMangoError } from 'types'
import { PublicKey, TransactionInstruction } from '@solana/web3.js'
import Button from '@components/shared/Button'
import Tooltip from '@components/shared/Tooltip'
import { MAX_ACCOUNTS } from 'utils/constants'
import MarketLogos from '@components/trade/MarketLogos'
import useMangoGroup from 'hooks/useMangoGroup'
import { Disclosure } from '@headlessui/react'

enum CLOSE_TYPE {
  TOKEN,
  PERP,
  SERUMOO,
  PERPOO,
}

const CloseUnusedAccountSlotsModal = ({ isOpen, onClose }: ModalProps) => {
  const { t } = useTranslation(['common', 'settings'])
  const { group } = useMangoGroup()
  const {
    // emptyTokens,
    emptySerum3,
    emptyPerps,
    // emptyPerpOo,
    // totalTokens,
    totalSerum3,
    totalPerps,
    // totalPerpOpenOrders,
  } = useMangoAccountAccounts()

  const handleCloseSlots = async (closeType: CLOSE_TYPE) => {
    const client = mangoStore.getState().client
    const group = mangoStore.getState().group
    const mangoAccount = mangoStore.getState().mangoAccount.current
    const actions = mangoStore.getState().actions
    if (!mangoAccount || !group) return
    try {
      let ixs: TransactionInstruction[] = []
      if (closeType == CLOSE_TYPE.TOKEN) {
        // No instruction yet
      } else if (closeType === CLOSE_TYPE.PERP) {
        ixs = await Promise.all(
          emptyPerps.map((p) =>
            client.perpDeactivatePositionIx(group, mangoAccount, p.marketIndex),
          ),
        )
      } else if (closeType === CLOSE_TYPE.SERUMOO) {
        ixs = await Promise.all(
          emptySerum3.map((s) =>
            client.serum3CloseOpenOrdersIx(
              group,
              mangoAccount,
              new PublicKey(s),
            ),
          ),
        )
      } else if (closeType === CLOSE_TYPE.PERPOO) {
        // No instruction yet
      }

      if (ixs.length === 0) return
      const tx = await client.sendAndConfirmTransaction(ixs)

      notify({
        title: 'Transaction confirmed',
        type: 'success',
        txid: tx.signature,
      })
      await actions.reloadMangoAccount()
    } catch (e) {
      console.error(e)
      if (!isMangoError(e)) return
      notify({
        title: 'Transaction failed',
        description: e.message,
        txid: e?.txid,
        type: 'error',
      })
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <>
        <h2 className="mb-2 text-center">{t('settings:close-unused-slots')}</h2>
        <p className="mb-4 text-center text-xs">
          {t('settings:close-unused-slots-desc')}
        </p>
        {/* <Tooltip content={{t('settings:close-token-desc')}}>
          <Button
            className="mb-4 mt-6 flex w-full items-center justify-center"
            disabled={emptyTokens.length === 0}
            onClick={() => handleCloseSlots(CLOSE_TYPE.TOKEN)}
        > 
            <span className="ml-2">{{t('settings:spot-close-token')}}</span>
        </Button>
          </Tooltip> */}
        <Disclosure>
          {({ open }) => (
            <>
              <Disclosure.Button className="w-full border-t border-th-bkg-3 py-4 md:px-4">
                <div className="flex items-center justify-between">
                  <Tooltip
                    content={t('settings:tooltip-spot-open-orders', {
                      max: MAX_ACCOUNTS.spotOpenOrders,
                    })}
                  >
                    <p className="tooltip-underline mb-2 md:mb-0">
                      {t('settings:spot-open-orders')}
                    </p>
                  </Tooltip>
                  <div className="flex items-center space-x-2">
                    <p className="font-mono">
                      <span
                        className={getAvaialableAccountsColor(
                          emptySerum3.length,
                          totalSerum3.length,
                        )}
                        key="spotOpenOrders"
                      >{`${emptySerum3.length}/${totalSerum3.length}`}</span>
                    </p>
                    <ChevronDownIcon
                      className={`${
                        open ? 'rotate-180' : 'rotate-360'
                      } h-6 w-6 flex-shrink-0 text-th-fgd-3`}
                    />
                  </div>
                </div>
              </Disclosure.Button>
              <Disclosure.Panel className="pb-2 md:px-4">
                {emptySerum3.length && group ? (
                  emptySerum3.map((mkt, i) => {
                    const market = group.getSerum3MarketByMarketIndex(
                      mkt.marketIndex,
                    )
                    return (
                      <div
                        className="mb-2 flex items-center"
                        key={mkt.marketIndex}
                      >
                        <p className="mr-3 text-th-fgd-4">{i + 1}.</p>
                        <MarketLogos market={market} />
                        <p className="text-th-fgd-2">{market.name}</p>
                      </div>
                    )
                  })
                ) : (
                  <p className="mb-2 text-center">
                    {t('notifications:empty-state-title')}...
                  </p>
                )}
                {emptySerum3.length > 0 ? (
                  <Tooltip content={t('settings:close-spot-oo-desc')}>
                    <Button
                      className="mb-4 mt-6 flex w-full items-center justify-center"
                      disabled={emptySerum3.length === 0}
                      onClick={() => handleCloseSlots(CLOSE_TYPE.SERUMOO)}
                    >
                      <span className="ml-2">
                        {t('settings:close-spot-oo')}
                      </span>
                    </Button>
                  </Tooltip>
                ) : null}
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>
        <Disclosure>
          {({ open }) => (
            <>
              <Disclosure.Button className="w-full border-t border-th-bkg-3 py-4 md:px-4">
                <div className="flex items-center justify-between">
                  <Tooltip
                    content={t('settings:tooltip-perp-positions', {
                      max: MAX_ACCOUNTS.perpAccounts,
                    })}
                  >
                    <p className="tooltip-underline mb-2 md:mb-0">
                      {t('settings:perp-positions')}
                    </p>
                  </Tooltip>
                  <div className="flex items-center space-x-2">
                    <p className="font-mono">
                      <span
                        className={getAvaialableAccountsColor(
                          emptyPerps.length,
                          totalPerps.length,
                        )}
                        key="perps"
                      >{`${emptyPerps.length}/${totalPerps.length}`}</span>
                    </p>
                    <ChevronDownIcon
                      className={`${
                        open ? 'rotate-180' : 'rotate-360'
                      } h-6 w-6 flex-shrink-0 text-th-fgd-3`}
                    />
                  </div>
                </div>
              </Disclosure.Button>
              <Disclosure.Panel className="pb-2 md:px-4">
                {emptyPerps.length && group ? (
                  emptyPerps.map((perp, i) => {
                    const market = group.getPerpMarketByMarketIndex(
                      perp.marketIndex,
                    )
                    return (
                      <div
                        className="mb-2 flex items-center"
                        key={perp.marketIndex}
                      >
                        <p className="mr-3 text-th-fgd-4">{i + 1}.</p>
                        <MarketLogos market={market} />
                        <p className="text-th-fgd-2">{market.name}</p>
                      </div>
                    )
                  })
                ) : (
                  <p className="mb-2 text-center">
                    {t('notifications:empty-state-title')}...
                  </p>
                )}
                {emptyPerps.length > 0 ? (
                  <Tooltip content={t('settings:close-perp-desc')}>
                    <Button
                      className="mb-4 mt-6 flex w-full items-center justify-center"
                      disabled={emptyPerps.length === 0}
                      onClick={() => handleCloseSlots(CLOSE_TYPE.PERP)}
                    >
                      <span className="ml-2">{t('settings:close-perp')}</span>
                    </Button>
                  </Tooltip>
                ) : null}
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>
        {/* <Tooltip content={{t('settings:close-perp-desc')}}>
          <Button
            className="mb-4 mt-6 flex w-full items-center justify-center"
            disabled={emptyTokens.length === 0}
            onClick={() => handleCloseSlots(CLOSE_TYPE.TOKEN)}
        > 
            <span className="ml-2">{{t('settings:spot-close-token')}}</span>
        </Button>
          </Tooltip> */}
      </>
    </Modal>
  )
}

export default CloseUnusedAccountSlotsModal
