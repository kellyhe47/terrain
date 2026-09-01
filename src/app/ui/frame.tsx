// The 390×844 phone frame the designs use. On web at wide viewports the app is centred in the frame; at ≤ 430px wide
// (and on native) it fills the window. The fake "9:41" status bar mirrors the prototype on web only.
import React from 'react';
import { Platform, useWindowDimensions, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { color, font } from '../../theme/tokens';
import { Text } from 'react-native';

export function StatusBarFake({ light }: { light?: boolean }) {
  if (Platform.OS !== 'web') return <View style={{ height: 44 }} />;
  const c = light ? '#fff' : color.text1;
  return (
    <View style={{ height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24 }}>
      <Text style={{ fontFamily: font.bodySemi, fontSize: 13, color: c }}>9:41</Text>
      <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
        <Svg width={16} height={12} viewBox="0 0 16 12" fill="none" stroke={c} strokeWidth={1.5}><Path d="M1 8.5C3 5 6 3.5 8 3.5s5 1.5 7 5" /></Svg>
        <Svg width={22} height={11} viewBox="0 0 22 11"><Rect x="0.5" y="0.5" width="18" height="10" rx="2.5" fill="none" stroke={c} opacity={0.5} /><Rect x="2" y="2" width="12" height="7" rx="1.2" fill={c} /><Rect x="20" y="3.5" width="2" height="4" rx="1" fill={c} opacity={0.5} /></Svg>
      </View>
    </View>
  );
}

export function PhoneFrame({ children }: { children: React.ReactNode }) {
  const { width, height } = useWindowDimensions();
  const framed = Platform.OS === 'web' && width > 430;
  if (!framed) return <View style={{ flex: 1, backgroundColor: color.bg }}>{children}</View>;
  return (
    <View style={{ flex: 1, backgroundColor: color.appBg, alignItems: 'center', justifyContent: height > 900 ? 'center' : 'flex-start', paddingVertical: height > 900 ? 24 : 0 }}>
      <View style={{ width: 390, height: 844, backgroundColor: color.bg, borderWidth: 1, borderColor: color.borderStrong, borderRadius: 34, overflow: 'hidden' }}>{children}</View>
    </View>
  );
}
