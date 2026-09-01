// R16 camera state: full-bleed viewfinder with the design's overlays (template.html 889–917). Falls back to the bundled
// plate photo when no camera permission/device exists (the browser QA has no camera).
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Asset } from 'expo-asset';
import { color, font } from '../../../theme/tokens';
import { Icon } from '../../ui/icons';
import { media } from '../../ui/assets';

export interface Capture { base64: string; uri: string | null }
export const FIXTURE_URI = 'asset:meal-chicken-rice';
const AUTO_MS = 3000;

/** Bundled fixture bytes for the estimator when no camera exists. The fake provider ignores the bytes. */
export async function fixtureBase64(): Promise<string> {
  try {
    let uri: string | undefined;
    try { const a = Asset.fromModule(media['meal-chicken-rice']); if (!a.uri && a.downloadAsync) await a.downloadAsync(); uri = a.localUri || a.uri || undefined; } catch { /* fall through */ }
    if (!uri) uri = (Image as any).resolveAssetSource?.(media['meal-chicken-rice'])?.uri;
    if (!uri) return '';
    const blob = await (await fetch(uri)).blob();
    return await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onerror = () => reject(r.error);
      r.onload = () => { const s = String(r.result || ''); resolve(s.includes(',') ? s.slice(s.indexOf(',') + 1) : s); };
      r.readAsDataURL(blob);
    });
  } catch { return ''; }
}

function usePulse(ms: number) {
  const a = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([Animated.timing(a, { toValue: 0.45, duration: ms / 2, useNativeDriver: Platform.OS !== 'web' }), Animated.timing(a, { toValue: 1, duration: ms / 2, useNativeDriver: Platform.OS !== 'web' })]));
    loop.start(); return () => loop.stop();
  }, [a, ms]);
  return a;
}

export function CameraStage({ onCapture, onClose }: { onCapture: (c: Capture) => void; onClose: () => void }) {
  const [perm, request] = useCameraPermissions();
  const [camFailed, setCamFailed] = useState(false);
  const cam = useRef<CameraView>(null);
  const firing = useRef(false);
  const square = usePulse(1600); const dot = usePulse(1200);
  const live = !!perm?.granted && !camFailed;

  useEffect(() => { if (perm && !perm.granted && perm.canAskAgain) request().catch(() => {}); }, [perm, request]);

  const shutter = async () => {
    if (firing.current) return; firing.current = true;
    let capture: Capture | null = null;
    if (live && cam.current) {
      try {
        const pic = await cam.current.takePictureAsync({ base64: true, quality: 0.7 });
        if (pic) { const raw = pic.base64 || ''; capture = { base64: raw.includes(',') ? raw.slice(raw.indexOf(',') + 1) : raw, uri: pic.uri || null }; }
      } catch { capture = null; }
    }
    if (!capture) capture = { base64: await fixtureBase64(), uri: FIXTURE_URI };
    onCapture(capture);
  };
  const shutterRef = useRef(shutter); shutterRef.current = shutter;
  useEffect(() => { const id = setTimeout(() => { shutterRef.current(); }, AUTO_MS); return () => clearTimeout(id); }, []);

  const round = (extra?: object) => [{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' } as const, extra];
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000', zIndex: 5 }]} testID="meal-camera">
      <View style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {live ? (
          <CameraView ref={cam} style={StyleSheet.absoluteFill} facing="back" onMountError={() => setCamFailed(true)} />
        ) : (
          <Image source={media['meal-chicken-rice']} resizeMode="cover" style={[StyleSheet.absoluteFill, { width: '100%', height: '100%', opacity: 0.8 }]} accessibilityIgnoresInvertColors />
        )}
        <LinearGradient pointerEvents="none" colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.5)']} locations={[0, 0.22, 0.72, 1]} style={StyleSheet.absoluteFill} />
        <View style={{ position: 'absolute', top: 14, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={round()}><Icon name="x" size={16} color="#fff" /></Pressable>
          <Text style={{ fontFamily: font.bodyBold, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)', backgroundColor: 'rgba(0,0,0,0.45)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, overflow: 'hidden' }}>Meal photo</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Flash" style={round()}><Icon name="flash" size={15} color="#fff" /></Pressable>
        </View>
        <View pointerEvents="none" style={{ position: 'absolute', top: '50%', left: '50%', width: 230, height: 230, marginLeft: -115, marginTop: -115 }}>
          <View style={[corner, { top: 0, left: 0, borderTopWidth: 2.5, borderLeftWidth: 2.5, borderTopLeftRadius: 8 }]} />
          <View style={[corner, { top: 0, right: 0, borderTopWidth: 2.5, borderRightWidth: 2.5, borderTopRightRadius: 8 }]} />
          <View style={[corner, { bottom: 0, left: 0, borderBottomWidth: 2.5, borderLeftWidth: 2.5, borderBottomLeftRadius: 8 }]} />
          <View style={[corner, { bottom: 0, right: 0, borderBottomWidth: 2.5, borderRightWidth: 2.5, borderBottomRightRadius: 8 }]} />
          <Animated.View style={{ position: 'absolute', top: 89, left: 89, width: 52, height: 52, borderWidth: 1.5, borderColor: color.orange, borderRadius: 8, opacity: square }} />
        </View>
        <View pointerEvents="none" style={{ position: 'absolute', bottom: 18, left: 0, right: 0, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(0,0,0,0.45)', paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999 }}>
            <Animated.View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: color.orange, opacity: dot }} />
            <Text style={{ fontFamily: font.bodySemi, fontSize: 11, color: 'rgba(255,255,255,0.85)' }}>Hold steady — capturing automatically</Text>
          </View>
        </View>
      </View>
      <View style={{ height: 112, backgroundColor: '#000', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 36 }}>
        <Image source={media['meal-chicken-rice']} resizeMode="cover" style={{ width: 42, height: 42, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' }} accessibilityLabel="Last photo" accessibilityIgnoresInvertColors />
        <Pressable accessibilityRole="button" accessibilityLabel="Take photo" onPress={shutter} testID="meal-shutter" style={({ pressed }) => [{ width: 68, height: 68, borderRadius: 34, borderWidth: 3, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' }, pressed ? { transform: [{ scale: 0.94 }] } : null]}>
          <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: '#fff' }} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Flip camera" style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}><Icon name="flip" size={18} color="#fff" /></Pressable>
      </View>
    </View>
  );
}
const corner = { position: 'absolute', width: 26, height: 26, borderColor: '#fff' } as const;
