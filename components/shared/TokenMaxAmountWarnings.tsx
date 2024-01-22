import { Bank, toUiDecimals } from '@blockworks-foundation/mango-v4'
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
              remaining:
                limit && bank ? toUiDecimals(limit, bank?.mintDecimals) : 0,
            })}
          />
        </div>
      ) : null}
      {vaultFull ? (
        <div className={className}>
          <InlineNotification
            type="error"
            desc={t('warning-deposits-full', { token: bank?.name })}
          />
        </div>
      ) : null}
    </>
  )
}
export default TokenMaxAmountWarnings
