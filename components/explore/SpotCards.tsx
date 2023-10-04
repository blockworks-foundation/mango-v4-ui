import { ActionsMenu } from '@components/TokenList'
import Button from '@components/shared/Button'
import Change from '@components/shared/Change'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import TokenLogo from '@components/shared/TokenLogo'
import { goToTokenPage } from '@components/stats/tokens/TokenOverviewTable'
import Decimal from 'decimal.js'
import useMangoGroup from 'hooks/useMangoGroup'
import { useRouter } from 'next/router'
import { useTranslation } from 'react-i18next'
import { numberCompacter } from 'utils/numbers'
import { BankWithMarketData } from './Spot'

const SpotCards = ({ tokens }: { tokens: BankWithMarketData[] }) => {
  const { t } = useTranslation(['common', 'explore', 'trade'])
  const { group } = useMangoGroup()
  const router = useRouter()
  return (
    <div className="grid grid-cols-12 gap-4 px-4 py-6 md:px-6 2xl:px-12">
      {tokens.map((token) => {
        const { bank } = token

        const availableVaultBalance = group
          ? group.getTokenVaultBalanceByMintUi(bank.mint) -
            bank.uiDeposits() * bank.minVaultToDepositsRatio
          : 0
        const available = Decimal.max(
          0,
          availableVaultBalance.toFixed(bank.mintDecimals),
        )
        const depositRate = bank.getDepositRateUi()
        const borrowRate = bank.getBorrowRateUi()
        const assetWeight = bank.scaledInitAssetWeight(bank.price).toFixed(2)
        return (
          <div
            className="col-span-12 rounded-lg border border-th-bkg-3 p-6 md:col-span-6 xl:col-span-4 2xl:col-span-3"
            key={bank.tokenIndex}
          >
            <div className="mb-4 flex items-center space-x-3 border-b border-th-bkg-3 pb-4">
              <TokenLogo bank={bank} size={32} />
              <div>
                <h3 className="mb-1 text-base leading-none">{bank.name}</h3>
                <div className="flex items-center space-x-3">
                  <span className="font-mono">
                    <FormatNumericValue value={bank.uiPrice} isUsd />
                  </span>
                  {token.market ? (
                    <Change
                      change={token.market?.rollingChange || 0}
                      suffix="%"
                    />
                  ) : null}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p>{t('trade:24h-volume')}</p>
                <p className="font-mono text-th-fgd-2">
                  {!token.market ? (
                    '–'
                  ) : token.market?.marketData?.quote_volume_24h ? (
                    <span>
                      {numberCompacter.format(
                        token.market.marketData.quote_volume_24h,
                      )}{' '}
                      <span className="font-body text-th-fgd-4">USDC</span>
                    </span>
                  ) : (
                    <span>
                      0 <span className="font-body text-th-fgd-4">USDC</span>
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p>{t('available')}</p>
                <span className="font-mono text-th-fgd-2">
                  <FormatNumericValue value={available} />
                </span>
              </div>
              <div>
                <p>{t('explore:collateral-weight')}</p>
                <span className="font-mono text-th-fgd-2">{assetWeight}x</span>
              </div>
              <div>
                <p>{t('rates')}</p>
                <div className="flex space-x-1.5 font-mono">
                  <p className="text-th-up">
                    <FormatNumericValue value={depositRate} decimals={2} />%
                  </p>
                  <span className="text-th-fgd-4">|</span>
                  <p className="text-th-down">
                    <FormatNumericValue value={borrowRate} decimals={2} />%
                  </p>
                </div>
              </div>
              <Button
                className="mt-3"
                onClick={() => goToTokenPage(bank.name.split(' ')[0], router)}
                secondary
              >
                {t('details')}
              </Button>
              <div className="relative mt-3">
                <ActionsMenu bank={bank} showText />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default SpotCards
