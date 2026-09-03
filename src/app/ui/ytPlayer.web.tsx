// Web inline YouTube player: a plain iframe. react-native-web renders unknown DOM elements as-is.
import React from 'react';

export function YtPlayer({ embedUrl, onError }: { embedUrl: string; onError?: () => void }) {
  return React.createElement('iframe', {
    src: embedUrl,
    title: 'Exercise demonstration',
    allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
    allowFullScreen: true,
    frameBorder: '0',
    onError,
    style: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 },
  });
}
