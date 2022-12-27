import { Bank, HealthType } from '@blockworks-foundation/mango-v4'
import {
  ArrowLeftIcon,
  ArrowUpTrayIcon,
  ChevronDownIcon,
  ExclamationCircleIcon,
  LinkIcon,
} from '@heroicons/react/20/solid'
import Decimal from 'decimal.js'
import { useTranslation } from 'next-i18next'
import Image from 'next/legacy/image'
import { useCallback, useMemo, useState } from 'react'
import NumberFormat, { NumberFormatValues } from 'react-number-format'

import mangoStore from '@store/mangoStore'
import {
  ACCOUNT_ACTION_MODAL_INNER_HEIGHT,
  INPUT_TOKEN_DEFAULT,
} from './../utils/constants'
import { notify } from './../utils/notifications'
import { floorToDecimal, formatFixedDecimals } from './../utils/numbers'
import ActionTokenList from './account/ActionTokenList'
import ButtonGroup from './forms/ButtonGroup'
import Label from './forms/Label'
import Button from './shared/Button'
import InlineNotification from './shared/InlineNotification'
import Loading from './shared/Loading'
import { EnterBottomExitBottom, FadeInFadeOut } from './shared/Transitions'
import { withValueLimit } from './swap/SwapForm'
import { getMaxWithdrawForBank } from './swap/useTokenMax'
import MaxAmountButton from '@components/shared/MaxAmountButton'
import HealthImpactTokenChange from '@components/HealthImpactTokenChange'
import useMangoAccount from 'hooks/useMangoAccount'
import useJupiterMints from 'hooks/useJupiterMints'
import useMangoGroup from 'hooks/useMangoGroup'
import TokenVaultWarnings from '@components/shared/TokenVaultWarnings'
import { useWallet } from '@solana/wallet-adapter-react'

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
    token || INPUT_TOKEN_DEFAULT
  )
  const [showTokenList, setShowTokenList] = useState(false)
  const [sizePercentage, setSizePercentage] = useState('')
  const { mangoTokens } = useJupiterMints()
  const { mangoAccount } = useMangoAccount()
  const { connected } = useWallet()

  const bank = useMemo(() => {
    const group = mangoStore.getState().group
    return group?.banksMapByName.get(selectedToken)?.[0]
  }, [selectedToken])

  const logoUri = useMemo(() => {
    let logoURI
    if (mangoTokens?.length) {
      logoURI = mangoTokens.find(
        (t) => t.address === bank?.mint.toString()
      )?.logoURI
    }
    return logoURI
  }, [bank?.mint, mangoTokens])

  const tokenMax = useMemo(() => {
    if (!bank || !mangoAccount || !group) return new Decimal(0)
    const amount = getMaxWithdrawForBank(group, bank, mangoAccount)

    return amount && amount.gt(0)
      ? floorToDecimal(amount, bank.mintDecimals)
      : new Decimal(0)
  }, [mangoAccount, bank, group])

  const handleSizePercentage = useCallback(
    (percentage: string) => {
      setSizePercentage(percentage)
      const amount = tokenMax.mul(Number(percentage) / 100)
      setInputAmount(amount.toFixed())
    },
    [tokenMax]
  )

  const handleWithdraw = useCallback(async () => {
    const client = mangoStore.getState().client
    const group = mangoStore.getState().group
    const mangoAccount = mangoStore.getState().mangoAccount.current
    const actions = mangoStore.getState().actions
    if (!mangoAccount || !group || !bank) return
    setSubmitting(true)
    try {
      const tx = await client.tokenWithdraw(
        group,
        mangoAccount,
        bank.mint,
        parseFloat(inputAmount),
        false
      )
      notify({
        title: 'Transaction confirmed',
        type: 'success',
        txid: tx,
      })
      await actions.reloadMangoAccount()
      setSubmitting(false)
      onSuccess()
    } catch (e: any) {
      console.error(e)
      notify({
        title: 'Transaction failed',
        description: e.message,
        txid: e?.txid,
        type: 'error',
      })
      setSubmitting(false)
    }
  }, [bank, inputAmount])

  const handleSelectToken = useCallback((token: string) => {
    setSelectedToken(token)
    setShowTokenList(false)
  }, [])

  const withdrawBanks = useMemo(() => {
    if (mangoAccount) {
      const banks = group?.banksMapByName
        ? Array.from(group?.banksMapByName, ([key, value]) => {
            const bank: Bank = value[0]
            const accountBalance = getMaxWithdrawForBank(
              group,
              bank,
              mangoAccount
            )
            return {
              key,
              value,
              accountBalance: accountBalance
                ? floorToDecimal(accountBalance, bank.mintDecimals).toNumber()
                : 0,
              accountBalanceValue:
                accountBalance && bank.uiPrice
                  ? accountBalance.toNumber() * bank.uiPrice
                  : 0,
            }
          })
        : []
      return banks
    }
    return []
  }, [mangoAccount, group])

  const initHealth = useMemo(() => {
    return group && mangoAccount
      ? mangoAccount.getHealthRatioUi(group, HealthType.init)
      : 100
  }, [mangoAccount])

  const showInsufficientBalance = Number(inputAmount)
    ? tokenMax.lt(inputAmount)
    : false

  return (
    <>
      <EnterBottomExitBottom
        className="absolute bottom-0 left-0 z-20 h-full w-full overflow-auto rounded-lg bg-th-bkg-1 p-6"
        show={showTokenList}
      >
        <button
          onClick={() => setShowTokenList(false)}
          className={`absolute left-4 top-4 z-40 w-6 text-th-fgd-4 focus:outline-none md:right-2 md:top-2 md:hover:text-th-active`}
        >
          <ArrowLeftIcon className={`h-6 w-6`} />
        </button>
        <h2 className="mb-4 text-center text-lg">
          {t('select-withdraw-token')}
        </h2>
        <div className="grid auto-cols-fr grid-flow-col  px-4 pb-2">
          <div className="text-left">
            <p className="text-xs">{t('token')}</p>
          </div>
          <div className="flex justify-end">
            <p className="text-xs">{t('available-balance')}</p>
          </div>
        </div>
        <ActionTokenList
          banks={withdrawBanks}
          onSelect={handleSelectToken}
          sortByKey="accountBalanceValue"
          valueKey="accountBalance"
        />
      </EnterBottomExitBottom>
      <FadeInFadeOut show={!showTokenList}>
        <div
          className="flex flex-col justify-between"
          style={{ height: ACCOUNT_ACTION_MODAL_INNER_HEIGHT }}
        >
          <div>
            {initHealth <= 0 ? (
              <div className="mb-4">
                <InlineNotification
                  type="error"
                  desc="You have no available collateral to withdraw."
                />
              </div>
            ) : null}
            {bank ? <TokenVaultWarnings bank={bank} /> : null}
            <div className="grid grid-cols-2">
              <div className="col-span-2 flex justify-between">
                <Label text={`${t('withdraw')} ${t('token')}`} />
                <MaxAmountButton
                  className="mb-2"
                  label={t('max')}
                  onClick={() => handleSizePercentage('100')}
                  value={tokenMax.toString()}
                />
              </div>
              <div className="col-span-1 rounded-lg rounded-r-none border border-r-0 border-th-input-border bg-th-input-bkg">
                <button
                  onClick={() => setShowTokenList(true)}
                  className="default-transition flex h-full w-full items-center rounded-lg rounded-r-none py-2 px-3 text-th-fgd-2 hover:cursor-pointer hover:bg-th-bkg-2 hover:text-th-fgd-1"
                >
                  <div className="mr-2.5 flex min-w-[24px] items-center">
                    <Image
                      alt=""
                      width="24"
                      height="24"
                      src={
                        logoUri || `/icons/${selectedToken.toLowerCase()}.svg`
                      }
                    />
                  </div>
                  <div className="flex w-full items-center justify-between">
                    <div className="text-xl font-bold">{selectedToken}</div>
                    <ChevronDownIcon className="h-6 w-6" />
                  </div>
                </button>
              </div>
              <div className="col-span-1">
                <NumberFormat
                  name="amountIn"
                  id="amountIn"
                  inputMode="decimal"
                  thousandSeparator=","
                  allowNegative={false}
                  isNumericString={true}
                  decimalScale={bank?.mintDecimals || 6}
                  className="w-full rounded-lg rounded-l-none border border-th-input-border bg-th-input-bkg p-3 text-right font-mono text-xl tracking-wider text-th-fgd-1 focus:border-th-input-border-hover focus:outline-none md:hover:border-th-input-border-hover"
                  placeholder="0.00"
                  value={inputAmount}
                  onValueChange={(e: NumberFormatValues) =>
                    setInputAmount(
                      !Number.isNaN(Number(e.value)) ? e.value : ''
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
            <div className="my-6 space-y-2 border-y border-th-bkg-3 px-2 py-4">
              <HealthImpactTokenChange
                mintPk={bank!.mint}
                uiAmount={Number(inputAmount)}
              />
              <div className="flex justify-between">
                <p>{t('withdraw-value')}</p>
                <p className="font-mono text-th-fgd-1">
                  {bank?.uiPrice
                    ? formatFixedDecimals(
                        bank.uiPrice * Number(inputAmount),
                        true
                      )
                    : '-'}
                </p>
              </div>
            </div>
          </div>
          <Button
            onClick={handleWithdraw}
            className="flex w-full items-center justify-center"
            size="large"
            disabled={
              !inputAmount ||
              showInsufficientBalance ||
              initHealth <= 0 ||
              !connected
            }
          >
            {!connected ? (
              <div className="flex items-center">
                <LinkIcon className="mr-2 h-5 w-5" />
                {t('connect')}
              </div>
            ) : submitting ? (
              <Loading className="mr-2 h-5 w-5" />
            ) : showInsufficientBalance ? (
              <div className="flex items-center">
                <ExclamationCircleIcon className="mr-2 h-5 w-5 flex-shrink-0" />
                {t('swap:insufficient-balance', {
                  symbol: selectedToken,
                })}
              </div>
            ) : (
              <div className="flex items-center">
                <ArrowUpTrayIcon className="mr-2 h-5 w-5" />
                {t('withdraw')}
              </div>
            )}
          </Button>
        </div>
        {bank ? (
          <div className="pt-4">
            <TokenVaultWarnings bank={bank} />
          </div>
        ) : null}
      </FadeInFadeOut>
    </>
  )
}

export default WithdrawForm
