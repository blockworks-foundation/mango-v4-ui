import { Group } from 'mango-v4-test-pack'
import mangoStore from '@store/mangoStore'

export default function useMangoGroup(): {
  group: Group | undefined
} {
  const group = mangoStore((s) => s.group)

  return { group }
}
