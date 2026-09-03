// The exercise demonstration, streamed from YouTube (PRD R20/R22, R30/R81). Nothing is bundled or downloaded.
//
// Two shapes, one source:
//   `background` — the full-bleed ambient loop behind the gym player. Muted, looping, no YouTube chrome and
//                  not interactive, cover-cropped like the design's `object-fit:cover` video.
//   default      — a 16:9 card with YouTube's controls, for the Form video screen.
//
// A 16:9 player cannot letterbox into a portrait screen, so the background variant measures its container
// and over-sizes the player to cover it, clipping the overflow — the RN equivalent of object-fit: cover.
// YouTube's own thumbnail sits behind the player throughout: it is the poster frame while the embed loads,
// so the screen is never blank. If the embed fails outright — a gym's flaky wifi is the ordinary case — the
// background variant falls back to the bundled loop, because a black workout screen is worse than a
// generic one; the 16:9 card just keeps the poster frame.
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { color } from '../../theme/tokens';
import { media } from './assets';
import { YtPlayer } from './ytPlayer';

const ASPECT = 16 / 9;

/** Over-size a 16:9 player so it covers `w × h`, centred — object-fit: cover for an iframe. */
function coverBox(w: number, h: number) {
  if (w <= 0 || h <= 0) return null;
  const vw = Math.max(w, h * ASPECT);
  const vh = vw / ASPECT;
  return { position: 'absolute' as const, width: vw, height: vh, left: (w - vw) / 2, top: (h - vh) / 2 };
}

export function ExerciseVideo({ videoId, thumbnailUrl, background, paused, style }: {
  videoId: string;
  thumbnailUrl: string;
  /** Ambient full-bleed loop (gym player) rather than a controllable 16:9 card. */
  background?: boolean;
  /** Reduce-motion, or the screen is not visible: show the poster frame only. */
  paused?: boolean;
  style?: object;
}) {
  const [{ w, h }, setSize] = useState({ w: 0, h: 0 });
  const [failed, setFailed] = useState(false);
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== w || height !== h) setSize({ w: width, h: height });
  };

  const box = background ? coverBox(w, h) : StyleSheet.absoluteFill;
  const show = !paused && !failed && (!background || !!box);
  const offline = background && failed && !paused;

  return (
    <View
      onLayout={onLayout}
      pointerEvents={background ? 'none' : 'auto'}
      style={[
        background
          ? [StyleSheet.absoluteFill, { backgroundColor: '#000' }]
          : { width: '100%', aspectRatio: ASPECT, backgroundColor: '#000', borderRadius: 8, borderWidth: 1, borderColor: color.border },
        { overflow: 'hidden' },
        style,
      ]}
    >
      <Image source={{ uri: thumbnailUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      {offline ? <BundledLoop /> : null}
      {show ? (
        <View style={box as object}>
          <YtPlayer
            videoId={videoId}
            opts={background ? { controls: false, muted: true, loop: true, autoplay: true } : { controls: true, autoplay: true }}
            onError={() => setFailed(true)}
          />
        </View>
      ) : null}
    </View>
  );
}

/** Offline/failed fallback for the ambient background: the bundled gym loop the app shipped with. */
function BundledLoop() {
  const player = useVideoPlayer(media.gymLoop, (p) => { p.loop = true; p.muted = true; p.play(); });
  useEffect(() => { try { player.play(); } catch {} }, [player]);
  return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />;
}
