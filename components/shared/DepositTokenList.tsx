import { useTranslation } from 'next-i18next'
import mangoStore from '../../store/state'
import DepositTokenItem from './DepositTokenItem'
import { FadeInList } from './Transitions'

const DepositTokenList = ({ onSelect }: { onSelect: (x: any) => void }) => {
  const { t } = useTranslation('common')
  const group = mangoStore((s) => s.group)
  const banks = group?.banksMap
    ? Array.from(group?.banksMap, ([key, value]) => ({ key, value }))
    : []
  return (
    <>
      <div className="flex px-4 pb-2">
        <div className="w-1/4">
          <p className="text-xs">{t('token')}</p>
        </div>
        <div className="w-1/4 text-right">
          <p className="text-xs">{t('deposit-rate')}</p>
        </div>
        <div className="w-2/4 text-right">
          <p className="whitespace-nowrap text-xs">{t('wallet-balance')}</p>
        </div>
      </div>
      <div className="space-y-2">
        {banks.map((bank, index) => (
          <FadeInList index={index} key={bank.value.name}>
            <DepositTokenItem bank={bank.value} onSelect={onSelect} />
          </FadeInList>
        ))}
      </div>
    </>
  )
}

export default DepositTokenList
