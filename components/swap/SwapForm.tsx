import { useState, useCallback, useMemo, useEffect } from 'react'
import { PublicKey } from '@solana/web3.js'
import { Cog8ToothIcon } from '@heroicons/react/20/solid'
import mangoStore from '@store/mangoStore'
import ContentBox from '../shared/ContentBox'
import { useTranslation } from 'next-i18next'
import SwapFormTokenList from './SwapFormTokenList'
import { IconButton, LinkButton } from '../shared/Button'
import { EnterBottomExitBottom } from '../shared/Transitions'
import { HealthType } from '@blockworks-foundation/mango-v4'
import { SWAP_MARGIN_KEY } from '../../utils/constants'
import HealthImpact from '@components/shared/HealthImpact'
import TokenVaultWarnings from '@components/shared/TokenVaultWarnings'
import SwapSettings from './SwapSettings'
import InlineNotification from '@components/shared/InlineNotification'
import Tooltip from '@components/shared/Tooltip'
import TabUnderline from '@components/shared/TabUnderline'
import MarketSwapForm from './MarketSwapForm'
import LimitSwapForm from './LimitSwapForm'
import Switch from '@components/forms/Switch'
import useLocalStorageState from 'hooks/useLocalStorageState'

const set = mangoStore.getState().set

const SwapForm = () => {
  const { t } = useTranslation(['common', 'swap', 'trade'])
  const [showTokenSelect, setShowTokenSelect] = useState<'input' | 'output'>()
  const [showSettings, setShowSettings] = useState(false)
  const [swapOrLimit, setSwapOrLimit] = useState('swap')
  const [, setSavedSwapMargin] = useLocalStorageState<boolean>(
    SWAP_MARGIN_KEY,
    true,
  )

  const {
    margin: useMargin,
    slippage,
    inputBank,
    outputBank,
    amountIn: amountInFormValue,
    amountOut: amountOutFormValue,
  } = mangoStore((s) => s.swap)

  const handleTokenInSelect = useCallback((mintAddress: string) => {
    const group = mangoStore.getState().group
    if (group) {
      const bank = group.getFirstBankByMint(new PublicKey(mintAddress))
      set((s) => {
        s.swap.inputBank = bank
        s.swap.limitPrice = ''
      })
    }
    setShowTokenSelect(undefined)
  }, [])

  const handleTokenOutSelect = useCallback((mintAddress: string) => {
    const group = mangoStore.getState().group
    if (group) {
      const bank = group.getFirstBankByMint(new PublicKey(mintAddress))
      set((s) => {
        s.swap.outputBank = bank
        s.swap.limitPrice = ''
      })
    }
    setShowTokenSelect(undefined)
  }, [])

  const maintProjectedHealth = useMemo(() => {
    const group = mangoStore.getState().group
    const mangoAccount = mangoStore.getState().mangoAccount.current
    if (
      !inputBank ||
      !mangoAccount ||
      !outputBank ||
      !amountOutFormValue ||
      !group
    )
      return 100

    const simulatedHealthRatio =
      mangoAccount.simHealthRatioWithTokenPositionUiChanges(
        group,
        [
          {
            mintPk: inputBank.mint,
            uiTokenAmount: parseFloat(amountInFormValue) * -1,
          },
          {
            mintPk: outputBank.mint,
            uiTokenAmount: parseFloat(amountOutFormValue),
          },
        ],
        HealthType.maint,
      )
    return simulatedHealthRatio > 100
      ? 100
      : simulatedHealthRatio < 0
      ? 0
      : Math.trunc(simulatedHealthRatio)
  }, [inputBank, outputBank, amountInFormValue, amountOutFormValue])

  const handleSwapOrLimit = useCallback(
    (orderType: string) => {
      setSwapOrLimit(orderType)
    },
    [outputBank, set, setSwapOrLimit],
  )

  const handleSetMargin = () => {
    set((s) => {
      s.swap.margin = !s.swap.margin
    })
  }

  useEffect(() => {
    setSavedSwapMargin(useMargin)
  }, [useMargin])

  const estSlippage = useMemo(() => {
    const { group } = mangoStore.getState()
    const amountIn = parseFloat(amountInFormValue) || 0
    if (!group || !inputBank || amountIn <= 0) return 0
    const value = amountIn * inputBank.uiPrice
    const slippage = group.getPriceImpactByTokenIndex(
      inputBank.tokenIndex,
      value,
    )
    return slippage
  }, [amountInFormValue, inputBank])

  return (
    <ContentBox
      hidePadding
      className="relative overflow-hidden border-x-0 bg-th-bkg-1 md:border-l md:border-r-0 md:border-t-0 md:border-b-0"
    >
      <div>
        <EnterBottomExitBottom
          className="thin-scroll absolute bottom-0 left-0 z-10 h-full w-full overflow-auto bg-th-bkg-1 p-6 pb-0"
          show={!!showTokenSelect}
        >
          <SwapFormTokenList
            onClose={() => setShowTokenSelect(undefined)}
            onTokenSelect={
              showTokenSelect === 'input'
                ? handleTokenInSelect
                : handleTokenOutSelect
            }
            type={showTokenSelect}
            useMargin={useMargin}
          />
        </EnterBottomExitBottom>
        <EnterBottomExitBottom
          className="thin-scroll absolute bottom-0 left-0 z-10 h-full w-full overflow-auto bg-th-bkg-1 p-6 pb-0"
          show={showSettings}
        >
          <SwapSettings onClose={() => setShowSettings(false)} />
        </EnterBottomExitBottom>
        <div className="relative p-6">
          <div className="mb-6">
            <TabUnderline
              activeValue={swapOrLimit}
              values={['swap', 'trade:trigger-order']}
              onChange={(v) => handleSwapOrLimit(v)}
            />
          </div>
          <div className="absolute right-4 top-4">
            <IconButton
              className="text-th-fgd-3"
              hideBg
              onClick={() => setShowSettings(true)}
            >
              <Cog8ToothIcon className="h-5 w-5" />
            </IconButton>
          </div>
          {swapOrLimit === 'swap' ? (
            <MarketSwapForm setShowTokenSelect={setShowTokenSelect} />
          ) : (
            <LimitSwapForm
              showTokenSelect={showTokenSelect}
              setShowTokenSelect={setShowTokenSelect}
            />
          )}
          {inputBank ? (
            <TokenVaultWarnings bank={inputBank} type="swap" />
          ) : null}
          {inputBank &&
          inputBank.areBorrowsReduceOnly() &&
          inputBank.areDepositsReduceOnly() ? (
            <div className="pb-4">
              <InlineNotification
                type="warning"
                desc={t('swap:input-reduce-only-warning', {
                  symbol: inputBank.name,
                })}
              />
            </div>
          ) : null}
          {outputBank &&
          outputBank.areBorrowsReduceOnly() &&
          outputBank.areDepositsReduceOnly() ? (
            <div className="pb-4">
              <InlineNotification
                type="warning"
                desc={t('swap:output-reduce-only-warning', {
                  symbol: outputBank.name,
                })}
              />
            </div>
          ) : null}
          <div className="space-y-2">
            <div id="swap-step-four">
              <HealthImpact maintProjectedHealth={maintProjectedHealth} />
            </div>
            {swapOrLimit === 'swap' ? (
              <>
                <div className="flex items-center justify-between">
                  <Tooltip content={t('swap:tooltip-margin')}>
                    <p className="tooltip-underline text-sm text-th-fgd-3">
                      {t('swap:margin')}
                    </p>
                  </Tooltip>
                  <Switch
                    className="text-th-fgd-3"
                    checked={useMargin}
                    onChange={handleSetMargin}
                    small
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-th-fgd-3">
                    {t('swap:max-slippage')}
                  </p>
                  <LinkButton
                    className="text-right font-mono text-sm font-normal text-th-fgd-2 underline underline-offset-2 md:hover:no-underline"
                    onClick={() => setShowSettings(true)}
                  >
                    {slippage}%
                  </LinkButton>
                </div>
              </>
            ) : null}
            {estSlippage ? (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-th-fgd-3">
                    {t('trade:est-slippage')}
                  </p>
                  <span className="font-mono text-th-fgd-2">
                    {estSlippage.toFixed(2)}%
                  </span>
                </div>
                {/* {outputBank ? (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-th-fgd-3">
                      {t('swap:est-received')}
                    </p>
                    <span className="font-mono text-th-fgd-2">
                      {floorToDecimal(
                        amountOutAsDecimal.div(1 + estSlippage / 100),
                        outputBank.mintDecimals,
                      ).toNumber()}
                      <span className="font-body text-th-fgd-3">
                        {' '}
                        {outputBank?.name}
                      </span>
                    </span>
                  </div>
                ) : null} */}
              </>
            ) : null}
          </div>
        </div>
      </div>
    </ContentBox>
  )
}

export default SwapForm
