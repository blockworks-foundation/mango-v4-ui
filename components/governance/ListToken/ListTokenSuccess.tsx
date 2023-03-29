import { useTranslation } from 'next-i18next'

const ListTokenSuccess = ({ proposalPk }: { proposalPk: string }) => {
  const { t } = useTranslation(['governance'])
  return (
    <>
      <h3>{t('token-details')}</h3>
      <div>{t('proposal-listed')}</div>
      <div>
        {t('your-proposal-url')}
        {`https://dao.mango.markets/dao/MNGO/proposal/${proposalPk}`}
      </div>
    </>
  )
}

export default ListTokenSuccess
