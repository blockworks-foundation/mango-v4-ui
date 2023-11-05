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
import InlineNotification from '@components/shared/InlineNotification'
import useMangoAccount from 'hooks/useMangoAccount'
import { SwapFormTokenListType } from './SwapFormTokenList'
import { getTokenBalance } from './TriggerSwapForm'

const ReduceOutputTokenInput = ({
  error,
  handleAmountOutChange,
  loading,
  setShowTokenSelect,
}: {
  error?: string
  handleAmountOutChange: (e: NumberFormatValues, info: SourceInfo) => void
  loading?: boolean
  setShowTokenSelect: Dispatch<SetStateAction<SwapFormTokenListType>>
}) => {
  const { t } = useTranslation('common')
  const { mangoAccountAddress } = useMangoAccount()
  const { group } = useMangoGroup()
  const {
    inputBank,
    outputBank,
    amountOut: amountOutFormValue,
  } = mangoStore((s) => s.swap)

  const reducingLong = useMemo(() => {
    if (!inputBank || !mangoAccountAddress) return false
    const inputBalance = getTokenBalance(inputBank)
    return inputBalance > 0
  }, [inputBank, mangoAccountAddress])

  return (
    <div className="mb-2 grid grid-cols-2 rounded-b-xl border-t border-th-bkg-4 bg-th-bkg-2 p-3">
      <p className="col-span-2 mb-2 text-th-fgd-2">
        {reducingLong ? t('buy') : t('sell')}
      </p>
      <div className="col-span-1">
        <TokenSelect
          bank={
            outputBank || group?.banksMapByName.get(OUTPUT_TOKEN_DEFAULT)?.[0]
          }
          showTokenList={setShowTokenSelect}
          tokenType="reduce-output"
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

export default ReduceOutputTokenInput
