import MaxAmountButton from '@components/shared/MaxAmountButton'
import TokenSelect from './TokenSelect'
import Loading from '@components/shared/Loading'
import NumberFormat, {
  NumberFormatValues,
  SourceInfo,
} from 'react-number-format'
import { formatCurrencyValue } from 'utils/numbers'
import { useTranslation } from 'react-i18next'
import { Dispatch, SetStateAction, useMemo } from 'react'
import mangoStore from '@store/mangoStore'
import useMangoGroup from 'hooks/useMangoGroup'
import { OUTPUT_TOKEN_DEFAULT } from 'utils/constants'
import { NUMBER_FORMAT_CLASSNAMES } from './MarketSwapForm'

const BuyTokenInput = ({
  handleAmountOutChange,
  loading,
  setShowTokenSelect,
  handleRepay,
}: {
  handleAmountOutChange: (e: NumberFormatValues, info: SourceInfo) => void
  loading?: boolean
  setShowTokenSelect: Dispatch<SetStateAction<'input' | 'output' | undefined>>
  handleRepay: (amountOut: string) => void
}) => {
  const { t } = useTranslation('common')
  const { group } = useMangoGroup()
  const { outputBank, amountOut: amountOutFormValue } = mangoStore(
    (s) => s.swap,
  )

  const outputTokenBalanceBorrow = useMemo(() => {
    if (!outputBank) return 0
    const mangoAccount = mangoStore.getState().mangoAccount.current
    const balance = mangoAccount?.getTokenBalanceUi(outputBank)
    return balance && balance < 0 ? Math.abs(balance) : 0
  }, [outputBank])

  return (
    <div className="mb-2 grid grid-cols-2 rounded-xl bg-th-bkg-2 p-3">
      <div className="col-span-2 mb-2 flex items-end justify-between">
        <p className="text-th-fgd-2">{t('buy')}</p>
        {outputTokenBalanceBorrow ? (
          <MaxAmountButton
            className="mb-0.5 text-xs"
            decimals={outputBank?.mintDecimals || 9}
            label={t('repay')}
            onClick={() =>
              handleRepay(
                outputTokenBalanceBorrow.toFixed(outputBank?.mintDecimals || 9),
              )
            }
            value={outputTokenBalanceBorrow}
          />
        ) : null}
      </div>
      <div className="col-span-1">
        <TokenSelect
          bank={
            outputBank || group?.banksMapByName.get(OUTPUT_TOKEN_DEFAULT)?.[0]
          }
          showTokenList={setShowTokenSelect}
          type="output"
        />
      </div>
      <div className="relative col-span-1">
        {loading ? (
          <div className="flex h-[56px] w-full items-center justify-center rounded-l-none rounded-r-lg bg-th-input-bkg">
            <Loading />
          </div>
        ) : (
          <>
            <NumberFormat
              inputMode="decimal"
              thousandSeparator=","
              allowNegative={false}
              isNumericString={true}
              decimalScale={outputBank?.mintDecimals || 6}
              name="amountOut"
              id="amountOut"
              className={NUMBER_FORMAT_CLASSNAMES}
              placeholder="0.00"
              value={amountOutFormValue}
              onValueChange={handleAmountOutChange}
            />
            <span className="absolute right-3 bottom-1.5 text-xxs text-th-fgd-4">
              {outputBank
                ? formatCurrencyValue(
                    outputBank.uiPrice * Number(amountOutFormValue),
                  )
                : '–'}
            </span>
          </>
        )}
      </div>
    </div>
  )
}

export default BuyTokenInput
