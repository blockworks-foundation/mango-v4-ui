import localFont from 'next/font/local'
import { Nunito, Short_Stack } from 'next/font/google'

// this font should be used as the mono variant for all themes

export const ttCommonsMono = localFont({
  src: '../fonts/TT_Commons_Pro_Mono_Medium.woff2',
  variable: '--font-mono',
})

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

// bonk skin

export const nunitoDisplay = Nunito({
  weight: '900',
  subsets: ['latin'],
  variable: '--font-display',
})

export const nunitoBody = Nunito({
  subsets: ['latin'],
  variable: '--font-body',
})

// pepe theme

export const shortStackDisplay = Short_Stack({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
})

export const shortStackBody = Short_Stack({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-body',
})
