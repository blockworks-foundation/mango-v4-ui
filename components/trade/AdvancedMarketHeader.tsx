import { Serum3Market } from '@blockworks-foundation/mango-v4'
import PercentageChange from '@components/shared/PercentageChange'
import { Popover } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import mangoStore from '@store/mangoStore'
import { useTranslation } from 'next-i18next'
import { useCallback, useMemo } from 'react'
import { DEFAULT_MARKET_NAME } from 'utils/constants'
import { formatFixedDecimals } from 'utils/numbers'

const MarketSelectDropdown = () => {
  const selectedMarket = mangoStore((s) => s.selectedMarket.current)
  const serumMarkets = mangoStore((s) => s.serumMarkets)
  const set = mangoStore((s) => s.set)

  const handleSelectMarket = useCallback(
    (market: Serum3Market, close: any) => {
      set((s) => {
        s.selectedMarket.current = market
      })
      close()
    },
    [set]
  )

  return (
    <Popover>
      {({ close, open }) => (
        <div className="relative flex flex-col overflow-visible">
          <Popover.Button className="flex w-full items-center hover:text-th-primary">
            <div className="text-xl font-bold md:text-base">
              {selectedMarket?.name || DEFAULT_MARKET_NAME}
            </div>
            <ChevronDownIcon
              className={`${
                open ? 'rotate-180' : 'rotate-360'
              } mt-0.5 ml-2 h-6 w-6 flex-shrink-0 text-th-fgd-3`}
            />
          </Popover.Button>

          <Popover.Panel className="absolute -left-5 top-[46px] z-50 mr-4 w-screen border border-l-0 border-th-bkg-3 bg-th-bkg-1 sm:w-56 md:top-[37px]">
            {serumMarkets?.length
              ? serumMarkets.map((m) => (
                  <div
                    key={m.publicKey.toString()}
                    className="bg-th-bkg-1 py-2 px-4 hover:cursor-pointer hover:bg-th-bkg-2"
                    onClick={() => handleSelectMarket(m, close)}
                  >
                    {m.name}
                  </div>
                ))
              : null}
          </Popover.Panel>
        </div>
      )}
    </Popover>
  )
}

const OraclePrice = () => {
  const group = mangoStore((s) => s.group)
  const selectedMarket = mangoStore((s) => s.selectedMarket.current)

  if (!group || !selectedMarket) return null

  const baseTokenBank = group.getFirstBankByTokenIndex(
    selectedMarket?.baseTokenIndex
  )

  return (
    <div className="font-mono text-xs text-th-fgd-1">
      $
      {baseTokenBank.uiPrice
        ? formatFixedDecimals(baseTokenBank.uiPrice)
        : null}
    </div>
  )
}

const AdvancedMarketHeader = () => {
  const { t } = useTranslation('common')
  const selectedMarket = mangoStore((s) => s.selectedMarket.current)
  const coingeckoPrices = mangoStore((s) => s.coingeckoPrices.data)

  const baseSymbol = useMemo(() => {
    return selectedMarket?.name.split('/')[0]
  }, [selectedMarket])

  const coingeckoData = coingeckoPrices.find((asset) =>
    baseSymbol === 'soETH'
      ? asset.symbol === 'ETH'
      : asset.symbol === baseSymbol
  )

  const change = coingeckoData
    ? ((coingeckoData.prices[coingeckoData.prices.length - 1][1] -
        coingeckoData.prices[0][1]) /
        coingeckoData.prices[0][1]) *
      100
    : 0

  return (
    <div className="flex h-16 items-center bg-th-bkg-1 px-5 md:h-12">
      <div className="md:pr-6 lg:pb-0">
        <div className="flex items-center">
          <MarketSelectDropdown />
        </div>
      </div>
      <div className="ml-6 flex-col">
        <div className="text-xs text-th-fgd-4">{t('oracle-price')}</div>
        <OraclePrice />
      </div>
      <div className="ml-6 flex-col">
        <div className="text-xs text-th-fgd-4">{t('rolling-change')}</div>
        <div
          className={`font-mono text-xs ${
            change < 0 ? 'text-th-red' : 'text-th-gree'
          }`}
        >
          {isNaN(change) ? '0.00' : change.toFixed(2)}%
        </div>
      </div>
    </div>
  )
}

export default AdvancedMarketHeader
