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
    </div>
  )
}

export default SwapSummaryInfo
