import type { NextPage } from 'next'
import { DashboardNavbar } from '.'
import { Table, Td, Th, TrBody, TrHead } from '@components/shared/TableElements'
import useBanks from 'hooks/useBanks'
import { Bank } from '@blockworks-foundation/mango-v4'
import { formatCurrencyValue } from 'utils/numbers'
import { toUiDecimalsForQuote } from '@blockworks-foundation/mango-v4'
import { useRouter } from 'next/router' // Import the useRouter hook

const Marketing: NextPage = () => {
  const banks = useBanks()['banks']
  const router = useRouter()

  const getColorForPercent = (percent: number) => {
    // Use a smoother gradient of colors from red to green based on the percentage
    if (percent < 10) return '#ff073a' // Deep red
    else if (percent < 20) return '#ff6347' // Tomato
    else if (percent < 30) return '#ff7f50' // Coral
    else if (percent < 40) return '#ffa500' // Orange
    else if (percent < 50) return '#ffd700' // Gold
    else if (percent < 60) return '#ffff00' // Yellow
    else if (percent < 70) return '#adff2f' // Green Yellow
    else if (percent < 80) return '#7fff00' // Chartreuse
    else if (percent < 90) return '#32cd32' // Lime Green
    return '#00ff00' // Green
  }

  const handleRowClick = (tokenName: string) => {
    router.push(`/stats?token=${tokenName}`)
  }

  return (
    <div className="col-span-12 w-full lg:col-span-8 lg:col-start-3">
      <DashboardNavbar />
      <div className="mt-4">
        <div className="mx-20 mb-4">
          <p className="flex items-center space-x-4 text-th-fgd-4">
            <span>Fullness of Token Deposits</span>
          </p>
        </div>
        <div className="w-full overflow-scroll" style={{ maxHeight: '70vh' }}>
          <Table className="h-full">
            <thead>
              <TrHead
                style={{ boxShadow: '1px -5px 1px rgba(0,0,0,1)', zIndex: 19 }}
                className="sticky top-0 border-t bg-th-bkg-2"
              >
                <Th
                  className="text-left"
                  style={{ borderLeft: '1px solid #ccc' }}
                >
                  {'Symbol'}
                </Th>
                <Th className="text-left">{'Leverage'}</Th>
                <Th className="text-left">{'Deposits'}</Th>
                <Th className="text-left">{'Limit'}</Th>
                <Th className="text-left">{'Percent'}</Th>
              </TrHead>
            </thead>
            <tbody>
              {banks.map((bank: Bank, idx) => {
                const deposits = bank?.uiDeposits() * bank?.uiPrice
                const depositLimit = Number(
                  toUiDecimalsForQuote(bank.borrowWeightScaleStartQuote),
                )
                const percent = (100 * deposits) / depositLimit

                if (
                  bank?.name !== 'USDC' &&
                  bank?.maintAssetWeight.toNumber() > 0
                ) {
                  return (
                    <TrBody
                      key={idx}
                      className="h-10 cursor-pointer text-xs md:hover:bg-th-bkg-2"
                      onClick={() => handleRowClick(bank.name)}
                    >
                      <Td className={`sticky left-0 z-10 !py-3`}>
                        {bank?.name}
                      </Td>
                      <Td className={`sticky left-0 z-10 !py-3`}>
                        {(1 / (1 - bank?.initAssetWeight.toNumber())).toFixed()}
                        x
                      </Td>
                      <Td className={`sticky left-0 z-10 !py-3`}>
                        $
                        {(bank?.uiDeposits() * bank?.uiPrice).toLocaleString(
                          undefined,
                          {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          },
                        )}
                      </Td>
                      <Td className={`sticky left-0 z-10 !py-3`}>
                        {formatCurrencyValue(
                          toUiDecimalsForQuote(
                            bank.borrowWeightScaleStartQuote,
                          ),
                        )}
                      </Td>
                      <Td className={`sticky left-0 z-10 !py-3`}>
                        <div className="relative h-full w-full">
                          <div className="absolute flex h-full w-full items-center justify-start">
                            <span className="absolute left-0 font-bold">
                              {percent.toFixed(2)}%
                            </span>
                            <div
                              style={{
                                width: `${percent}%`,
                                backgroundColor: getColorForPercent(percent),
                                minHeight: '1rem',
                                marginLeft: '50px', // Offset to the right to avoid overlap
                              }}
                              className="transition-all duration-300 ease-in-out"
                            />
                          </div>
                        </div>
                      </Td>
                    </TrBody>
                  )
                }
              })}
            </tbody>
          </Table>
        </div>
      </div>
    </div>
  )
}

export default Marketing
