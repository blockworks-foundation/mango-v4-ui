import { ThemeData } from 'types'
import {
  nunitoBody,
  nunitoDisplay,
  shortStackBody,
  shortStackDisplay,
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
    fonts: { body: ttCommons, display: ttCommonsExpanded, mono: ttCommonsMono },
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
    fonts: { body: nunitoBody, display: nunitoDisplay, mono: ttCommonsMono },
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
      body: shortStackBody,
      display: shortStackDisplay,
      mono: ttCommonsMono,
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
  bonk: '6FUYsgvSPiLsMpKZqLWswkw7j4juudZyVopU6RYKLkQ3',
  pepe: '6FUYsgvSPiLsMpKZqLWswkw7j4juudZyVopU6RYKLkQ3',
}
