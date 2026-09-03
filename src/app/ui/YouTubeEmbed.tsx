// Thumbnail-first YouTube embed (PRD R20/R22). Nothing is bundled or downloaded: the poster frame is
// YouTube's own thumbnail and the video streams from an inline embed once the trainee taps play.
// Playing on tap rather than on mount keeps it honest for reduce-motion and metered connections.
import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, View } from 'react-native';
import { color } from '../../theme/tokens';
import { Icon } from './icons';
import { Small } from './text';
import { YtPlayer } from './ytPlayer';

export function YouTubeEmbed({ embedUrl, thumbnailUrl, watchUrl, name, onOpenExternal }: {
  embedUrl: string; thumbnailUrl: string; watchUrl: string; name: string; onOpenExternal: () => void;
}) {
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <View style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: color.border }}>
      {playing && !failed ? (
        <YtPlayer embedUrl={`${embedUrl}&autoplay=1`} onError={() => setFailed(true)} />
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={failed ? `Open the ${name} demonstration on YouTube` : `Play the ${name} demonstration`}
          onPress={() => (failed ? onOpenExternal() : setPlaying(true))}
          style={{ flex: 1 }}
        >
          <Image source={{ uri: thumbnailUrl }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} resizeMode="cover" />
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.35)', gap: 8 }}>
            <View style={{ width: 56, height: 56, borderRadius: 999, backgroundColor: color.orange, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="play" size={22} color={color.textOnOrange} />
            </View>
            {failed ? <Small c={color.text1}>Can’t play here — tap to watch on YouTube</Small> : null}
          </View>
        </Pressable>
      )}
    </View>
  );
}

/** Small loading affordance, exported so screens can match the embed's frame while data resolves. */
export function EmbedSkeleton() {
  return (
    <View style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: color.surface, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={color.text3} />
    </View>
  );
}
