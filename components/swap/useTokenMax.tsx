import { Bank, Group, MangoAccount } from '@blockworks-foundation/mango-v4'
import Decimal from 'decimal.js'
import { useMemo } from 'react'
import mangoStore from '@store/mangoStore'
import { floorToDecimal } from '../../utils/numbers'
import useMangoAccount from '../shared/useMangoAccount'

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

export const getTokenInMax = (
  inputTokenAddress: string,
  group: Group,
  useMargin: boolean
) => {
  const mangoAccount = mangoStore.getState().mangoAccount.current
  const outputBank = mangoStore.getState().swap.outputBank
  const inputBank = group.banksMapByMint.get(inputTokenAddress)![0]

  if (!group || !inputBank || !mangoAccount || !outputBank) {
    return {
      amount: new Decimal(0.0),
      decimals: 6,
      amountWithBorrow: new Decimal(0.0),
    }
  }

  const inputTokenBalance = floorToDecimal(
    mangoAccount.getTokenBalanceUi(inputBank),
    inputBank.mintDecimals
  )
  const maxAmountWithoutMargin = inputTokenBalance.gt(0)
    ? inputTokenBalance
    : new Decimal(0)
  const maxUiAmountWithBorrow = floorToDecimal(
    mangoAccount?.getMaxSourceUiForTokenSwap(
      group,
      inputBank.mint,
      outputBank.mint,
      1
    )!,
    inputBank.mintDecimals
  )
  const inputBankVaultBalance = group.getTokenVaultBalanceByMintUi(
    inputBank.mint
  )

  const maxAmount = useMargin
    ? Decimal.min(
        maxAmountWithoutMargin,
        inputBankVaultBalance,
        maxUiAmountWithBorrow!
      )
    : Decimal.min(maxAmountWithoutMargin, inputBankVaultBalance)

  const maxAmountWithBorrow = Decimal.min(
    maxUiAmountWithBorrow!,
    inputBankVaultBalance
  )

  return {
    amount: maxAmount,
    amountWithBorrow: maxAmountWithBorrow,
    decimals: inputBank.mintDecimals,
  }
}

export const useTokenMax = (useMargin = true) => {
  const { mangoAccount } = useMangoAccount()
  const inputBank = mangoStore((s) => s.swap.inputBank)
  const outputBank = mangoStore((s) => s.swap.outputBank)

  const tokenInMax = useMemo(() => {
    const group = mangoStore.getState().group
    if (!group || !inputBank || !mangoAccount || !outputBank)
      return {
        amount: new Decimal(0.0),
        decimals: 6,
        amountWithBorrow: new Decimal(0.0),
      }

    const inputBankFromGroup = group.getFirstBankByMint(inputBank.mint)
    const tokenBalance = floorToDecimal(
      mangoAccount?.getTokenBalanceUi(inputBankFromGroup),
      inputBankFromGroup.mintDecimals
    )

    const inputBankVaultBalance = group.getTokenVaultBalanceByMintUi(
      inputBank.mint
    )
    const maxAmountWithoutMargin = tokenBalance.gt(0)
      ? tokenBalance
      : new Decimal(0)

    const maxUiAmountWithBorrow = floorToDecimal(
      mangoAccount?.getMaxSourceUiForTokenSwap(
        group,
        inputBank.mint,
        outputBank.mint,
        1
      )!,
      inputBank.mintDecimals
    )

    const maxAmount = useMargin
      ? Decimal.min(
          maxAmountWithoutMargin,
          inputBankVaultBalance,
          maxUiAmountWithBorrow!
        )
      : Decimal.min(maxAmountWithoutMargin, inputBankVaultBalance)

    const maxAmountWithBorrow = Decimal.min(
      maxUiAmountWithBorrow!,
      inputBankVaultBalance
    )

    return {
      amount: maxAmount,
      amountWithBorrow: maxAmountWithBorrow,
      decimals: inputBank.mintDecimals,
    }
  }, [inputBank, mangoAccount, outputBank, useMargin])

  return tokenInMax
}
