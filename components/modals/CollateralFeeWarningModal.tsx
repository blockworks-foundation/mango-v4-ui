import useCollateralFeePopupConditions from 'hooks/useCollateralFeePositions'
import Modal from '../shared/Modal'
import Button from '@components/shared/Button'
import { useTranslation } from 'react-i18next'
import { Table, Td, Th, TrBody, TrHead } from '@components/shared/TableElements'
import TableTokenName from '@components/shared/TableTokenName'
import useMangoAccount from 'hooks/useMangoAccount'
import useMangoGroup from 'hooks/useMangoGroup'
import { useMemo } from 'react'
import FormatNumericValue from '@components/shared/FormatNumericValue'

type WarningProps = {
  isOpen: boolean
}

const CollateralFeeWarningModal = ({ isOpen }: WarningProps) => {
  const { t } = useTranslation(['account'])
  const { setWasModalOpen, collateralFeeBanks, ltvRatio } =
    useCollateralFeePopupConditions()
  const { mangoAccount } = useMangoAccount()
  const { group } = useMangoGroup()
  const lastCharge = mangoAccount?.lastCollateralFeeCharge.toNumber()
  const collateralFeeInterval = group?.collateralFeeInterval.toNumber()

  const hoursTillNextCharge = useMemo(() => {
    if (!lastCharge || !collateralFeeInterval) return
    const nowInSeconds = Date.now() / 1000
    const timeUntilChargeInSeconds =
      lastCharge + collateralFeeInterval - nowInSeconds
    const timeUntilChargeInHours = timeUntilChargeInSeconds / 3600
    return Math.round(timeUntilChargeInHours * 100) / 100
  }, [lastCharge, collateralFeeInterval])

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setWasModalOpen(true)}
      disableOutsideClose
      hideClose
    >
      <h2 className="mb-2 text-center">
        {t('collateral-funding-modal-heading', {
          remaining_hours: hoursTillNextCharge,
        })}
      </h2>
      <a
        className="mb-6 flex justify-center text-base font-bold focus:outline-none"
        href="https://docs.mango.markets/mango-markets/fees"
        target="_blank"
        rel="noopener noreferrer"
      >
        {t('whats-this')}
      </a>
      <Table>
        <thead>
          <TrHead>
            <Th className="text-left">{t('collateral')}</Th>
            <Th className="text-right">{t('funding-rate')} (APR)</Th>
            <Th>
              <div className="flex justify-end">{t('daily-fee')}</div>
            </Th>
          </TrHead>
        </thead>
        <tbody>
          {collateralFeeBanks.map((b) => {
            const { bank, balance } = b
            const dailyFee = ltvRatio * bank.collateralFeePerDay * balance
            return (
              <TrBody key={bank.name}>
                <Td>
                  <TableTokenName bank={bank} symbol={bank.name} />
                </Td>
                <Td>
                  <p className="text-right">
                    {(ltvRatio * bank.collateralFeePerDay * 365 * 100).toFixed(
                      2,
                    )}
                    %
                  </p>
                </Td>
                <Td>
                  <div className="flex flex-col items-end">
                    <p>
                      <FormatNumericValue value={dailyFee} />
                      <span className="font-body"> {bank.name}</span>
                    </p>
                    <span className="font-mono text-th-fgd-4">
                      $<FormatNumericValue value={dailyFee * bank.uiPrice} />
                    </span>
                  </div>
                </Td>
              </TrBody>
            )
          })}
        </tbody>
      </Table>
      <Button
        className="mt-6 w-full"
        onClick={() => {
          setWasModalOpen(true)
        }}
      >
        {t('okay-got-it')}
      </Button>
    </Modal>
  )
}

export default CollateralFeeWarningModal
