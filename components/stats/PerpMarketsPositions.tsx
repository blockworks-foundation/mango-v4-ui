import mangoStore from '@store/mangoStore'
import {
  getLargestPerpPositions,
  getClosestToLiquidationPerpPositions,
  // I80F48,
  PerpPosition,
} from '@blockworks-foundation/mango-v4'
import { useEffect, useState } from 'react'
import { PublicKey } from '@solana/web3.js'
import { Table, Td, Th, TrBody, TrHead } from '@components/shared/TableElements'
import TableMarketName from '@components/trade/TableMarketName'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import { floorToDecimal, getDecimalCount } from 'utils/numbers'
import { useTranslation } from 'next-i18next'
import useMangoGroup from 'hooks/useMangoGroup'
import { abbreviateAddress } from 'utils/formatting'
import { ChevronRightIcon, NoSymbolIcon } from '@heroicons/react/20/solid'
import SheenLoader from '@components/shared/SheenLoader'

const PerpMarketsPositions = () => {
  const { t } = useTranslation('stats')
  return (
    <>
      <div className="px-6 pt-6 pb-2">
        <h2 className="text-lg">{t('stats:largest-perp-positions')}</h2>
      </div>
      <LargestPerpPositions />
      <div className="px-6 pt-6 pb-2">
        <h2 className="text-lg">{t('stats:closest-to-liquidation')}</h2>
      </div>
      <ClosestToLiquidation />
    </>
  )
}

export default PerpMarketsPositions

type AccountPosition = {
  mangoAccount: PublicKey
  // pct: I80F48
  perpPosition: PerpPosition
}

const LargestPerpPositions = () => {
  const { t } = useTranslation(['common', 'stats', 'trade'])
  const { group } = useMangoGroup()
  const [positions, setPositions] = useState<AccountPosition[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getLargestOpenPositions = async () => {
      const client = mangoStore.getState().client
      const group = mangoStore.getState().group
      if (!group) return
      try {
        const positions = await getLargestPerpPositions(client, group)
        // await client.getMangoAccount(pk)
        setPositions(positions.slice(0, 5))
      } catch (e) {
        console.log('failed to get largest positions', e)
      } finally {
        setLoading(false)
      }
    }
    if (!positions.length) {
      getLargestOpenPositions()
    }
  }, [positions])

  if (!group) return null

  return positions.length ? (
    <div className="thin-scroll overflow-x-auto">
      <Table>
        <thead>
          <TrHead>
            <Th className="text-left">{t('market')}</Th>
            <Th className="text-right">{t('trade:size')}</Th>
            <Th className="text-right">{t('trade:avg-entry-price')}</Th>
            {/* <Th>
            <div className="flex justify-end">
              <Tooltip content={t('trade:tooltip-est-liq-price')}>
                <span className="tooltip-underline">
                  {t('trade:est-liq-price')}
                </span>
              </Tooltip>
            </div>
          </Th> */}
            <Th className="text-right">{t('trade:unrealized-pnl')}</Th>
            <Th className="text-right">{t('account')}</Th>
          </TrHead>
        </thead>
        <tbody>
          {positions.map(({ perpPosition, mangoAccount }, i) => {
            const market = group.getPerpMarketByMarketIndex(
              perpPosition.marketIndex
            )
            const basePosition = perpPosition.getBasePositionUi(market)

            if (!basePosition) return null

            const floorBasePosition = floorToDecimal(
              basePosition,
              getDecimalCount(market.minOrderSize)
            ).toNumber()

            const isLong = basePosition > 0
            const avgEntryPrice = perpPosition.getAverageEntryPriceUi(market)
            // const unsettledPnl = perpPosition.getUnsettledPnlUi(market)
            // const totalPnl =
            //   perpPosition.cumulativePnlOverPositionLifetimeUi(market)
            const unrealizedPnl = perpPosition.getUnRealizedPnlUi(market)
            // const realizedPnl = perpPosition.getRealizedPnlUi()
            const roe =
              (unrealizedPnl / (Math.abs(basePosition) * avgEntryPrice)) * 100
            // const estLiqPrice = perpPosition.getLiquidationPriceUi(
            //   group,
            //   mangoAccount
            // )

            return (
              <TrBody
                key={`${perpPosition.marketIndex}${basePosition}${i}`}
                className="my-1 p-2"
              >
                <Td>
                  <TableMarketName
                    market={market}
                    side={isLong ? 'buy' : 'sell'}
                  />
                </Td>
                <Td className="text-right font-mono">
                  <div className="flex flex-col items-end space-y-0.5">
                    <FormatNumericValue
                      value={Math.abs(basePosition)}
                      decimals={getDecimalCount(market.minOrderSize)}
                    />
                    <FormatNumericValue
                      classNames="text-xs text-th-fgd-3"
                      value={Math.abs(floorBasePosition) * market._uiPrice}
                      isUsd
                    />
                  </div>
                </Td>
                <Td className="font-mono">
                  <div className="flex flex-col items-end space-y-0.5">
                    <FormatNumericValue
                      value={avgEntryPrice}
                      decimals={getDecimalCount(market.tickSize)}
                      isUsd
                    />
                    <FormatNumericValue
                      classNames="text-xs text-th-fgd-3"
                      value={market.uiPrice}
                      decimals={getDecimalCount(market.tickSize)}
                      isUsd
                    />
                  </div>
                </Td>
                {/* <Td className="text-right font-mono">
                {estLiqPrice ? (
                  <FormatNumericValue
                    value={estLiqPrice}
                    decimals={getDecimalCount(market.tickSize)}
                    isUsd
                  />
                ) : (
                  '–'
                )}
              </Td> */}
                <Td className="text-right font-mono">
                  <div className="flex flex-col items-end space-y-0.5">
                    <span
                      className={`${
                        unrealizedPnl >= 0 ? 'text-th-up' : 'text-th-down'
                      }`}
                    >
                      <FormatNumericValue
                        value={unrealizedPnl}
                        isUsd
                        decimals={2}
                      />
                    </span>
                    <span className={roe >= 0 ? 'text-th-up' : 'text-th-down'}>
                      <FormatNumericValue
                        classNames="text-xs"
                        value={roe}
                        decimals={2}
                      />
                      %{' '}
                      <span className="font-body text-xs text-th-fgd-3">
                        (ROE)
                      </span>
                    </span>
                  </div>
                </Td>
                <Td>
                  <div className="flex items-center justify-end">
                    <a className="flex cursor-pointer items-center text-th-fgd-2">
                      <span className="mr-1">
                        {abbreviateAddress(mangoAccount)}
                      </span>
                      <ChevronRightIcon className="h-5 w-5" />
                    </a>
                  </div>
                </Td>
              </TrBody>
            )
          })}
        </tbody>
      </Table>
    </div>
  ) : loading ? (
    <div className="space-y-1.5">
      {[...Array(5)].map((x, i) => (
        <SheenLoader className="mx-4 flex flex-1 md:mx-6" key={i}>
          <div className="h-16 w-full bg-th-bkg-2" />
        </SheenLoader>
      ))}
    </div>
  ) : (
    <div className="flex flex-col items-center p-8">
      <NoSymbolIcon className="mb-2 h-6 w-6 text-th-fgd-4" />
      <p>{t('stats:no-largest-positions')}</p>
    </div>
  )
}

const ClosestToLiquidation = () => {
  const { t } = useTranslation(['common', 'stats', 'trade'])
  const { group } = useMangoGroup()
  const [positions, setPositions] = useState<AccountPosition[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getClosestToLiquidation = async () => {
      const client = mangoStore.getState().client
      const group = mangoStore.getState().group
      if (!group) return
      try {
        const positions = await getClosestToLiquidationPerpPositions(
          client,
          group
        )
        // await client.getMangoAccount(pk)
        setPositions(positions.slice(0, 5))
      } catch (e) {
        console.log('failed to get closest to liquidation', e)
      } finally {
        setLoading(false)
      }
    }
    if (!positions.length) {
      getClosestToLiquidation()
    }
  }, [positions])

  if (!group) return null

  return positions.length ? (
    <div className="thin-scroll overflow-x-auto">
      <Table>
        <thead>
          <TrHead>
            <Th className="text-left">{t('market')}</Th>
            <Th className="text-right">{t('trade:size')}</Th>
            <Th className="text-right">{t('trade:avg-entry-price')}</Th>
            {/* <Th>
            <div className="flex justify-end">
              <Tooltip content={t('trade:tooltip-est-liq-price')}>
                <span className="tooltip-underline">
                  {t('trade:est-liq-price')}
                </span>
              </Tooltip>
            </div>
          </Th> */}
            <Th className="text-right">{t('trade:unrealized-pnl')}</Th>
            <Th className="text-right">{t('account')}</Th>
          </TrHead>
        </thead>
        <tbody>
          {positions.map(({ perpPosition, mangoAccount }, i) => {
            const market = group.getPerpMarketByMarketIndex(
              perpPosition.marketIndex
            )
            const basePosition = perpPosition.getBasePositionUi(market)

            if (!basePosition) return null

            const floorBasePosition = floorToDecimal(
              basePosition,
              getDecimalCount(market.minOrderSize)
            ).toNumber()

            const isLong = basePosition > 0
            const avgEntryPrice = perpPosition.getAverageEntryPriceUi(market)
            // const unsettledPnl = perpPosition.getUnsettledPnlUi(market)
            // const totalPnl =
            //   perpPosition.cumulativePnlOverPositionLifetimeUi(market)
            const unrealizedPnl = perpPosition.getUnRealizedPnlUi(market)
            // const realizedPnl = perpPosition.getRealizedPnlUi()
            const roe =
              (unrealizedPnl / (Math.abs(basePosition) * avgEntryPrice)) * 100
            // const estLiqPrice = perpPosition.getLiquidationPriceUi(
            //   group,
            //   mangoAccount
            // )

            return (
              <TrBody
                key={`${perpPosition.marketIndex}${basePosition}${i}`}
                className="my-1 p-2"
              >
                <Td>
                  <TableMarketName
                    market={market}
                    side={isLong ? 'buy' : 'sell'}
                  />
                </Td>
                <Td className="text-right font-mono">
                  <div className="flex flex-col items-end space-y-0.5">
                    <FormatNumericValue
                      value={Math.abs(basePosition)}
                      decimals={getDecimalCount(market.minOrderSize)}
                    />
                    <FormatNumericValue
                      classNames="text-xs text-th-fgd-3"
                      value={Math.abs(floorBasePosition) * market._uiPrice}
                      isUsd
                    />
                  </div>
                </Td>
                <Td className="font-mono">
                  <div className="flex flex-col items-end space-y-0.5">
                    <FormatNumericValue
                      value={avgEntryPrice}
                      decimals={getDecimalCount(market.tickSize)}
                      isUsd
                    />
                    <FormatNumericValue
                      classNames="text-xs text-th-fgd-3"
                      value={market.uiPrice}
                      decimals={getDecimalCount(market.tickSize)}
                      isUsd
                    />
                  </div>
                </Td>
                {/* <Td className="text-right font-mono">
                {estLiqPrice ? (
                  <FormatNumericValue
                    value={estLiqPrice}
                    decimals={getDecimalCount(market.tickSize)}
                    isUsd
                  />
                ) : (
                  '–'
                )}
              </Td> */}
                <Td className="text-right font-mono">
                  <div className="flex flex-col items-end space-y-0.5">
                    <span
                      className={`${
                        unrealizedPnl >= 0 ? 'text-th-up' : 'text-th-down'
                      }`}
                    >
                      <FormatNumericValue
                        value={unrealizedPnl}
                        isUsd
                        decimals={2}
                      />
                    </span>
                    <span className={roe >= 0 ? 'text-th-up' : 'text-th-down'}>
                      <FormatNumericValue
                        classNames="text-xs"
                        value={roe}
                        decimals={2}
                      />
                      %{' '}
                      <span className="font-body text-xs text-th-fgd-3">
                        (ROE)
                      </span>
                    </span>
                  </div>
                </Td>
                <Td>
                  <div className="flex items-center justify-end">
                    <a className="flex cursor-pointer items-center text-th-fgd-2">
                      <span className="mr-1">
                        {abbreviateAddress(mangoAccount)}
                      </span>
                      <ChevronRightIcon className="h-5 w-5" />
                    </a>
                  </div>
                </Td>
              </TrBody>
            )
          })}
        </tbody>
      </Table>
    </div>
  ) : loading ? (
    <div className="space-y-1.5">
      {[...Array(5)].map((x, i) => (
        <SheenLoader className="mx-4 flex flex-1 md:mx-6" key={i}>
          <div className="h-16 w-full bg-th-bkg-2" />
        </SheenLoader>
      ))}
    </div>
  ) : (
    <div className="flex flex-col items-center p-8">
      <NoSymbolIcon className="mb-2 h-6 w-6 text-th-fgd-4" />
      <p>{t('stats:no-closest-to-liquidation')}</p>
    </div>
  )
}
