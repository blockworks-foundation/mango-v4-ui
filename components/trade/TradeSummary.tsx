import {
  Bank,
  HealthType,
  MangoAccount,
  PerpMarket,
  Serum3Market,
} from '@blockworks-foundation/mango-v4'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import HealthImpact from '@components/shared/HealthImpact'
import Tooltip from '@components/shared/Tooltip'
import mangoStore from '@store/mangoStore'
import Decimal from 'decimal.js'
import useMangoGroup from 'hooks/useMangoGroup'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { useTranslation } from 'next-i18next'
import { useMemo } from 'react'
import Slippage from './Slippage'
import {
  floorToDecimal,
  formatNumericValue,
  getDecimalCount,
} from 'utils/numbers'
import { formatTokenSymbol } from 'utils/tokens'
import useOpenPerpPositions from 'hooks/useOpenPerpPositions'
import {
  TriggerOrderTypes,
  calculateEstPriceForBaseSize,
} from 'utils/tradeForm'

const TradeSummary = ({
  balanceBank,
  mangoAccount,
}: {
  balanceBank: Bank | undefined
  mangoAccount: MangoAccount | undefined
}) => {
  const { t } = useTranslation(['common', 'trade'])
  const { group } = useMangoGroup()
  const tradeForm = mangoStore((s) => s.tradeForm)
  const orderbook = mangoStore((s) => s.selectedMarket.orderbook)
  const { selectedMarket, quoteBank } = useSelectedMarket()
  const { openPerpPositions } = useOpenPerpPositions()

  // calc new avg price if an open position exists
  const avgEntryPrice = useMemo(() => {
    if (
      !openPerpPositions?.length ||
      !selectedMarket ||
      !orderbook ||
      selectedMarket instanceof Serum3Market
    )
      return

    const openPosition = openPerpPositions.find(
      (pos) => pos.marketIndex === selectedMarket.perpMarketIndex,
    )

    const { baseSize, price, reduceOnly, side, tradeType } = tradeForm

    if (!openPosition || !price || !tradeForm.baseSize) return

    let orderPrice = parseFloat(price)
    if (tradeType === 'Market') {
      orderPrice = calculateEstPriceForBaseSize(
        orderbook,
        parseFloat(tradeForm.baseSize),
        tradeForm.side,
      )
    }
    const currentSize = openPosition.getBasePositionUi(selectedMarket)
    const tradeSize =
      side === 'buy' ? parseFloat(baseSize) : parseFloat(baseSize) * -1
    const newTotalSize = currentSize + tradeSize
    const currentAvgPrice = openPosition.getAverageEntryPriceUi(selectedMarket)

    // don't calc when closing position
    if (newTotalSize === 0) {
      return
    }

    // don't calc when reducing position
    if (
      (currentSize < 0 !== tradeSize < 0 &&
        newTotalSize < 0 === currentSize < 0) ||
      reduceOnly
    ) {
      return
    }

    // if trade side changes with new trade return new trade price
    if (currentSize < 0 !== newTotalSize < 0) {
      return price
    }

    const newTotalCost = currentAvgPrice * currentSize + orderPrice * tradeSize
    const newAvgEntryPrice = newTotalCost / newTotalSize
    return newAvgEntryPrice
  }, [openPerpPositions, selectedMarket, tradeForm, orderbook])

  const maintProjectedHealth = useMemo(() => {
    if (!mangoAccount || !group) return 100

    let simulatedHealthRatio = 0
    try {
      if (selectedMarket instanceof Serum3Market) {
        simulatedHealthRatio =
          tradeForm.side === 'sell'
            ? mangoAccount.simHealthRatioWithSerum3AskUiChanges(
                group,
                Number(tradeForm.baseSize),
                selectedMarket.serumMarketExternal,
                HealthType.maint,
              )
            : mangoAccount.simHealthRatioWithSerum3BidUiChanges(
                group,
                Number(tradeForm.quoteSize),
                selectedMarket.serumMarketExternal,
                HealthType.maint,
              )
      } else if (selectedMarket instanceof PerpMarket) {
        simulatedHealthRatio =
          tradeForm.side === 'sell'
            ? mangoAccount.simHealthRatioWithPerpAskUiChanges(
                group,
                selectedMarket.perpMarketIndex,
                parseFloat(tradeForm.baseSize) || 0,
                HealthType.maint,
              )
            : mangoAccount.simHealthRatioWithPerpBidUiChanges(
                group,
                selectedMarket.perpMarketIndex,
                parseFloat(tradeForm.baseSize) || 0,
                HealthType.maint,
              )
      }
    } catch (e) {
      console.warn('Error calculating projected health: ', e)
    }

    return simulatedHealthRatio > 100
      ? 100
      : simulatedHealthRatio < 0
      ? 0
      : Math.trunc(simulatedHealthRatio)
  }, [group, mangoAccount, selectedMarket, tradeForm])

  const [balance, borrowAmount] = useMemo(() => {
    if (!balanceBank || !mangoAccount) return [0, 0]
    let borrowAmount
    const balance = mangoAccount.getTokenDepositsUi(balanceBank)
    if (tradeForm.side === 'buy') {
      const remainingBalance = balance - parseFloat(tradeForm.quoteSize)
      borrowAmount = remainingBalance < 0 ? Math.abs(remainingBalance) : 0
    } else {
      const remainingBalance = balance - parseFloat(tradeForm.baseSize)
      borrowAmount = remainingBalance < 0 ? Math.abs(remainingBalance) : 0
    }

    return [balance, borrowAmount]
  }, [balanceBank, mangoAccount, tradeForm])

  const orderValue = useMemo(() => {
    if (
      !quoteBank ||
      !tradeForm.price ||
      !tradeForm.baseSize ||
      isNaN(parseFloat(tradeForm.price)) ||
      isNaN(parseFloat(tradeForm.baseSize))
    )
      return 0
    const basePriceDecimal = new Decimal(tradeForm.price)
    const quotePriceDecimal = new Decimal(quoteBank.uiPrice)
    const sizeDecimal = new Decimal(tradeForm.baseSize)
    return floorToDecimal(
      basePriceDecimal.mul(quotePriceDecimal).mul(sizeDecimal),
      2,
    )
  }, [quoteBank, tradeForm])

  const isTriggerOrder =
    tradeForm.tradeType === TriggerOrderTypes.STOP_LOSS ||
    tradeForm.tradeType === TriggerOrderTypes.TAKE_PROFIT

  return (
    <div className="space-y-2 px-3 md:px-4">
      <div className="flex justify-between text-xs">
        <p>{t('trade:order-value')}</p>
        <p className="font-mono text-th-fgd-2">
          {orderValue ? <FormatNumericValue value={orderValue} isUsd /> : '–'}
        </p>
      </div>
      <HealthImpact maintProjectedHealth={maintProjectedHealth} small />
      {borrowAmount && balanceBank ? (
        <>
          <div className="flex justify-between text-xs">
            <Tooltip
              content={
                balance
                  ? t('trade:tooltip-borrow-balance', {
                      balance: formatNumericValue(balance),
                      borrowAmount: formatNumericValue(borrowAmount),
                      token: formatTokenSymbol(balanceBank.name),
                      rate: formatNumericValue(
                        balanceBank.getBorrowRateUi(),
                        2,
                      ),
                    })
                  : t('trade:tooltip-borrow-no-balance', {
                      borrowAmount: formatNumericValue(borrowAmount),
                      token: formatTokenSymbol(balanceBank.name),
                      rate: formatNumericValue(
                        balanceBank.getBorrowRateUi(),
                        2,
                      ),
                    })
              }
              delay={100}
            >
              <p className="tooltip-underline">{t('borrow-amount')}</p>
            </Tooltip>
            <p className="text-right font-mono text-th-fgd-2">
              <FormatNumericValue
                value={borrowAmount}
                decimals={balanceBank.mintDecimals}
              />{' '}
              <span className="font-body text-th-fgd-4">
                {formatTokenSymbol(balanceBank.name)}
              </span>
            </p>
          </div>
          <div className="flex justify-between text-xs">
            <Tooltip
              content={t('loan-origination-fee-tooltip', {
                fee: `${(
                  balanceBank.loanOriginationFeeRate.toNumber() * 100
                ).toFixed(3)}%`,
              })}
              delay={100}
            >
              <p className="tooltip-underline">{t('loan-origination-fee')}</p>
            </Tooltip>
            <p className="text-right font-mono text-th-fgd-2">
              <FormatNumericValue
                value={
                  borrowAmount * balanceBank.loanOriginationFeeRate.toNumber()
                }
                decimals={balanceBank.mintDecimals}
              />{' '}
              <span className="font-body text-th-fgd-4">
                {formatTokenSymbol(balanceBank.name)}
              </span>
            </p>
          </div>
        </>
      ) : null}
      {/* <div className="flex justify-between text-xs">
        <Tooltip content="The amount of capital you have to use for trades and loans. When your free collateral reaches $0 you won't be able to trade, borrow or withdraw.">
          <p className="tooltip-underline">{t('free-collateral')}</p>
        </Tooltip>
        <p className="text-th-fgd-2">
          {group && mangoAccount ? (
            <FormatNumericValue
              value={toUiDecimalsForQuote(
                mangoAccount.getCollateralValue(group)
              )}
              decimals={2}
              isUsd
            />
          ) : (
            '–'
          )}
        </p>
      </div> */}
      <Slippage />
      {avgEntryPrice && selectedMarket instanceof PerpMarket ? (
        <div className="flex justify-between text-xs">
          <p>{t('trade:avg-entry-price')}</p>
          <p className="text-th-fgd-2">
            <FormatNumericValue
              value={avgEntryPrice}
              decimals={getDecimalCount(selectedMarket.tickSize)}
              isUsd
            />
          </p>
        </div>
      ) : null}
      {selectedMarket instanceof Serum3Market && !isTriggerOrder ? (
        <div className="flex justify-between text-xs">
          <p>{t('common:route')}</p>
          <p className="text-th-fgd-2">Openbook</p>
        </div>
      ) : null}
    </div>
  )
}

export default TradeSummary
