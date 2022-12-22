import {
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddress,
  toUiDecimalsForQuote,
} from '@blockworks-foundation/mango-v4'
import {
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  ChevronDownIcon,
  ExclamationCircleIcon,
  LinkIcon,
} from '@heroicons/react/20/solid'
import { Wallet } from '@project-serum/anchor'
import { useWallet } from '@solana/wallet-adapter-react'
import Decimal from 'decimal.js'
import { useTranslation } from 'next-i18next'
import Image from 'next/legacy/image'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import NumberFormat, { NumberFormatValues } from 'react-number-format'
import mangoStore from '@store/mangoStore'
import {
  ACCOUNT_ACTION_MODAL_INNER_HEIGHT,
  ALPHA_DEPOSIT_LIMIT,
  Chain,
  ETH_BRIDGE_ADDRESS,
  ETH_TOKEN_BRIDGE_ADDRESS,
  INPUT_TOKEN_DEFAULT,
  MAX_VAA_UPLAOD_RETRIES_SOLANA,
  SOLANA_TOKEN_BRIDGE_ADDRESS,
  SOL_BRIDGE_ADDRESS,
  WETH_CONTRACT_ADDRESS,
  WETH_DECIMALS_SOLANA,
  WORMHOLE_RPC_HOSTS,
} from './../utils/constants'
import { notify } from './../utils/notifications'
import { floorToDecimal, formatFixedDecimals } from './../utils/numbers'
import { TokenAccount } from './../utils/tokens'
import ActionTokenList from './account/ActionTokenList'
import ButtonGroup from './forms/ButtonGroup'
import Label from './forms/Label'
import Button from './shared/Button'
import InlineNotification from './shared/InlineNotification'
import Loading from './shared/Loading'
import { EnterBottomExitBottom, FadeInFadeOut } from './shared/Transitions'
import { withValueLimit } from './swap/SwapForm'
import MaxAmountButton from '@components/shared/MaxAmountButton'
import Tooltip from '@components/shared/Tooltip'
import HealthImpactTokenChange from '@components/HealthImpactTokenChange'
import SolBalanceWarnings from '@components/shared/SolBalanceWarnings'
import useJupiterMints from 'hooks/useJupiterMints'
import useMangoGroup from 'hooks/useMangoGroup'
import { useWeb3Modal } from '@web3modal/react'
import { useAccount, useDisconnect, useSigner } from 'wagmi'
import { getDefaultProvider, utils } from 'ethers'
import usePrevious from './shared/usePrevious'
import {
  getForeignAssetSolana,
  hexToUint8Array,
  nativeToHexString,
  parseSequenceFromLogEth,
  getEmitterAddressEth,
  getSignedVAAWithRetry,
  postVaaSolanaWithRetry,
  CHAIN_ID_ETH,
  CHAIN_ID_SOLANA,
  redeemOnSolana,
  transferFromEthNative,
} from '@certusone/wormhole-sdk'
import { PublicKey, Transaction } from '@solana/web3.js'

interface DepositFormProps {
  onSuccess: () => void
  token?: string
  onChainSwitch: (chain: Chain) => void
}

export const walletBalanceForToken = (
  walletTokens: TokenAccount[],
  token: string
): { maxAmount: number; maxDecimals: number } => {
  const group = mangoStore.getState().group
  const bank = group?.banksMapByName.get(token)?.[0]

  let walletToken
  if (bank) {
    const tokenMint = bank?.mint
    walletToken = tokenMint
      ? walletTokens.find((t) => t.mint.toString() === tokenMint.toString())
      : null
  }

  return {
    maxAmount: walletToken ? walletToken.uiAmount : 0,
    maxDecimals: bank?.mintDecimals || 6,
  }
}

function DepositForm({ onSuccess, token, onChainSwitch }: DepositFormProps) {
  //-------ETH chain-----------

  //for now we only use ETH
  //other tokens would need better abstraction
  const [chain, setChain] = useState(Chain.SOL)
  const { open } = useWeb3Modal()
  const { isConnected, address } = useAccount()
  const previousAddress = usePrevious(address)
  const [ethBalance, setEthBalance] = useState({
    maxAmount: 0,
    maxDecimals: WETH_DECIMALS_SOLANA,
  })
  const { disconnect } = useDisconnect()
  const { data: signer } = useSigner()
  const isEthWalletConnected = isConnected
  const isEthChain = chain === Chain.ETH
  useEffect(() => {
    const getEthBalance = async () => {
      const provider = getDefaultProvider()
      const balance = await provider.getBalance(address!)
      const balanceInEth = utils.formatEther(balance)
      setEthBalance({
        maxAmount: Number(
          floorToDecimal(balanceInEth, WETH_DECIMALS_SOLANA).toFixed()
        ),
        maxDecimals: WETH_DECIMALS_SOLANA,
      })
    }
    console.log(
      address &&
        isEthChain &&
        !ethBalance.maxAmount &&
        previousAddress !== address
    )
    if (
      address &&
      isEthChain &&
      !ethBalance.maxAmount &&
      previousAddress !== address
    ) {
      console.log('123')
      getEthBalance()
    }
  }, [address, isEthChain, ethBalance, previousAddress])

  useEffect(() => {
    onChainSwitch(chain)
    if (chain === Chain.ETH) {
      setSelectedToken('ETH')
    }
    if (chain === Chain.SOL) {
      setSelectedToken(defaultToken)
    }
    return () => {
      if (isEthWalletConnected) {
        disconnect()
      }
    }
  }, [chain])

  //-------ETH chain-----------

  const defaultToken = token || INPUT_TOKEN_DEFAULT
  const { t } = useTranslation('common')
  const { group } = useMangoGroup()
  const [inputAmount, setInputAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [selectedToken, setSelectedToken] = useState(defaultToken)
  const [showTokenList, setShowTokenList] = useState(false)
  const [sizePercentage, setSizePercentage] = useState('')
  const { mangoTokens } = useJupiterMints()

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

  const { wallet, connected } = useWallet()
  const walletTokens = mangoStore((s) => s.wallet.tokens)

  const tokenMax = useMemo(() => {
    return isEthChain
      ? ethBalance
      : walletBalanceForToken(walletTokens, selectedToken)
  }, [walletTokens, selectedToken, ethBalance.maxAmount, isEthChain])

  const setMax = useCallback(() => {
    setInputAmount(tokenMax.maxAmount.toString())
    setSizePercentage('100')
  }, [tokenMax])

  const handleSizePercentage = useCallback(
    (percentage: string) => {
      setSizePercentage(percentage)

      let amount = new Decimal(tokenMax.maxAmount).mul(percentage).div(100)
      amount = floorToDecimal(amount, tokenMax.maxDecimals)

      setInputAmount(amount.toString())
    },
    [tokenMax]
  )

  const handleSelectToken = (token: string) => {
    setSelectedToken(token)
    setShowTokenList(false)
  }

  const handleSetShowTokenList = (val: boolean) => {
    if (isEthChain) {
      return
    }
    setShowTokenList(val)
  }

  const handleSolanaChainDeposit = async () => {
    const client = mangoStore.getState().client
    const group = mangoStore.getState().group
    const actions = mangoStore.getState().actions
    const mangoAccount = mangoStore.getState().mangoAccount.current

    if (!mangoAccount || !group || !bank) return

    setSubmitting(true)
    try {
      const tx = await client.tokenDeposit(
        group,
        mangoAccount,
        bank.mint,
        parseFloat(inputAmount)
      )
      notify({
        title: 'Transaction confirmed',
        type: 'success',
        txid: tx,
      })

      await actions.reloadMangoAccount()
      actions.fetchWalletTokens(wallet!.adapter as unknown as Wallet)
      setSubmitting(false)
      onSuccess()
    } catch (e: any) {
      notify({
        title: 'Transaction failed',
        description: e.message,
        txid: e?.txid,
        type: 'error',
      })
      console.error('Error depositing:', e)
      setSubmitting(false)
    }
  }
  const handleEthChainDeposit = async () => {
    const anchorProvider = mangoStore.getState().provider
    const connection = mangoStore.getState().connection
    const group = mangoStore.getState().group
    const mangoAccount = mangoStore.getState().mangoAccount.current
    const actions = mangoStore.getState().actions

    if (!mangoAccount || !group || !bank || !address || !wallet) return

    setSubmitting(true)
    try {
      const walletPk = wallet!.adapter.publicKey!
      // determine destination address - an associated token account
      const solanaMintKey = new PublicKey(
        (await getForeignAssetSolana(
          connection,
          SOLANA_TOKEN_BRIDGE_ADDRESS,
          CHAIN_ID_ETH,
          hexToUint8Array(
            nativeToHexString(WETH_CONTRACT_ADDRESS, CHAIN_ID_ETH) || ''
          )
        )) || ''
      )

      const recipientAddress = await getAssociatedTokenAddress(
        solanaMintKey,
        walletPk
      )

      try {
        await connection.getTokenAccountBalance(recipientAddress)
      } catch (e) {
        const ix = await createAssociatedTokenAccountIdempotentInstruction(
          walletPk,
          walletPk,
          solanaMintKey
        )
        const tx = new Transaction()
        const recentBlock = await connection.getLatestBlockhash()
        tx.recentBlockhash = recentBlock.blockhash
        tx.feePayer = walletPk
        tx.add(ix)
        const signed = await anchorProvider.wallet.signTransaction(tx)
        const txid = await connection.sendRawTransaction(signed.serialize())
        await connection.confirmTransaction(txid)
      }
      const transferAmount = utils.parseEther(inputAmount)
      const receipt = await transferFromEthNative(
        ETH_TOKEN_BRIDGE_ADDRESS,
        signer!,
        transferAmount,
        CHAIN_ID_SOLANA,
        recipientAddress.toBuffer()
      )

      // Get the sequence number and emitter address required to fetch the signedVAA of our message
      const sequence = parseSequenceFromLogEth(receipt, ETH_BRIDGE_ADDRESS)
      const emitterAddress = getEmitterAddressEth(ETH_TOKEN_BRIDGE_ADDRESS)
      // Fetch the signedVAA from the Wormhole Network (this may require retries while you wait for confirmation)
      const vaaBytesResponse = await getSignedVAAWithRetry(
        WORMHOLE_RPC_HOSTS,
        CHAIN_ID_ETH,
        emitterAddress,
        sequence
      )
      // On Solana, we have to post the signedVAA ourselves
      await postVaaSolanaWithRetry(
        connection,
        //do not change this to wallet.signTransaction because of this binding inside signTransaction
        async function (transaction) {
          const signed = await anchorProvider.wallet.signTransaction(
            transaction
          )
          return signed
        },
        SOL_BRIDGE_ADDRESS,
        wallet!.adapter.publicKey!,
        Buffer.from(vaaBytesResponse.vaaBytes),
        MAX_VAA_UPLAOD_RETRIES_SOLANA
      )
      // Finally, redeem on Solana
      const transaction = await redeemOnSolana(
        connection,
        SOL_BRIDGE_ADDRESS,
        SOLANA_TOKEN_BRIDGE_ADDRESS,
        wallet.adapter.publicKey!,
        vaaBytesResponse.vaaBytes
      )
      const signed = await anchorProvider.wallet.signTransaction(transaction)
      const txid = await connection.sendRawTransaction(signed.serialize())
      const blockhash = await connection.getLatestBlockhash()
      await connection.confirmTransaction({
        blockhash: blockhash.blockhash,
        lastValidBlockHeight: blockhash.lastValidBlockHeight,
        signature: txid,
      })
      await actions.fetchWalletTokens(wallet!.adapter as unknown as Wallet)
      await handleSolanaChainDeposit()
    } catch (e: any) {
      notify({
        title: 'Transaction failed',
        description: e.message,
        txid: e?.txid,
        type: 'error',
      })
      console.error('Error depositing:', e)
      setSubmitting(false)
    }
  }

  const handleDeposit = async () => {
    if (chain === Chain.ETH) {
      handleEthChainDeposit()
      return
    }
    handleSolanaChainDeposit()
  }

  // TODO extract into a shared hook for UserSetup.tsx
  const banks = useMemo(() => {
    const banks = group?.banksMapByName
      ? Array.from(group?.banksMapByName, ([key, value]) => {
          const walletBalance = isEthChain
            ? ethBalance
            : walletBalanceForToken(walletTokens, key)
          return {
            key,
            value,
            walletBalance: floorToDecimal(
              walletBalance.maxAmount,
              walletBalance.maxDecimals
            ).toNumber(),
            walletBalanceValue: walletBalance.maxAmount * value[0].uiPrice!,
          }
        })
      : []
    return banks
  }, [group?.banksMapByName, walletTokens, isEthChain, ethBalance.maxAmount])

  const exceedsAlphaMax = useMemo(() => {
    const mangoAccount = mangoStore.getState().mangoAccount.current
    const group = mangoStore.getState().group
    if (!group || !mangoAccount) return
    if (
      mangoAccount.owner.toString() ===
      '8SSLjXBEVk9nesbhi9UMCA32uijbVBUqWoKPPQPTekzt'
    )
      return false
    const accountValue = toUiDecimalsForQuote(
      mangoAccount.getEquity(group).toNumber()
    )
    return (
      parseFloat(inputAmount) * (bank?.uiPrice || 1) + accountValue >
        ALPHA_DEPOSIT_LIMIT || accountValue > ALPHA_DEPOSIT_LIMIT
    )
  }, [inputAmount, bank])

  const showInsufficientBalance = tokenMax.maxAmount < Number(inputAmount)

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
          {t('select-deposit-token')}
        </h2>
        <div className="grid auto-cols-fr grid-flow-col px-4 pb-2">
          <div className="text-left">
            <p className="text-xs">{t('token')}</p>
          </div>
          <div className="text-right">
            <p className="text-xs">{t('deposit-rate')}</p>
          </div>
          <div className="text-right">
            <p className="whitespace-nowrap text-xs">{t('wallet-balance')}</p>
          </div>
        </div>

        <ActionTokenList
          banks={banks}
          onSelect={handleSelectToken}
          showDepositRates
          sortByKey="walletBalanceValue"
          valueKey="walletBalance"
        />
      </EnterBottomExitBottom>
      <FadeInFadeOut
        className={`flex h-[${ACCOUNT_ACTION_MODAL_INNER_HEIGHT}] flex-col justify-between`}
        show={!showTokenList}
      >
        <div>
          <InlineNotification
            type="info"
            desc={`There is a $${ALPHA_DEPOSIT_LIMIT} account value limit during alpha
            testing.`}
          />
          <SolBalanceWarnings
            amount={inputAmount}
            setAmount={setInputAmount}
            selectedToken={selectedToken}
          />
          <div className="flex justify-between pt-3">
            <Label text={t('deposit-from')} />
            <div className="flex space-x-4">
              <div
                className={`cursor-pointer ${
                  chain !== Chain.SOL ? 'grayscale' : ''
                }`}
                onClick={() => setChain(Chain.SOL)}
              >
                <Image src="/icons/sol.svg" width={24} height={24} />
              </div>
              <div
                className={`cursor-pointer ${
                  chain !== Chain.ETH ? 'grayscale' : ''
                }`}
                onClick={() => setChain(Chain.ETH)}
              >
                <Image src="/icons/eth.svg" width={24} height={24} />
              </div>
            </div>
          </div>
          {isEthChain && (
            <div className="space-y-4 pt-3">
              <InlineNotification
                type="info"
                desc={t('wormhole-deposit-info')}
              />
              <InlineNotification
                type="info"
                desc={t('wormhole-deposit-description')}
              />
            </div>
          )}

          <div className="mt-4 grid grid-cols-2">
            <div className="col-span-2 flex justify-between">
              <Label text={`${t('deposit')} ${t('token')}`} />
              <MaxAmountButton
                className="mb-2"
                label={t('wallet-balance')}
                onClick={setMax}
                value={floorToDecimal(
                  tokenMax.maxAmount,
                  tokenMax.maxDecimals
                ).toFixed()}
              />
            </div>
            <div className="col-span-1 rounded-lg rounded-r-none border border-r-0 border-th-input-border bg-th-input-bkg">
              <button
                onClick={() => handleSetShowTokenList(true)}
                className="default-transition flex h-full w-full items-center rounded-lg rounded-r-none py-2 px-3 text-th-fgd-2 hover:cursor-pointer hover:bg-th-bkg-2 hover:text-th-fgd-1"
              >
                <div className="mr-2.5 flex min-w-[24px] items-center">
                  <Image
                    alt=""
                    width="24"
                    height="24"
                    src={logoUri || `/icons/${selectedToken.toLowerCase()}.svg`}
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
                onValueChange={(e: NumberFormatValues) => {
                  setInputAmount(!Number.isNaN(Number(e.value)) ? e.value : '')
                }}
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
          <div className="my-6 space-y-1.5 border-y border-th-bkg-3 px-2 py-4 text-sm ">
            <HealthImpactTokenChange
              mintPk={bank!.mint}
              uiAmount={Number(inputAmount)}
              isDeposit
            />
            <div className="flex justify-between">
              <p>{t('deposit-value')}</p>
              <p className="font-mono">
                {bank?.uiPrice
                  ? formatFixedDecimals(
                      bank.uiPrice * Number(inputAmount),
                      true
                    )
                  : '-'}
              </p>
            </div>
            {/* <div className="flex justify-between">
              <div className="flex items-center">
                <Tooltip content={t('asset-weight-desc')}>
                  <p className="tooltip-underline">{t('asset-weight')}</p>
                </Tooltip>
              </div>
              <p className="font-mono">{bank!.initAssetWeight.toFixed(2)}x</p>
            </div> */}
            <div className="flex justify-between">
              <Tooltip content={t('tooltip-collateral-value')}>
                <p className="tooltip-underline">{t('collateral-value')}</p>
              </Tooltip>
              <p className="font-mono">
                {formatFixedDecimals(
                  bank!.uiPrice! *
                    Number(inputAmount) *
                    Number(bank!.initAssetWeight),
                  true
                )}
              </p>
            </div>
          </div>
          {!isEthWalletConnected && isEthChain ? (
            <Button disabled={!connected} onClick={() => open()}>
              Connect Ethereum wallet
            </Button>
          ) : (
            <Button
              onClick={handleDeposit}
              className="flex w-full items-center justify-center"
              disabled={
                !inputAmount ||
                exceedsAlphaMax ||
                showInsufficientBalance ||
                !connected
              }
              size="large"
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
                  <ArrowDownTrayIcon className="mr-2 h-5 w-5" />
                  {t('deposit')}
                </div>
              )}
            </Button>
          )}
        </div>
      </FadeInFadeOut>
    </>
  )
}

export default DepositForm
