import { Bank } from '@blockworks-foundation/mango-v4'
import { useTranslation } from 'next-i18next'
import { useMemo } from 'react'
import mangoStore from '../../store/state'
import WithdrawTokenItem from './WithdrawTokenItem'

const WithdrawTokenList = ({ onSelect }: { onSelect: (x: any) => void }) => {
  const { t } = useTranslation('common')
  const group = mangoStore((s) => s.group)
  const mangoAccount = mangoStore((s) => s.mangoAccount.current)
  const banks = group?.banksMap
    ? Array.from(group?.banksMap, ([key, value]) => ({ key, value }))
    : []

  return mangoAccount ? (
    <>
      <div className="grid grid-cols-2 px-4 pb-2">
        <div className="col-span-1">
          <p className="text-xs">{t('token')}</p>
        </div>
        <div className="col-span-1 flex justify-end">
          <p className="text-xs">{t('available-balance')}</p>
        </div>
      </div>
      <div className="space-y-2">
        {banks.map((bank) => (
          <WithdrawTokenItem
            bank={bank.value}
            key={bank.value.name}
            onSelect={onSelect}
          />
        ))}
      </div>
    </>
  ) : null
}

export default WithdrawTokenList
