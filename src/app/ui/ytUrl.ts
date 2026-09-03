// Shared YouTube player URL builder, so the web iframe and the native WebView are configured identically.
export interface PlayerOpts {
  /** Show YouTube's own controls. Off for the ambient background loop (design: no chrome). */
  controls?: boolean;
  autoplay?: boolean;
  /** Muted + looping is what makes an ambient background legal to autoplay and calm to watch. */
  muted?: boolean;
  loop?: boolean;
}

export function playerVars(videoId: string, o: PlayerOpts = {}): Record<string, string> {
  const p: Record<string, string> = {
    playsinline: '1',
    rel: '0',
    modestbranding: '1',
    iv_load_policy: '3', // no annotation cards over the demonstration
    cc_load_policy: '0', // no auto-captions burned over an ambient background
    disablekb: '1',
    showinfo: '0',
    fs: o.controls ? '1' : '0',
    controls: o.controls ? '1' : '0',
    autoplay: o.autoplay === false ? '0' : '1',
    mute: o.muted ? '1' : '0',
  };
  // YouTube only loops a single video when it is given as a one-item playlist.
  if (o.loop) { p.loop = '1'; p.playlist = videoId; }
  return p;
}

export function playerUrl(videoId: string, o: PlayerOpts = {}): string {
  return `https://www.youtube.com/embed/${videoId}?${new URLSearchParams(playerVars(videoId, o)).toString()}`;
}
