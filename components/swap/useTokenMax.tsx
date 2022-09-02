import { Bank, Group, MangoAccount } from '@blockworks-foundation/mango-v4'
import Decimal from 'decimal.js'
import { useMemo } from 'react'
import mangoStore from '../../store/mangoStore'
import { floorToDecimal, formatDecimal } from '../../utils/numbers'

export const getMaxWithdrawForBank = (
  group: Group,
  bank: Bank,
  mangoAccount: MangoAccount,
  allowBorrow: boolean = false
): Decimal => {
  const accountBalance = mangoAccount?.getTokenBalanceUi(bank)
  const vaultBalance = group.getTokenVaultBalanceByMintUi(bank.mint)
  const maxBorrow = floorToDecimal(
    mangoAccount?.getMaxWithdrawWithBorrowForTokenUi(group, bank.mint)!,
    bank.mintDecimals
  )
  return allowBorrow
    ? Decimal.min(vaultBalance, maxBorrow!)
    : Decimal.min(accountBalance, vaultBalance, maxBorrow!)
}

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

    const inputBankVaultBalance = group.getTokenVaultBalanceByMintUi(
      inputBank.mint
    )
    const maxAmountWithoutMargin = tokenBalance > 0 ? tokenBalance : 0

    const maxUiAmountWithBorrow = floorToDecimal(
      mangoAccount?.getMaxSourceUiForTokenSwap(
        group,
        inputBank.mint,
        outputBank.mint,
        0.98 - slippage / 10
      )!,
      inputBank.mintDecimals
    )

    const maxAmount = useMargin
      ? Math.min(
          maxAmountWithoutMargin,
          inputBankVaultBalance,
          maxUiAmountWithBorrow!.toNumber()
        )
      : Math.min(maxAmountWithoutMargin, inputBankVaultBalance)

    const maxAmountWithBorrow = Math.min(
      maxUiAmountWithBorrow!.toNumber(),
      inputBankVaultBalance
    )

    return {
      amount: maxAmount,
      amountWithBorrow: maxAmountWithBorrow,
      decimals: inputBank.mintDecimals,
    }
  }, [inputBank, mangoAccount, outputBank, slippage, useMargin])

  return tokenInMax
}
