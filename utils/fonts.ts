import localFont from '@next/font/local'

export const ttCommons = localFont({
  src: [
    {
      path: '../fonts/TT_Commons_Pro_Normal.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../fonts/TT_Commons_Pro_Medium.woff2',
      weight: '600',
      style: 'medium',
    },
    {
      path: '../fonts/TT_Commons_Pro_DemiBold.woff2',
      weight: '700',
      style: 'bold',
    },
  ],
  variable: '--font-body',
})

export const ttCommonsExpanded = localFont({
  src: '../fonts/TT_Commons_Pro_Expanded_DemiBold.woff2',
  variable: '--font-display',
})

export const ttCommonsMono = localFont({
  src: '../fonts/TT_Commons_Pro_Mono_Medium.woff2',
  variable: '--font-mono',
})

// bonk theme
export const cherryBombOne = localFont({
  src: '../fonts/CherryBombOne-Regular.woff2',
  variable: '--font-display',
})
