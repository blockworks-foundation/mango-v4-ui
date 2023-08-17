import { useTranslation } from 'next-i18next'

const SoonBadge = () => {
  const { t } = useTranslation('common')
  return (
    <div className="flex items-center rounded-full border border-th-active px-1.5 py-0.5 text-xxs uppercase leading-none text-th-active">
      {t('soon')}&trade;
    </div>
  )
}

export default SoonBadge
