import InlineNotification from '@components/shared/InlineNotification'
import { formatCurrencyValue } from 'utils/numbers'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import Decimal from 'decimal.js'
import { JupiterV6RouteInfo } from 'types/jupiter'
import { useTranslation } from 'react-i18next'
import useMangoAccount from 'hooks/useMangoAccount'
import { useWallet } from '@solana/wallet-adapter-react'
import TopBarStore from '@store/topBarStore'
import mangoStore from '@store/mangoStore'
import useRemainingBorrowsInPeriod from 'hooks/useRemainingBorrowsInPeriod'
import useTokenPositionsFull from 'hooks/useTokenPositionsFull'
import { useMemo } from 'react'
import Button from '@components/shared/Button'
import Loading from '@components/shared/Loading'
import SecondaryConnectButton from '@components/shared/SecondaryConnectButton'
import Link from 'next/link'
import useIpAddress from 'hooks/useIpAddress'
dayjs.extend(relativeTime)

const SwapFormSubmitButton = ({
  amountIn,
  amountOut,
  loadingSwapDetails,
  selectedRoute,
  setShowConfirm,
}: {
  amountIn: Decimal
  amountOut: number | undefined
  loadingSwapDetails: boolean
  selectedRoute: JupiterV6RouteInfo | undefined | null
  setShowConfirm: (x: boolean) => void
}) => {
  const { t } = useTranslation('common')
  const { mangoAccountAddress } = useMangoAccount()
  const { connected } = useWallet()
  const { ipAllowed, ipCountry } = useIpAddress()
  const { setShowSettingsModal } = TopBarStore()
  const { inputBank, outputBank } = mangoStore((s) => s.swap)
  const { remainingBorrowsInPeriod, timeToNextPeriod } =
    useRemainingBorrowsInPeriod(true)
  const tokenPositionsFull = useTokenPositionsFull([outputBank, inputBank])

  // check if the borrowed amount exceeds the net borrow limit in the current period
  const borrowExceedsLimitInPeriod = useMemo(() => {
    const mangoAccount = mangoStore.getState().mangoAccount.current
    if (!mangoAccount || !inputBank || !remainingBorrowsInPeriod) return false

    const balance = mangoAccount.getTokenDepositsUi(inputBank)
    const remainingBalance = balance - amountIn.toNumber()
    const borrowAmount = remainingBalance < 0 ? Math.abs(remainingBalance) : 0
    const borrowAmountNotional = borrowAmount * inputBank.uiPrice
    return borrowAmountNotional > remainingBorrowsInPeriod
  }, [amountIn, inputBank, mangoAccountAddress, remainingBorrowsInPeriod])

  const disabled =
    !amountIn.toNumber() ||
    !amountOut ||
    !selectedRoute ||
    !!selectedRoute.error

  return ipAllowed ? (
    <>
      {connected ? (
        <Button
          onClick={() => setShowConfirm(true)}
          className="mb-4 mt-6 flex w-full items-center justify-center text-base"
          disabled={disabled}
          size="large"
        >
          {loadingSwapDetails ? (
            <Loading />
          ) : (
            <span>{t('swap:review-swap')}</span>
          )}
        </Button>
      ) : (
        <SecondaryConnectButton
          className="mb-4 mt-6 flex w-full items-center justify-center"
          isLarge
        />
      )}
      {tokenPositionsFull ? (
        <div className="pb-4">
          <InlineNotification
            type="error"
            desc={
              <>
                {t('error-token-positions-full')}{' '}
                <Link href={''} onClick={() => setShowSettingsModal(true)}>
                  {t('manage')}
                </Link>
              </>
            }
          />
        </div>
      ) : null}
      {borrowExceedsLimitInPeriod &&
      remainingBorrowsInPeriod &&
      timeToNextPeriod ? (
        <div className="mb-4">
          <InlineNotification
            type="error"
            desc={t('error-borrow-exceeds-limit', {
              remaining: formatCurrencyValue(remainingBorrowsInPeriod),
              resetTime: dayjs().to(dayjs().add(timeToNextPeriod, 'second')),
            })}
          />
        </div>
      ) : null}
      {(selectedRoute === null && amountIn.gt(0)) ||
      (selectedRoute && !!selectedRoute.error) ? (
        <div className="mb-4">
          <InlineNotification type="error" desc={t('swap:no-swap-found')} />
        </div>
      ) : null}
    </>
  ) : (
    <Button
      disabled
      className="mb-4 mt-6 flex w-full items-center justify-center text-base"
      size="large"
    >
      {t('country-not-allowed', {
        country: ipCountry ? `(${ipCountry})` : '',
      })}
    </Button>
  )
}

export default SwapFormSubmitButton
