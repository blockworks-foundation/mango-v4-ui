import {
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
import { floorToDecimal, formatNumericValue } from 'utils/numbers'
import { formatTokenSymbol } from 'utils/tokens'

const TradeSummary = ({
  mangoAccount,
  useMargin,
}: {
  mangoAccount: MangoAccount | undefined
  useMargin: boolean
}) => {
  const { t } = useTranslation(['common', 'trade'])
  const { group } = useMangoGroup()
  const tradeForm = mangoStore((s) => s.tradeForm)
  const { selectedMarket, quoteBank } = useSelectedMarket()

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
                HealthType.maint
              )
            : mangoAccount.simHealthRatioWithSerum3BidUiChanges(
                group,
                Number(tradeForm.quoteSize),
                selectedMarket.serumMarketExternal,
                HealthType.maint
              )
      } else if (selectedMarket instanceof PerpMarket) {
        simulatedHealthRatio =
          tradeForm.side === 'sell'
            ? mangoAccount.simHealthRatioWithPerpAskUiChanges(
                group,
                selectedMarket.perpMarketIndex,
                parseFloat(tradeForm.baseSize) || 0
              )
            : mangoAccount.simHealthRatioWithPerpBidUiChanges(
                group,
                selectedMarket.perpMarketIndex,
                parseFloat(tradeForm.baseSize) || 0
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

  const balanceBank = useMemo(() => {
    if (
      !group ||
      !selectedMarket ||
      selectedMarket instanceof PerpMarket ||
      !useMargin
    )
      return
    if (tradeForm.side === 'buy') {
      return group.getFirstBankByTokenIndex(selectedMarket.quoteTokenIndex)
    } else {
      return group.getFirstBankByTokenIndex(selectedMarket.baseTokenIndex)
    }
  }, [group, selectedMarket, tradeForm.side])

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
      Number.isNaN(tradeForm.price) ||
      Number.isNaN(tradeForm.baseSize)
    )
      return 0
    const basePriceDecimal = new Decimal(tradeForm.price)
    const quotePriceDecimal = new Decimal(quoteBank.uiPrice)
    const sizeDecimal = new Decimal(tradeForm.baseSize)
    return floorToDecimal(
      basePriceDecimal.mul(quotePriceDecimal).mul(sizeDecimal),
      2
    )
  }, [quoteBank, tradeForm])

  return (
    <div className="space-y-2 px-3 md:px-4">
      <div className="flex justify-between text-xs">
        <p>{t('trade:order-value')}</p>
        <p className="text-th-fgd-2">
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
                        2
                      ),
                    })
                  : t('trade:tooltip-borrow-no-balance', {
                      borrowAmount: formatNumericValue(borrowAmount),
                      token: formatTokenSymbol(balanceBank.name),
                      rate: formatNumericValue(
                        balanceBank.getBorrowRateUi(),
                        2
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
    </div>
  )
}

export default TradeSummary
