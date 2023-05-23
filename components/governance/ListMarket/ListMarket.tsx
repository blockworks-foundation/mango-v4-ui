import Label from '@components/forms/Label'
import Select from '@components/forms/Select'
import Button from '@components/shared/Button'
import Loading from '@components/shared/Loading'
import { InformationCircleIcon } from '@heroicons/react/20/solid'
import { INSTRUCTION_LAYOUT } from '@project-serum/serum/lib/instructions'
import mangoStore, { CLUSTER } from '@store/mangoStore'
import useMangoGroup from 'hooks/useMangoGroup'
import { useTranslation } from 'next-i18next'
import { useCallback, useState } from 'react'
import { getBestMarket, getOracle } from 'utils/governance/listingTools'

enum VIEWS {
  BASE_TOKEN,
  PROPS,
  SUCCESS,
}

const ListMarket = () => {
  const { t } = useTranslation(['governance'])
  const { group } = useMangoGroup()
  const connection = mangoStore((s) => s.connection)
  const availableTokens = group ? [...group.banksMapByName.keys()] : []

  const [baseToken, setBaseToken] = useState<null | string>(null)
  const [quoteToken, setQuoteToken] = useState<null | string>(null)
  const [loadingMarketProps, setLoadingMarketProps] = useState(false)
  const [currentView, setCurrentView] = useState(VIEWS.BASE_TOKEN)

  const goToPropsPage = async () => {
    await handleGetMarketProps()
    setCurrentView(VIEWS.PROPS)
  }
  const handleGetMarketProps = useCallback(async () => {
    if (!baseToken || !quoteToken || !group) {
      return
    }

    const baseBank = group.banksMapByName.get(baseToken)
    const quoteBank = group.banksMapByName.get(quoteToken)

    if (!baseBank?.length || !quoteBank?.length) {
      return
    }
    setLoadingMarketProps(true)
    const [oraclePk, marketPk] = await Promise.all([
      getOracle({
        baseSymbol: baseToken,
        quoteSymbol: quoteToken,
        connection,
      }),
      getBestMarket({
        baseMint: baseBank[0].mint.toBase58(),
        quoteMint: quoteBank[0].mint.toBase58(),
        cluster: CLUSTER,
        connection,
      }),
    ])
    console.log(oraclePk, marketPk)
    setLoadingMarketProps(false)
  }, [baseToken, quoteToken, connection])

  return (
    <div className="h-full">
      <h1 className="mb-4 flex items-center">{t('new-market-listing')}</h1>
      {currentView === VIEWS.BASE_TOKEN && (
        <div className="mb-6">
          <h2 className="mb-2 text-lg">{t('before-you-list-market')}</h2>
          <ul>
            <li className="mb-2 flex items-center text-base">
              <InformationCircleIcon className="mr-2 h-5 w-5 flex-shrink-0 text-th-fgd-4" />
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
              <InformationCircleIcon className="mr-2 h-5 w-5 flex-shrink-0 text-th-fgd-4" />
              {t('before-listing-4')}
            </li>
          </ul>
          <div>
            <div className="pb-4">
              <Label text={t('base-token')} />
              <Select
                value={baseToken}
                onChange={(token) => setBaseToken(token)}
                className="w-full"
              >
                {availableTokens
                  .filter((x) => x !== quoteToken)
                  .map((token) => (
                    <Select.Option key={token} value={token}>
                      <div className="flex w-full items-center justify-between">
                        {token}
                      </div>
                    </Select.Option>
                  ))}
              </Select>
            </div>
            <div className="pb-4">
              <Label text={t('quote-token')} />
              <Select
                value={quoteToken}
                onChange={(token) => setQuoteToken(token)}
                className="w-full"
              >
                {availableTokens
                  .filter((x) => x !== baseToken)
                  .map((token) => (
                    <Select.Option key={token} value={token}>
                      <div className="flex w-full items-center justify-between">
                        {token}
                      </div>
                    </Select.Option>
                  ))}
              </Select>
            </div>
          </div>
          <div>
            <Button
              className="float-right mt-6 flex w-36 items-center justify-center"
              onClick={goToPropsPage}
              disabled={loadingMarketProps}
              size="large"
            >
              {loadingMarketProps ? (
                <Loading className="w-4"></Loading>
              ) : (
                t('next')
              )}
            </Button>
          </div>
        </div>
      )}
      {currentView === VIEWS.PROPS && <div></div>}
    </div>
  )
}

export default ListMarket
