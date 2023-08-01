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

const SellTokenInput = ({
  handleAmountInChange,
  setShowTokenSelect,
  handleMax,
  className,
}: {
  handleAmountInChange: (e: NumberFormatValues, info: SourceInfo) => void
  setShowTokenSelect: Dispatch<SetStateAction<'input' | 'output' | undefined>>
  handleMax: (amountIn: string) => void
  className?: string
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
    <div className={`grid grid-cols-2 rounded-xl bg-th-bkg-2 p-3 ${className}`}>
      <div className="col-span-2 mb-2 flex items-center justify-between">
        <p className="text-th-fgd-2">{t('sell')}</p>
        {!isUnownedAccount ? (
          <MaxSwapAmount
            useMargin={useMargin}
            setAmountIn={(v) => handleMax(v)}
          />
        ) : null}
      </div>
      <div className="col-span-1">
        <TokenSelect
          bank={
            inputBank || group?.banksMapByName.get(INPUT_TOKEN_DEFAULT)?.[0]
          }
          showTokenList={setShowTokenSelect}
          type="input"
        />
      </div>
      <div className="relative col-span-1">
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
        <span className="absolute right-3 bottom-1.5 text-xxs text-th-fgd-4">
          {inputBank
            ? formatCurrencyValue(inputBank.uiPrice * Number(amountInFormValue))
            : '–'}
        </span>
      </div>
    </div>
  )
}

export default SellTokenInput
