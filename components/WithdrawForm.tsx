import {
  ArrowUpTrayIcon,
  ExclamationCircleIcon,
  // ExclamationCircleIcon,
} from '@heroicons/react/20/solid'
import Decimal from 'decimal.js'
import { useTranslation } from 'next-i18next'
import { useCallback, useMemo, useState } from 'react'
import NumberFormat from 'react-number-format'

import mangoStore from '@store/mangoStore'
import {
  DEPOSIT_WITHDRAW_MODAL_INNER_HEIGHT,
  INPUT_TOKEN_DEFAULT,
} from './../utils/constants'
import { notify } from './../utils/notifications'
import ActionTokenList from './account/ActionTokenList'
import ButtonGroup from './forms/ButtonGroup'
import Label from './forms/Label'
import Button from './shared/Button'
import Loading from './shared/Loading'
import { EnterBottomExitBottom, FadeInFadeOut } from './shared/Transitions'
import { withValueLimit } from './swap/MarketSwapForm'
import { getMaxWithdrawForBank } from './swap/useTokenMax'
import MaxAmountButton from '@components/shared/MaxAmountButton'
import HealthImpactTokenChange from '@components/HealthImpactTokenChange'
import useMangoAccount from 'hooks/useMangoAccount'
import useMangoGroup from 'hooks/useMangoGroup'
import TokenVaultWarnings from '@components/shared/TokenVaultWarnings'
import { useWallet } from '@solana/wallet-adapter-react'
import { floorToDecimal } from 'utils/numbers'
import BankAmountWithValue from './shared/BankAmountWithValue'
import useBanksWithBalances from 'hooks/useBanksWithBalances'
import { isMangoError } from 'types'
import TokenListButton from './shared/TokenListButton'
import { ACCOUNT_ACTIONS_NUMBER_FORMAT_CLASSES, BackButton } from './BorrowForm'
import TokenLogo from './shared/TokenLogo'
import SecondaryConnectButton from './shared/SecondaryConnectButton'
import { handleInputChange } from 'utils/account'
import useUnsettledPerpPositions from 'hooks/useUnsettledPerpPositions'
import { HealthType } from '@blockworks-foundation/mango-v4'

interface WithdrawFormProps {
  onSuccess: () => void
  token?: string
}

function WithdrawForm({ onSuccess, token }: WithdrawFormProps) {
  const { t } = useTranslation(['common', 'trade'])
  const { group } = useMangoGroup()
  const [inputAmount, setInputAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [selectedToken, setSelectedToken] = useState(
    token || INPUT_TOKEN_DEFAULT,
  )
  const [showTokenList, setShowTokenList] = useState(false)
  const [sizePercentage, setSizePercentage] = useState('')
  const { mangoAccount } = useMangoAccount()
  const { connected } = useWallet()
  const banks = useBanksWithBalances('maxWithdraw')
  const unsettledPerpPositions = useUnsettledPerpPositions()

  const bank = useMemo(() => {
    const group = mangoStore.getState().group
    return group?.banksMapByName.get(selectedToken)?.[0]
  }, [selectedToken])

  const [tokenMax, decimals] = useMemo(() => {
    if (!bank || !mangoAccount || !group) return [new Decimal(0), undefined]
    const tokenMax = getMaxWithdrawForBank(group, bank, mangoAccount).toNumber()
    const decimals = floorToDecimal(tokenMax, bank.mintDecimals).toNumber()
      ? bank.mintDecimals
      : undefined
    const roundedMax = decimals ? floorToDecimal(tokenMax, decimals) : tokenMax
    // Note: Disable for now, not sure why this was added, we can re-renable with specific conditions when
    // need is realized
    // const balance = mangoAccount.getTokenBalanceUi(bank)
    // if (tokenMax < balance) {
    //   adjustedTokenMax = tokenMax * 0.998
    // }

    return [new Decimal(roundedMax), decimals]
  }, [mangoAccount, bank, group])

  const handleSizePercentage = useCallback(
    (percentage: string) => {
      if (!bank) return
      setSizePercentage(percentage)
      let amount: Decimal
      if (percentage !== '100') {
        amount = new Decimal(tokenMax).mul(percentage).div(100)
      } else {
        amount = new Decimal(tokenMax)
      }
      setInputAmount(amount.toFixed())
    },
    [bank, decimals, tokenMax],
  )

  const setMax = useCallback(() => {
    if (!bank) return
    setInputAmount(tokenMax.toFixed())
    setSizePercentage('100')
  }, [bank, tokenMax])

  const handleWithdraw = useCallback(async () => {
    const client = mangoStore.getState().client
    const group = mangoStore.getState().group
    const mangoAccount = mangoStore.getState().mangoAccount.current
    const actions = mangoStore.getState().actions
    const withdrawAmount = parseFloat(inputAmount)
    if (!mangoAccount || !group || !bank) return

    setSubmitting(true)

    const withdrawAll =
      floorToDecimal(tokenMax, bank.mintDecimals).eq(
        new Decimal(inputAmount),
      ) || sizePercentage === '100'

    try {
      const { signature: tx, slot } = withdrawAll
        ? await client.tokenWithdrawAllDepositForMint(
            group,
            mangoAccount,
            bank.mint,
          )
        : await client.tokenWithdraw(
            group,
            mangoAccount,
            bank.mint,
            withdrawAmount,
            false,
          )
      notify({
        title: 'Transaction confirmed',
        type: 'success',
        txid: tx,
      })
      await actions.reloadMangoAccount(slot)
      setSubmitting(false)
      onSuccess()
    } catch (e) {
      console.error(e)
      setSubmitting(false)
      if (!isMangoError(e)) return
      notify({
        title: 'Transaction failed',
        description: e.message,
        txid: e?.txid,
        type: 'error',
      })
    }
  }, [tokenMax, bank, inputAmount, sizePercentage])

  const handleSelectToken = useCallback((token: string) => {
    setSelectedToken(token)
    setShowTokenList(false)
  }, [])

  const showInsufficientBalance = inputAmount
    ? tokenMax.lt(new Decimal(inputAmount))
    : false

  const maintProjectedHealth = useMemo(() => {
    const uiAmount = Number(inputAmount)
    const mangoAccount = mangoStore.getState().mangoAccount.current
    const group = mangoStore.getState().group
    if (!group || !mangoAccount || !bank) return 0

    const mintPk = bank.mint
    const uiTokenAmount = uiAmount * -1
    const projectedHealth =
      mangoAccount.simHealthRatioWithTokenPositionUiChanges(
        group,
        [{ mintPk, uiTokenAmount }],
        HealthType.maint,
      )

    return projectedHealth! > 100
      ? 100
      : projectedHealth! < 0
      ? 0
      : Math.trunc(projectedHealth!)
  }, [tokenMax, bank, inputAmount, sizePercentage])

  const showMaxWithdrawUnSettledPerpsExist =
    unsettledPerpPositions &&
    unsettledPerpPositions.length > 0 &&
    maintProjectedHealth == 0

  return (
    <>
      <EnterBottomExitBottom
        className="absolute bottom-0 left-0 z-20 h-full w-full overflow-auto rounded-lg bg-th-bkg-1 p-6"
        show={showTokenList}
      >
        <BackButton onClick={() => setShowTokenList(false)} />
        <h2 className="mb-4 text-center text-lg">
          {t('select-withdraw-token')}
        </h2>
        <div className="flex items-center px-4 pb-2">
          <div className="w-1/2 text-left">
            <p className="text-xs">{t('token')}</p>
          </div>
          <div className="w-1/2 text-right">
            <p className="text-xs">{t('available-balance')}</p>
          </div>
        </div>
        <ActionTokenList
          banks={banks}
          onSelect={handleSelectToken}
          valueKey="maxWithdraw"
        />
      </EnterBottomExitBottom>
      <FadeInFadeOut show={!showTokenList}>
        <div
          className="flex flex-col justify-between"
          style={{ height: DEPOSIT_WITHDRAW_MODAL_INNER_HEIGHT }}
        >
          <div>
            {bank ? <TokenVaultWarnings bank={bank} type="withdraw" /> : null}
            <div className="grid grid-cols-2">
              <div className="col-span-2 flex justify-between">
                <Label text={`${t('withdraw')} ${t('token')}`} />
                {bank ? (
                  <MaxAmountButton
                    className="mb-2"
                    decimals={decimals}
                    label={t('max')}
                    onClick={setMax}
                    value={tokenMax}
                  />
                ) : null}
              </div>
              <div className="col-span-1">
                <TokenListButton
                  token={selectedToken}
                  logo={<TokenLogo bank={bank} />}
                  setShowList={setShowTokenList}
                />
              </div>
              <div className="col-span-1">
                <NumberFormat
                  name="amountIn"
                  id="amountIn"
                  inputMode="decimal"
                  thousandSeparator=","
                  allowNegative={false}
                  isNumericString={true}
                  decimalScale={decimals}
                  className={ACCOUNT_ACTIONS_NUMBER_FORMAT_CLASSES}
                  placeholder="0.00"
                  value={inputAmount}
                  onValueChange={(values, source) =>
                    handleInputChange(
                      values,
                      source,
                      setInputAmount,
                      setSizePercentage,
                    )
                  }
                  isAllowed={withValueLimit}
                />
              </div>
              <div className="col-span-2 mt-2">
                <ButtonGroup
                  activeValue={sizePercentage}
                  className="font-mono"
                  onChange={(p) => handleSizePercentage(p)}
                  values={['10', '25', '50', '75', '100']}
                  unit="%"
                />
              </div>
            </div>
            {bank ? (
              <div className="my-6 space-y-1.5 border-y border-th-bkg-3 px-2 py-4">
                <HealthImpactTokenChange
                  mintPk={bank.mint}
                  uiAmount={Number(inputAmount)}
                />
                <div className="flex justify-between">
                  <p>{t('withdraw-amount')}</p>
                  <BankAmountWithValue
                    amount={inputAmount}
                    bank={bank}
                    decimals={decimals}
                    fixDecimals={false}
                  />
                </div>
              </div>
            ) : null}
          </div>
          {connected ? (
            <Button
              onClick={handleWithdraw}
              className="flex w-full items-center justify-center"
              size="large"
              disabled={
                connected &&
                (!inputAmount ||
                  showInsufficientBalance ||
                  showMaxWithdrawUnSettledPerpsExist)
              }
            >
              {submitting ? (
                <Loading className="mr-2 h-5 w-5" />
              ) : showInsufficientBalance ? (
                <div className="flex items-center">
                  <ExclamationCircleIcon className="mr-2 h-5 w-5 shrink-0" />
                  {t('swap:insufficient-balance', {
                    symbol: selectedToken,
                  })}
                </div>
              ) : showMaxWithdrawUnSettledPerpsExist ? (
                <div className="flex items-center">
                  <ExclamationCircleIcon className="mr-2 h-5 w-5 shrink-0" />
                  {t('trade:unsettled-perps')}
                </div>
              ) : (
                <div className="flex items-center">
                  <ArrowUpTrayIcon className="mr-2 h-5 w-5" />
                  {t('withdraw')}
                </div>
              )}
            </Button>
          ) : (
            <SecondaryConnectButton
              className="flex w-full items-center justify-center"
              isLarge
            />
          )}
        </div>
      </FadeInFadeOut>
    </>
  )
}

export default WithdrawForm
