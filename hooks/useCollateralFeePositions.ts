import { COLLATERAL_FEE_KEY } from 'utils/constants'
import useBanksWithBalances from './useBanksWithBalances'
import useLocalStorageState from './useLocalStorageState'
import { useMemo } from 'react'
import useMangoAccount from './useMangoAccount'

const useCollateralFeePopupConditions = () => {
  const [wasModalOpen, setWasModalOpen] = useLocalStorageState(
    COLLATERAL_FEE_KEY,
    false,
  )
  const banks = useBanksWithBalances('balance')

  const marginPositionBalanceWithBanks = banks.filter(
    (x) => x.balance < 0 && Math.abs(x.balance) * x.bank.uiPrice >= 100,
  )

  const collateralFeeBanks = banks.filter(
    (x) => x.balance > 0 && x.bank.collateralFeePerDay > 0,
  )

  // Use useMemo to recalculate the LTV ratio only when the list of banks changes
  const ltvRatio = useMemo(() => {
    let totalWeightedAssets = 0
    let totalWeightedLiabilities = 0

    banks.forEach(({ balance, bank }) => {
      const weight =
        balance > 0
          ? Number(bank.maintAssetWeight)
          : Number(bank.maintLiabWeight)
      const value = Math.abs(balance) * bank.uiPrice * weight

      if (balance > 0) {
        totalWeightedAssets += value
      } else if (balance < 0) {
        totalWeightedLiabilities += value
      }
    })

    return totalWeightedAssets > 0
      ? totalWeightedLiabilities / totalWeightedAssets
      : 0
  }, [banks])

  const showCollateralFeeWarning =
    !!marginPositionBalanceWithBanks.length &&
    !!collateralFeeBanks.length &&
    !wasModalOpen

  const isCharged =
    !!marginPositionBalanceWithBanks.length && !!collateralFeeBanks.length

  return {
    showCollateralFeeWarning,
    setWasModalOpen,
    marginPositionBalanceWithBanks,
    collateralFeeBanks,
    ltvRatio,
    isCharged,
  }
}

export default useCollateralFeePopupConditions
