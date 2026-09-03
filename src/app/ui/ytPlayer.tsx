// Native inline YouTube player. Nothing is downloaded — the video streams from YouTube inside a WebView.
// The web build resolves `ytPlayer.web.tsx`, so react-native-webview never reaches the web bundle.
//
// The referrer is the whole ballgame here, and all three cases were observed on a simulator, not guessed:
//   • navigating the WebView straight to the embed URL sends no referrer  → YouTube **error 153**
//   • wrapping it in a document whose baseUrl is youtube.com              → YouTube **error 152**
//   • wrapping it in a document whose baseUrl is an ordinary third-party
//     origin (what a real embedding site looks like)                     → plays
// So the iframe is wrapped in our own page and `baseUrl` is set to EMBED_ORIGIN. Keep it a plain https
// origin that is not youtube.com; changing it back to either of the other two silently breaks playback.
//
// The player is driven through the IFrame API rather than bare query params so a player-level failure
// (embedding revoked, video pulled) reaches `onError` — WebView's own onError only sees navigation errors,
// and without this the trainee would get YouTube's black error card instead of the poster frame.
import React from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { playerVars, type PlayerOpts } from './ytUrl';

const EMBED_ORIGIN = 'https://terrain.app';

const page = (videoId: string, opts: PlayerOpts) => `<!DOCTYPE html>
<html><head><meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
<style>html,body{margin:0;padding:0;height:100%;background:#000;overflow:hidden}
#player,iframe{position:absolute;top:0;left:0;width:100%;height:100%;border:0}
${opts.controls ? '' : 'iframe{filter:saturate(.7) contrast(1.05)}'}</style></head>
<body><div id="player"></div>
<script src="https://www.youtube.com/iframe_api"></script>
<script>
  var post = function (m) { if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(m); };
  // cc_load_policy=0 only sets the default; auto-captions still turn themselves on, and the cover-crop
  // scales them to fill the screen. Unloading the modules is the only reliable way to keep them off.
  var killCaptions = function (p) { try { p.unloadModule('captions'); p.unloadModule('cc'); } catch (err) {} };
  window.onYouTubeIframeAPIReady = function () {
    new YT.Player('player', {
      videoId: ${JSON.stringify(videoId)},
      playerVars: ${JSON.stringify(playerVars(videoId, opts))},
      events: {
        onReady: function (e) { ${opts.muted ? 'try { e.target.mute(); } catch (err) {}' : ''}
          killCaptions(e.target); try { e.target.playVideo(); } catch (err) {} },
        onStateChange: function (e) { killCaptions(e.target); },
        onError: function (e) { post('error:' + e.data); }
      }
    });
  };
  setTimeout(function () { if (!window.YT || !window.YT.Player) post('error:timeout'); }, 15000);
</script></body></html>`;

export function YtPlayer({ videoId, opts, onError }: { videoId: string; opts: PlayerOpts; onError?: () => void }) {
  return (
    <WebView
      source={{ html: page(videoId, opts), baseUrl: EMBED_ORIGIN }}
      style={[StyleSheet.absoluteFill, { backgroundColor: 'transparent' }]}
      pointerEvents={opts.controls ? 'auto' : 'none'}
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      allowsFullscreenVideo={!!opts.controls}
      javaScriptEnabled
      domStorageEnabled
      scrollEnabled={false}
      originWhitelist={['*']}
      onMessage={(e) => { if (e.nativeEvent.data.startsWith('error:')) onError?.(); }}
      onError={() => onError?.()}
      onHttpError={() => onError?.()}
    />
  );
}
