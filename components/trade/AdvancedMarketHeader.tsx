import { PerpMarket, Serum3Market } from '@blockworks-foundation/mango-v4'
import { IconButton, LinkButton } from '@components/shared/Button'
import Change from '@components/shared/Change'
import { getOneDayPerpStats } from '@components/stats/PerpMarketsOverviewTable'
import { ChartBarIcon, InformationCircleIcon } from '@heroicons/react/20/solid'
import mangoStore from '@store/mangoStore'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { useTranslation } from 'next-i18next'
import { useEffect, useMemo, useState } from 'react'
import { numberCompacter } from 'utils/numbers'
import MarketSelectDropdown from './MarketSelectDropdown'
import PerpFundingRate from './PerpFundingRate'
import { useBirdeyeMarketPrices } from 'hooks/useBirdeyeMarketPrices'
import SheenLoader from '@components/shared/SheenLoader'
import usePrevious from '@components/shared/usePrevious'
import PerpMarketDetailsModal from '@components/modals/PerpMarketDetailsModal'
import useMangoGroup from 'hooks/useMangoGroup'
import OraclePrice from './OraclePrice'
import SpotMarketDetailsModal from '@components/modals/SpotMarketDetailsModal'
import { useQuery } from '@tanstack/react-query'
import { MANGO_DATA_OPENBOOK_URL } from 'utils/constants'
import { TickerData } from 'types'

export const fetchSpotVolume = async () => {
  try {
    const data = await fetch(`${MANGO_DATA_OPENBOOK_URL}/coingecko/tickers`)
    const res = await data.json()
    return res
  } catch (e) {
    console.log('Failed to fetch spot volume data', e)
  }
}

const AdvancedMarketHeader = ({
  showChart,
  setShowChart,
}: {
  showChart?: boolean
  setShowChart?: (x: boolean) => void
}) => {
  const { t } = useTranslation(['common', 'trade'])
  const perpStats = mangoStore((s) => s.perpStats.data)
  const loadingPerpStats = mangoStore((s) => s.perpStats.loading)
  const {
    serumOrPerpMarket,
    price: stalePrice,
    selectedMarket,
  } = useSelectedMarket()
  const selectedMarketName = mangoStore((s) => s.selectedMarket.name)
  const [changePrice, setChangePrice] = useState(stalePrice)
  const { data: birdeyePrices, isLoading: loadingPrices } =
    useBirdeyeMarketPrices()
  const previousMarketName = usePrevious(selectedMarketName)
  const [showMarketDetails, setShowMarketDetails] = useState(false)
  const { group } = useMangoGroup()

  const {
    data: spotVolumeData,
    isLoading: loadingSpotVolume,
    isFetching: fetchingSpotVolume,
  } = useQuery(['spot-volume', selectedMarketName], () => fetchSpotVolume(), {
    cacheTime: 1000 * 60 * 10,
    staleTime: 1000 * 60,
    retry: 3,
    refetchOnWindowFocus: false,
    enabled: selectedMarket instanceof Serum3Market,
  })

  const spotMarketVolume = useMemo(() => {
    if (!spotVolumeData || !spotVolumeData.length) return
    return spotVolumeData.find(
      (mkt: TickerData) => mkt.ticker_id === selectedMarketName
    )
  }, [selectedMarketName, spotVolumeData])

  useEffect(() => {
    if (group) {
      const actions = mangoStore.getState().actions
      actions.fetchPerpStats()
    }
  }, [group])

  const birdeyeData = useMemo(() => {
    if (
      !birdeyePrices?.length ||
      !selectedMarket ||
      selectedMarket instanceof PerpMarket
    )
      return
    return birdeyePrices.find(
      (m) => m.mint === selectedMarket.serumMarketExternal.toString()
    )
  }, [birdeyePrices, selectedMarket])

  const oneDayPerpStats = useMemo(() => {
    if (
      !perpStats ||
      !perpStats.length ||
      !selectedMarketName ||
      !selectedMarketName.includes('PERP')
    )
      return []
    return getOneDayPerpStats(perpStats, selectedMarketName)
  }, [perpStats, selectedMarketName])

  const change = useMemo(() => {
    if (
      !changePrice ||
      !serumOrPerpMarket ||
      selectedMarketName !== previousMarketName
    )
      return 0
    if (serumOrPerpMarket instanceof PerpMarket) {
      return oneDayPerpStats.length
        ? ((changePrice - oneDayPerpStats[0].price) /
            oneDayPerpStats[0].price) *
            100
        : 0
    } else {
      if (!birdeyeData) return 0
      return (
        ((changePrice - birdeyeData.data[0].value) /
          birdeyeData.data[0].value) *
        100
      )
    }
  }, [
    birdeyeData,
    changePrice,
    serumOrPerpMarket,
    oneDayPerpStats,
    previousMarketName,
    selectedMarketName,
  ])

  // const perpVolume = useMemo(() => {
  //   if (!oneDayPerpStats.length) return
  //   return oneDayPerpStats.reduce((a, c) => a + c.quote_volume, 0)
  // }, [oneDayPerpStats])

  return (
    <>
      <div className="flex flex-col bg-th-bkg-1 md:h-12 md:flex-row md:items-center">
        <div className="w-full pl-4 md:w-auto md:py-0 md:pl-6 lg:pb-0">
          <MarketSelectDropdown />
        </div>
        <div className="hide-scroll flex w-full items-center justify-between overflow-x-auto border-t border-th-bkg-3 py-2 px-5 md:border-t-0 md:py-0 md:px-0 md:pr-6">
          <div className="flex items-center">
            <>
              <OraclePrice setChangePrice={setChangePrice} />
            </>
            <div className="ml-6 flex-col whitespace-nowrap">
              <div className="mb-0.5 text-xs text-th-fgd-4">
                {t('rolling-change')}
              </div>
              {!loadingPrices && !loadingPerpStats ? (
                <Change change={change} size="small" suffix="%" />
              ) : (
                <SheenLoader className="mt-0.5">
                  <div className="h-3.5 w-12 bg-th-bkg-2" />
                </SheenLoader>
              )}
            </div>
            {serumOrPerpMarket instanceof PerpMarket ? (
              <>
                {/* <div className="ml-6 flex-col whitespace-nowrap text-xs">
                  <div className="mb-0.5 text-th-fgd-4 ">
                    {t('trade:24h-volume')}
                  </div>
                  {perpVolume ? (
                    <span className="font-mono">
                      ${numberCompacter.format(perpVolume)}{' '}
                    </span>
                  ) : (
                    '-'
                  )}
                </div> */}
                <PerpFundingRate />
                <div className="ml-6 flex-col whitespace-nowrap text-xs">
                  <div className="mb-0.5 text-th-fgd-4 ">
                    {t('trade:open-interest')}
                  </div>
                  <span className="font-mono">
                    $
                    {numberCompacter.format(
                      serumOrPerpMarket.baseLotsToUi(
                        serumOrPerpMarket.openInterest
                      ) * serumOrPerpMarket.uiPrice
                    )}
                    <span className="mx-1">|</span>
                    {numberCompacter.format(
                      serumOrPerpMarket.baseLotsToUi(
                        serumOrPerpMarket.openInterest
                      )
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
                {!loadingSpotVolume && !fetchingSpotVolume ? (
                  spotMarketVolume ? (
                    <span className="font-mono">
                      {numberCompacter.format(spotMarketVolume.target_volume)}{' '}
                      <span className="font-body text-th-fgd-3">
                        {selectedMarketName.split('/')[1]}
                      </span>
                    </span>
                  ) : (
                    '-'
                  )
                ) : (
                  <SheenLoader className="mt-0.5">
                    <div className="h-3.5 w-12 bg-th-bkg-2" />
                  </SheenLoader>
                )}
              </div>
            )}
          </div>
          <div className="ml-6 flex items-center space-x-4">
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
