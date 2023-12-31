import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// test-utils.ts
import fs from 'fs'
import path from 'path'
import { WalletProvider } from '@solana/wallet-adapter-react'
import fetchMock from 'jest-fetch-mock'

const getAllPagePaths = (dir = 'pages', basePath = '') => {
  const pagesDir = basePath
    ? path.join(process.cwd(), dir, basePath)
    : path.join(process.cwd(), dir)

  if (!fs.existsSync(pagesDir)) {
    console.error(`Directory not found: ${pagesDir}`)
    return []
  }

  let paths: { params: { page: string } }[] = []

  fs.readdirSync(pagesDir).forEach((file) => {
    if (file === 'api' || file.startsWith('_')) {
      // Skip API routes and files starting with '_'
      return
    }

    const filePath = path.join(basePath, file)
    const fullFilePath = path.join(pagesDir, file)
    const stat = fs.statSync(fullFilePath)

    if (stat.isDirectory()) {
      // Recurse into subdirectories
      paths = paths.concat(getAllPagePaths(dir, filePath))
    } else if (file.endsWith('.tsx')) {
      // Add file to paths, replacing windows-style backslashes with forward slashes if necessary
      const relativePath = filePath.replace(/\.tsx$/, '').replace(/\\/g, '/')
      paths.push({ params: { page: relativePath } })
    }
  })

  return paths
}

describe('Renders are pages from pages folder', () => {
  const pages = getAllPagePaths()
  beforeAll(() => {
    fetchMock.enableMocks()
    jest.mock('@solana/web3.js', () => ({
      ...jest.requireActual('@solana/web3.js'),
      Connection: jest.fn(),
    }))
    jest.mock('@metaplex-foundation/js', () => ({
      ...jest.requireActual('@metaplex-foundation/js'),
      Metaplex: jest.fn(),
    }))
  })

  pages.forEach(({ params: { page } }) => {
    it(`renders ${page} page without crashing`, async () => {
      const pagePath = `../pages/${page}`
      const Page = (await import(pagePath)).default
      const queryClient = new QueryClient()

      render(
        <QueryClientProvider client={queryClient}>
          <WalletProvider wallets={[]}>
            <Page />
          </WalletProvider>
        </QueryClientProvider>,
      )
    })
  })
})
