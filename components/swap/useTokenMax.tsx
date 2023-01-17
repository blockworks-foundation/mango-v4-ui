import { Bank, Group, MangoAccount } from '@blockworks-foundation/mango-v4'
import Decimal from 'decimal.js'
import { useMemo } from 'react'
import mangoStore from '@store/mangoStore'
import { floorToDecimal } from '../../utils/numbers'
import useMangoAccount from '../../hooks/useMangoAccount'
import useMangoGroup from 'hooks/useMangoGroup'
import { PublicKey } from '@solana/web3.js'

export const getMaxWithdrawForBank = (
  group: Group,
  bank: Bank,
  mangoAccount: MangoAccount,
  allowBorrow = false
): Decimal => {
  const accountBalance = mangoAccount.getTokenBalanceUi(bank)
  const vaultBalance = group.getTokenVaultBalanceByMintUi(bank.mint)
  const maxBorrow = mangoAccount.getMaxWithdrawWithBorrowForTokenUi(
    group,
    bank.mint
  )
  const maxWithdraw = allowBorrow
    ? Decimal.min(vaultBalance, maxBorrow)
    : bank.initAssetWeight.toNumber() === 0
    ? Decimal.min(accountBalance, vaultBalance)
    : Decimal.min(accountBalance, vaultBalance, maxBorrow)
  return Decimal.max(0, maxWithdraw)
}

export const getTokenInMax = (
  mangoAccount: MangoAccount,
  inputMint: PublicKey,
  outputMint: PublicKey,
  group: Group,
  useMargin: boolean
) => {
  const inputBank = group.getFirstBankByMint(inputMint)
  const outputBank = group.getFirstBankByMint(outputMint)

  if (!group || !inputBank || !mangoAccount || !outputBank) {
    return {
      amount: new Decimal(0.0),
      decimals: 6,
      amountWithBorrow: new Decimal(0.0),
    }
  }

  const inputTokenBalance = new Decimal(
    mangoAccount.getTokenBalanceUi(inputBank)
  )

  const maxUiAmountWithBorrow = floorToDecimal(
    mangoAccount.getMaxSourceUiForTokenSwap(
      group,
      inputBank.mint,
      outputBank.mint
    ),
    inputBank.mintDecimals
  )

  const maxAmountWithoutMargin = inputTokenBalance.gt(0)
    ? inputTokenBalance.lt(maxUiAmountWithBorrow)
      ? inputTokenBalance
      : maxUiAmountWithBorrow
    : new Decimal(0)

  const inputBankVaultBalance = floorToDecimal(
    group
      .getTokenVaultBalanceByMintUi(inputBank.mint)
      .toFixed(inputBank.mintDecimals),
    inputBank.mintDecimals
  )

  const maxAmount = useMargin
    ? Decimal.min(
        maxAmountWithoutMargin,
        inputBankVaultBalance,
        maxUiAmountWithBorrow
      )
    : Decimal.min(maxAmountWithoutMargin, inputBankVaultBalance)

  const maxAmountWithBorrow = Decimal.min(
    maxUiAmountWithBorrow,
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
  const { group } = useMangoGroup()
  const inputBank = mangoStore((s) => s.swap.inputBank)
  const outputBank = mangoStore((s) => s.swap.outputBank)

  const tokenInMax = useMemo(() => {
    if (mangoAccount && group && inputBank && outputBank) {
      return getTokenInMax(
        mangoAccount,
        inputBank.mint,
        outputBank.mint,
        group,
        useMargin
      )
    }

    return {
      amount: new Decimal(0),
      amountWithBorrow: new Decimal(0),
      decimals: 6,
    }
  }, [mangoAccount, group, useMargin, inputBank, outputBank])

  return tokenInMax
}
