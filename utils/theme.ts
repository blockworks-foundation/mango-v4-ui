import { ThemeData } from 'types'
import {
  comicNeueBody,
  comicNeueDisplay,
  lalezar,
  nunitoBody,
  nunitoDisplay,
  ttCommons,
  ttCommonsExpanded,
  ttCommonsMono,
} from './fonts'

export const breakpoints = {
  sm: 640,
  // => @media (min-width: 640px) { ... }

  md: 768,
  // => @media (min-width: 768px) { ... }

  lg: 1024,
  // => @media (min-width: 1024px) { ... }

  xl: 1280,
  // => @media (min-width: 1280px) { ... }

  '2xl': 1536,
  // => @media (min-width: 1536px) { ... }

  '3xl': 1792,
  // => @media (min-width: 1792px) { ... }
}

type NftThemeMeta = {
  [key: string]: ThemeData
}

export const nftThemeMeta: NftThemeMeta = {
  default: {
    buttonStyle: 'flat',
    fonts: {
      body: ttCommons,
      display: ttCommonsExpanded,
      mono: ttCommonsMono,
      rewards: lalezar,
    },
    logoPath: '/logos/logo-mark.svg',
    platformName: 'Mango',
    rainAnimationImagePath: '',
    sideImagePath: '',
    sideTilePath: '',
    sideTilePathExpanded: '',
    topTilePath: '',
    tvChartTheme: 'Dark',
    tvImagePath: '',
    useGradientBg: false,
  },
  Bonk: {
    buttonStyle: 'raised',
    fonts: {
      body: nunitoBody,
      display: nunitoDisplay,
      mono: ttCommonsMono,
      rewards: lalezar,
    },
    logoPath: '/images/themes/bonk/bonk-logo.png',
    platformName: 'Bongo',
    rainAnimationImagePath: '/images/themes/bonk/bonk-animation-logo.png',
    sideImagePath: '/images/themes/bonk/sidenav-image.png',
    sideTilePath: '/images/themes/bonk/bonk-tile.png',
    sideTilePathExpanded: '/images/themes/bonk/bonk-tile-expanded.png',
    topTilePath: '/images/themes/bonk/bonk-tile.png',
    tvChartTheme: 'Light',
    tvImagePath: '/images/themes/bonk/tv-chart-image.png',
    useGradientBg: true,
  },
  Pepe: {
    buttonStyle: 'raised',
    fonts: {
      body: comicNeueBody,
      display: comicNeueDisplay,
      mono: ttCommonsMono,
      rewards: lalezar,
    },
    logoPath: '/images/themes/pepe/pepe-logo.png',
    platformName: 'Pepe',
    rainAnimationImagePath: '/images/themes/pepe/pepe-logo.png',
    sideImagePath: '/images/themes/pepe/sidenav-image.png',
    sideTilePath: '/images/themes/pepe/pepe-vert-tile.png',
    sideTilePathExpanded: '/images/themes/pepe/pepe-vert-tile-expanded.png',
    topTilePath: '/images/themes/pepe/pepe-hori-tile.png',
    tvChartTheme: 'Dark',
    tvImagePath: '/images/themes/pepe/tv-chart-image.png',
    useGradientBg: false,
  },
}

export const CUSTOM_SKINS: { [key: string]: string } = {
  pepe: 'GJHEhovHn8UT98xUbWWWAC9J5iaRs6M5grBUzs8zqTd6',
}
