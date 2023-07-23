import { useTheme } from 'next-themes'

export default function useThemeWrapper() {
  const theme = useTheme()

  return {
    ...theme,
    theme: theme.theme || theme.themes[0],
  }
}
