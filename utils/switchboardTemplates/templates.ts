export const LSTExactIn = (
  inMint: string,
  nativeInAmount: string,
  stakePoolAddress: string,
) => {
  const template = `tasks:
    - conditionalTask:
        attempt:
        - httpTask:
                  url: https://api.sanctum.so/v1/swap/quote?input=${inMint}&outputLstMint=So11111111111111111111111111111111111111112&amount=${nativeInAmount}&mode=ExactIn
        - jsonParseTask:
                  path: $.outAmount
        - divideTask:
                 scalar: ${nativeInAmount}
        onFailure:
        - splStakePoolTask:
            pubkey: ${stakePoolAddress}
        - cacheTask:
            cacheItems:
              - variableName: poolTokenSupply
                job:
                  tasks:
                    - jsonParseTask:
                        path: $.uiPoolTokenSupply
                        aggregationMethod: NONE
              - variableName: totalStakeLamports
                job:
                  tasks:
                    - jsonParseTask:
                        path: $.uiTotalLamports
                        aggregationMethod: NONE
        - valueTask:
            big: \${totalStakeLamports}
        - divideTask:
            big: \${poolTokenSupply}
    - multiplyTask:
              job:
                tasks:
                  - oracleTask:
                      pythAddress: ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d
                      pythAllowedConfidenceInterval: 10`
  return template
}

export const LSTExactOut = (
  inMint: string,
  nativeOutSolAmount: string,
  stakePoolAddress: string,
) => {
  const template = `tasks:
  - conditionalTask:
      attempt:
        - cacheTask:
            cacheItems:
              - variableName: QTY
                job:
                  tasks:
                    - httpTask:
                        url: https://api.sanctum.so/v1/swap/quote?input=${inMint}&outputLstMint=So11111111111111111111111111111111111111112&amount=${nativeOutSolAmount}&mode=ExactOut
                    - jsonParseTask:
                              path: $.inAmount
        - httpTask:
             url: https://api.sanctum.so/v1/swap/quote?input=${inMint}&outputLstMint=So11111111111111111111111111111111111111112&amount=\${QTY}&mode=ExactIn
        - jsonParseTask:
            path: $.outAmount
        - divideTask:
            big: \${QTY}
      onFailure:
          - splStakePoolTask:
              pubkey: ${stakePoolAddress}
          - cacheTask:
              cacheItems:
                - variableName: poolTokenSupply
                  job:
                    tasks:
                      - jsonParseTask:
                          path: $.uiPoolTokenSupply
                          aggregationMethod: NONE
                - variableName: totalStakeLamports
                  job:
                    tasks:
                      - jsonParseTask:
                          path: $.uiTotalLamports
                          aggregationMethod: NONE
          - valueTask:
              big: \${totalStakeLamports}
          - divideTask:
              big: \${poolTokenSupply}
  - multiplyTask:
        job:
          tasks:
            - oracleTask:
                pythAddress: ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d
                pythAllowedConfidenceInterval: 10`
  return template
}
