import { Bank } from 'mango-v4-test-pack'
import InlineNotification from './InlineNotification'
import { useVaultLimits } from '@components/swap/useVaultLimits'
import { useTranslation } from 'react-i18next'

const TokenMaxAmountWarnings = ({
  bank,
  limitNearlyReached,
  className,
}: {
  bank: Bank | undefined
  limitNearlyReached?: boolean
  className?: string
}) => {
  const { t } = useTranslation('common')
  const { limit, vaultFull } = useVaultLimits(bank)
  return (
    <>
      {limitNearlyReached && !vaultFull ? (
        <div className={className}>
          <InlineNotification
            type="warning"
            desc={t('warning-deposits-almost-full', {
              token: bank?.name,
              remaining: limit?.toNumber(),
            })}
          />
        </div>
      ) : null}
      {vaultFull ? (
        <div className={className}>
          <InlineNotification type="error" desc={t('warning-deposits-full')} />
        </div>
      ) : null}
    </>
  )
}
export default TokenMaxAmountWarnings
