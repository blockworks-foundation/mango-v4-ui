/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from 'react'

type Direction = 'ascending' | 'descending'

export interface SortConfig {
  key: string
  direction: Direction
}

export function useSortableData<T extends Record<string, any>>(
  items: T[],
  config: SortConfig | null = null,
): {
  items: T[]
  requestSort: (key: string) => void
  sortConfig: SortConfig | null
} {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(config)

  const sortedItems = useMemo(() => {
    const sortableItems = items ? [...items] : []
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (!isNaN(a[sortConfig.key])) {
          return sortConfig.direction === 'ascending'
            ? a[sortConfig.key] - b[sortConfig.key]
            : b[sortConfig.key] - a[sortConfig.key]
        }
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1
        }
        return 0
      })
    }
    return sortableItems
  }, [items, sortConfig])

  const requestSort = (key: string) => {
    let direction: Direction = 'ascending'
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === 'ascending'
    ) {
      direction = 'descending'
    }
    setSortConfig({ key, direction })
  }

  return { items: sortedItems, requestSort, sortConfig }
}
