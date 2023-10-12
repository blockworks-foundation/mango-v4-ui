import { HealthType } from '@blockworks-foundation/mango-v4'
import Switch from '@components/forms/Switch'
import { LinkButton } from '@components/shared/Button'
import HealthImpact from '@components/shared/HealthImpact'
import Tooltip from '@components/shared/Tooltip'
import { PencilIcon } from '@heroicons/react/20/solid'
import mangoStore from '@store/mangoStore'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

const set = mangoStore.getState().set

const SwapSummaryInfo = ({
  walletSwap,
  setShowSettings,
}: {
  walletSwap: boolean
  setShowSettings: (show: boolean) => void
}) => {
  const { t } = useTranslation(['swap'])
  const {
    margin: useMargin,
    slippage,
    inputBank,
    outputBank,
    amountIn: amountInFormValue,
    amountOut: amountOutFormValue,
    swapOrTrigger,
  } = mangoStore((s) => s.swap)

  const maintProjectedHealth = useMemo(() => {
    const group = mangoStore.getState().group
    const mangoAccount = mangoStore.getState().mangoAccount.current
    if (
      !inputBank ||
      !mangoAccount ||
      !outputBank ||
      !amountInFormValue ||
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

  const handleSetMargin = () => {
    set((s) => {
      s.swap.margin = !s.swap.margin
      s.swap.amountIn = ''
      s.swap.amountOut = ''
    })
  }

  return (
    <div className="space-y-2">
      {!walletSwap ? (
        <HealthImpact maintProjectedHealth={maintProjectedHealth} />
      ) : null}
      {swapOrTrigger === 'swap' ? (
        <>
          {!walletSwap ? (
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
          ) : null}
          <div className="flex items-center justify-between">
            <p className="text-sm text-th-fgd-3">{t('swap:max-slippage')}</p>
            <LinkButton
              className="flex items-center text-right font-mono text-sm font-normal text-th-fgd-2"
              onClick={() => setShowSettings(true)}
            >
              <span className="mr-1.5">{slippage}%</span>
              <PencilIcon className="h-4 w-4" />
            </LinkButton>
          </div>
        </>
      ) : null}
      {estSlippage ? (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-th-fgd-3">{t('trade:est-slippage')}</p>
            <span className="font-mono text-th-fgd-2">
              {estSlippage.toFixed(2)}%
            </span>
          </div>
        </>
      ) : null}
    </div>
  )
}

export default SwapSummaryInfo
