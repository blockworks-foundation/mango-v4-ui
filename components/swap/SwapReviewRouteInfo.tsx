import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  TransactionInstruction,
  PublicKey,
  VersionedTransaction,
  Connection,
  TransactionMessage,
  AddressLookupTableAccount,
} from '@solana/web3.js'
import Decimal from 'decimal.js'
import * as sentry from '@sentry/nextjs'

import mangoStore from '@store/mangoStore'
import Button, { IconButton } from '../shared/Button'
import Loading from '../shared/Loading'
import {
  ArrowLeftIcon,
  PencilIcon,
  ArrowsRightLeftIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  ArrowPathIcon,
} from '@heroicons/react/20/solid'
import { useTranslation } from 'next-i18next'
import { formatNumericValue } from '../../utils/numbers'
import { notify } from '../../utils/notifications'
import useJupiterMints from '../../hooks/useJupiterMints'
import { JupiterV6RouteInfo, JupiterV6RoutePlan } from 'types/jupiter'
import useJupiterSwapData from './useJupiterSwapData'
// import { Transaction } from '@solana/web3.js'
import {
  JUPITER_V6_QUOTE_API_MAINNET,
  MANGO_ROUTER_API_URL,
  SOUND_SETTINGS_KEY,
} from 'utils/constants'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { Howl } from 'howler'
import { INITIAL_SOUND_SETTINGS } from '@components/settings/SoundSettings'
import Tooltip from '@components/shared/Tooltip'
import { Disclosure, Transition } from '@headlessui/react'
import RoutesModal from './RoutesModal'
// import { createAssociatedTokenAccountIdempotentInstruction } from '@blockworks-foundation/mango-v4'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import { isMangoError } from 'types'
import { useWallet } from '@solana/wallet-adapter-react'
import TokenLogo from '@components/shared/TokenLogo'
import {
  Bank,
  TransactionErrors,
  parseTxForKnownErrors,
} from '@blockworks-foundation/mango-v4'
import CircularProgress from '@components/shared/CircularProgress'
import {
  QueryObserverResult,
  RefetchOptions,
  RefetchQueryFilters,
} from '@tanstack/react-query'
import { isTokenInsured } from '@components/DepositForm'
import UninsuredNotification from '@components/shared/UninsuredNotification'
import { sendTxAndConfirm } from 'utils/governance/tools'
import useAnalytics from 'hooks/useAnalytics'

type JupiterRouteInfoProps = {
  amountIn: Decimal
  loadingRoute: boolean
  isWalletSwap?: boolean
  onClose: () => void
  onSuccess?: () => void
  refetchRoute:
    | (<TPageData>(
        options?: (RefetchOptions & RefetchQueryFilters<TPageData>) | undefined,
      ) => Promise<
        QueryObserverResult<{ bestRoute: JupiterV6RouteInfo | null }, Error>
      >)
    | undefined
  routes: JupiterV6RouteInfo[] | undefined
  selectedRoute: JupiterV6RouteInfo | undefined | null
  setSelectedRoute: Dispatch<
    SetStateAction<JupiterV6RouteInfo | undefined | null>
  >
  slippage: number
  show: boolean
}

const deserializeJupiterIxAndAlt = async (
  connection: Connection,
  swapTransaction: string,
): Promise<[TransactionInstruction[], AddressLookupTableAccount[]]> => {
  const parsedSwapTransaction = VersionedTransaction.deserialize(
    Buffer.from(swapTransaction, 'base64'),
  )
  const message = parsedSwapTransaction.message
  // const lookups = message.addressTableLookups
  const addressLookupTablesResponses = await Promise.all(
    message.addressTableLookups.map((alt) =>
      connection.getAddressLookupTable(alt.accountKey),
    ),
  )
  const addressLookupTables: AddressLookupTableAccount[] =
    addressLookupTablesResponses
      .map((alt) => alt.value)
      .filter((x): x is AddressLookupTableAccount => x !== null)

  const decompiledMessage = TransactionMessage.decompile(message, {
    addressLookupTableAccounts: addressLookupTables,
  })

  return [decompiledMessage.instructions, addressLookupTables]
}

const calculateOutFees = (
  routePlan: JupiterV6RoutePlan[],
  inputBank: Bank,
  outputBank: Bank,
  outputDecimals: number,
): [number, number] => {
  let outFee = 0
  for (let i = 0; i < routePlan.length; i++) {
    const r = routePlan[i].swapInfo
    const price = r.outAmount / r.inAmount
    outFee *= price
    if (r.feeMint === r.outputMint) {
      outFee += r.feeAmount
    } else {
      outFee += r.feeAmount * price
    }
  }
  const jupiterFee = outFee / 10 ** outputDecimals

  const flashLoanSwapFeeRate = Math.max(
    inputBank.flashLoanSwapFeeRate,
    outputBank.flashLoanSwapFeeRate,
  )
  const mangoSwapFee = routePlan[0].swapInfo.inAmount * flashLoanSwapFeeRate

  return [jupiterFee, mangoSwapFee]
}

// const prepareMangoRouterInstructions = async (
//   selectedRoute: RouteInfo,
//   inputMint: PublicKey,
//   outputMint: PublicKey,
//   userPublicKey: PublicKey,
// ): Promise<[TransactionInstruction[], AddressLookupTableAccount[]]> => {
//   if (!selectedRoute || !selectedRoute.mints || !selectedRoute.instructions) {
//     return [[], []]
//   }
//   const mintsToFilterOut = [inputMint, outputMint]
//   const filteredOutMints = [
//     ...selectedRoute.mints.filter(
//       (routeMint) =>
//         !mintsToFilterOut.find((filterOutMint) =>
//           filterOutMint.equals(routeMint),
//         ),
//     ),
//   ]
//   const additionalInstructions = []
//   for (const mint of filteredOutMints) {
//     const ix = await createAssociatedTokenAccountIdempotentInstruction(
//       userPublicKey,
//       userPublicKey,
//       mint,
//     )
//     additionalInstructions.push(ix)
//   }
//   const instructions = [
//     ...additionalInstructions,
//     ...selectedRoute.instructions,
//   ]
//   return [instructions, []]
// }

/**  Given a Jupiter route, fetch the transaction for the user to sign.
 **This function should ONLY be used for wallet swaps* */
export const fetchJupiterWalletSwapTransaction = async (
  selectedRoute: JupiterV6RouteInfo,
  userPublicKey: PublicKey,
  slippage: number,
): Promise<VersionedTransaction> => {
  // docs https://station.jup.ag/api-v6/post-swap
  const transactions = await (
    await fetch(`${JUPITER_V6_QUOTE_API_MAINNET}/swap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // response from /quote api
        quoteResponse: selectedRoute,
        // user public key to be used for the swap
        userPublicKey,
        slippageBps: Math.ceil(slippage * 100),
      }),
    })
  ).json()

  const { swapTransaction } = transactions
  const parsedSwapTransaction = VersionedTransaction.deserialize(
    Buffer.from(swapTransaction, 'base64'),
  )
  return parsedSwapTransaction
}
/**  Given a Jupiter route, fetch the transaction for the user to sign.
 **This function should be used for margin swaps* */
export const fetchJupiterTransaction = async (
  connection: Connection,
  selectedRoute: JupiterV6RouteInfo,
  userPublicKey: PublicKey,
  slippage: number,
  inputMint: PublicKey,
  outputMint: PublicKey,
  origin?: 'mango' | 'jupiter' | 'raydium',
): Promise<[TransactionInstruction[], AddressLookupTableAccount[]]> => {
  // docs https://station.jup.ag/api-v6/post-swap
  const transactions = await (
    await fetch(
      `${
        origin === 'mango' ? MANGO_ROUTER_API_URL : JUPITER_V6_QUOTE_API_MAINNET
      }/swap`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // response from /quote api
          quoteResponse: selectedRoute,
          // user public key to be used for the swap
          userPublicKey,
          slippageBps: Math.ceil(slippage * 100),
          wrapAndUnwrapSol: false,
        }),
      },
    )
  ).json()

  const { swapTransaction } = transactions

  const [ixs, alts] = await deserializeJupiterIxAndAlt(
    connection,
    swapTransaction,
  )

  const isSetupIx = (pk: PublicKey): boolean =>
    pk.toString() === 'ComputeBudget111111111111111111111111111111' ||
    pk.toString() === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'

  const isDuplicateAta = (ix: TransactionInstruction): boolean => {
    return (
      ix.programId.toString() ===
        'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL' &&
      (ix.keys[3].pubkey.toString() === inputMint.toString() ||
        ix.keys[3].pubkey.toString() === outputMint.toString())
    )
  }

  //remove ATA and compute setup from swaps in margin trades
  const filtered_jup_ixs = ixs
    .filter((ix) => !isSetupIx(ix.programId))
    .filter((ix) => !isDuplicateAta(ix))

  return [filtered_jup_ixs, alts]
}

const EMPTY_COINGECKO_PRICES = {
  inputCoingeckoPrice: 0,
  outputCoingeckoPrice: 0,
}

const successSound = new Howl({
  src: ['/sounds/swap-success.mp3'],
  volume: 0.5,
})

const SwapReviewRouteInfo = ({
  amountIn,
  loadingRoute,
  isWalletSwap,
  onClose,
  onSuccess,
  refetchRoute,
  routes,
  selectedRoute,
  setSelectedRoute,
  show,
}: JupiterRouteInfoProps) => {
  const { t } = useTranslation(['common', 'account', 'swap', 'trade'])
  const slippage = mangoStore((s) => s.swap.slippage)

  const wallet = useWallet()
  const [showRoutesModal, setShowRoutesModal] = useState<boolean>(false)
  const [swapRate, setSwapRate] = useState<boolean>(false)
  const [feeValue] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [coingeckoPrices, setCoingeckoPrices] = useState(EMPTY_COINGECKO_PRICES)
  const { jupiterTokens } = useJupiterMints()
  const { inputTokenInfo, outputTokenInfo } = useJupiterSwapData()
  const inputBank = mangoStore((s) => s.swap.inputBank)
  const outputBank = mangoStore((s) => s.swap.outputBank)
  const [soundSettings] = useLocalStorageState(
    SOUND_SETTINGS_KEY,
    INITIAL_SOUND_SETTINGS,
  )
  const focusRef = useRef<HTMLButtonElement>(null)
  const { sendAnalytics } = useAnalytics()

  const [refetchRoutePercentage, setRefetchRoutePercentage] = useState(0)

  useEffect(() => {
    let currentPercentage = 0
    const countdownInterval = setInterval(() => {
      if (currentPercentage < 100) {
        currentPercentage += 5 // 5% increment per second
        setRefetchRoutePercentage(currentPercentage)
      }
    }, 1000)

    return () => {
      clearInterval(countdownInterval)
    }
  }, [selectedRoute])

  const amountOut = useMemo(() => {
    if (!selectedRoute?.outAmount || !outputTokenInfo) return
    return new Decimal(selectedRoute.outAmount.toString()).div(
      10 ** outputTokenInfo.decimals,
    )
  }, [selectedRoute, outputTokenInfo])

  useEffect(() => {
    if (focusRef?.current) {
      focusRef.current.focus()
    }
  }, [focusRef])

  useEffect(() => {
    setCoingeckoPrices(EMPTY_COINGECKO_PRICES)
    const fetchTokenPrices = async () => {
      const inputId = inputTokenInfo?.extensions?.coingeckoId
      const outputId = outputTokenInfo?.extensions?.coingeckoId

      if (inputId && outputId) {
        try {
          const results = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${inputId},${outputId}&vs_currencies=usd`,
          )
          const json = await results.json()
          if (json[inputId]?.usd && json[outputId]?.usd) {
            setCoingeckoPrices({
              inputCoingeckoPrice: json[inputId].usd,
              outputCoingeckoPrice: json[outputId].usd,
            })
          }
        } catch (e) {
          console.error('Loading coingecko prices: ', e)
        }
      }
    }

    if (inputTokenInfo && outputTokenInfo) {
      fetchTokenPrices()
    }
  }, [inputTokenInfo, outputTokenInfo])

  const onWalletSwap = useCallback(async () => {
    if (!selectedRoute || !inputBank || !outputBank || !wallet.publicKey) return
    const actions = mangoStore.getState().actions
    const client = mangoStore.getState().client
    const set = mangoStore.getState().set
    const connection = mangoStore.getState().connection
    setSubmitting(true)
    try {
      const vtx = await fetchJupiterWalletSwapTransaction(
        selectedRoute,
        wallet.publicKey,
        slippage,
      )
      const latestBlockhash = await connection.getLatestBlockhash()
      const sign = wallet.signTransaction!
      const signed = await sign(vtx)
      const txid = await sendTxAndConfirm(
        client.opts.multipleConnections,
        connection,
        signed,
        latestBlockhash,
      )
      set((s) => {
        s.swap.amountIn = ''
        s.swap.amountOut = ''
      })
      notify({
        title: 'Transaction confirmed',
        type: 'success',
        txid,
      })
      actions.fetchWalletTokens(wallet.publicKey)
    } catch (e) {
      console.log('error swapping wallet tokens', e)
    } finally {
      setSubmitting(false)
      onClose()
    }
  }, [
    inputBank,
    outputBank,
    onClose,
    selectedRoute,
    slippage,
    wallet.publicKey,
  ])

  const onSwap = useCallback(async () => {
    if (!selectedRoute) return
    let directRouteFallbackUsed = false
    try {
      const client = mangoStore.getState().client
      const group = mangoStore.getState().group
      const actions = mangoStore.getState().actions
      const set = mangoStore.getState().set
      const mangoAccount = mangoStore.getState().mangoAccount.current
      const inputBank = mangoStore.getState().swap.inputBank
      const outputBank = mangoStore.getState().swap.outputBank
      const connection = mangoStore.getState().connection

      if (
        !mangoAccount ||
        !group ||
        !inputBank ||
        !outputBank ||
        !wallet.publicKey
      )
        return
      setSubmitting(true)
      let tx = ''
      const [ixs, alts] =
        // selectedRoute.routerName === 'Mango'
        //   ? await prepareMangoRouterInstructions(
        //       selectedRoute,
        //       inputBank.mint,
        //       outputBank.mint,
        //       mangoAccount.owner,
        //     )
        // :
        selectedRoute.instructions
          ? [selectedRoute.instructions, []]
          : await fetchJupiterTransaction(
              connection,
              selectedRoute,
              wallet.publicKey,
              slippage,
              inputBank.mint,
              outputBank.mint,
              selectedRoute.origin,
            )

      try {
        sendAnalytics(
          {
            inputMintPk: inputBank.mint,
            amountIn: amountIn.toNumber(),
            outputMintPk: outputBank.mint,
          },
          'swapping',
        )
        const { signature, slot } = await client.marginTrade({
          group,
          mangoAccount,
          inputMintPk: inputBank.mint,
          amountIn: amountIn.toNumber(),
          outputMintPk: outputBank.mint,
          userDefinedInstructions: ixs,
          userDefinedAlts: alts,
          flashLoanType: { swap: {} },
        })
        tx = signature
        set((s) => {
          s.successAnimation.swap = true
          s.swap.amountIn = ''
          s.swap.amountOut = ''
        })
        if (soundSettings['swap-success']) {
          successSound.play()
        }
        sendAnalytics(
          {
            tx: `${tx}`,
          },
          'swapSuccess',
        )
        notify({
          title: 'Transaction confirmed',
          type: 'success',
          txid: signature,
          noSound: true,
        })
        actions.fetchGroup()
        actions.fetchSwapHistory(mangoAccount.publicKey.toString(), 30000)
        await actions.reloadMangoAccount(slot)
        if (onSuccess) {
          onSuccess()
        }
      } catch (e) {
        sendAnalytics(
          {
            e: `${e}`,
            tx: `${tx}`,
          },
          'onSwapError',
        )
        console.error('onSwap error: ', e)
        sentry.captureException(e)
        if (isMangoError(e)) {
          const slippageExceeded = await parseTxForKnownErrors(
            connection,
            e?.txid,
          )
          if (
            slippageExceeded ===
            TransactionErrors.JupiterSlippageToleranceExceeded
          ) {
            notify({
              title: t('swap:error-slippage-exceeded'),
              description: t('swap:error-slippage-exceeded-desc'),
              txid: e?.txid,
              type: 'error',
            })
          } else {
            notify({
              title: 'Transaction failed',
              description: e.message,
              txid: e?.txid,
              type: 'error',
            })
          }
        } else {
          const stringError = `${e}`
          if (
            stringError.toLowerCase().includes('max accounts') &&
            routes?.length &&
            routes.length > 1
          ) {
            directRouteFallbackUsed = true
            setSelectedRoute(
              routes.filter(
                (x) =>
                  JSON.stringify(x.routePlan) !==
                  JSON.stringify(selectedRoute.routePlan),
              )[0],
            )
            notify({
              title: 'Transaction failed',
              description: `${stringError} - please review route and click swap again`,
              type: 'error',
            })
          } else {
            notify({
              title: 'Transaction failed',
              description: `${stringError} - please try again`,
              type: 'error',
            })
          }
        }
      } finally {
        setSubmitting(false)
      }
    } catch (e) {
      console.error('Swap error:', e)
    } finally {
      if (!directRouteFallbackUsed) {
        onClose()
      }
    }
  }, [
    sendAnalytics,
    selectedRoute,
    wallet.publicKey,
    slippage,
    amountIn,
    soundSettings,
    onSuccess,
    t,
    routes,
    onClose,
  ])

  const onClick = isWalletSwap ? onWalletSwap : onSwap

  const [balance, borrowAmount] = useMemo(() => {
    const mangoAccount = mangoStore.getState().mangoAccount.current
    const inputBank = mangoStore.getState().swap.inputBank
    if (!mangoAccount || !inputBank) return [0, 0]

    const balance = mangoAccount.getTokenDepositsUi(inputBank)
    const remainingBalance = balance - amountIn.toNumber()
    const borrowAmount = remainingBalance < 0 ? Math.abs(remainingBalance) : 0

    return [balance, borrowAmount]
  }, [amountIn])

  const [jupiterFees] = useMemo(() => {
    if (
      !selectedRoute?.routePlan ||
      !inputBank ||
      !outputBank ||
      !outputTokenInfo
    ) {
      return [0, 0]
    }

    return calculateOutFees(
      selectedRoute?.routePlan,
      inputBank,
      outputBank,
      outputTokenInfo.decimals,
    )
  }, [inputBank, outputBank, outputTokenInfo, selectedRoute])

  const flashLoanFee = useMemo(() => {
    if (!inputBank || !outputBank) return 0
    const rate = Math.max(
      inputBank.flashLoanSwapFeeRate,
      outputBank.flashLoanSwapFeeRate,
    )
    return amountIn.mul(rate).toNumber()
  }, [amountIn, inputBank, outputBank])

  const coinGeckoPriceDifference = useMemo(() => {
    return amountOut?.toNumber()
      ? amountIn
          .div(amountOut)
          .minus(
            new Decimal(coingeckoPrices?.outputCoingeckoPrice).div(
              coingeckoPrices?.inputCoingeckoPrice,
            ),
          )
          .div(amountIn.div(amountOut))
          .mul(100)
      : new Decimal(0)
  }, [coingeckoPrices, amountIn, amountOut])

  const isInsured = useMemo(() => {
    const group = mangoStore.getState().group
    return isTokenInsured(outputBank, group)
  }, [outputBank])

  return routes?.length &&
    selectedRoute &&
    inputTokenInfo &&
    outputTokenInfo &&
    amountOut ? (
    <Transition
      className="absolute right-0 top-0 z-20 h-full w-full bg-th-bkg-1 pb-0"
      show={show}
      enter="transition ease-in duration-300"
      enterFrom="-translate-x-full"
      enterTo="translate-x-0"
      leave="transition ease-out duration-300"
      leaveFrom="translate-x-0"
      leaveTo="-translate-x-full"
    >
      <div className="thin-scroll flex h-full flex-col justify-between overflow-y-auto">
        <div>
          <div className="relative w-full px-4 pt-4">
            <IconButton
              className="absolute text-th-fgd-2"
              onClick={onClose}
              size="small"
              ref={focusRef}
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </IconButton>
            <div className="absolute right-4 h-8 w-8">
              <CircularProgress
                size={32}
                indicatorWidth={1}
                trackWidth={1}
                progress={refetchRoutePercentage}
              />
              {refetchRoute ? (
                <IconButton
                  className="absolute inset-0 text-th-fgd-2"
                  hideBg
                  onClick={() => refetchRoute()}
                  size="small"
                  ref={focusRef}
                >
                  <ArrowPathIcon
                    className={`h-5 w-5 ${
                      loadingRoute ? 'animate-spin' : null
                    }`}
                  />
                </IconButton>
              ) : null}
            </div>
          </div>
          <div className="flex justify-center bg-th-bkg-1 px-6 pt-4">
            <div className="mb-3 flex w-full flex-col items-center border-b border-th-bkg-3 pb-4">
              <div className="relative mb-2 w-[72px]">
                <TokenLogo bank={inputBank} size={40} />
                <div className="absolute right-0 top-0">
                  <TokenLogo bank={outputBank} size={40} />
                </div>
              </div>
              <p className="mb-0.5 flex items-center text-center text-lg">
                <span className="mr-1 font-mono text-th-fgd-1">
                  <FormatNumericValue value={amountIn} />
                </span>{' '}
                {inputTokenInfo?.symbol}
                <ArrowRightIcon className="mx-2 h-5 w-5 text-th-fgd-2" />
                <span className="mr-1 font-mono text-th-fgd-1">
                  <FormatNumericValue value={amountOut} />
                </span>{' '}
                {`${outputTokenInfo?.symbol}`}
              </p>
            </div>
          </div>
          <div className="space-y-2 overflow-auto px-6">
            <div className="flex justify-between">
              <p className="text-sm text-th-fgd-3">{t('price')}</p>
              <div>
                <div className="flex items-center justify-end">
                  <p className="text-right font-mono text-sm text-th-fgd-2">
                    {swapRate ? (
                      <>
                        1{' '}
                        <span className="font-body text-th-fgd-3">
                          {inputTokenInfo?.symbol} ≈{' '}
                        </span>
                        <FormatNumericValue value={amountOut.div(amountIn)} />{' '}
                        <span className="font-body text-th-fgd-3">
                          {outputTokenInfo?.symbol}
                        </span>
                      </>
                    ) : (
                      <>
                        1{' '}
                        <span className="font-body text-th-fgd-3">
                          {outputTokenInfo?.symbol} ≈{' '}
                        </span>
                        <FormatNumericValue value={amountIn.div(amountOut)} />{' '}
                        <span className="font-body text-th-fgd-3">
                          {inputTokenInfo?.symbol}
                        </span>
                      </>
                    )}
                  </p>
                  <ArrowsRightLeftIcon
                    className="ml-1 h-4 w-4 cursor-pointer text-th-fgd-2 hover:text-th-active"
                    onClick={() => setSwapRate(!swapRate)}
                  />
                </div>
                <div className="space-y-2 px-1 text-xs">
                  {coingeckoPrices?.outputCoingeckoPrice &&
                  coingeckoPrices?.inputCoingeckoPrice ? (
                    <div
                      className={`text-right font-mono ${
                        coinGeckoPriceDifference.gt(1)
                          ? 'text-th-down'
                          : 'text-th-up'
                      }`}
                    >
                      {Decimal.abs(coinGeckoPriceDifference).toFixed(1)}%{' '}
                      <span className="font-body text-th-fgd-3">{`${
                        coinGeckoPriceDifference.lte(0)
                          ? 'cheaper'
                          : 'more expensive'
                      } than CoinGecko`}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="flex justify-between">
              <p className="text-sm text-th-fgd-3">
                {t('swap:minimum-received')}
              </p>
              {outputTokenInfo?.decimals && selectedRoute ? (
                <p className="text-right font-mono text-sm text-th-fgd-2">
                  {selectedRoute.swapMode === 'ExactIn' ? (
                    <FormatNumericValue
                      value={
                        selectedRoute.otherAmountThreshold /
                        10 ** outputTokenInfo.decimals
                      }
                      decimals={outputTokenInfo.decimals}
                    />
                  ) : (
                    <FormatNumericValue
                      value={
                        selectedRoute.outAmount / 10 ** outputTokenInfo.decimals
                      }
                      decimals={outputTokenInfo.decimals}
                    />
                  )}{' '}
                  <span className="font-body text-th-fgd-3">
                    {outputTokenInfo?.symbol}
                  </span>
                </p>
              ) : null}
            </div>
            {selectedRoute?.swapMode === 'ExactOut' ? (
              <div className="flex justify-between">
                <p className="text-sm text-th-fgd-3">
                  {t('swap:maximum-cost')}
                </p>
                {inputTokenInfo?.decimals && selectedRoute ? (
                  <p className="text-right font-mono text-sm text-th-fgd-2">
                    <FormatNumericValue
                      value={
                        selectedRoute.otherAmountThreshold /
                        10 ** inputTokenInfo.decimals
                      }
                      decimals={inputTokenInfo.decimals}
                    />{' '}
                    <span className="font-body text-th-fgd-3">
                      {inputTokenInfo?.symbol}
                    </span>
                  </p>
                ) : null}
              </div>
            ) : null}
            <div className="flex justify-between">
              <Tooltip
                content={
                  <>
                    <p>
                      The price impact is the difference observed between the
                      total value of the entry tokens swapped and the
                      destination tokens obtained.
                    </p>
                    <p className="mt-1">
                      The bigger the trade is, the bigger the price impact can
                      be.
                    </p>
                  </>
                }
              >
                <p className="tooltip-underline">{t('swap:price-impact')}</p>
              </Tooltip>
              <p className="text-right font-mono text-sm text-th-fgd-2">
                {selectedRoute?.priceImpactPct * 100 < 0.1
                  ? '<0.1%'
                  : `${(selectedRoute?.priceImpactPct * 100).toFixed(2)}%`}
              </p>
            </div>
            {!isWalletSwap ? (
              <div className="flex justify-between">
                {/* <Tooltip content={t('swap:tooltip-flash-loan-fee')}> */}
                <p>{t('swap:flash-loan-fee')}</p>
                {/* </Tooltip> */}
                <p className="text-right font-mono text-sm text-th-fgd-2">
                  ≈
                  <FormatNumericValue
                    value={flashLoanFee}
                    decimals={inputBank?.mintDecimals}
                  />{' '}
                  <span className="font-body text-th-fgd-3">
                    {inputBank?.name}
                  </span>
                </p>
              </div>
            ) : null}
            <div className="flex justify-between">
              <Tooltip
                content={
                  <>
                    <p>
                      The fee displayed here is an estimate and is displayed in
                      destination tokens for convenience. Note that each leg of
                      the swap may collect its fee in different tokens, so fees
                      may vary.
                    </p>
                  </>
                }
              >
                <p className="tooltip-underline">Jupiter Fees</p>
              </Tooltip>
              <p className="text-right font-mono text-sm text-th-fgd-2">
                ≈
                <FormatNumericValue
                  value={jupiterFees}
                  decimals={outputTokenInfo.decimals}
                />{' '}
                <span className="font-body text-th-fgd-3">
                  {outputTokenInfo?.symbol}
                </span>
              </p>
            </div>

            {/* <div className="flex justify-between">
              <p className="text-th-fgd-3">Mango Fees</p>
              <p className="text-right font-mono text-sm text-th-fgd-2">
                ≈{' '}
                <FormatNumericValue
                  value={mangoFees}
                  decimals={outputTokenInfo.decimals}
                />{' '}
                <span className="font-body text-th-fgd-3">
                  {outputTokenInfo?.symbol}
                </span>
              </p>
            </div> */}
            {borrowAmount && inputBank ? (
              <>
                <div className="flex justify-between">
                  <Tooltip
                    content={
                      balance
                        ? t('swap:tooltip-borrow-balance', {
                            balance: formatNumericValue(balance),
                            borrowAmount: formatNumericValue(borrowAmount),
                            token: inputTokenInfo?.symbol,
                            rate: formatNumericValue(
                              inputBank.getBorrowRateUi(),
                              2,
                            ),
                          })
                        : t('swap:tooltip-borrow-no-balance', {
                            borrowAmount: formatNumericValue(borrowAmount),
                            token: inputTokenInfo?.symbol,
                            rate: formatNumericValue(
                              inputBank.getBorrowRateUi(),
                              2,
                            ),
                          })
                    }
                    delay={100}
                  >
                    <p className="tooltip-underline">{t('borrow-amount')}</p>
                  </Tooltip>
                  <p className="text-right font-mono text-sm text-th-fgd-2">
                    <FormatNumericValue value={borrowAmount} />{' '}
                    <span className="font-body text-th-fgd-3">
                      {inputTokenInfo?.symbol}
                    </span>
                  </p>
                </div>
                <div className="flex justify-between">
                  <Tooltip
                    content={t('loan-origination-fee-tooltip', {
                      fee: `${(
                        inputBank.loanOriginationFeeRate.toNumber() * 100
                      ).toFixed(3)}%`,
                    })}
                    delay={100}
                  >
                    <p className="tooltip-underline">
                      {t('loan-origination-fee')}
                    </p>
                  </Tooltip>
                  <p className="text-right font-mono text-th-fgd-2">
                    <FormatNumericValue
                      value={
                        borrowAmount *
                        inputBank.loanOriginationFeeRate.toNumber()
                      }
                      decimals={inputBank.mintDecimals}
                    />{' '}
                    <span className="font-body text-th-fgd-3">
                      {inputBank.name}
                    </span>
                  </p>
                </div>
              </>
            ) : null}
          </div>
          {!isInsured ? (
            <div className="mt-4 px-6">
              <UninsuredNotification name={outputBank?.name} />
            </div>
          ) : null}
        </div>
        <div className="p-6">
          <div className="mb-4 flex items-center justify-center">
            <Button
              onClick={onClick}
              className="flex w-full items-center justify-center text-base"
              size="large"
            >
              {submitting ? (
                <Loading className="mr-2 h-5 w-5" />
              ) : (
                <div className="flex items-center">
                  <ArrowsRightLeftIcon className="mr-2 h-5 w-5" />
                  {t('swap')}
                </div>
              )}
            </Button>
          </div>
          <div className="rounded-md bg-th-bkg-2">
            <Disclosure>
              {({ open }) => (
                <>
                  <Disclosure.Button
                    className={`flex w-full items-center justify-between rounded-md p-3 focus-visible:bg-th-bkg-3 ${
                      open ? 'mb-2 rounded-b-none' : ''
                    }`}
                  >
                    <p>{t('swap:route-info')}</p>
                    <ChevronDownIcon
                      className={`${
                        open ? 'rotate-180' : 'rotate-0'
                      } h-5 w-5 text-th-fgd-3`}
                    />
                  </Disclosure.Button>
                  <Disclosure.Panel className="space-y-2 p-3 pt-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-th-fgd-3">
                        {t('swap:swap-route')}
                      </p>
                      <div
                        className="flex items-center text-th-fgd-2 md:hover:cursor-pointer md:hover:text-th-fgd-3"
                        role="button"
                        onClick={() => setShowRoutesModal(true)}
                      >
                        <span className="overflow-ellipsis whitespace-nowrap">
                          {selectedRoute?.routePlan?.map((info, index) => {
                            let includeSeparator = false
                            if (
                              selectedRoute.routePlan &&
                              selectedRoute?.routePlan.length > 1 &&
                              index !== selectedRoute?.routePlan.length - 1
                            ) {
                              includeSeparator = true
                            }
                            return (
                              <span key={index}>{`${info?.swapInfo.label} ${
                                includeSeparator ? 'x ' : ''
                              }`}</span>
                            )
                          })}
                        </span>
                        <PencilIcon className="ml-2 h-4 w-4 hover:text-th-active" />
                      </div>
                    </div>
                    {typeof feeValue === 'number' ? (
                      <div className="flex justify-between">
                        <p className="text-sm text-th-fgd-3">{t('fee')}</p>
                        <div className="flex items-center">
                          <p className="text-right font-mono text-sm text-th-fgd-2">
                            ≈ ${feeValue?.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      selectedRoute?.routePlan?.map((info, index) => {
                        const feeToken = jupiterTokens.find(
                          (item) => item?.address === info.swapInfo.feeMint,
                        )
                        return (
                          <div className="flex justify-between" key={index}>
                            <p className="text-sm text-th-fgd-3">
                              {t('swap:fees-paid-to', {
                                route: info?.swapInfo.label,
                              })}
                            </p>
                            {feeToken?.decimals && (
                              <p className="pl-4 text-right font-mono text-sm text-th-fgd-2">
                                {(
                                  info.swapInfo.feeAmount /
                                  Math.pow(10, feeToken.decimals)
                                ).toFixed(6)}{' '}
                                <span className="font-body">
                                  {feeToken?.symbol}
                                </span>{' '}
                                (
                                {(
                                  (info.swapInfo.outputMint == feeToken.address
                                    ? info.swapInfo.feeAmount /
                                      info.swapInfo.outAmount
                                    : info.swapInfo.feeAmount /
                                      info.swapInfo.inAmount) * 100
                                ).toLocaleString(undefined, {
                                  maximumSignificantDigits: 2,
                                })}
                                %)
                              </p>
                            )}
                          </div>
                        )
                      })
                    )}
                  </Disclosure.Panel>
                </>
              )}
            </Disclosure>
          </div>
        </div>
        {showRoutesModal ? (
          <RoutesModal
            show={showRoutesModal}
            onClose={() => setShowRoutesModal(false)}
            setSelectedRoute={setSelectedRoute}
            selectedRoute={selectedRoute}
            routes={routes}
            inputTokenSymbol={inputTokenInfo?.name}
            outputTokenInfo={outputTokenInfo}
          />
        ) : null}
      </div>
    </Transition>
  ) : null
}

export default React.memo(SwapReviewRouteInfo)
