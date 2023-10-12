import MaxAmountButton from '@components/shared/MaxAmountButton'
import TokenSelect from './TokenSelect'
import Loading from '@components/shared/Loading'
import NumberFormat, {
  NumberFormatValues,
  SourceInfo,
} from 'react-number-format'
import { floorToDecimal, formatCurrencyValue } from 'utils/numbers'
import { useTranslation } from 'react-i18next'
import { Dispatch, SetStateAction, useMemo } from 'react'
import mangoStore from '@store/mangoStore'
import useMangoGroup from 'hooks/useMangoGroup'
import { OUTPUT_TOKEN_DEFAULT } from 'utils/constants'
import { NUMBER_FORMAT_CLASSNAMES } from './MarketSwapForm'
import InlineNotification from '@components/shared/InlineNotification'
import useMangoAccount from 'hooks/useMangoAccount'
import { SwapFormTokenListType } from './SwapFormTokenList'

const BuyTokenInput = ({
  error,
  handleAmountOutChange,
  loading,
  setShowTokenSelect,
  handleRepay,
}: {
  error?: string
  handleAmountOutChange: (e: NumberFormatValues, info: SourceInfo) => void
  loading?: boolean
  setShowTokenSelect: Dispatch<SetStateAction<SwapFormTokenListType>>
  handleRepay?: (amountOut: string) => void
}) => {
  const { t } = useTranslation('common')
  const { mangoAccount } = useMangoAccount()
  const { group } = useMangoGroup()
  const { outputBank, amountOut: amountOutFormValue } = mangoStore(
    (s) => s.swap,
  )

  const outputTokenBalanceBorrow = useMemo(() => {
    if (!outputBank || !mangoAccount) return 0
    const balance = mangoAccount.getTokenBalanceUi(outputBank)
    const roundedBalance = floorToDecimal(
      balance,
      outputBank.mintDecimals,
    ).toNumber()
    return balance && balance < 0 ? Math.abs(roundedBalance) : 0
  }, [mangoAccount, outputBank])

  return (
    <div className="mb-2 grid grid-cols-2 rounded-xl bg-th-bkg-2 p-3">
      <div className="col-span-2 mb-2 flex items-end justify-between">
        <p className="text-th-fgd-2">{t('buy')}</p>
        {handleRepay && outputTokenBalanceBorrow ? (
          <MaxAmountButton
            className="mb-0.5 text-xs"
            decimals={outputBank?.mintDecimals || 9}
            label={t('repay')}
            onClick={() => handleRepay(outputTokenBalanceBorrow.toString())}
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
          tokenType="output"
        />
      </div>
      <div className="relative col-span-1">
        {loading ? (
          <div className="flex h-[56px] w-full items-center justify-center rounded-l-none rounded-r-lg border-l border-th-bkg-2 bg-th-input-bkg">
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
            {!isNaN(Number(amountOutFormValue)) ? (
              <span className="absolute bottom-1.5 right-3 text-xxs text-th-fgd-4">
                {outputBank
                  ? formatCurrencyValue(
                      outputBank.uiPrice * Number(amountOutFormValue),
                    )
                  : '–'}
              </span>
            ) : null}
          </>
        )}
      </div>
      {error ? (
        <div className="col-span-2 mt-1 flex justify-center">
          <InlineNotification
            type="error"
            desc={error}
            hideBorder
            hidePadding
          />
        </div>
      ) : null}
    </div>
  )
}

export default BuyTokenInput
