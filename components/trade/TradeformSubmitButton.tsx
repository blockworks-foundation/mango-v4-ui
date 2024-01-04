import Button from '@components/shared/Button'
import Loading from '@components/shared/Loading'
import SecondaryConnectButton from '@components/shared/SecondaryConnectButton'
import { useWallet } from '@solana/wallet-adapter-react'
import useIpAddress from 'hooks/useIpAddress'
import useMangoAccount from 'hooks/useMangoAccount'
import mangoStore from '@store/mangoStore'
import { useTranslation } from 'react-i18next'

const TradeformSubmitButton = ({
  disabled,
  placingOrder,
  setShowCreateAccountModal,
  sideNames,
  tooMuchSize,
  isForceReduceOnly,
  isSanctioned,
}: {
  disabled: boolean
  placingOrder: boolean
  setShowCreateAccountModal: (show: boolean) => void
  setShowDepositModal: (show: boolean) => void
  sideNames: string[]
  tooMuchSize: boolean
  useMargin: boolean
  isForceReduceOnly: boolean
  isSanctioned: boolean
}) => {
  const { t } = useTranslation(['common', 'swap', 'trade'])
  const side = mangoStore((s) => s.tradeForm.side)
  const themeData = mangoStore((s) => s.themeData)
  const { connected } = useWallet()
  const { initialLoad: mangoAccountLoading, mangoAccountAddress } =
    useMangoAccount()
  const { ipCountry } = useIpAddress()

  return !isSanctioned || isForceReduceOnly ? (
    (connected && mangoAccountLoading) || mangoAccountAddress ? (
      <Button
        className={`flex w-full items-center justify-center ${
          side === 'buy'
            ? themeData.buttonStyle === 'raised'
              ? 'raised-buy-button'
              : 'bg-th-up-dark text-white md:hover:bg-th-up-dark md:hover:brightness-90'
            : themeData.buttonStyle === 'raised'
            ? 'raised-sell-button'
            : 'bg-th-down-dark text-white md:hover:bg-th-down-dark md:hover:brightness-90'
        }`}
        disabled={disabled || tooMuchSize}
        size="large"
        type="submit"
      >
        {!placingOrder ? (
          <span>
            {tooMuchSize
              ? t('swap:insufficient-balance', { symbol: '' })
              : t('trade:place-order', {
                  side: side === 'buy' ? sideNames[0] : sideNames[1],
                })}
          </span>
        ) : (
          <div className="flex items-center space-x-2">
            <Loading />
            <span className="hidden sm:block">{t('trade:placing-order')}</span>
          </div>
        )}
      </Button>
    ) : connected && !mangoAccountAddress ? (
      <div className="w-full">
        <Button
          className="flex w-full items-center justify-center"
          onClick={() => setShowCreateAccountModal(true)}
          size="large"
        >
          {t('create-account')}
        </Button>
      </div>
    ) : (
      <SecondaryConnectButton
        className="flex w-full items-center justify-center"
        isLarge
      />
    )
  ) : (
    <Button disabled className="w-full leading-tight" size="large">
      {t('country-not-allowed', {
        country: ipCountry ? `(${ipCountry})` : '',
      })}
    </Button>
  )
}

export default TradeformSubmitButton
