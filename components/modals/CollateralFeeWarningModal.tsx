import useCollateralFeePopupConditions from 'hooks/useCollateralFeePositions'
import Modal from '../shared/Modal'
import Button from '@components/shared/Button'
import { useTranslation } from 'react-i18next'
import { Table, Td, Th, TrBody, TrHead } from '@components/shared/TableElements'
import TableTokenName from '@components/shared/TableTokenName'
import BankAmountWithValue from '@components/shared/BankAmountWithValue'

type WarningProps = {
  isOpen: boolean
}

const CollateralFeeWarningModal = ({ isOpen }: WarningProps) => {
  const { t } = useTranslation(['account'])
  const {
    setWasModalOpen,
    marginPositionBalanceWithBanks,
    collateralFeeBanks,
    ltvRatio,
  } = useCollateralFeePopupConditions()
  console.log(marginPositionBalanceWithBanks)

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setWasModalOpen(true)}
      disableOutsideClose
      hideClose
    >
      <h2 className="mb-2 text-center">
        {t('collateral-funding-modal-heading')}
      </h2>
      <a
        className="mb-6 flex justify-center text-base font-bold"
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
            return (
              <TrBody key={bank.name}>
                <Td>
                  <TableTokenName bank={bank} symbol={bank.name} />
                </Td>
                <Td>
                  <p>
                    {(ltvRatio * bank.collateralFeePerDay * 365 * 100).toFixed(
                      2,
                    )}
                  </p>
                </Td>
                <Td>
                  <div className="flex flex-col items-end">
                    <BankAmountWithValue
                      amount={ltvRatio * bank.collateralFeePerDay * balance}
                      bank={bank}
                      stacked
                    />
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
