import { Bank } from '@blockworks-foundation/mango-v4'
import { useTranslation } from 'react-i18next'
import { TOKEN_REDUCE_ONLY_OPTIONS } from 'utils/constants'

const TokenReduceOnlyDesc = ({ bank }: { bank: Bank | undefined }) => {
  const { t } = useTranslation('trade')
  const tokenReduceState = bank?.reduceOnly
  return tokenReduceState === TOKEN_REDUCE_ONLY_OPTIONS.DISABLED ? null : (
    <span className="whitespace-nowrap text-xxs leading-none">
      {tokenReduceState === TOKEN_REDUCE_ONLY_OPTIONS.ENABLED ? (
        <span className="text-th-warning">{t('reduce-only')}</span>
      ) : (
        <span className="text-th-fgd-4">{t('no-borrows')}</span>
      )}
    </span>
  )
}

export default TokenReduceOnlyDesc
