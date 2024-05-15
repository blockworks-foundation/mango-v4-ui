import { PerpMarket } from '@blockworks-foundation/mango-v4'
import { IconButton, LinkButton } from '@components/shared/Button'
import { ChartBarIcon, InformationCircleIcon } from '@heroicons/react/20/solid'
import mangoStore from '@store/mangoStore'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { useTranslation } from 'next-i18next'
import { useMemo, useState } from 'react'
import { numberCompacter } from 'utils/numbers'
import MarketSelectDropdown, { CURRENCY_SYMBOLS } from './MarketSelectDropdown'
import PerpFundingRate from './PerpFundingRate'
import SheenLoader from '@components/shared/SheenLoader'
import PerpMarketDetailsModal from '@components/modals/PerpMarketDetailsModal'
import OraclePrice from './OraclePrice'
import SpotMarketDetailsModal from '@components/modals/SpotMarketDetailsModal'
import { MarketData } from 'types'
import MarketChange from '@components/shared/MarketChange'
import useMarketsData from 'hooks/useMarketsData'
import HotKeysDrawerButton from './HotKeysDrawerButton'

const AdvancedMarketHeader = ({
  showChart,
  setShowChart,
}: {
  showChart?: boolean
  setShowChart?: (x: boolean) => void
}) => {
  const { t } = useTranslation(['common', 'trade'])
  const { serumOrPerpMarket, selectedMarket, quoteBank } = useSelectedMarket()
  const selectedMarketName = mangoStore((s) => s.selectedMarket.name)
  const [showMarketDetails, setShowMarketDetails] = useState(false)
  const { data: marketsData, isLoading, isFetching } = useMarketsData()

  const volume = useMemo(() => {
    if (!selectedMarketName || !serumOrPerpMarket || !marketsData) return 0
    if (serumOrPerpMarket instanceof PerpMarket) {
      const perpData: MarketData | null = marketsData?.perpData
      if (!perpData) return 0
      const perpEntries = Object.entries(perpData).find(
        (e) => e[0].toLowerCase() === selectedMarketName.toLowerCase(),
      )
      return perpEntries ? perpEntries[1][0]?.quote_volume_24h : 0
    } else {
      const spotData: MarketData | null = marketsData?.spotData
      if (!spotData) return 0
      const spotEntries = Object.entries(spotData).find(
        (e) => e[0].toLowerCase() === selectedMarketName.toLowerCase(),
      )
      return spotEntries ? spotEntries[1][0]?.quote_volume_24h : 0
    }
  }, [marketsData, selectedMarketName, serumOrPerpMarket])

  const loadingVolume = isLoading || isFetching

  return (
    <>
      <div
        className={`flex flex-col bg-th-bkg-1 md:h-12 md:flex-row md:items-center`}
      >
        <div className="w-full pl-4 md:w-auto md:py-0 md:pl-6 lg:pb-0">
          <MarketSelectDropdown />
        </div>
        <div className="hide-scroll flex w-full items-center justify-between overflow-x-auto border-t border-th-bkg-3 px-5 py-2 md:border-t-0 md:px-0 md:py-0 md:pr-6">
          <div className="flex items-center">
            <>
              <OraclePrice />
            </>
            <div className="ml-6 flex-col whitespace-nowrap">
              <div className="mb-0.5 text-xs text-th-fgd-4">
                {t('rolling-change')}
              </div>
              <MarketChange market={selectedMarket} size="small" />
            </div>
            {serumOrPerpMarket instanceof PerpMarket ? (
              <>
                <div className="ml-6 flex-col whitespace-nowrap text-xs">
                  <div className="mb-0.5 text-th-fgd-4 ">
                    {t('trade:24h-volume')}
                  </div>
                  {loadingVolume ? (
                    <SheenLoader className="mt-0.5">
                      <div className="h-3.5 w-12 bg-th-bkg-2" />
                    </SheenLoader>
                  ) : volume ? (
                    <span className="font-mono">
                      ${numberCompacter.format(volume)}
                    </span>
                  ) : (
                    <span className="font-mono">$0</span>
                  )}
                </div>
                <PerpFundingRate />
                <div className="ml-6 flex-col whitespace-nowrap text-xs">
                  <div className="mb-0.5 text-th-fgd-4 ">
                    {t('trade:open-interest')}
                  </div>
                  <span className="font-mono">
                    $
                    {numberCompacter.format(
                      serumOrPerpMarket.baseLotsToUi(
                        serumOrPerpMarket.openInterest,
                      ) * serumOrPerpMarket.uiPrice,
                    )}
                    <span className="mx-1">|</span>
                    {numberCompacter.format(
                      serumOrPerpMarket.baseLotsToUi(
                        serumOrPerpMarket.openInterest,
                      ),
                    )}{' '}
                    <span className="font-body text-th-fgd-3">
                      {serumOrPerpMarket.name.split('-')[0]}
                    </span>
                  </span>
                </div>
              </>
            ) : (
              <div className="ml-6 flex-col whitespace-nowrap text-xs">
                <div className="mb-0.5 text-th-fgd-4 ">
                  {t('trade:24h-volume')}
                </div>
                {loadingVolume ? (
                  <SheenLoader className="mt-0.5">
                    <div className="h-3.5 w-12 bg-th-bkg-2" />
                  </SheenLoader>
                ) : (
                  <span className="font-mono">
                    {quoteBank?.name === 'USDC' ? '$' : ''}
                    {volume ? numberCompacter.format(volume) : 0}
                    {quoteBank?.name && quoteBank.name !== 'USDC' ? (
                      <span className="font-body text-th-fgd-3">
                        {' '}
                        {CURRENCY_SYMBOLS[quoteBank.name] || quoteBank.name}
                      </span>
                    ) : null}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="ml-6 flex items-center">
            <HotKeysDrawerButton />
            <LinkButton
              className="ml-4 flex items-center whitespace-nowrap text-th-fgd-3"
              onClick={() => setShowMarketDetails(true)}
            >
              <InformationCircleIcon className="h-5 w-5 shrink-0 md:mr-1.5 md:h-4 md:w-4" />
              <span className="hidden text-xs md:inline">
                {t('trade:market-details', { market: '' })}
              </span>
            </LinkButton>
            {setShowChart ? (
              <IconButton
                className={`ml-4 ${
                  showChart ? 'text-th-active' : 'text-th-fgd-2'
                }`}
                onClick={() => setShowChart(!showChart)}
                hideBg
              >
                <ChartBarIcon className="h-5 w-5" />
              </IconButton>
            ) : null}
          </div>
        </div>
      </div>
      {showMarketDetails ? (
        selectedMarket instanceof PerpMarket ? (
          <PerpMarketDetailsModal
            isOpen={showMarketDetails}
            onClose={() => setShowMarketDetails(false)}
            market={selectedMarket}
          />
        ) : (
          <SpotMarketDetailsModal
            isOpen={showMarketDetails}
            onClose={() => setShowMarketDetails(false)}
            market={selectedMarket}
          />
        )
      ) : null}
    </>
  )
}

export default AdvancedMarketHeader
