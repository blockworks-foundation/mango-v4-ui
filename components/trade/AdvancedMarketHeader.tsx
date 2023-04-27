import { Bank, PerpMarket } from '@blockworks-foundation/mango-v4'
import { IconButton, LinkButton } from '@components/shared/Button'
import Change from '@components/shared/Change'
import { getOneDayPerpStats } from '@components/stats/PerpMarketsTable'
import { ChartBarIcon, InformationCircleIcon } from '@heroicons/react/20/solid'
import mangoStore from '@store/mangoStore'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { useTranslation } from 'next-i18next'
import { useEffect, useMemo, useState } from 'react'
import {
  floorToDecimal,
  formatCurrencyValue,
  getDecimalCount,
  numberCompacter,
} from 'utils/numbers'
import MarketSelectDropdown from './MarketSelectDropdown'
import PerpFundingRate from './PerpFundingRate'
import { BorshAccountsCoder } from '@coral-xyz/anchor'
import { useBirdeyeMarketPrices } from 'hooks/useBirdeyeMarketPrices'
import SheenLoader from '@components/shared/SheenLoader'
import usePrevious from '@components/shared/usePrevious'
import PerpMarketDetailsModal from '@components/modals/PerpMarketDetailsModal'
import useMangoGroup from 'hooks/useMangoGroup'

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
    quoteBank,
  } = useSelectedMarket()
  const selectedMarketName = mangoStore((s) => s.selectedMarket.name)
  const connection = mangoStore((s) => s.connection)
  const [price, setPrice] = useState(stalePrice)
  const { data: birdeyePrices, isLoading: loadingPrices } =
    useBirdeyeMarketPrices()
  const previousMarketName = usePrevious(selectedMarketName)
  const [showMarketDetails, setShowMarketDetails] = useState(false)
  const { group } = useMangoGroup()

  //subscribe to the market oracle account
  useEffect(() => {
    const client = mangoStore.getState().client
    const group = mangoStore.getState().group
    if (!group || !selectedMarket) return

    let marketOrBank: PerpMarket | Bank
    let decimals: number
    if (selectedMarket instanceof PerpMarket) {
      marketOrBank = selectedMarket
      decimals = selectedMarket.baseDecimals
    } else {
      const baseBank = group.getFirstBankByTokenIndex(
        selectedMarket.baseTokenIndex
      )
      marketOrBank = baseBank
      decimals = group.getMintDecimals(baseBank.mint)
    }

    const coder = new BorshAccountsCoder(client.program.idl)
    const subId = connection.onAccountChange(
      marketOrBank.oracle,
      async (info, _context) => {
        // selectedMarket = mangoStore.getState().selectedMarket.current
        // if (!(selectedMarket instanceof PerpMarket)) return
        const { price, uiPrice, lastUpdatedSlot } =
          await group.decodePriceFromOracleAi(
            coder,
            marketOrBank.oracle,
            info,
            decimals,
            client
          )
        marketOrBank._price = price
        marketOrBank._uiPrice = uiPrice
        marketOrBank._oracleLastUpdatedSlot = lastUpdatedSlot
        if (selectedMarket instanceof PerpMarket) {
          setPrice(uiPrice)
        } else {
          let price
          if (quoteBank && serumOrPerpMarket) {
            price = floorToDecimal(
              uiPrice / quoteBank.uiPrice,
              getDecimalCount(serumOrPerpMarket.tickSize)
            ).toNumber()
          } else {
            price = 0
          }
          setPrice(price)
        }
      },
      'processed'
    )
    return () => {
      if (typeof subId !== 'undefined') {
        connection.removeAccountChangeListener(subId)
      }
    }
  }, [connection, selectedMarket])

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

  const change = useMemo(() => {
    if (
      !price ||
      !serumOrPerpMarket ||
      selectedMarketName !== previousMarketName
    )
      return 0
    if (serumOrPerpMarket instanceof PerpMarket) {
      const changeData = getOneDayPerpStats(perpStats, selectedMarketName)
      return changeData.length
        ? ((price - changeData[0].price) / changeData[0].price) * 100
        : 0
    } else {
      if (!birdeyeData) return 0
      return (
        ((price - birdeyeData.data[0].value) / birdeyeData.data[0].value) * 100
      )
    }
  }, [
    birdeyeData,
    price,
    serumOrPerpMarket,
    perpStats,
    previousMarketName,
    selectedMarketName,
  ])

  return (
    <>
      <div className="flex flex-col bg-th-bkg-1 md:h-12 md:flex-row md:items-center">
        <div className="w-full pl-4 md:w-auto md:py-0 md:pl-6 lg:pb-0">
          <MarketSelectDropdown />
        </div>
        <div className="hide-scroll flex w-full items-center justify-between overflow-x-auto border-t border-th-bkg-3 py-2 px-5 md:border-t-0 md:py-0 md:px-0 md:pr-6">
          <div className="flex items-center">
            <div
              id="trade-step-two"
              className="flex-col whitespace-nowrap md:ml-6"
            >
              <div className="text-xs text-th-fgd-4">
                {t('trade:oracle-price')}
              </div>
              <div className="font-mono text-xs text-th-fgd-2">
                {price ? (
                  `${formatCurrencyValue(
                    price,
                    getDecimalCount(serumOrPerpMarket?.tickSize || 0.01)
                  )}`
                ) : (
                  <span className="text-th-fgd-4">–</span>
                )}
              </div>
            </div>
            <div className="ml-6 flex-col whitespace-nowrap">
              <div className="text-xs text-th-fgd-4">{t('rolling-change')}</div>
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
                <PerpFundingRate />
                <div className="ml-6 flex-col whitespace-nowrap text-xs">
                  <div className="text-th-fgd-4">
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
            ) : null}
          </div>
          <div className="ml-6 flex items-center space-x-4">
            {selectedMarket instanceof PerpMarket ? (
              <LinkButton
                className="flex items-center whitespace-nowrap text-th-fgd-3"
                onClick={() => setShowMarketDetails(true)}
              >
                <InformationCircleIcon className="h-5 w-5 flex-shrink-0 md:mr-1.5 md:h-4 md:w-4" />
                <span className="hidden text-xs md:inline">
                  {t('trade:market-details', { market: '' })}
                </span>
              </LinkButton>
            ) : null}
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
        <PerpMarketDetailsModal
          isOpen={showMarketDetails}
          onClose={() => setShowMarketDetails(false)}
        />
      ) : null}
    </>
  )
}

export default AdvancedMarketHeader
