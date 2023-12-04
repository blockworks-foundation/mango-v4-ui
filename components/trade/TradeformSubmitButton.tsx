import { PerpMarket, Serum3Market } from '@blockworks-foundation/mango-v4'
import Button from '@components/shared/Button'
import InlineNotification from '@components/shared/InlineNotification'
import Loading from '@components/shared/Loading'
import SecondaryConnectButton from '@components/shared/SecondaryConnectButton'
import { useWallet } from '@solana/wallet-adapter-react'
import useIpAddress from 'hooks/useIpAddress'
import useMangoAccount from 'hooks/useMangoAccount'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { useSpotMarketMax, useSpotMarketWalletMax } from './SpotSlider'
import { usePerpMarketMax } from './PerpSlider'
import mangoStore from '@store/mangoStore'
import { useTranslation } from 'react-i18next'

const TradeformSubmitButton = ({
  disabled,
  placingOrder,
  setShowCreateAccountModal,
  setShowDepositModal,
  sideNames,
  tooMuchSize,
  useMargin,
}: {
  disabled: boolean
  placingOrder: boolean
  setShowCreateAccountModal: (show: boolean) => void
  setShowDepositModal: (show: boolean) => void
  sideNames: string[]
  tooMuchSize: boolean
  useMargin: boolean
}) => {
  const { t } = useTranslation(['common', 'swap', 'trade'])
  const side = mangoStore((s) => s.tradeForm.side)
  const themeData = mangoStore((s) => s.themeData)
  const { connected } = useWallet()
  const {
    initialLoad: mangoAccountLoading,
    mangoAccount,
    mangoAccountAddress,
  } = useMangoAccount()
  const { selectedMarket } = useSelectedMarket()
  const { ipAllowed, ipCountry } = useIpAddress()
  const spotMax = useSpotMarketMax(
    mangoAccount,
    selectedMarket,
    side,
    useMargin,
  )
  const perpMax = usePerpMarketMax(mangoAccount, selectedMarket, side)
  const walletOrderMax = useSpotMarketWalletMax(selectedMarket, side)

  const isWalletOrder =
    selectedMarket instanceof Serum3Market && !spotMax && walletOrderMax

  return ipAllowed ? (
    connected ? (
      mangoAccountLoading ||
      (selectedMarket instanceof Serum3Market && spotMax) ||
      (selectedMarket instanceof PerpMarket && perpMax) ||
      isWalletOrder ? (
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
                : isWalletOrder
                ? t('trade:deposit-place-order')
                : t('trade:place-order', {
                    side: side === 'buy' ? sideNames[0] : sideNames[1],
                  })}
            </span>
          ) : (
            <div className="flex items-center space-x-2">
              <Loading />
              <span className="hidden sm:block">
                {t('trade:placing-order')}
              </span>
            </div>
          )}
        </Button>
      ) : mangoAccountAddress ? (
        <div className="w-full">
          <Button
            className="flex w-full items-center justify-center"
            onClick={() => setShowDepositModal(true)}
            size="large"
          >
            {t('deposit')}
          </Button>
          <div className="mt-4">
            <InlineNotification
              type="info"
              desc={t('trade:no-balance-to-trade')}
            />
          </div>
        </div>
      ) : (
        <div className="w-full">
          <Button
            className="flex w-full items-center justify-center"
            onClick={() => setShowCreateAccountModal(true)}
            size="large"
          >
            {t('create-account')}
          </Button>
        </div>
      )
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
