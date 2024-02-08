import { Bank, Group, MangoAccount } from '@blockworks-foundation/mango-v4'
import Decimal from 'decimal.js'
import { useMemo } from 'react'
import mangoStore from '@store/mangoStore'
import { floorToDecimal } from '../../utils/numbers'
import useMangoAccount from '../../hooks/useMangoAccount'
import useMangoGroup from 'hooks/useMangoGroup'
import { PublicKey } from '@solana/web3.js'
import { toUiDecimals } from '@blockworks-foundation/mango-v4'

export const getMaxBorrowForBank = (
  group: Group,
  bank: Bank,
  mangoAccount: MangoAccount,
) => {
  try {
    const maxBorrow = new Decimal(
      mangoAccount.getMaxWithdrawWithBorrowForTokenUi(group, bank.mint),
    )
    return maxBorrow
  } catch (e) {
    console.log(`failed to get max borrow for ${bank.name}`, e)
    return new Decimal(0)
  }
}

const getMaxSourceForSwap = (
  group: Group,
  mangoAccount: MangoAccount,
  inputMint: PublicKey,
  outputMint: PublicKey,
) => {
  try {
    const rawMaxUiAmountWithBorrow = mangoAccount.getMaxSourceUiForTokenSwap(
      group,
      inputMint,
      outputMint,
    )

    return rawMaxUiAmountWithBorrow
  } catch (e) {
    console.log(`failed to get max source`, e)
    return 0
  }
}

export const getMaxWithdrawForBank = (
  group: Group,
  bank: Bank,
  mangoAccount: MangoAccount,
  allowBorrow = false,
): Decimal => {
  const accountBalance = new Decimal(mangoAccount.getTokenBalanceUi(bank))
  const vaultBalance = group.getTokenVaultBalanceByMintUi(bank.mint)
  const maxBorrow = getMaxBorrowForBank(group, bank, mangoAccount)
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
) => {
  const inputBank = group.getFirstBankByMint(inputMint)
  const outputBank = group.getFirstBankByMint(outputMint)

  if (!group || !inputBank || !mangoAccount || !outputBank) {
    return tokenMaxFallback
  }

  const inputReduceOnly = inputBank.areBorrowsReduceOnly()
  const outputReduceOnly = outputBank.areDepositsReduceOnly()

  const inputTokenBalance = new Decimal(
    mangoAccount.getTokenBalanceUi(inputBank),
  )

  const outputTokenBalance = new Decimal(
    mangoAccount.getTokenBalanceUi(outputBank),
  )
  const rawMaxUiAmountWithBorrow = getMaxSourceForSwap(
    group,
    mangoAccount,
    inputBank.mint,
    outputBank.mint,
  )

  let spotMax = new Decimal(0)
  let leverageMax = new Decimal(0)

  if (!outputReduceOnly || (outputReduceOnly && outputTokenBalance.lt(0))) {
    spotMax = inputTokenBalance
    leverageMax = floorToDecimal(
      rawMaxUiAmountWithBorrow,
      inputBank.mintDecimals,
    )
  }

  const inputBankVaultBalance = floorToDecimal(
    group
      .getTokenVaultBalanceByMintUi(inputBank.mint)
      .toFixed(inputBank.mintDecimals),
    inputBank.mintDecimals,
  )

  const maxAmount = Decimal.min(spotMax, leverageMax, inputBankVaultBalance)

  const maxAmountWithBorrow = inputReduceOnly
    ? Decimal.min(spotMax, leverageMax, inputBankVaultBalance)
    : Decimal.min(leverageMax, inputBankVaultBalance)

  return {
    amount: maxAmount,
    amountWithBorrow: maxAmountWithBorrow,
    decimals: inputBank.mintDecimals,
    amountIsLimited:
      !!outputBank.getRemainingDepositLimit() &&
      maxAmount.equals(
        floorToDecimal(rawMaxUiAmountWithBorrow, inputBank.mintDecimals),
      ),
    amountWithBorrowIsLimited:
      !!outputBank.getRemainingDepositLimit() &&
      toUiDecimals(
        outputBank.getRemainingDepositLimit()!,
        outputBank.mintDecimals,
      ) *
        outputBank.uiPrice <=
        inputBank.uiPrice * rawMaxUiAmountWithBorrow,
  }
}

export interface TokenMaxResults {
  amount: Decimal
  amountWithBorrow: Decimal
  decimals: number
  amountIsLimited: boolean
  amountWithBorrowIsLimited: boolean
}

export const useTokenMax = (): TokenMaxResults => {
  const { mangoAccount } = useMangoAccount()
  const { group } = useMangoGroup()
  const inputBank = mangoStore((s) => s.swap.inputBank)
  const outputBank = mangoStore((s) => s.swap.outputBank)

  const tokenInMax = useMemo(() => {
    try {
      if (mangoAccount && group && inputBank && outputBank) {
        return getTokenInMax(
          mangoAccount,
          inputBank.mint,
          outputBank.mint,
          group,
        )
      }
    } catch (e) {
      console.warn('Error in useTokenMax:  ', e)
    }
    return tokenMaxFallback
  }, [mangoAccount, group, inputBank, outputBank])

  return tokenInMax
}

export const useAbsInputPosition = (): TokenMaxResults => {
  const { mangoAccount } = useMangoAccount()
  const { inputBank } = mangoStore((s) => s.swap)

  if (!mangoAccount || !inputBank) {
    return tokenMaxFallback
  }

  const amount = new Decimal(
    Math.abs(mangoAccount.getTokenBalanceUi(inputBank)),
  )
  return {
    decimals: inputBank.mintDecimals,
    amount: amount,
    amountWithBorrow: amount,
    amountIsLimited: false,
    amountWithBorrowIsLimited: false,
  }
}

const tokenMaxFallback = {
  amount: new Decimal(0),
  amountWithBorrow: new Decimal(0),
  decimals: 6,
  amountIsLimited: false,
  amountWithBorrowIsLimited: false,
}
