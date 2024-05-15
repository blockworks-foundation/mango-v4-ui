import { useTranslation } from 'react-i18next'
import InlineNotification from './InlineNotification'
import Tooltip from './Tooltip'

const UninsuredNotification = ({ name }: { name: string | undefined }) => {
  const { t } = useTranslation(['common', 'account'])
  return (
    <InlineNotification
      type="info"
      desc={
        <>
          <Tooltip
            wrapperClassName="inline"
            content={t('account:tooltip-warning-uninsured', { token: name })}
          >
            <span className="tooltip-underline">
              {t('account:warning-uninsured', {
                token: name,
              })}
            </span>
          </Tooltip>{' '}
          <a
            href="https://docs.mango.markets/mango-markets/socialized-losses"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('learn-more')}
          </a>
        </>
      }
    />
  )
}

export default UninsuredNotification
