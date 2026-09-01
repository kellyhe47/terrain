// Form video (PRD R20): the bundled demo loop for an exercise, Nora's cue, and a link out to the library video.
import React, { useEffect } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useTerrain } from '../state';
import { useNav } from '../nav';
import { useReduceMotion } from '../hooks';
import { color, font } from '../../theme/tokens';
import { Display, Small } from '../ui/text';
import { Btn } from '../ui/primitives';
import { Icon } from '../ui/icons';
import { StatusBarFake } from '../ui/frame';
import { media } from '../ui/assets';

export function FormVideoScreen({ exerciseId }: { exerciseId: string }) {
  const { t } = useTerrain();
  const nav = useNav();
  const reduceMotion = useReduceMotion();
  const ex = t.library.get(exerciseId);
  const player = useVideoPlayer(media.gymLoop, (p) => { p.loop = true; p.muted = true; p.play(); });
  useEffect(() => { try { if (reduceMotion) player.pause(); else player.play(); } catch {} }, [reduceMotion, player]);

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBarFake light />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, paddingHorizontal: 16 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => nav.pop()} style={{ width: 30, height: 30, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="x" size={15} color="#fff" />
        </Pressable>
        <Display size={20} lh={22} c="#fff" style={{ flex: 1 }}>{ex?.name ?? exerciseId}</Display>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 14 }}>
        <View style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: color.border }}>
          {!reduceMotion ? <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} /> : null}
        </View>
        {ex ? (
          <Text style={{ fontFamily: font.body, fontSize: 14, lineHeight: 21, color: 'rgba(255,255,255,0.78)' }}>
            <Text style={{ color: color.orange, fontFamily: font.bodySemi }}>Nora:</Text>{` ${ex.cue}`}
          </Text>
        ) : null}
        {ex ? <Btn label="Open on YouTube" kind="primary" size="lg" onPress={() => { Linking.openURL(ex.videoUrl).catch(() => {}); }} /> : null}
        <Small>Demonstration from the exercise library.</Small>
      </ScrollView>
    </View>
  );
}
