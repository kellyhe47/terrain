// Native inline YouTube player. Nothing is downloaded — the embed page is loaded in a WebView and
// YouTube streams it. The web build resolves `ytPlayer.web.tsx` instead, so react-native-webview
// never reaches the web bundle.
import React from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export function YtPlayer({ embedUrl, onError }: { embedUrl: string; onError?: () => void }) {
  return (
    <WebView
      source={{ uri: embedUrl }}
      style={StyleSheet.absoluteFill}
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      allowsFullscreenVideo
      javaScriptEnabled
      domStorageEnabled
      originWhitelist={['*']}
      onError={onError}
      onHttpError={onError}
    />
  );
}
