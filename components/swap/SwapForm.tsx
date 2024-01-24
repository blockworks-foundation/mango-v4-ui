import { useState, useCallback, useEffect } from 'react'
import { PublicKey } from '@solana/web3.js'
import mangoStore from '@store/mangoStore'
import ContentBox from '../shared/ContentBox'
import { useTranslation } from 'next-i18next'
import SwapFormTokenList from './SwapFormTokenList'
import { EnterBottomExitBottom } from '../shared/Transitions'
import { OUTPUT_TOKEN_DEFAULT, SWAP_MARGIN_KEY } from '../../utils/constants'
import TokenVaultWarnings from '@components/shared/TokenVaultWarnings'
import SwapSettings from './SwapSettings'
import InlineNotification from '@components/shared/InlineNotification'
import Tooltip from '@components/shared/Tooltip'
import MarketSwapForm from './MarketSwapForm'
import Switch from '@components/forms/Switch'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { SwapFormTokenListType } from './SwapFormTokenList'
import { SwapTypes } from 'types'
import TriggerSwapForm from './TriggerSwapForm'
import WalletSwapForm from './WalletSwapForm'
import TabButtons from '@components/shared/TabButtons'
import useMangoAccount from 'hooks/useMangoAccount'
import { useWallet } from '@solana/wallet-adapter-react'
import { useRouter } from 'next/router'
import SwapSummaryInfo from './SwapSummaryInfo'

const set = mangoStore.getState().set

export const handleTokenInSelect = (mintAddress: string, close: () => void) => {
  const group = mangoStore.getState().group
  if (group) {
    const bank = group.getFirstBankByMint(new PublicKey(mintAddress))
    set((s) => {
      s.swap.inputBank = bank
    })
  }
  close()
}

export const handleTokenOutSelect = (
  mintAddress: string,
  close: () => void,
) => {
  const group = mangoStore.getState().group
  if (group) {
    const bank = group.getFirstBankByMint(new PublicKey(mintAddress))
    set((s) => {
      s.swap.outputBank = bank
    })
  }
  close()
}

const SwapForm = () => {
  const { t } = useTranslation(['common', 'swap', 'trade'])
  const groupLoaded = mangoStore((s) => s.groupLoaded)
  const { mangoAccountAddress, initialLoad } = useMangoAccount()
  const { connected } = useWallet()
  const { query } = useRouter()
  const [showTokenSelect, setShowTokenSelect] =
    useState<SwapFormTokenListType>()
  const [showSettings, setShowSettings] = useState(false)
  const [walletSwap, setWalletSwap] = useState(false)
  const [, setSavedSwapMargin] = useLocalStorageState<boolean>(
    SWAP_MARGIN_KEY,
    true,
  )

  const {
    margin: useMargin,
    inputBank,
    outputBank,
    swapOrTrigger,
  } = mangoStore((s) => s.swap)

  // enable wallet swap when connected and no mango account
  useEffect(() => {
    if (connected && !mangoAccountAddress && !initialLoad) {
      setWalletSwap(true)
    }
  }, [connected, mangoAccountAddress, initialLoad])

  // setup swap from url query
  useEffect(() => {
    const { group } = mangoStore.getState()
    if ('walletSwap' in query) {
      setWalletSwap(true)
    }
    if (!groupLoaded) return
    if (query.in) {
      const inBank = group?.banksMapByName.get(query.in.toString())?.[0]
      set((state) => {
        state.swap.inputBank = inBank
      })
    }
    if (query.out) {
      const outBank = group?.banksMapByName.get(query.out.toString())?.[0]
      set((state) => {
        state.swap.outputBank = outBank
      })
    }
  }, [groupLoaded, query])

  const handleSwapOrTrigger = useCallback(
    (orderType: SwapTypes) => {
      set((state) => {
        state.swap.swapOrTrigger = orderType
        if (orderType !== 'swap' && outputBank?.name === OUTPUT_TOKEN_DEFAULT) {
          const { group } = mangoStore.getState()
          const outputBankName = inputBank?.name === 'USDC' ? 'SOL' : 'USDC'
          state.swap.outputBank = group?.banksMapByName.get(outputBankName)?.[0]
        }
      })
    },
    [inputBank, outputBank],
  )

  useEffect(() => {
    setSavedSwapMargin(useMargin)
  }, [useMargin])

  return (
    <ContentBox
      hidePadding
      className="relative overflow-hidden border-x-0 bg-th-bkg-1 md:border-b-0 md:border-l md:border-r-0 md:border-t-0"
    >
      <div>
        <EnterBottomExitBottom
          className="thin-scroll absolute bottom-0 left-0 z-20 h-full w-full overflow-auto bg-th-bkg-1 p-6 pb-0"
          show={!!showTokenSelect}
        >
          <SwapFormTokenList
            onClose={() => setShowTokenSelect(undefined)}
            onTokenSelect={
              showTokenSelect === 'input' ||
              showTokenSelect === 'reduce-input' ||
              showTokenSelect === 'wallet-input'
                ? handleTokenInSelect
                : handleTokenOutSelect
            }
            type={showTokenSelect}
            useMargin={swapOrTrigger === 'swap' ? useMargin : false}
            walletSwap={walletSwap}
          />
        </EnterBottomExitBottom>
        <EnterBottomExitBottom
          className="thin-scroll absolute bottom-0 left-0 z-20 h-full w-full overflow-auto bg-th-bkg-1 p-6 pb-0"
          show={showSettings}
        >
          <SwapSettings onClose={() => setShowSettings(false)} />
        </EnterBottomExitBottom>
        <div className="relative border-b border-th-bkg-3">
          <TabButtons
            activeValue={swapOrTrigger}
            fillWidth
            values={[
              ['swap', 0],
              ['trade:trigger-order', 0],
            ]}
            onChange={(v) => handleSwapOrTrigger(v)}
          />
        </div>
        <div></div>
        <div className="relative">
          {swapOrTrigger === 'swap' ? (
            <>
              <div className="flex justify-end pb-3 pt-4">
                <div className="flex justify-between px-4 md:px-6">
                  <Switch
                    checked={walletSwap}
                    onChange={() => setWalletSwap(!walletSwap)}
                    small
                  >
                    <Tooltip content={t('swap:tooltip-wallet-swap')}>
                      <span className="tooltip-underline">
                        {t('swap:wallet-swap')}
                      </span>
                    </Tooltip>
                  </Switch>
                </div>
              </div>
              {walletSwap ? (
                <div className="px-4 md:px-6">
                  <WalletSwapForm setShowTokenSelect={setShowTokenSelect} />
                </div>
              ) : (
                <div className="px-4 md:px-6">
                  <MarketSwapForm setShowTokenSelect={setShowTokenSelect} />
                </div>
              )}
            </>
          ) : (
            <div className="px-4 pt-4 md:px-6">
              <TriggerSwapForm
                showTokenSelect={showTokenSelect}
                setShowTokenSelect={setShowTokenSelect}
              />
            </div>
          )}
          <div className="px-4 pb-6 md:px-6">
            {inputBank && !walletSwap ? (
              <TokenVaultWarnings bank={inputBank} type="swap" />
            ) : null}
            {inputBank &&
            !walletSwap &&
            inputBank.areBorrowsReduceOnly() &&
            useMargin ? (
              <div className="pb-4">
                <InlineNotification
                  type="warning"
                  desc={t('swap:input-reduce-only-warning', {
                    symbol: inputBank.name,
                  })}
                />
              </div>
            ) : null}
            {outputBank && !walletSwap && outputBank.areDepositsReduceOnly() ? (
              <div className="pb-4">
                <InlineNotification
                  type="warning"
                  desc={t('swap:output-reduce-only-warning', {
                    symbol: outputBank.name,
                  })}
                />
              </div>
            ) : null}
            <SwapSummaryInfo
              walletSwap={walletSwap}
              setShowSettings={setShowSettings}
            />
          </div>
        </div>
      </div>
    </ContentBox>
  )
}

export default SwapForm
