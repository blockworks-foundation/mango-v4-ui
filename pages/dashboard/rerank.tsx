import type { NextPage } from 'next'
import { DashboardNavbar } from '.'
import { Table, Td, Th, TrBody, TrHead } from '@components/shared/TableElements'
import { useState, useMemo, useEffect } from 'react'
import Loading from '@components/shared/Loading'

type Token = { [key: string]: unknown }

const fetchRanks = async (): Promise<Token[]> => {
  const res = await fetch(`/api/tokentiers`)
  if (!res.ok) {
    throw new Error('Failed to fetch token rankings')
  }
  const data: Token[] = await res.json()
  return data
}

const Rerank: NextPage = () => {
  const [tokensRankingsList, setTokensRankingsList] = useState<Token[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    const initialFetch = async () => {
      setLoading(true)
      try {
        const tokensRankingsListRetrieved = await fetchRanks()
        setTokensRankingsList(tokensRankingsListRetrieved)
      } catch (error) {
        console.error('Failed to fetch tokens:', error)
      } finally {
        setLoading(false)
      }
    }
    initialFetch()
  }, [])

  const heads = useMemo(() => {
    if (tokensRankingsList.length > 0) {
      const allKeys = Object.keys(tokensRankingsList[0])
      return ['symbol', ...allKeys.filter((key) => key !== 'symbol')]
    }
    return []
  }, [tokensRankingsList])

  return (
    <div className="col-span-12 w-full lg:col-span-8 lg:col-start-3">
      <DashboardNavbar />
      <div className="mt-4">
        <div className="mx-20 mb-4">
          <p className="flex items-center space-x-4 text-th-fgd-4">
            <span>Hidden Gems to Prospect On</span>
          </p>
        </div>
        <div className="w-full overflow-scroll" style={{ maxHeight: '70vh' }}>
          <Table className="h-full">
            <thead>
              <TrHead
                style={{ boxShadow: '1px -5px 1px rgba(0,0,0,1)', zIndex: 19 }}
                className="sticky top-0 border-t bg-th-bkg-2"
              >
                {heads.map((head, index) => (
                  <Th
                    key={head}
                    className="text-left"
                    style={{
                      borderLeft: index !== 0 ? '1px solid #ccc' : 'none',
                    }}
                  >
                    {head}
                  </Th>
                ))}
              </TrHead>
            </thead>
            <tbody>
              {tokensRankingsList.map((token, idx) => (
                <TrBody
                  key={idx}
                  className="h-10 cursor-pointer text-xs md:hover:bg-th-bkg-2"
                >
                  {heads.map((head, valIdx) => (
                    <Td
                      xBorder={valIdx !== 0}
                      key={valIdx}
                      className={`sticky left-0 z-10 bg-th-bkg-2 !py-3`}
                    >
                      <div className="flex">
                        <div className="mr-2 h-full">
                          {token[head] ? (token[head] as string) : 'N/A'}
                        </div>
                      </div>
                    </Td>
                  ))}
                </TrBody>
              ))}
            </tbody>
          </Table>
        </div>
        {loading && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '5vh',
            }}
          >
            <Loading className="mr-2 h-8 w-8" />
          </div>
        )}
      </div>
    </div>
  )
}

export default Rerank
