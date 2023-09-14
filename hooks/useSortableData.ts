/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from 'react'
import get from 'lodash/get'

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
        if (!isNaN(get(a, sortConfig.key))) {
          return sortConfig.direction === 'ascending'
            ? get(a, sortConfig.key) - get(b, sortConfig.key)
            : get(b, sortConfig.key) - get(a, sortConfig.key)
        }
        if (get(a, sortConfig.key) < get(b, sortConfig.key)) {
          return sortConfig.direction === 'ascending' ? -1 : 1
        }
        if (get(a, sortConfig.key) > get(b, sortConfig.key)) {
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
