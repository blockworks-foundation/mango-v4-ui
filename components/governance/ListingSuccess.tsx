import { useTranslation } from 'next-i18next'

const ListingSuccess = ({
  proposalPk,
  token,
}: {
  proposalPk: string
  token: string
}) => {
  const { t } = useTranslation(['governance'])
  return (
    <>
      <h2 className="mb-2 text-lg">😎 {t('success')}</h2>
      <p className="mb-6 text-base">
        {t('proposal-listed', { token: token })}{' '}
        <a
          href={`https://dao.mango.markets/dao/MNGO/proposal/${proposalPk}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('view-proposal')}
        </a>
      </p>
      <div className="rounded-lg bg-th-bkg-2 p-6">
        <h2 className="mb-2 text-lg">{t('what-happens-next')}</h2>
        <ol className="list-inside list-decimal space-y-2">
          <li>{t('what-happens-next-1')}</li>
          <li>{t('what-happens-next-2')}</li>
          <li>{t('what-happens-next-3', { token: token })}</li>
        </ol>
        <a
          className="mt-6 inline-block rounded-md bg-th-button px-6 py-3 font-display text-base focus:outline-none md:hover:bg-th-button-hover"
          href={`https://dao.mango.markets/dao/MNGO/proposal/${proposalPk}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('vote-now')}
        </a>
      </div>
    </>
  )
}

export default ListingSuccess
