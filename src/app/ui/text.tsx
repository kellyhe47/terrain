import React from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';
import { color, font } from '../../theme/tokens';

type P = TextProps & { c?: string; size?: number; lh?: number; style?: TextStyle | TextStyle[] };
const mk = (base: TextStyle) => ({ c, size, lh, style, ...rest }: P) => (
  <Text {...rest} style={[base, c ? { color: c } : null, size ? { fontSize: size } : null, lh ? { lineHeight: lh } : null, style]} />
);
/** Anton display, uppercase, tight leading. */
export const Display = mk({ fontFamily: font.display, textTransform: 'uppercase', color: color.text1, letterSpacing: 0.3, fontSize: 26, lineHeight: 26 * 0.98 });
/** Anton numeral, tabular. */
export const Numeral = mk({ fontFamily: font.display, color: color.text1, fontVariant: ['tabular-nums'], fontSize: 22, lineHeight: 24 });
/** 11px semibold uppercase tracked label. */
export const Label = mk({ fontFamily: font.bodySemi, textTransform: 'uppercase', letterSpacing: 0.9, fontSize: 11, lineHeight: 14, color: color.text3 });
export const Body = mk({ fontFamily: font.body, fontSize: 14, lineHeight: 21, color: color.text2 });
export const Semi = mk({ fontFamily: font.bodySemi, fontSize: 14, lineHeight: 20, color: color.text1 });
export const Bold = mk({ fontFamily: font.bodyBold, fontSize: 14, lineHeight: 20, color: color.text1 });
export const Small = mk({ fontFamily: font.body, fontSize: 12, lineHeight: 17, color: color.text3 });
export const Tiny = mk({ fontFamily: font.body, fontSize: 11, lineHeight: 15, color: color.text3 });
