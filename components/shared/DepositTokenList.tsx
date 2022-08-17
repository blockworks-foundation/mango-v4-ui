import { useTranslation } from 'next-i18next'
import mangoStore from '../../store/state'
import { floorToDecimal } from '../../utils/numbers'
import { walletBalanceForToken } from '../modals/DepositModal'
import DepositTokenItem from './DepositTokenItem'
import { FadeInList } from './Transitions'

const DepositTokenList = ({ onSelect }: { onSelect: (x: any) => void }) => {
  const { t } = useTranslation('common')
  const group = mangoStore((s) => s.group)
  const walletTokens = mangoStore((s) => s.wallet.tokens)

  const banks = group?.banksMap
    ? Array.from(group?.banksMap, ([key, value]) => {
        const walletBalance = walletBalanceForToken(walletTokens, key)
        return {
          key,
          value,
          walletBalance: floorToDecimal(
            walletBalance.maxAmount,
            walletBalance.maxDecimals
          ),
        }
      })
    : []

  return (
    <>
      <div className="flex px-4 pb-2">
        <div className="w-1/5">
          <p className="text-xs">{t('token')}</p>
        </div>
        <div className="w-2/5 text-right">
          <p className="text-xs">{t('deposit-rate')}</p>
        </div>
        <div className="w-2/5 text-right">
          <p className="whitespace-nowrap text-xs">{t('wallet-balance')}</p>
        </div>
      </div>
      <div className="space-y-2">
        {banks
          .sort((a, b) => b.walletBalance - a.walletBalance)
          .map((bank, index) => (
            <FadeInList index={index} key={bank.value.name}>
              <DepositTokenItem
                bank={bank.value}
                onSelect={onSelect}
                walletBalance={bank.walletBalance}
              />
            </FadeInList>
          ))}
      </div>
    </>
  )
}

export default DepositTokenList
