export const LSTExactIn = (inMint: string, uiAmountIn: string): string => {
  const template = `tasks:
  - conditionalTask:
      attempt:
      - sanctumLstPriceTask:
          lstMint: ${inMint}
      - conditionalTask:
          attempt:
          - valueTask:
              big: ${uiAmountIn}
          - divideTask:
              job:
                tasks:
                - jupiterSwapTask:
                    inTokenAddress: So11111111111111111111111111111111111111112
                    outTokenAddress: ${inMint}
                    baseAmountString: ${uiAmountIn}
      - conditionalTask:
          attempt:
          - multiplyTask:
              job:
                tasks:
                - oracleTask:
                    pythAddress: ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d
                    pythAllowedConfidenceInterval: 10
          onFailure:
          - multiplyTask:
              job:
                tasks:
                - oracleTask:
                    switchboardAddress: AEcJSgRBkU9WnKCBELj66TPFfzhKWBWa4tL7JugnonUa`
  return template
}

export const LSTExactOut = (inMint: string, uiOutSolAmount: string): string => {
  const template = `tasks:
  - conditionalTask:
      attempt:
      - sanctumLstPriceTask:
          lstMint: ${inMint}
      - conditionalTask:
          attempt:
          - cacheTask:
              cacheItems:
              - variableName: QTY
                job:
                  tasks:
                  - jupiterSwapTask:
                      inTokenAddress: So11111111111111111111111111111111111111112
                      outTokenAddress: ${inMint}
                      baseAmountString: ${uiOutSolAmount}
          - jupiterSwapTask:
              inTokenAddress: ${inMint}
              outTokenAddress: So11111111111111111111111111111111111111112
              baseAmountString: \${QTY}
          - divideTask:
              big: \${QTY}
      - conditionalTask:
          attempt:
          - multiplyTask:
              job:
                tasks:
                - oracleTask:
                    pythAddress: ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d
                    pythAllowedConfidenceInterval: 10
          onFailure:
          - multiplyTask:
              job:
                tasks:
                - oracleTask:
                    switchboardAddress: AEcJSgRBkU9WnKCBELj66TPFfzhKWBWa4tL7JugnonUa`
  return template
}
