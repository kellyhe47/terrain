import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, View, type ViewStyle, type StyleProp, Platform, TouchableWithoutFeedback } from 'react-native';
import { color, font, radius } from '../../theme/tokens';
import { Semi, Display, Small } from './text';
import { Icon } from './icons';

export function Card({ children, style, dashed, onPress }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; dashed?: boolean; onPress?: () => void }) {
  const s = [st.card, dashed ? st.dashed : null, style];
  if (onPress) return <Pressable onPress={onPress} style={({ pressed }) => [s, pressed ? { transform: [{ scale: 0.99 }] } : null]}>{children}</Pressable>;
  return <View style={s}>{children}</View>;
}

type BtnKind = 'primary' | 'secondary' | 'ghost' | 'outline' | 'link';
export function Btn({ label, onPress, kind = 'primary', style, size = 'md', disabled, testID }: { label: string; onPress?: () => void; kind?: BtnKind; style?: StyleProp<ViewStyle>; size?: 'sm' | 'md' | 'lg'; disabled?: boolean; testID?: string }) {
  const pad = size === 'lg' ? 15 : size === 'sm' ? 8 : 13;
  const fs = size === 'lg' ? 15 : size === 'sm' ? 12 : 14;
  const base: ViewStyle = { borderRadius: radius.sm, paddingVertical: pad, paddingHorizontal: size === 'sm' ? 14 : 16, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.5 : 1 };
  const kinds: Record<BtnKind, { box: ViewStyle; text: string }> = {
    primary: { box: { backgroundColor: color.orange }, text: color.textOnOrange },
    secondary: { box: { backgroundColor: color.surface2, borderWidth: 1, borderColor: color.borderStrong }, text: color.text1 },
    outline: { box: { backgroundColor: 'transparent', borderWidth: 1, borderColor: color.borderStrong }, text: color.text2 },
    ghost: { box: { backgroundColor: 'transparent' }, text: color.text3 },
    link: { box: { backgroundColor: 'transparent', paddingVertical: 0, paddingHorizontal: 0 }, text: color.orange },
  };
  return (
    <Pressable testID={testID} accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [base, kinds[kind].box, style, pressed ? { opacity: 0.85, transform: [{ scale: 0.98 }] } : null]}>
      <Semi c={kinds[kind].text} size={fs} style={{ fontFamily: font.bodySemi }}>{label}</Semi>
    </Pressable>
  );
}

export function IconBtn({ name, onPress, size = 32, label, style }: { name: string; onPress?: () => void; size?: number; label?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [{ width: size, height: size, borderRadius: radius.sm, borderWidth: 1, borderColor: color.border, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' }, style, pressed ? { backgroundColor: color.surface2 } : null]}>
      <Icon name={name} size={16} color={color.text2} />
    </Pressable>
  );
}

export function StepBtn({ sign, onPress, size = 26, disabled }: { sign: '−' | '+'; onPress: () => void; size?: number; disabled?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={sign === '+' ? 'Increase' : 'Decrease'} disabled={disabled} onPress={onPress} style={({ pressed }) => [{ width: size, height: size, borderRadius: radius.sm, borderWidth: 1, borderColor: color.borderStrong, backgroundColor: color.surface2, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.3 : 1 }, pressed ? { transform: [{ scale: 0.95 }] } : null]}>
      <Semi c={color.text1} size={size >= 44 ? 24 : size >= 30 ? 16 : 14} style={{ lineHeight: size >= 44 ? 28 : 18 }}>{sign}</Semi>
    </Pressable>
  );
}

export function Chip({ label, active, onPress, pill = true }: { label: string; active?: boolean; onPress?: () => void; pill?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: !!active }} onPress={onPress} style={[{ borderRadius: pill ? radius.pill : radius.sm, paddingVertical: 8, paddingHorizontal: 14, borderWidth: 1 }, active ? { backgroundColor: color.orange, borderColor: color.orange } : { backgroundColor: color.surface2, borderColor: color.border }]}>
      <Semi c={active ? color.textOnOrange : color.text2} size={13}>{label}</Semi>
    </Pressable>
  );
}

export function Segmented({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2, backgroundColor: color.surface2, borderWidth: 1, borderColor: color.border, borderRadius: radius.sm, padding: 2 }}>
      {options.map((o) => (
        <Pressable key={o} accessibilityRole="button" accessibilityState={{ selected: o === value }} onPress={() => onChange(o)} style={{ borderRadius: 4, paddingVertical: 6, paddingHorizontal: 13, backgroundColor: o === value ? color.orange : 'transparent' }}>
          <Semi c={o === value ? color.textOnOrange : color.text3} size={11} style={{ textTransform: 'uppercase', letterSpacing: 0.55 }}>{o}</Semi>
        </Pressable>
      ))}
    </View>
  );
}

export function Bar({ pct, fill = color.orange, track = color.surface2, height = 4 }: { pct: number; fill?: string; track?: string; height?: number }) {
  return <View style={{ height, borderRadius: height / 2, backgroundColor: track, overflow: 'hidden' }}><View style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: '100%', borderRadius: height / 2, backgroundColor: fill }} /></View>;
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) { return <View style={[{ height: 1, backgroundColor: color.border }, style]} />; }

/** Bottom sheet inside the phone frame (absolute, not a native Modal, so it screenshots inside the 390×844 frame). */
export function Sheet({ open, onClose, children, title, subtitle }: { open: boolean; onClose: () => void; children: React.ReactNode; title?: string; subtitle?: string }) {
  if (!open) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable accessibilityLabel="Dismiss" onPress={onClose} style={[StyleSheet.absoluteFill, { backgroundColor: color.scrim }]} />
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: color.surface, borderTopWidth: 1, borderColor: color.borderStrong, borderTopLeftRadius: 14, borderTopRightRadius: 14, paddingTop: 18, paddingHorizontal: 20, paddingBottom: 30, maxHeight: '92%' }}>
        {title ? (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View><Display size={20} lh={22}>{title}</Display>{subtitle ? <Small style={{ marginTop: 2 }}>{subtitle}</Small> : null}</View>
            <Pressable accessibilityLabel="Close" onPress={onClose} style={{ padding: 4 }}><Icon name="x" size={18} color={color.text3} /></Pressable>
          </View>
        ) : null}
        {children}
      </View>
    </View>
  );
}

export function Toast({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 20, right: 20, bottom: 96, zIndex: 30, backgroundColor: color.surface3, borderWidth: 1, borderColor: color.borderStrong, borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
      <Icon name="check" size={15} color={color.green} strokeWidth={2.5} />
      <Semi c={color.text1} size={13} style={{ flex: 1, fontFamily: font.body }}>{msg}</Semi>
    </View>
  );
}

export function Shimmer({ width = '100%', height = 11, style }: { width?: number | `${number}%`; height?: number; style?: StyleProp<ViewStyle> }) {
  const a = useRef(new Animated.Value(0.35)).current;
  useEffect(() => { const loop = Animated.loop(Animated.sequence([Animated.timing(a, { toValue: 0.7, duration: 700, useNativeDriver: Platform.OS !== 'web' }), Animated.timing(a, { toValue: 0.35, duration: 700, useNativeDriver: Platform.OS !== 'web' })])); loop.start(); return () => loop.stop(); }, [a]);
  return <Animated.View style={[{ width, height, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.22)', opacity: a }, style]} />;
}

export function Spinner({ size = 28, border = 3 }: { size?: number; border?: number }) {
  const r = useRef(new Animated.Value(0)).current;
  useEffect(() => { const loop = Animated.loop(Animated.timing(r, { toValue: 1, duration: 900, useNativeDriver: Platform.OS !== 'web' })); loop.start(); return () => loop.stop(); }, [r]);
  const rotate = r.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return <Animated.View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: border, borderColor: color.surface3, borderTopColor: color.orange, transform: [{ rotate }] }} />;
}

export function Row({ children, style, gap = 8, center }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; gap?: number; center?: boolean }) {
  return <View style={[{ flexDirection: 'row', gap, alignItems: center ? 'center' : 'flex-start' }, style]}>{children}</View>;
}

const st = StyleSheet.create({
  card: { backgroundColor: color.surface, borderWidth: 1, borderColor: color.border, borderRadius: radius.md, padding: 16 },
  dashed: { borderStyle: 'dashed', borderColor: color.borderStrong },
});
export { Modal, TouchableWithoutFeedback };
