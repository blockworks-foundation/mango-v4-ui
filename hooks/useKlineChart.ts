import { COLORS } from 'styles/colors'
import useThemeWrapper from './useThemeWrapper'

export function useKlineChart() {
  const { theme } = useThemeWrapper()
  const styles = {
    grid: {
      show: false,
    },
    candle: {
      bar: {
        upColor: COLORS.UP[theme],
        downColor: COLORS.DOWN[theme],
      },
      tooltip: {
        labels: ['', 'O:', 'C:', 'H:', 'L:', 'V:'],
        text: {
          size: 12,
          family: 'TT Mono',
          weight: 'normal',
          color: COLORS.FGD4[theme],
          marginLeft: 8,
          marginTop: 6,
          marginRight: 8,
          marginBottom: 0,
        },
      },
      priceMark: {
        show: true,
        high: {
          show: true,
          color: COLORS.FGD4[theme],
          textMargin: 5,
          textSize: 10,
          textFamily: 'TT Mono',
          textWeight: 'normal',
        },
        low: {
          show: true,
          color: COLORS.FGD4[theme],
          textMargin: 5,
          textSize: 10,
          textFamily: 'TT Mono',
          textWeight: 'normal',
        },
        last: {
          show: true,
          upColor: COLORS.BKG4[theme],
          downColor: COLORS.BKG4[theme],
          noChangeColor: COLORS.BKG4[theme],
          line: {
            show: true,
            // 'solid'|'dash'
            style: 'dash',
            dashValue: [4, 4],
            size: 1,
          },
          text: {
            show: true,
            size: 10,
            paddingLeft: 2,
            paddingTop: 2,
            paddingRight: 2,
            paddingBottom: 2,
            color: '#FFFFFF',
            family: 'TT Mono',
            weight: 'normal',
            borderRadius: 2,
          },
        },
      },
    },
    xAxis: {
      axisLine: {
        show: true,
        color: COLORS.BKG4[theme],
        size: 1,
      },
      tickLine: {
        show: true,
        size: 1,
        length: 3,
        color: COLORS.BKG4[theme],
      },
      tickText: {
        show: true,
        color: COLORS.FGD4[theme],
        family: 'TT Mono',
        weight: 'normal',
        size: 10,
      },
    },
    yAxis: {
      axisLine: {
        show: true,
        color: COLORS.BKG4[theme],
        size: 1,
      },
      tickLine: {
        show: true,
        size: 1,
        length: 3,
        color: COLORS.BKG4[theme],
      },
      tickText: {
        show: true,
        color: COLORS.FGD4[theme],
        family: 'TT Mono',
        weight: 'normal',
        size: 10,
      },
    },
    crosshair: {
      show: true,
      horizontal: {
        show: true,
        line: {
          show: true,
          style: 'dash',
          dashValue: [4, 2],
          size: 1,
          color: COLORS.FGD4[theme],
        },
        text: {
          show: true,
          color: '#FFFFFF',
          size: 10,
          family: 'TT Mono',
          weight: 'normal',
          paddingLeft: 2,
          paddingRight: 2,
          paddingTop: 2,
          paddingBottom: 2,
          borderSize: 1,
          borderColor: COLORS.FGD4[theme],
          borderRadius: 2,
          backgroundColor: COLORS.FGD4[theme],
        },
      },
      vertical: {
        show: true,
        line: {
          show: true,
          style: 'dash',
          dashValue: [4, 2],
          size: 1,
          color: COLORS.FGD4[theme],
        },
        text: {
          show: true,
          color: '#FFFFFF',
          size: 10,
          family: 'TT Mono',
          weight: 'normal',
          paddingLeft: 2,
          paddingRight: 2,
          paddingTop: 2,
          paddingBottom: 2,
          borderSize: 1,
          borderColor: COLORS.FGD4[theme],
          borderRadius: 2,
          backgroundColor: COLORS.FGD4[theme],
        },
      },
    },
    technicalIndicator: {
      margin: {
        top: 0.2,
        bottom: 0.1,
      },
      bar: {
        upColor: COLORS.UP[theme],
        downColor: COLORS.DOWN[theme],
        noChangeColor: '#888888',
      },
      line: {
        size: 1,
        colors: ['#FF9600', '#9D65C9', '#2196F3', '#E11D74', '#01C5C4'],
      },
      circle: {
        upColor: '#26A69A',
        downColor: '#EF5350',
        noChangeColor: '#888888',
      },
      lastValueMark: {
        show: false,
        text: {
          show: false,
          color: '#ffffff',
          size: 12,
          family: 'Helvetica Neue',
          weight: 'normal',
          paddingLeft: 3,
          paddingTop: 2,
          paddingRight: 3,
          paddingBottom: 2,
          borderRadius: 2,
        },
      },
      tooltip: {
        // 'always' | 'follow_cross' | 'none'
        showRule: 'always',
        // 'standard' | 'rect'
        showType: 'standard',
        showName: true,
        showParams: true,
        defaultValue: 'n/a',
        text: {
          size: 12,
          family: 'TT Mono',
          weight: 'normal',
          color: COLORS.FGD4[theme],
          marginTop: 6,
          marginRight: 8,
          marginBottom: 0,
          marginLeft: 8,
        },
      },
    },
    separator: {
      size: 2,
      color: COLORS.BKG4[theme],
    },
  }
  return {
    styles,
  }
}
