import dynamic from 'next/dynamic'
import GovernancePageWrapper from './GovernancePageWrapper'
import { useState } from 'react'
import Button from '@components/shared/Button'
import ListMarket from './ListMarket/ListMarket'
import { useTranslation } from 'next-i18next'
import { InformationCircleIcon } from '@heroicons/react/20/solid'
import { useWallet } from '@solana/wallet-adapter-react'
import ConnectEmptyState from '@components/shared/ConnectEmptyState'

const ListToken = dynamic(() => import('./ListToken/ListToken'))

enum LIST_OPTIONS {
  MARKET,
  TOKEN,
}

const BUTTON_WRAPPER_CLASSES =
  'col-span-2 rounded-lg border border-th-bkg-3 md:col-span-1 p-6'

const ListMarketOrTokenPage = () => {
  const { t } = useTranslation(['governance'])
  const { connected } = useWallet()
  const [listOptions, setListOption] = useState<LIST_OPTIONS | null>(null)

  return (
    <div className="min-h-[calc(100vh-64px)] p-8 pb-20 md:pb-16 lg:p-10">
      <GovernancePageWrapper>
        {listOptions === LIST_OPTIONS.MARKET ? (
          <ListMarket goBack={() => setListOption(null)} />
        ) : listOptions === LIST_OPTIONS.TOKEN ? (
          <ListToken goBack={() => setListOption(null)} />
        ) : (
          <>
            <h1 className="mb-4 flex items-center">{t('new-listing')}</h1>
            <ul className="mb-6">
              <li className="mb-2 flex items-center text-base">
                <InformationCircleIcon className="mr-2 h-5 w-5 shrink-0 text-th-fgd-4" />
                <span>
                  {t('before-listing-1')}{' '}
                  <a
                    href="https://dao.mango.markets"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {t('mango-governance')}
                  </a>
                </span>
              </li>
              <li className="mb-2 flex items-center text-base">
                <InformationCircleIcon className="mr-2 h-5 w-5 shrink-0 text-th-fgd-4" />
                {t('before-listing-3')}
              </li>
              <li className="mb-2 flex items-center text-base">
                <InformationCircleIcon className="mr-2 h-5 w-5 shrink-0 text-th-fgd-4" />
                {t('before-listing-4')}
              </li>
            </ul>
            {connected ? (
              <div className="grid-row-2 grid gap-6">
                <div className={BUTTON_WRAPPER_CLASSES}>
                  <img
                    src="/images/list-token.png"
                    className="mb-2 h-10 w-auto"
                  />
                  <h2 className="mb-2">{t('list-token')}</h2>
                  <p className="mb-4">{t('list-token-desc')}</p>
                  <Button onClick={() => setListOption(LIST_OPTIONS.TOKEN)}>
                    {t('list-token')}
                  </Button>
                </div>
                <div className={BUTTON_WRAPPER_CLASSES}>
                  <img
                    src="/images/list-market.png"
                    className="mb-2 h-10 w-auto"
                  />
                  <h2 className="mb-2">{t('list-spot-market')}</h2>
                  <p className="mb-4">{t('list-spot-market-desc')}</p>
                  <Button onClick={() => setListOption(LIST_OPTIONS.MARKET)}>
                    {t('list-spot-market')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-th-bkg-3 p-6">
                <ConnectEmptyState text={t('connect-to-list')} />
              </div>
            )}
          </>
        )}
      </GovernancePageWrapper>
    </div>
  )
}
export default ListMarketOrTokenPage
