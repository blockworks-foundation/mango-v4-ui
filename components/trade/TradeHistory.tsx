import { PerpMarket } from '@blockworks-foundation/mango-v4'
import { IconButton, LinkButton } from '@components/shared/Button'
import ConnectEmptyState from '@components/shared/ConnectEmptyState'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import SheenLoader from '@components/shared/SheenLoader'
import SideBadge from '@components/shared/SideBadge'
import {
  Table,
  TableDateDisplay,
  Td,
  Th,
  TrBody,
  TrHead,
} from '@components/shared/TableElements'
import Tooltip from '@components/shared/Tooltip'
import { NoSymbolIcon, UsersIcon } from '@heroicons/react/20/solid'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import mangoStore from '@store/mangoStore'
import dayjs from 'dayjs'
import useMangoAccount from 'hooks/useMangoAccount'
import useSelectedMarket from 'hooks/useSelectedMarket'
import useTradeHistory from 'hooks/useTradeHistory'
import { useViewport } from 'hooks/useViewport'
import { useTranslation } from 'next-i18next'
import { PAGINATION_PAGE_LENGTH } from 'utils/constants'
import { abbreviateAddress } from 'utils/formatting'
import { breakpoints } from 'utils/theme'
import MarketLogos from './MarketLogos'
import PerpSideBadge from './PerpSideBadge'
import TableMarketName from './TableMarketName'

const TradeHistory = () => {
  const { t } = useTranslation(['common', 'trade'])
  const group = mangoStore.getState().group
  const { selectedMarket } = useSelectedMarket()
  const { mangoAccountAddress } = useMangoAccount()
  const {
    data: combinedTradeHistory,
    isLoading: loadingTradeHistory,
    fetchNextPage,
  } = useTradeHistory()
  const { width } = useViewport()
  const { connected } = useWallet()
  const showTableView = width ? width > breakpoints.md : false

  if (!selectedMarket || !group) return null

  return mangoAccountAddress &&
    (combinedTradeHistory.length || loadingTradeHistory) ? (
    <>
      {showTableView ? (
        <div className="thin-scroll overflow-x-auto">
          <Table>
            <thead>
              <TrHead>
                <Th className="text-left">{t('market')}</Th>
                <Th className="text-right">{t('trade:size')}</Th>
                <Th className="text-right">{t('price')}</Th>
                <Th className="text-right">{t('value')}</Th>
                <Th className="text-right">{t('fee')}</Th>
                <Th className="text-right">{t('date')}</Th>
                <Th />
              </TrHead>
            </thead>
            <tbody>
              {combinedTradeHistory.map((trade, index: number) => {
                const { side, price, market, size, feeCost, liquidity } = trade
                return (
                  <TrBody
                    key={`${side}${size}${price}${index}`}
                    className="my-1 p-2"
                  >
                    <Td>
                      <TableMarketName market={market} side={side} />
                    </Td>
                    <Td className="text-right font-mono">{size}</Td>
                    <Td className="text-right font-mono">
                      <FormatNumericValue value={price} />
                    </Td>
                    <Td className="text-right font-mono">
                      <FormatNumericValue
                        value={price * size}
                        decimals={2}
                        isUsd
                      />
                    </Td>
                    <Td className="text-right">
                      <span className="font-mono">
                        <FormatNumericValue roundUp value={feeCost} />
                      </span>
                      <p className="font-body text-xs text-th-fgd-4">
                        {liquidity}
                      </p>
                    </Td>
                    <Td className="whitespace-nowrap text-right">
                      {trade?.time ? (
                        <TableDateDisplay date={trade.time} showSeconds />
                      ) : (
                        'Recent'
                      )}
                    </Td>
                    <Td className="xl:!pl-0">
                      {'taker' in trade ? (
                        <div className="flex justify-end">
                          <Tooltip
                            content={`View Counterparty ${abbreviateAddress(
                              trade.liquidity === 'Taker'
                                ? new PublicKey(trade.maker)
                                : new PublicKey(trade.taker)
                            )}`}
                            delay={0}
                          >
                            <a
                              className=""
                              target="_blank"
                              rel="noopener noreferrer"
                              href={`/?address=${
                                trade.liquidity === 'Taker'
                                  ? trade.maker
                                  : trade.taker
                              }`}
                            >
                              <IconButton size="small">
                                <UsersIcon className="h-4 w-4" />
                              </IconButton>
                            </a>
                          </Tooltip>
                        </div>
                      ) : null}
                    </Td>
                  </TrBody>
                )
              })}
            </tbody>
          </Table>
        </div>
      ) : (
        <div>
          {combinedTradeHistory.map((trade, index: number) => {
            const { side, price, market, size, liquidity } = trade
            return (
              <div
                className="flex items-center justify-between border-b border-th-bkg-3 p-4"
                key={`${price}${size}${side}${index}`}
              >
                <div>
                  <p className="text-sm text-th-fgd-1">
                    {dayjs(trade?.time ? trade.time : Date.now()).format(
                      'ddd D MMM'
                    )}
                  </p>
                  <p className="text-xs text-th-fgd-3">
                    {trade?.time ? dayjs(trade.time).format('h:mma') : 'Recent'}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex flex-col items-end">
                    <div className="flex items-center">
                      <MarketLogos market={market} size="small" />
                      <span className="mr-1 whitespace-nowrap">
                        {market.name}
                      </span>
                      {market instanceof PerpMarket ? (
                        <PerpSideBadge basePosition={side === 'buy' ? 1 : -1} />
                      ) : (
                        <SideBadge side={side} />
                      )}
                    </div>
                    <div className="mt-0.5 flex space-x-1 leading-none text-th-fgd-2">
                      <p className="text-th-fgd-4">
                        <span className="font-mono text-th-fgd-2">{size}</span>
                        {' at '}
                        <span className="font-mono text-th-fgd-2">
                          <FormatNumericValue value={price} />
                        </span>
                      </p>
                    </div>
                  </div>
                  {'taker' in trade ? (
                    <a
                      className=""
                      target="_blank"
                      rel="noopener noreferrer"
                      href={`/?address=${
                        liquidity === 'Taker' ? trade.maker : trade.taker
                      }`}
                    >
                      <IconButton size="small">
                        <UsersIcon className="h-4 w-4" />
                      </IconButton>
                    </a>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      )}
      {loadingTradeHistory ? (
        <div className="mt-4 space-y-1.5">
          {[...Array(4)].map((x, i) => (
            <SheenLoader className="mx-4 flex flex-1 md:mx-6" key={i}>
              <div className="h-16 w-full bg-th-bkg-2" />
            </SheenLoader>
          ))}
        </div>
      ) : null}
      {combinedTradeHistory.length &&
      combinedTradeHistory.length % PAGINATION_PAGE_LENGTH === 0 ? (
        <div className="flex justify-center py-6">
          <LinkButton onClick={() => fetchNextPage()}>Show More</LinkButton>
        </div>
      ) : null}
    </>
  ) : mangoAccountAddress || connected ? (
    <div className="flex flex-col items-center p-8">
      <NoSymbolIcon className="mb-2 h-6 w-6 text-th-fgd-4" />
      <p>No trade history</p>
    </div>
  ) : (
    <div className="p-8">
      <ConnectEmptyState text={t('trade:connect-trade-history')} />
    </div>
  )
}

export default TradeHistory
