import { HealthType, toNative } from '@blockworks-foundation/mango-v4'
import {
  ArrowUpTrayIcon,
  ExclamationCircleIcon,
  LinkIcon,
} from '@heroicons/react/20/solid'
import Decimal from 'decimal.js'
import { useTranslation } from 'next-i18next'
import { ChangeEvent, useCallback, useMemo, useState } from 'react'
import NumberFormat, { NumberFormatValues } from 'react-number-format'

import mangoStore from '@store/mangoStore'
import {
  ACCOUNT_ACTION_MODAL_INNER_HEIGHT,
  INPUT_TOKEN_DEFAULT,
} from './../utils/constants'
import { notify } from './../utils/notifications'
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
import { useEnhancedWallet } from './wallet/EnhancedWalletProvider'
import { floorToDecimal } from 'utils/numbers'
import BankAmountWithValue from './shared/BankAmountWithValue'
import useBanksWithBalances from 'hooks/useBanksWithBalances'
import { isMangoError } from 'types'
import TokenListButton from './shared/TokenListButton'
import { ACCOUNT_ACTIONS_NUMBER_FORMAT_CLASSES, BackButton } from './BorrowForm'
import { AccountRetriever } from '@blockworks-foundation/mango-v4/dist/types/src/client'
import { AccountMeta, PublicKey } from '@solana/web3.js'
import { BN } from '@project-serum/anchor'
import Input from './forms/Input'

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
  const { handleConnect } = useEnhancedWallet()
  const banks = useBanksWithBalances('maxWithdraw')
  const [destinationAddress, setDestinationAddress] = useState('')

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

    return amount
  }, [mangoAccount, bank, group])

  const handleSizePercentage = useCallback(
    (percentage: string) => {
      if (!bank) return
      setSizePercentage(percentage)
      const amount = floorToDecimal(
        new Decimal(tokenMax).mul(percentage).div(100),
        bank.mintDecimals
      )
      setInputAmount(amount.toFixed())
    },
    [bank, tokenMax]
  )

  const setMax = useCallback(() => {
    if (!bank) return
    const max = floorToDecimal(tokenMax, bank.mintDecimals)
    setInputAmount(max.toFixed())
    setSizePercentage('100')
  }, [bank, tokenMax])

  const handleWithdraw = useCallback(async () => {
    const client = mangoStore.getState().client
    const group = mangoStore.getState().group
    const mangoAccount = mangoStore.getState().mangoAccount.current
    const actions = mangoStore.getState().actions
    if (!mangoAccount || !group || !bank) return
    setSubmitting(true)
    try {
      const nativeAmount = toNative(
        parseFloat(inputAmount),
        group.getMintDecimals(bank.mint)
      )

      const healthRemainingAccounts: PublicKey[] =
        client.buildHealthRemainingAccounts(group, [mangoAccount], [bank], [])

      const ix = await client.program.methods
        .tokenWithdraw(new BN(nativeAmount), false)
        .accounts({
          group: group.publicKey,
          account: mangoAccount.publicKey,
          owner: mangoAccount.owner,
          bank: bank.publicKey,
          vault: bank.vault,
          oracle: bank.oracle,
          tokenAccount: new PublicKey(destinationAddress),
        })
        .remainingAccounts(
          healthRemainingAccounts.map(
            (pk) =>
              ({
                pubkey: pk,
                isWritable: false,
                isSigner: false,
              } as AccountMeta)
          )
        )
        .instruction()
      const tx = await client.sendAndConfirmTransaction([ix])
      notify({
        title: 'Transaction confirmed',
        type: 'success',
        txid: tx,
      })
      await actions.reloadMangoAccount()
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
  }, [bank, inputAmount])

  const handleSelectToken = useCallback((token: string) => {
    setSelectedToken(token)
    setShowTokenList(false)
  }, [])

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
            {bank ? <TokenVaultWarnings bank={bank} type="withdraw" /> : null}
            <div className="grid grid-cols-2">
              <div className="col-span-2 flex justify-between">
                <Label text={`${t('withdraw')} ${t('token')}`} />
                {bank ? (
                  <MaxAmountButton
                    className="mb-2"
                    decimals={bank.mintDecimals}
                    label={t('max')}
                    onClick={setMax}
                    value={tokenMax}
                  />
                ) : null}
              </div>
              <div className="col-span-1">
                <TokenListButton
                  token={selectedToken}
                  logoUri={logoUri}
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
                  decimalScale={bank?.mintDecimals || 6}
                  className={ACCOUNT_ACTIONS_NUMBER_FORMAT_CLASSES}
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
            <div className="pb-4 pt-4">
              <Label text="Destination Token Account Address" />
              <Input
                type="text"
                name="name"
                id="name"
                placeholder="e.g. Sweet Caroline"
                value={destinationAddress}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setDestinationAddress(e.target.value)
                }
              />
            </div>
            {bank ? (
              <div className="my-6 space-y-1.5 border-y border-th-bkg-3 px-2 py-4">
                <HealthImpactTokenChange
                  mintPk={bank.mint}
                  uiAmount={Number(inputAmount)}
                />
                <div className="flex justify-between">
                  <p>{t('withdraw-amount')}</p>
                  <BankAmountWithValue amount={inputAmount} bank={bank} />
                </div>
              </div>
            ) : null}
          </div>
          <Button
            onClick={connected ? handleWithdraw : handleConnect}
            className="flex w-full items-center justify-center"
            size="large"
            disabled={
              connected &&
              (!inputAmount || showInsufficientBalance || initHealth <= 0)
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
      </FadeInFadeOut>
    </>
  )
}

export default WithdrawForm
