import { ActionsMenu } from '@components/TokenList'
import Button from '@components/shared/Button'
import Change from '@components/shared/Change'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import TokenLogo from '@components/shared/TokenLogo'
import { goToTokenPage } from '@components/stats/tokens/TokenOverviewTable'
import { useRouter } from 'next/router'
import { useTranslation } from 'react-i18next'
import { floorToDecimal, numberCompacter } from 'utils/numbers'
import { BankWithMarketData } from './Spot'
import Tooltip from '@components/shared/Tooltip'
import SimpleAreaChart from '@components/shared/SimpleAreaChart'
import { COLORS } from 'styles/colors'
import useThemeWrapper from 'hooks/useThemeWrapper'
import TokenReduceOnlyDesc from '@components/shared/TokenReduceOnlyDesc'
import CollateralWeightDisplay from '@components/shared/CollateralWeightDisplay'
import WatchlistButton from './WatchlistButton'
import TableRatesDisplay from '@components/shared/TableRatesDisplay'
import { LeverageMaxDisplay } from './SpotTable'

const SpotCards = ({ tokens }: { tokens: BankWithMarketData[] }) => {
  const { t } = useTranslation(['common', 'explore', 'trade'])
  const { theme } = useThemeWrapper()
  const router = useRouter()
  return (
    <div className="grid grid-cols-12 gap-4 px-4 py-6 md:px-6 2xl:px-12">
      {tokens.map((token) => {
        const { bank } = token

        const depositRate = bank.getDepositRateUi()
        const borrowRate = bank.getBorrowRateUi()
        const chartData = token?.market?.priceHistory?.length
          ? token.market.priceHistory
              ?.sort((a, b) => a.time - b.time)
              .concat([{ price: bank.uiPrice, time: Date.now() }])
          : []

        const volume = token.market?.marketData?.quote_volume_24h || 0

        const change = token.market?.rollingChange || 0

        const weight = bank.scaledInitAssetWeight(bank.price)
        const leverageFactor = 1 / (1 - weight.toNumber())
        const leverageMax = floorToDecimal(leverageFactor, 1).toNumber()

        return (
          <div
            className="col-span-12 rounded-lg border border-th-bkg-3 p-6 md:col-span-6 xl:col-span-4 2xl:col-span-3"
            key={bank.tokenIndex}
          >
            <div className="mb-4 flex items-center justify-between border-b border-th-bkg-3 pb-4">
              <div className="flex items-center space-x-3">
                <TokenLogo bank={bank} size={32} showRewardsLogo />
                <div>
                  <h3 className="mb-1 text-base leading-none">
                    {bank.name}
                    <span className="ml-1.5">
                      <TokenReduceOnlyDesc bank={bank} />
                    </span>
                  </h3>
                  {bank.uiPrice ? (
                    <div className="flex items-center space-x-3">
                      <span className="font-mono">
                        <FormatNumericValue value={bank.uiPrice} isUsd />
                      </span>
                      {token.market ? (
                        <Change change={change} suffix="%" />
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {chartData.length ? (
                  <div className="h-10 w-20">
                    <SimpleAreaChart
                      color={
                        chartData[0].price <= bank.uiPrice
                          ? COLORS.UP[theme]
                          : COLORS.DOWN[theme]
                      }
                      data={chartData}
                      name={bank.name}
                      xKey="time"
                      yKey="price"
                    />
                  </div>
                ) : null}
                <WatchlistButton tokenIndex={bank.tokenIndex} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="mb-1">{t('trade:24h-volume')}</p>
                <p className="font-mono text-th-fgd-2">
                  {!token.market ? (
                    '–'
                  ) : volume ? (
                    <span>
                      {numberCompacter.format(volume)}{' '}
                      <span className="font-body text-th-fgd-4">USDC</span>
                    </span>
                  ) : (
                    <span>
                      0 <span className="font-body text-th-fgd-4">USDC</span>
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="mb-1">{t('trade:max-leverage')}</p>
                <LeverageMaxDisplay leverageMax={leverageMax} />
              </div>
              <div>
                <Tooltip
                  content={t('tooltip-collateral-weight', { token: bank.name })}
                  placement="top-start"
                >
                  <p className="tooltip-underline mb-1">
                    {t('explore:collateral-weight')}
                  </p>
                </Tooltip>
                <span className="font-mono text-th-fgd-2">
                  <CollateralWeightDisplay bank={bank} />
                </span>
              </div>
              <div>
                <Tooltip
                  content={t('tooltip-interest-rates')}
                  placement="top-start"
                >
                  <p className="tooltip-underline mb-1">{t('rates')}</p>
                </Tooltip>
                <div className="flex space-x-1.5 font-mono">
                  <TableRatesDisplay
                    borrowRate={borrowRate}
                    depositRate={depositRate}
                  />
                </div>
              </div>
              <Button
                className="mt-3"
                onClick={() => goToTokenPage(bank.name.split(' ')[0], router)}
                secondary
              >
                {t('details')}
              </Button>
              <div className="relative mt-3">
                <ActionsMenu bank={bank} showText />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default SpotCards
