// Web inline YouTube player: a plain iframe. react-native-web renders unknown DOM elements as-is.
// The page has a real origin here, so the embed URL loads directly (see ytPlayer.tsx for why native cannot).
import React from 'react';
import { playerUrl, type PlayerOpts } from './ytUrl';

export function YtPlayer({ videoId, opts, onError }: { videoId: string; opts: PlayerOpts; onError?: () => void }) {
  return React.createElement('iframe', {
    src: playerUrl(videoId, opts),
    title: 'Exercise demonstration',
    allow: 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share',
    allowFullScreen: !!opts.controls,
    frameBorder: '0',
    onError,
    style: {
      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0,
      pointerEvents: opts.controls ? 'auto' : 'none',
      // Design: the ambient background video is graded down so the overlaid copy stays legible.
      filter: opts.controls ? undefined : 'saturate(.7) contrast(1.05)',
    },
  });
}
