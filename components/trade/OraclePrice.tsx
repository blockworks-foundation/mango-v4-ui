import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import useSelectedMarket from 'hooks/useSelectedMarket'
import Tooltip from '@components/shared/Tooltip'
import { useTranslation } from 'next-i18next'
import mangoStore from '@store/mangoStore'
import { useEffect, useState } from 'react'
import { PerpMarket, Bank } from '@blockworks-foundation/mango-v4'
import { BorshAccountsCoder } from '@coral-xyz/anchor'
import {
  floorToDecimal,
  formatNumericValue,
  getDecimalCount,
} from 'utils/numbers'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import relativeTime from 'dayjs/plugin/relativeTime'
import useOracleProvider from 'hooks/useOracleProvider'
import { CURRENCY_SYMBOLS } from './MarketSelectDropdown'
import OracleProvider from '@components/shared/OracleProvider'

const OraclePrice = () => {
  const {
    serumOrPerpMarket,
    price: stalePrice,
    selectedMarket,
    quoteBank,
  } = useSelectedMarket()
  dayjs.extend(duration)
  dayjs.extend(relativeTime)

  const connection = mangoStore((s) => s.connection)
  const [price, setPrice] = useState(stalePrice)
  const [oracleLastUpdatedSlot, setOracleLastUpdatedSlot] = useState(0)
  const [highestSlot, setHighestSlot] = useState(0)
  const [isStale, setIsStale] = useState(false)
  const { oracleProvider } = useOracleProvider()

  const { t } = useTranslation(['common', 'trade'])

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
        selectedMarket.baseTokenIndex,
      )
      marketOrBank = baseBank
      decimals = group.getMintDecimals(baseBank.mint)
    }

    const coder = new BorshAccountsCoder(client.program.idl)
    setPrice(stalePrice)
    const subId = connection.onAccountChange(
      marketOrBank.oracle,
      async (info, context) => {
        const { price, uiPrice, lastUpdatedSlot } =
          await group.decodePriceFromOracleAi(
            coder,
            marketOrBank.oracle,
            info,
            decimals,
            client,
          )
        marketOrBank._price = price
        marketOrBank._uiPrice = uiPrice
        marketOrBank._oracleLastUpdatedSlot = lastUpdatedSlot
        setOracleLastUpdatedSlot(lastUpdatedSlot)

        const marketSlot = mangoStore.getState().selectedMarket.lastSeenSlot
        const oracleWriteSlot = context.slot
        const accountSlot = mangoStore.getState().mangoAccount.lastSlot
        const highestSlot = Math.max(
          marketSlot.bids,
          marketSlot.asks,
          oracleWriteSlot,
          accountSlot,
        )
        const maxStalenessSlots =
          marketOrBank.oracleConfig.maxStalenessSlots.toNumber()
        setHighestSlot(highestSlot)
        setIsStale(
          maxStalenessSlots > 0 &&
            highestSlot - lastUpdatedSlot > maxStalenessSlots,
        )

        if (selectedMarket instanceof PerpMarket) {
          setPrice(uiPrice)
        } else {
          let price
          if (quoteBank && serumOrPerpMarket) {
            price = floorToDecimal(
              uiPrice / quoteBank.uiPrice,
              getDecimalCount(serumOrPerpMarket.tickSize),
            ).toNumber()
          } else {
            price = 0
          }
          setPrice(price)
        }
      },
      'processed',
    )
    return () => {
      if (typeof subId !== 'undefined') {
        connection.removeAccountChangeListener(subId)
      }
    }
  }, [connection, selectedMarket, serumOrPerpMarket, quoteBank, stalePrice])

  const oracleDecimals = getDecimalCount(serumOrPerpMarket?.tickSize || 0.01)
  const isStub = oracleProvider === 'Stub'

  return (
    <>
      <div id="trade-step-two" className="flex-col whitespace-nowrap md:ml-6">
        <Tooltip
          placement="bottom"
          content={
            !isStub ? (
              <>
                <div className="flex text-sm">
                  <span className="mr-1">{t('trade:price-provided-by')}</span>
                  <OracleProvider />
                </div>
                <div className="mt-2">
                  {t('trade:last-updated')}{' '}
                  {dayjs
                    .duration({
                      seconds: -((highestSlot - oracleLastUpdatedSlot) * 0.5),
                    })
                    .humanize(true)}
                  .
                </div>
                {isStale ? (
                  <div className="mt-2 font-black">
                    {t('trade:oracle-not-updated')}
                    <br />
                    {t('trade:oracle-not-updated-warning')}
                  </div>
                ) : undefined}
              </>
            ) : (
              t('trade:stub-oracle-description', {
                market: selectedMarket?.name || t('trade:this-market'),
              })
            )
          }
        >
          <div className="flex items-center">
            <div className="tooltip-underline mb-0.5 text-xs text-th-fgd-4">
              {t('trade:oracle-price')}
            </div>
            {isStale || isStub ? (
              <ExclamationTriangleIcon className="ml-1 h-4 w-4 text-th-warning" />
            ) : null}
          </div>
        </Tooltip>
        <div className="font-mono text-xs text-th-fgd-2">
          {price ? (
            <>
              {quoteBank?.name === 'USDC' ? '$' : ''}
              {formatNumericValue(price, oracleDecimals)}
              {quoteBank?.name && quoteBank.name !== 'USDC' ? (
                <span className="font-body text-th-fgd-3">
                  {' '}
                  {CURRENCY_SYMBOLS[quoteBank.name] || quoteBank.name}
                </span>
              ) : null}
            </>
          ) : (
            <span className="text-th-fgd-4">–</span>
          )}
        </div>
      </div>
    </>
  )
}

export default OraclePrice
