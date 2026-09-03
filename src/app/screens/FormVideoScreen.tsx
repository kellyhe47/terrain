// Form video (PRD R20, R22): the YouTube demonstration for an exercise, Nora's cue, what it targets,
// what it needs, and the basic form points. The video streams from YouTube — nothing is bundled.
import React from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { useTerrain } from '../state';
import { useNav } from '../nav';
import { color, radius } from '../../theme/tokens';
import { Body, Display, Label, Semi, Small } from '../ui/text';
import { Btn } from '../ui/primitives';
import { Icon } from '../ui/icons';
import { StatusBarFake } from '../ui/frame';
import { YouTubeEmbed } from '../ui/YouTubeEmbed';
import { label } from '../../seed/exerciseLibrary';

function Tag({ text, strong }: { text: string; strong?: boolean }) {
  return (
    <View style={{
      paddingHorizontal: 9, paddingVertical: 4, borderRadius: radius.pill,
      backgroundColor: strong ? color.orangeTint : color.surface2,
      borderWidth: 1, borderColor: strong ? color.orange : color.border,
    }}>
      <Small c={strong ? color.orange : color.text2}>{text}</Small>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Label>{title}</Label>
      {children}
    </View>
  );
}

export function FormVideoScreen({ exerciseId }: { exerciseId: string }) {
  const { t } = useTerrain();
  const nav = useNav();
  const ex = t.library.get(exerciseId);
  const openExternal = () => { if (ex) Linking.openURL(ex.videoUrl).catch(() => {}); };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBarFake light />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, paddingHorizontal: 16 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => nav.pop()} style={{ width: 30, height: 30, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="x" size={15} color="#fff" />
        </Pressable>
        <Display size={20} lh={22} c="#fff" style={{ flex: 1 }}>{ex?.name ?? exerciseId}</Display>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 18 }}>
        {ex ? (
          <>
            <YouTubeEmbed
              embedUrl={ex.videoEmbedUrl}
              thumbnailUrl={ex.thumbnailUrl}
              watchUrl={ex.videoUrl}
              name={ex.name}
              onOpenExternal={openExternal}
            />

            <Body>
              <Semi c={color.orange}>Nora: </Semi>
              {ex.cue}
            </Body>

            <Section title="Targets">
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {ex.muscles.primary.map((m) => <Tag key={m} text={label(m)} strong />)}
                {ex.muscles.secondary.map((m) => <Tag key={m} text={label(m)} />)}
              </View>
              {ex.muscles.secondary.length ? <Small>Orange is the primary mover; the rest assist.</Small> : null}
            </Section>

            <Section title="Equipment">
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {ex.equipment.map((q) => <Tag key={q} text={label(q)} />)}
              </View>
            </Section>

            <Section title="Form">
              <View style={{ gap: 7 }}>
                {ex.form.map((point) => (
                  <View key={point} style={{ flexDirection: 'row', gap: 8 }}>
                    <Body c={color.orange}>·</Body>
                    <Body style={{ flex: 1 }}>{point}</Body>
                  </View>
                ))}
              </View>
            </Section>

            <Btn label="Open on YouTube" kind="secondary" size="lg" onPress={openExternal} />
            <Small>Demonstration from the exercise library. Video streams from YouTube.</Small>
          </>
        ) : (
          <Small>That exercise isn’t in the library.</Small>
        )}
      </ScrollView>
    </View>
  );
}
