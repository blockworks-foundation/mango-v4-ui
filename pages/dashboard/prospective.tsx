import type { NextPage } from 'next'
import { DashboardNavbar } from '.'
import { Table, Td, Th, TrBody, TrHead } from '@components/shared/TableElements'
import { useState, useMemo, useEffect } from 'react'
import { LinkButton } from '@components/shared/Button'
import Image from 'next/image'
import Loading from '@components/shared/Loading'
import useBanks from 'hooks/useBanks'

interface Token {
  symbol: string // Every token will definitely have a symbol.
  [key: string]: string // Other properties are unknown and can vary.
}

const fetchTokens = async (
  offset = 0,
  existingTokens: Token[] = [],
): Promise<Token[]> => {
  const res = await fetch(`/api/tokens?offset=${offset * 50}&limit=50`)
  const data = await res.json()
  return [...existingTokens, ...data] // Ensure the returned data conforms to Token[]
}

const Prospective: NextPage = () => {
  const banks = useBanks()['banks']
  const bankNames = banks.map((bank) => bank.name.toUpperCase())

  // Generate headers from the first token entry if available
  const [tokensList, setTokensList] = useState<Token[]>([])
  const [offset, setOffset] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    const initialFetch = async () => {
      setLoading(true)
      try {
        const initialTokens: Token[] = await fetchTokens(0)
        setTokensList(initialTokens)
      } catch (error) {
        console.error('Failed to fetch tokens:', error)
      } finally {
        setLoading(false)
      }
    }
    initialFetch()
  }, [])

  const handleShowMore = async () => {
    setLoading(true)
    try {
      const newTokens = await fetchTokens(offset + 1, tokensList)
      setTokensList(newTokens)
      setOffset((prevOffset) => prevOffset + 1)
    } catch (error) {
      console.error('Failed to fetch more tokens:', error)
    }
    setLoading(false)
  }

  const heads = useMemo(() => {
    if (tokensList.length > 0) {
      const allKeys = Object.keys(tokensList[0])
      const filteredKeys = allKeys.filter(
        (key) =>
          ![
            'symbol',
            'extensions',
            'lastTradeUnixTime',
            'uniqueWallet30m',
          ].includes(key),
      )
      return ['symbol', ...filteredKeys]
    }
    return []
  }, [tokensList])

  const downloadTokens = () => {
    let csvContent = 'data:text/csv;charset=utf-8,'
    const filteredTokens = tokensList.filter(
      (token) => !bankNames.includes(token.symbol.toUpperCase()),
    )

    if (filteredTokens.length > 0) {
      const headers = Object.keys(filteredTokens[0]).join(',')
      const rows = filteredTokens.map((token) =>
        Object.values(token)
          .map(
            (value) => `"${value?.toString().replace(/"/g, '""')}"`, // Handle quotes in data
          )
          .join(','),
      )
      csvContent += headers + '\n' + rows.join('\n')
    }

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', 'non_bank_tokens.csv')
    document.body.appendChild(link) // Required for FF
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="col-span-12 w-full lg:col-span-8 lg:col-start-3">
      <DashboardNavbar />
      <div className="mt-4">
        <div className="mx-20 mb-4">
          <p className="flex items-center space-x-4 text-th-fgd-4">
            <span>Hidden Gems to Prospect On</span>
          </p>
          <button
            onClick={downloadTokens}
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Download
          </button>
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
              {tokensList.map((token: Token, idx) => (
                <TrBody
                  key={idx}
                  className="h-10 cursor-pointer text-xs md:hover:bg-th-bkg-2"
                  onClick={() =>
                    window.open(
                      `https://birdeye.so/token/${token['address']}?chain=solana&tab=recentTrades`,
                      '_blank',
                    )
                  }
                >
                  {heads.map((head, valIdx) => {
                    if (head == 'symbol') {
                      token[head] = token[head]?.toUpperCase().toString()
                    }
                    return (
                      <Td
                        xBorder={valIdx != 0}
                        key={valIdx}
                        className={`!py-3 
                        ${
                          valIdx === 0
                            ? 'sticky left-0 z-10 ' +
                              (bankNames.includes(token[head])
                                ? 'bg-lime-200'
                                : 'bg-th-bkg-2')
                            : ''
                        }
                    `}
                      >
                        <div className="flex">
                          <div className="mr-2 h-full">
                            {head == 'logoURI' ? (
                              <>
                                <Image
                                  src={token[head]}
                                  alt="Token Logo"
                                  width={100} // Set the desired width
                                  height={100} // Set the desired height
                                  unoptimized={true} // Use this only if you face issues with the Next.js optimizer
                                />{' '}
                              </>
                            ) : (
                              <>
                                {token[head] ? token[head]?.toString() : 'N/A'}
                              </>
                            )}
                          </div>
                        </div>
                      </Td>
                    )
                  })}
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
              height: '5vh', // Match the height of the table container
            }}
          >
            <Loading className="mr-2 h-8 w-8" />
          </div>
        )}

        <div className="flex justify-center py-6">
          <LinkButton onClick={handleShowMore}>Show More</LinkButton>
        </div>
      </div>
    </div>
  )
}

export default Prospective
