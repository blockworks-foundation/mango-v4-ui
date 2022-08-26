import { useMemo } from 'react'
import mangoStore from '../../store/mangoStore'
import { floorToDecimal, formatDecimal } from '../../utils/numbers'

export const useTokenMax = (useMargin = true) => {
  const mangoAccount = mangoStore((s) => s.mangoAccount.current)
  const inputBank = mangoStore((s) => s.swap.inputBank)
  const outputBank = mangoStore((s) => s.swap.outputBank)
  const slippage = mangoStore((s) => s.swap.slippage)

  const tokenInMax = useMemo(() => {
    const group = mangoStore.getState().group

    if (!group || !inputBank || !mangoAccount || !outputBank)
      return { amount: 0.0, decimals: 6, amountWithBorrow: 0.0 }
    const inputBankFromGroup = group.getFirstBankByMint(inputBank.mint)

    const tokenBalance = parseFloat(
      formatDecimal(
        mangoAccount?.getTokenBalanceUi(inputBankFromGroup),
        inputBankFromGroup.mintDecimals
      )
    )
    const maxAmountWithoutMargin = tokenBalance > 0 ? tokenBalance : 0
    const inputBankVaultBalance = floorToDecimal(
      inputBank.uiDeposits() - inputBank.uiBorrows(),
      inputBank.mintDecimals
    )

    const maxUiAmountWithBorrow = mangoAccount?.getMaxSourceUiForTokenSwap(
      group,
      inputBank.mint,
      outputBank.mint,
      0.98 - slippage / 10
    )

    const maxAmount = useMargin
      ? Math.min(
          maxAmountWithoutMargin,
          inputBankVaultBalance,
          maxUiAmountWithBorrow
        )
      : Math.min(maxAmountWithoutMargin, inputBankVaultBalance)

    const maxAmountWithBorrow = Math.min(
      floorToDecimal(maxUiAmountWithBorrow, inputBank.mintDecimals),
      inputBankVaultBalance
    )

    return {
      amount: maxAmount > 0 ? maxAmount : 0,
      amountWithBorrow: maxAmountWithBorrow > 0 ? maxAmountWithBorrow : 0,
      decimals: inputBank.mintDecimals,
    }
  }, [inputBank, mangoAccount, outputBank, slippage, useMargin])

  return tokenInMax
}
