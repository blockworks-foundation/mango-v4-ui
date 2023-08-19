import TokenSelect from './TokenSelect'
import NumberFormat, {
  NumberFormatValues,
  SourceInfo,
} from 'react-number-format'
import { formatCurrencyValue } from 'utils/numbers'
import { useTranslation } from 'react-i18next'
import { Dispatch, SetStateAction, useMemo } from 'react'
import mangoStore from '@store/mangoStore'
import useMangoGroup from 'hooks/useMangoGroup'
import { INPUT_TOKEN_DEFAULT } from 'utils/constants'
import { NUMBER_FORMAT_CLASSNAMES, withValueLimit } from './MarketSwapForm'
import MaxSwapAmount from './MaxSwapAmount'
import useUnownedAccount from 'hooks/useUnownedAccount'
import InlineNotification from '@components/shared/InlineNotification'
import useMangoAccount from 'hooks/useMangoAccount'
import { useWallet } from '@solana/wallet-adapter-react'
import { toUiDecimalsForQuote } from '@blockworks-foundation/mango-v4'

const SellTokenInput = ({
  handleAmountInChange,
  setShowTokenSelect,
  handleMax,
  className,
  error,
  isTriggerOrder,
}: {
  handleAmountInChange: (e: NumberFormatValues, info: SourceInfo) => void
  setShowTokenSelect: Dispatch<SetStateAction<'input' | 'output' | undefined>>
  handleMax: (amountIn: string) => void
  className?: string
  error?: string
  isTriggerOrder?: boolean
}) => {
  const { t } = useTranslation('common')
  const { mangoAccountAddress } = useMangoAccount()
  const { connected } = useWallet()
  const { group } = useMangoGroup()
  const { isUnownedAccount } = useUnownedAccount()
  const {
    margin: useMargin,
    inputBank,
    amountIn: amountInFormValue,
  } = mangoStore((s) => s.swap)

  const freeCollateral = useMemo(() => {
    const group = mangoStore.getState().group
    const mangoAccount = mangoStore.getState().mangoAccount.current
    return group && mangoAccount
      ? toUiDecimalsForQuote(mangoAccount.getCollateralValue(group))
      : 0
  }, [mangoAccountAddress])

  return (
    <div className={`grid grid-cols-2 rounded-xl bg-th-bkg-2 p-3 ${className}`}>
      <div className="col-span-2 mb-2 flex items-center justify-between">
        <p className="text-th-fgd-2">{t('sell')}</p>
        {!isUnownedAccount ? (
          <MaxSwapAmount
            useMargin={isTriggerOrder ? false : useMargin}
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
        {!isNaN(Number(amountInFormValue)) ? (
          <span className="absolute bottom-1.5 right-3 text-xxs text-th-fgd-4">
            {inputBank
              ? formatCurrencyValue(
                  inputBank.uiPrice * Number(amountInFormValue),
                )
              : '–'}
          </span>
        ) : null}
      </div>
      {connected && freeCollateral <= 0 ? (
        <div className="col-span-2 mt-1 flex justify-center">
          <InlineNotification
            type="warning"
            desc={t('swap:warning-no-collateral')}
            hideBorder
            hidePadding
          />
        </div>
      ) : null}
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
