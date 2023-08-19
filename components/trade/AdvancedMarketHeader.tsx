import { PerpMarket } from '@blockworks-foundation/mango-v4'
import { IconButton, LinkButton } from '@components/shared/Button'
import { ChartBarIcon, InformationCircleIcon } from '@heroicons/react/20/solid'
import mangoStore from '@store/mangoStore'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { useTranslation } from 'next-i18next'
import { useMemo, useState } from 'react'
import { numberCompacter } from 'utils/numbers'
import MarketSelectDropdown from './MarketSelectDropdown'
import PerpFundingRate from './PerpFundingRate'
import SheenLoader from '@components/shared/SheenLoader'
import PerpMarketDetailsModal from '@components/modals/PerpMarketDetailsModal'
import OraclePrice from './OraclePrice'
import SpotMarketDetailsModal from '@components/modals/SpotMarketDetailsModal'
import { MarketData } from 'types'
import ManualRefresh from '@components/shared/ManualRefresh'
import { useViewport } from 'hooks/useViewport'
import { breakpoints } from 'utils/theme'
import MarketChange from '@components/shared/MarketChange'
import useMarketsData from 'hooks/useMarketsData'

const AdvancedMarketHeader = ({
  showChart,
  setShowChart,
}: {
  showChart?: boolean
  setShowChart?: (x: boolean) => void
}) => {
  const { t } = useTranslation(['common', 'trade'])
  const { serumOrPerpMarket, selectedMarket } = useSelectedMarket()
  const selectedMarketName = mangoStore((s) => s.selectedMarket.name)
  const [showMarketDetails, setShowMarketDetails] = useState(false)
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.md : false
  const { data: marketsData, isLoading, isFetching } = useMarketsData()

  const volume = useMemo(() => {
    if (!selectedMarketName || !serumOrPerpMarket || !marketsData) return 0
    if (serumOrPerpMarket instanceof PerpMarket) {
      const perpData: MarketData = marketsData?.perpData
      const perpEntries = Object.entries(perpData).find(
        (e) => e[0].toLowerCase() === selectedMarketName.toLowerCase(),
      )
      return perpEntries ? perpEntries[1][0]?.quote_volume_24h : 0
    } else {
      const spotData: MarketData = marketsData?.spotData
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
                ) : volume ? (
                  <span className="font-mono">
                    {numberCompacter.format(volume)}{' '}
                    <span className="font-body text-th-fgd-3">
                      {selectedMarketName?.split('/')[1]}
                    </span>
                  </span>
                ) : (
                  <span className="font-mono">
                    0{' '}
                    <span className="font-body text-th-fgd-3">
                      {selectedMarketName?.split('/')[1]}
                    </span>
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="ml-6 flex items-center space-x-4">
            <ManualRefresh
              hideBg={isMobile}
              size={isMobile ? undefined : 'small'}
            />
            <LinkButton
              className="flex items-center whitespace-nowrap text-th-fgd-3"
              onClick={() => setShowMarketDetails(true)}
            >
              <InformationCircleIcon className="h-5 w-5 flex-shrink-0 md:mr-1.5 md:h-4 md:w-4" />
              <span className="hidden text-xs md:inline">
                {t('trade:market-details', { market: '' })}
              </span>
            </LinkButton>
            {setShowChart ? (
              <IconButton
                className={showChart ? 'text-th-active' : 'text-th-fgd-2'}
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
