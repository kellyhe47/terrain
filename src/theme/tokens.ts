// Design tokens copied from designs/Terrain App.html :root. Dark only (PRD §1).
export const color = {
  orange: '#F43D10', orangeHover: '#FF4D1F', orangePress: '#D33208', orangeTint: 'rgba(244,61,16,0.12)',
  bg: '#101010', appBg: '#0B0B0B', surface: '#1A1A1A', surface2: '#232323', surface3: '#2C2C2C',
  border: '#2E2E2E', borderStrong: '#3D3D3D',
  text1: '#F5F4F2', text2: '#B9B6B1', text3: '#7C7A76', textOnOrange: '#FFF6F2',
  green: '#3DBE6B', red: '#E5484D', yellow: '#F5B93D',
  scrim: 'rgba(16,16,16,0.85)',
  recoveryGreen: '#15241B',
} as const;

export const font = {
  display: 'Anton_400Regular',
  body: 'Archivo_400Regular',
  bodyMedium: 'Archivo_500Medium',
  bodySemi: 'Archivo_600SemiBold',
  bodyBold: 'Archivo_700Bold',
} as const;

export const size = {
  displayLg: 48, displayMd: 32, displaySm: 24,
  textLg: 18, textMd: 15, textSm: 13, textXs: 11,
} as const;

export const space = { s1: 4, s2: 8, s3: 12, s4: 16, s5: 24, s6: 32, s7: 48, s8: 64 } as const;
export const radius = { sm: 6, md: 8, pill: 999 } as const;
export const bands = {
  green: { stops: ['#166534', '#22C55E', '#6EE7A0', '#B9F5CF'], glow: 'rgba(34,197,94,0.35)' },
  yellow: { stops: ['#92400E', '#F59E0B', '#FCD34D', '#FDE68A'], glow: 'rgba(245,158,11,0.35)' },
  red: { stops: ['#7F1D1D', '#E5484D', '#F87171', '#FECACA'], glow: 'rgba(229,72,77,0.35)' },
} as const;
