import { COLLATERAL_FEE_KEY } from 'utils/constants'
import useBanksWithBalances from './useBanksWithBalances'
import useLocalStorageState from './useLocalStorageState'

const useCollateralFeePopupConditions = () => {
  const [wasModalOpen, setWasModalOpen] = useLocalStorageState(
    COLLATERAL_FEE_KEY,
    false,
  )
  const banks = useBanksWithBalances('balance')
  //check if there is at least 100$ active margin position and bank has collateral fee active
  const marginPositionBalanceWithBanks = banks.filter(
    (x) =>
      x.balance < 0 &&
      Math.abs(x.balance) * x.bank.uiPrice >= 100 &&
      x.bank.collateralFeePerDay > 0,
  )

  const showCollateralFeeWarning =
    !!marginPositionBalanceWithBanks.length && !wasModalOpen

  return {
    showCollateralFeeWarning,
    setWasModalOpen,
    marginPositionBalanceWithBanks,
  }
}

export default useCollateralFeePopupConditions
