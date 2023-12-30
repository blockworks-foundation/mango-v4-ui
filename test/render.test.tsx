/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// test-utils.ts
import fs from 'fs'
import path from 'path'

export const getAllPagePaths = () => {
  const pagesDir = path.join(process.cwd(), 'pages')
  let fileNames = fs.readdirSync(pagesDir)

  // Exclude _app.tsx, _document.tsx, and API routes
  fileNames = fileNames.filter(
    (file) =>
      file.endsWith('.tsx') && !file.startsWith('_') && !file.includes('api'),
  )

  return fileNames.map((fileName) => ({
    params: {
      page: fileName.replace(/\.tsx$/, ''),
    },
  }))
}

describe('Page render tests', () => {
  const pages = getAllPagePaths()

  pages.forEach(({ params: { page } }) => {
    it(`renders ${page} page without crashing`, async () => {
      const pagePath = `../pages/${page}`
      const Page = (await import(pagePath)).default
      const queryClient = new QueryClient()

      render(
        <QueryClientProvider client={queryClient}>
          <Page />
        </QueryClientProvider>,
      )
      // You can add more assertions here if needed
    })
  })
})
