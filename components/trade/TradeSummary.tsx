import {
  HealthType,
  MangoAccount,
  PerpMarket,
  Serum3Market,
  toUiDecimalsForQuote,
} from '@blockworks-foundation/mango-v4'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import HealthImpact from '@components/shared/HealthImpact'
import Tooltip from '@components/shared/Tooltip'
import mangoStore from '@store/mangoStore'
import useMangoGroup from 'hooks/useMangoGroup'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { useTranslation } from 'next-i18next'
import { useMemo } from 'react'
import Slippage from './Slippage'

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
  const { selectedMarket } = useSelectedMarket()

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
                parseFloat(tradeForm.baseSize)
              )
            : mangoAccount.simHealthRatioWithPerpBidUiChanges(
                group,
                selectedMarket.perpMarketIndex,
                parseFloat(tradeForm.baseSize)
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

  const borrowAmount = useMemo(() => {
    if (!balanceBank || !mangoAccount) return 0
    let borrowAmount
    const balance = mangoAccount.getTokenDepositsUi(balanceBank)
    if (tradeForm.side === 'buy') {
      const remainingBalance = balance - parseFloat(tradeForm.quoteSize)
      borrowAmount = remainingBalance < 0 ? Math.abs(remainingBalance) : 0
    } else {
      const remainingBalance = balance - parseFloat(tradeForm.baseSize)
      borrowAmount = remainingBalance < 0 ? Math.abs(remainingBalance) : 0
    }

    return borrowAmount
  }, [balanceBank, mangoAccount, tradeForm])

  return (
    <div className="space-y-2 px-3 md:px-4">
      <div className="flex justify-between text-xs">
        <p>{t('trade:order-value')}</p>
        <p className="text-th-fgd-2">
          {Number(tradeForm.price) && Number(tradeForm.baseSize) ? (
            <FormatNumericValue
              value={Number(tradeForm.price) * Number(tradeForm.baseSize)}
              decimals={2}
              isUsd
            />
          ) : (
            '0.00'
          )}
        </p>
      </div>
      <HealthImpact maintProjectedHealth={maintProjectedHealth} small />
      {borrowAmount ? (
        <div className="flex justify-between text-xs">
          <Tooltip
            content={t('loan-origination-fee-tooltip', {
              fee: `${(
                balanceBank!.loanOriginationFeeRate.toNumber() * 100
              ).toFixed(3)}%`,
            })}
            delay={100}
          >
            <p className="tooltip-underline">{t('loan-origination-fee')}</p>
          </Tooltip>
          <p className="text-right font-mono text-th-fgd-2">
            ~
            <FormatNumericValue
              value={
                borrowAmount * balanceBank!.loanOriginationFeeRate.toNumber()
              }
              decimals={balanceBank!.mintDecimals}
            />{' '}
            <span className="font-body text-th-fgd-4">{balanceBank!.name}</span>
          </p>
        </div>
      ) : null}
      <div className="flex justify-between text-xs">
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
      </div>
      <Slippage />
    </div>
  )
}

export default TradeSummary
