import { useColorScheme } from 'react-native';

// Kugelschreiberblau auf blaugrauem Grund, Glasflächen, Rot nur fürs Überziehen.
const light = {
  dark: false,
  bg: '#E3E7EF',
  ink: '#141A3F',
  muted: '#2E3766',
  faint: 'rgba(20,26,63,0.45)',
  accent: '#1F2F99',
  red: '#A3172C',
  glass: 'rgba(255,255,255,0.42)',
  edge: 'rgba(255,255,255,0.75)',
  field: 'rgba(255,255,255,0.65)',
  track: 'rgba(20,26,63,0.10)',
  btn: '#24329E',
  btnText: '#FFFFFF',
  tint: 'rgba(31,47,153,0.12)',
  tintEdge: 'rgba(31,47,153,0.16)',
  today: 'rgba(31,47,153,0.30)',
  sel: '#1E2650',
  selText: '#FFFFFF',
  blobs: ['#8E9CCF', '#C3CADB', '#A9B4CF'],
};

const dark: typeof light = {
  dark: true,
  bg: '#0E1224',
  ink: '#E8EBF7',
  muted: '#AEB6D8',
  faint: 'rgba(232,235,247,0.45)',
  accent: '#93A3FF',
  red: '#FF8E9E',
  glass: 'rgba(255,255,255,0.07)',
  edge: 'rgba(255,255,255,0.14)',
  field: 'rgba(255,255,255,0.08)',
  track: 'rgba(255,255,255,0.12)',
  btn: '#3E52D6',
  btnText: '#FFFFFF',
  tint: 'rgba(147,163,255,0.14)',
  tintEdge: 'rgba(147,163,255,0.22)',
  today: 'rgba(147,163,255,0.28)',
  sel: '#E8EBF7',
  selText: '#0E1224',
  blobs: ['#2A3A9A', '#1B2350', '#23306E'],
};

export type Theme = typeof light;
export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}

export const type = {
  h1: { fontSize: 29, lineHeight: 32, fontWeight: '800' as const, letterSpacing: -0.6 },
  h2: { fontSize: 17, fontWeight: '700' as const },
  body: { fontSize: 15, lineHeight: 21 },
  small: { fontSize: 13, lineHeight: 18 },
  num: { fontVariant: ['tabular-nums' as const] },
};
