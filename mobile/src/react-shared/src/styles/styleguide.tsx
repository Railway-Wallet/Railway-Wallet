import { ReactConfig } from "../config/react-config";

export const RAILGUN_GRADIENT = {
  colors: ["#371366", "#1E3C67", "#0E7A81"],
  start: { x: 0, y: 1 },
  end: { x: 1, y: 0 },
  locations: [0.0887, 0.5219, 0.9186],
  useAngle: true,
  angle: 1.5,
  angleCenter: { x: 1, y: 1 },
};

const typography = {
  fontFamily: "Inconsolata",
  heading1: {
    fontFamily: "Inconsolata-Bold",
    fontSize: 44,
    letterSpacing: -1,
    lineHeight: 48,
  },
  heading2: {
    fontFamily: "Inconsolata-Bold",
    fontSize: 34,
    letterSpacing: 0,
    lineHeight: 40,
  },
  heading3: {
    fontFamily: "Inconsolata-Bold",
    fontSize: 22,
    letterSpacing: 0,
    lineHeight: 24,
  },
  heading4: {
    fontFamily: "Inconsolata-Bold",
    fontSize: 18,
    letterSpacing: 0,
    lineHeight: 24,
  },
  button: {
    fontFamily: "Inconsolata-ExtraBold",
    fontSize: 18,
    letterSpacing: 0.5,
    lineHeight: 21,
  },
  paragraph: {
    fontFamily: "Inconsolata-Regular",
    fontSize: 19,
    letterSpacing: 0,
    lineHeight: 24,
  },
  paragraphSmall: {
    fontFamily: "Inconsolata-Regular",
    fontSize: 16,
    letterSpacing: 0,
    lineHeight: 20,
  },
  label: {
    fontFamily: "Inconsolata-ExtraBold",
    fontSize: 16,
    letterSpacing: 1,
    lineHeight: 20,
  },
  labelSmall: {
    fontFamily: "Inconsolata-ExtraBold",
    fontSize: 14,
    letterSpacing: 1,
    lineHeight: 17,
  },
  caption: {
    fontFamily: "Inconsolata-SemiBold",
    fontSize: 15,
    letterSpacing: 0,
    lineHeight: 18,
  },
  actionText: {
    fontFamily: "Inconsolata-Regular",
    fontSize: 18,
    letterSpacing: -0.5,
    lineHeight: 21,
  },
  numpad: {
    fontFamily: "Inconsolata-Light",
    fontSize: 44,
    letterSpacing: 0,
    lineHeight: 44,
  },
  numpadSmall: {
    fontFamily: "Inconsolata",
    fontSize: 36,
    letterSpacing: 0,
    lineHeight: 42,
  },
};

export const styleguide = {
  colors: {
    txGreen: (alpha = 1) => `rgba(5, 158, 121, ${alpha})`,
    txOrange: (alpha = 1) => `rgba(255, 165, 0, ${alpha})`,
    txRed: (alpha = 1) => `rgba(172, 8, 67, ${alpha})`,
    txYellow: (alpha = 1) => `rgba(225, 156, 23, ${alpha})`,
    error: (alpha = 1) => `rgba(255, 55, 95, ${alpha})`,
    danger: "#ff0000",
    text: (alpha = 1) => `rgba(255, 255, 255, ${alpha})`,
    inputBorder: "rgba(235, 235, 245, 0.25)",
    textSecondary: "rgba(235, 235, 245, 0.42)",
    lighterLabelSecondary: "rgba(235, 235, 245, 0.5)",
    labelSecondary: "rgba(235, 235, 245, 0.7)",
    gray: (alpha = 1) => `rgba(23, 23, 23, ${alpha})`,
    gray2: (alpha = 1) => `rgba(99, 99, 99, ${alpha})`,
    gray3: (alpha = 1) => `rgba(61, 61, 61, ${alpha})`,
    gray4: (alpha = 1) => `rgba(58, 58, 60, ${alpha})`,
    gray5: (alpha = 1) => `rgba(44, 44, 46, ${alpha})`,
    gray6: (alpha = 1) => `rgba(28, 28, 30, ${alpha})`,
    gray7: (alpha = 1) => `rgba(117, 117, 117, ${alpha})`,
    gray8: (alpha = 1) => `rgba(141, 141, 147, ${alpha})`,
    gray9: (alpha = 1) => `rgba(92, 92, 92, ${alpha})`,
    gray10: (alpha = 1) => `rgba(72, 72, 72, ${alpha})`,
    gray6_50: "rgb(14, 14, 15)",
    buttonBorder: "#a0a0a051",
    cardSurface: "rgb(30, 30, 30)",
    white: "#fff",
    black: "#000000",
    screenBackground: "#000000",
    headerBackground: ReactConfig.IS_ANDROID
      ? "rgb(44, 44, 46)"
      : "rgb(23, 23, 23)",
    gradients: {
      railgun: RAILGUN_GRADIENT,
      railgunDark: {
        ...RAILGUN_GRADIENT,
        colors: ["#3713661E", "#1E3C671E", "#0E7A811E"],
      },
      railgunSemiTransparent: {
        ...RAILGUN_GRADIENT,
        colors: ["#371366B3", "#1E3C67B3", "#0E7A81B3"],
      },
      redCallout: {
        ...RAILGUN_GRADIENT,
        colors: ["#200000", "#360000", "#650000"],
      },
      ethereum: {
        ...RAILGUN_GRADIENT,
        colors: ["rgb(59,70,126)", "rgb(70,82,169)", "rgb(100,120,220)"],
      },
      binance: {
        ...RAILGUN_GRADIENT,
        colors: ["rgb(122,93,24)", "rgb(194,149,38)", "rgb(243,186,47)"],
      },
      polygon: {
        ...RAILGUN_GRADIENT,
        colors: ["rgb(65,36,115)", "rgb(104,57,183)", "rgb(130,71,229)"],
      },
      arbitrum: {
        ...RAILGUN_GRADIENT,
        colors: ["rgb(148,208,248)", "rgb(83,179,243)", "rgb(40,160,240)"],
      },
      testnet: {
        ...RAILGUN_GRADIENT,
        colors: ["rgb(139,125,55)", "rgb(156,138,48)", "rgb(216,184,26)"],
      },
    },
    tokenBackgrounds: {
      railgun: (alpha = 1) => `rgba(14, 122, 129, ${alpha})`,
      ethereum: (alpha = 1) => `rgba(100, 120, 220, ${alpha})`,
      binance: (alpha = 1) => `rgba(243, 186, 47, ${alpha})`,
      polygon: (alpha = 1) => `rgba(130, 71, 229, ${alpha})`,
      arbitrum: (alpha = 1) => `rgba(40, 160, 240, ${alpha})`,
      testnet: (alpha = 1) => `rgba(253, 213, 13, ${alpha})`,
    },
  },
  typography,
};
