import TokenSelect from './TokenSelect'
import NumberFormat, {
  NumberFormatValues,
  SourceInfo,
} from 'react-number-format'
import { formatCurrencyValue } from 'utils/numbers'
import { useTranslation } from 'react-i18next'
import { Dispatch, SetStateAction } from 'react'
import mangoStore from '@store/mangoStore'
import useMangoGroup from 'hooks/useMangoGroup'
import { INPUT_TOKEN_DEFAULT } from 'utils/constants'
import { NUMBER_FORMAT_CLASSNAMES, withValueLimit } from './MarketSwapForm'
import MaxSwapAmount from './MaxSwapAmount'
import useUnownedAccount from 'hooks/useUnownedAccount'
import InlineNotification from '@components/shared/InlineNotification'
import { SwapFormTokenListType } from './SwapFormTokenList'
import { useTokenMax } from './useTokenMax'
import Loading from '@components/shared/Loading'

const SellTokenInput = ({
  handleAmountInChange,
  setShowTokenSelect,
  handleMax,
  className,
  error,
  isTriggerOrder,
  loading,
}: {
  handleAmountInChange: (e: NumberFormatValues, info: SourceInfo) => void
  setShowTokenSelect: Dispatch<SetStateAction<SwapFormTokenListType>>
  handleMax: (amountIn: string) => void
  className?: string
  error?: string
  isTriggerOrder?: boolean
  loading?: boolean
}) => {
  const { t } = useTranslation('common')
  const { group } = useMangoGroup()
  const { isUnownedAccount } = useUnownedAccount()
  const {
    margin: useMargin,
    inputBank,
    amountIn: amountInFormValue,
  } = mangoStore((s) => s.swap)

  return (
    <div
      className={`grid grid-cols-2 rounded-t-xl bg-th-bkg-2 p-3 pb-2 ${className}`}
    >
      <div className="col-span-2 mb-2 flex items-center justify-between">
        <p className="text-th-fgd-2">{t('sell')}</p>
        {!isUnownedAccount ? (
          <MaxSwapAmount
            useMargin={isTriggerOrder ? false : useMargin}
            setAmountIn={(v) => handleMax(v)}
            maxAmount={useTokenMax}
          />
        ) : null}
      </div>
      <div className="col-span-1">
        <TokenSelect
          bank={
            inputBank || group?.banksMapByName.get(INPUT_TOKEN_DEFAULT)?.[0]
          }
          showTokenList={setShowTokenSelect}
          tokenType="input"
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
              decimalScale={inputBank?.mintDecimals || 6}
              name="amountIn"
              id="amountIn"
              className={NUMBER_FORMAT_CLASSNAMES}
              placeholder="0.00"
              value={amountInFormValue}
              onValueChange={handleAmountInChange}
              isAllowed={withValueLimit}
            />
            {!isNaN(Number(amountInFormValue)) ? (
              <span className="absolute bottom-1.5 right-3 text-xxs text-th-fgd-4">
                {inputBank
                  ? formatCurrencyValue(
                      inputBank.uiPrice * Number(amountInFormValue),
                    )
                  : '–'}
              </span>
            ) : null}
          </>
        )}
      </div>
      {/* {mangoAccountAddress ? (
        <div className="col-span-2 mt-1 flex justify-center">
          <InlineNotification
            type="warning"
            desc={t('swap:warning-no-collateral')}
            hideBorder
            hidePadding
          />
        </div>
      ) : null} */}
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

export default SellTokenInput
