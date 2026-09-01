// Nora chat (PRD R43–R47, R54, R54a). Thread from t.chat.history(); patch and safety cards; offline / error / streaming states.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useTerrain } from '../state';
import { useNav } from '../nav';
import { NORA_INTRO } from '../../domain/chatService';
import type { ChatCard, ChatMessage } from '../../domain/types';
import { color, font, radius } from '../../theme/tokens';
import { Display, Body, Semi, Small, Tiny } from '../ui/text';
import { Shimmer } from '../ui/primitives';
import { Icon } from '../ui/icons';
import { useReduceMotion } from '../hooks';

type Pending = { kind: 'idle' } | { kind: 'streaming'; text: string } | { kind: 'error'; lastUserText: string };

export function NoraScreen() {
  const { t, version, bump, asOf, showToast } = useTerrain();
  const nav = useNav();
  const reduceMotion = useReduceMotion();
  const history = t.chat.history();
  const sharedCount = t.assembler.sharedSignalCount(asOf());
  const offline = t.flags.nora === 'offline' || (globalThis as { navigator?: { onLine?: boolean } }).navigator?.onLine === false;

  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState<Pending>({ kind: 'idle' });
  const scroll = useRef<ScrollView>(null);
  const runId = useRef(0);

  // Draft handed over from another screen (e.g. "Ask Nora" on a session) prefills the composer once.
  useEffect(() => {
    const g = globalThis as { __terrainDraft?: unknown };
    if (typeof g.__terrainDraft === 'string') { setDraft(g.__terrainDraft); delete g.__terrainDraft; }
  }, []);

  const scrollToEnd = useCallback(() => { scroll.current?.scrollToEnd({ animated: !reduceMotion }); }, [reduceMotion]);
  useEffect(() => { scrollToEnd(); }, [version, pending.kind, scrollToEnd]);

  const run = useCallback((userText: string, start: (onToken: (c: string) => void) => Promise<ChatMessage>) => {
    const id = ++runId.current;
    setPending({ kind: 'streaming', text: '' });
    const onToken = (c: string) => { if (id !== runId.current) return; setPending((p) => (p.kind === 'streaming' ? { kind: 'streaming', text: p.text + c } : p)); };
    let p: Promise<ChatMessage>;
    try { p = start(onToken); } catch { p = Promise.reject(new Error('send failed')); }
    bump(); // the user turn is persisted synchronously before the model call
    p.then(() => { if (id !== runId.current) return; setPending({ kind: 'idle' }); bump(); })
      .catch(() => { if (id !== runId.current) return; setPending({ kind: 'error', lastUserText: userText }); bump(); });
  }, [bump]);

  const send = () => {
    const text = draft.trim();
    if (!text || pending.kind === 'streaming') return;
    setDraft('');
    run(text, (onToken) => t.chat.send(text, asOf(), onToken));
  };
  const retry = (lastUserText: string) => run(lastUserText, (onToken) => t.chat.reply(lastUserText, asOf(), onToken));

  const onApply = (m: ChatMessage) => {
    const r = t.chat.applyPatch(m.id, asOf()); bump();
    if (r.ok) showToast('Patch validated · calendar updated'); else showToast('Patch rejected: ' + r.violations[0]);
  };
  const onDecline = (m: ChatMessage) => { t.chat.declinePatch(m.id); bump(); };
  const onReconsider = (m: ChatMessage) => { t.chat.reconsiderPatch(m.id); bump(); };
  const onPause = (m: ChatMessage) => { t.chat.pauseSession(m.id); bump(); };
  const onKeep = (m: ChatMessage) => { t.chat.keepSession(m.id); bump(); };

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }} testID="nora">
      <View style={{ paddingTop: 8, paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderColor: color.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Display size={26} lh={26 * 0.95}>Nora</Display>
          <Pressable accessibilityRole="button" accessibilityLabel="What Nora knows" onPress={() => nav.push({ name: 'knows' })} hitSlop={8}>
            <Semi c={color.orange} size={12} lh={16}>Sees {sharedCount} shared signals →</Semi>
          </Pressable>
        </View>
      </View>

      <ScrollView ref={scroll} style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: 20, gap: 12 }} onContentSizeChange={scrollToEnd} keyboardShouldPersistTaps="handled">
        {offline ? (
          <View style={{ backgroundColor: color.surface2, borderWidth: 1, borderColor: color.border, borderRadius: radius.md, paddingVertical: 10, paddingHorizontal: 14 }} accessibilityRole="alert">
            <Small c={color.text3} size={12} lh={17} style={{ textAlign: 'center' }}>You're offline. Nora will reply when you're back — logging still works.</Small>
          </View>
        ) : null}
        {history.length === 0 ? <NoraBubble text={NORA_INTRO} /> : null}
        {history.map((m) => (
          <React.Fragment key={m.id}>
            {m.role === 'user' ? <UserBubble text={m.text} /> : m.text ? <NoraBubble text={m.text} /> : null}
            {m.role === 'nora' && m.card?.kind === 'patch' ? <PatchCard card={m.card} onApply={() => onApply(m)} onDecline={() => onDecline(m)} onReconsider={() => onReconsider(m)} onViewCalendar={() => nav.setTab('calendar')} /> : null}
            {m.role === 'nora' && m.card?.kind === 'safety' ? <SafetyCard card={m.card} onPause={() => onPause(m)} onKeep={() => onKeep(m)} /> : null}
          </React.Fragment>
        ))}
        {pending.kind === 'streaming' ? (
          <View style={bubble.nora} accessibilityLabel="Nora is replying">
            {pending.text ? (
              <Body size={14} lh={21}>{pending.text}<Cursor reduceMotion={reduceMotion} /></Body>
            ) : (
              <View style={{ gap: 8, paddingVertical: 3 }}><Shimmer width="88%" /><Shimmer width="62%" /></View>
            )}
          </View>
        ) : null}
        {pending.kind === 'error' ? (
          <View style={{ maxWidth: '85%', backgroundColor: color.surface, borderWidth: 1, borderStyle: 'dashed', borderColor: color.red, borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 14, alignSelf: 'flex-start' }} accessibilityRole="alert">
            <Body size={13} lh={18}>Nora couldn't reply — connection dropped.</Body>
            <Pressable accessibilityRole="button" onPress={() => retry(pending.lastUserText)} style={({ pressed }) => [{ marginTop: 8, alignSelf: 'flex-start', borderWidth: 1, borderColor: color.borderStrong, backgroundColor: pressed ? color.surface3 : color.surface2, borderRadius: radius.sm, paddingVertical: 8, paddingHorizontal: 14 }]}>
              <Semi c={color.text1} size={12} lh={16}>Retry</Semi>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      <View style={{ paddingVertical: 12, paddingHorizontal: 20, borderTopWidth: 1, borderColor: color.border, flexDirection: 'row', gap: 8 }}>
        <TextInput
          value={draft} onChangeText={setDraft} onSubmitEditing={send} blurOnSubmit={false} returnKeyType="send"
          placeholder="Message Nora…" placeholderTextColor={color.text3} accessibilityLabel="Message Nora"
          style={{ flex: 1, minWidth: 0, backgroundColor: color.surface, borderWidth: 1, borderColor: color.border, borderRadius: radius.sm, paddingVertical: 12, paddingHorizontal: 14, color: color.text1, fontFamily: font.body, fontSize: 14 }}
        />
        <Pressable accessibilityRole="button" accessibilityLabel="Send" onPress={send} disabled={pending.kind === 'streaming'} style={({ pressed }) => [{ width: 44, height: 44, borderRadius: radius.sm, backgroundColor: pressed ? color.orangeHover : color.orange, alignItems: 'center', justifyContent: 'center', opacity: pending.kind === 'streaming' ? 0.6 : 1 }]}>
          <Icon name="send" size={18} color={color.textOnOrange} />
        </Pressable>
      </View>
    </View>
  );
}

const bubble = {
  user: { alignSelf: 'flex-end', maxWidth: '80%', backgroundColor: color.surface3, borderRadius: radius.md, paddingVertical: 11, paddingHorizontal: 14 },
  nora: { alignSelf: 'flex-start', maxWidth: '85%', backgroundColor: color.surface, borderWidth: 1, borderColor: color.border, borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 14 },
  card: { alignSelf: 'flex-start', maxWidth: '92%', width: '92%', backgroundColor: color.surface, borderWidth: 1, borderRadius: radius.md, overflow: 'hidden' },
} as const;

function UserBubble({ text }: { text: string }) { return <View style={bubble.user}><Body c={color.text1} size={14} lh={21}>{text}</Body></View>; }
function NoraBubble({ text }: { text: string }) { return <View style={bubble.nora}><Body size={14} lh={21}>{text}</Body></View>; }

function CardHead({ label, c, check }: { label: string; c: string; check?: boolean }) {
  return (
    <View style={{ paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderColor: color.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Tiny c={c} size={11} lh={14} style={{ fontFamily: font.bodyBold, letterSpacing: 0.88, textTransform: 'uppercase' }}>{label}</Tiny>
      {check ? <Icon name="check" size={16} color={color.green} strokeWidth={2.5} /> : null}
    </View>
  );
}

/** Footer button pair: the design's split row (left ghost / right filled). */
function FootBtn({ label, onPress, bg, pressBg, c, left }: { label: string; onPress: () => void; bg: string; pressBg: string; c: string; left?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [{ flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: pressed ? pressBg : bg }, left ? { borderLeftWidth: 1, borderColor: color.border } : null]}>
      <Semi c={c} size={13} lh={16}>{label}</Semi>
    </Pressable>
  );
}

function PatchCard({ card, onApply, onDecline, onReconsider, onViewCalendar }: { card: ChatCard; onApply: () => void; onDecline: () => void; onReconsider: () => void; onViewCalendar: () => void }) {
  const state = card.state;
  const head = state === 'applied' ? 'Plan change · applied' : state === 'declined' ? 'Plan change · not applied' : 'Proposed plan change';
  const headColor = state === 'applied' ? color.green : state === 'declined' ? color.text3 : color.orange;
  const border = state === 'applied' ? color.green : state === 'proposed' ? color.orange : color.border;
  return (
    <View style={[bubble.card, { borderColor: border }]} accessibilityLabel={head}>
      <CardHead label={head} c={headColor} check={state === 'applied'} />
      <View style={{ paddingVertical: 12, paddingHorizontal: 14, gap: 8 }}>
        {card.items.map((it, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
            <Body c={color.orange} size={13} lh={19}>{/swap/i.test(it) ? '⇄' : '→'}</Body>
            <Body size={13} lh={19} style={{ flex: 1 }}>{it}</Body>
          </View>
        ))}
        <Tiny c={color.text3} size={11} lh={15}>Checked against your plan rules before it touches the calendar.</Tiny>
      </View>
      {state === 'proposed' ? (
        <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: color.border }}>
          <FootBtn label="Not now" onPress={onDecline} bg="transparent" pressBg={color.surface2} c={color.text3} />
          <FootBtn label="Apply to calendar" onPress={onApply} bg={color.orange} pressBg={color.orangeHover} c={color.textOnOrange} left />
        </View>
      ) : null}
      {state === 'applied' ? (
        <View style={{ borderTopWidth: 1, borderColor: color.border, paddingVertical: 10, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Small c={color.green} size={12} lh={16}>{card.appliedNote ?? 'Applied · calendar updated.'}</Small>
          <Pressable accessibilityRole="button" onPress={onViewCalendar} hitSlop={6}><Semi c={color.orange} size={12} lh={16}>View calendar</Semi></Pressable>
        </View>
      ) : null}
      {state === 'declined' ? (
        <View style={{ borderTopWidth: 1, borderColor: color.border, paddingVertical: 10, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <Small c={color.text3} size={12} lh={16}>Not applied — plan unchanged.</Small>
          <Pressable accessibilityRole="button" onPress={onReconsider} hitSlop={6}><Semi c={color.orange} size={12} lh={16}>Reconsider</Semi></Pressable>
        </View>
      ) : null}
    </View>
  );
}

function SafetyCard({ card, onPause, onKeep }: { card: ChatCard; onPause: () => void; onKeep: () => void }) {
  const state = card.state;
  const head = state === 'paused' ? 'Safety · session paused' : 'Safety check';
  const headColor = state === 'paused' ? color.green : color.red;
  const border = state === 'proposed' ? color.red : color.border;
  const question = card.items[0] ?? '';
  // "Pause <session> until …" — the session name is bold in the design.
  const m = /^(Pause )(.+?)( until .*)$/.exec(question);
  return (
    <View style={[bubble.card, { borderColor: border }]} accessibilityLabel={head}>
      <View style={{ paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: state === 'proposed' ? 1 : 0, borderColor: color.border }}>
        <Tiny c={headColor} size={11} lh={14} style={{ fontFamily: font.bodyBold, letterSpacing: 0.88, textTransform: 'uppercase' }}>{head}</Tiny>
        <Body size={13} lh={19} style={{ marginTop: 6 }}>
          {m ? <>{m[1]}<Body c={color.text1} size={13} lh={19} style={{ fontFamily: font.bodyBold }}>{m[2]}</Body>{m[3]}</> : question}
        </Body>
      </View>
      {state === 'proposed' ? (
        <View style={{ flexDirection: 'row' }}>
          <FootBtn label="Keep it" onPress={onKeep} bg="transparent" pressBg={color.surface2} c={color.text3} />
          <FootBtn label="Pause it" onPress={onPause} bg={color.surface2} pressBg={color.surface3} c={color.text1} left />
        </View>
      ) : null}
      {state === 'paused' ? (
        <View style={{ paddingVertical: 10, paddingHorizontal: 14, borderTopWidth: 1, borderColor: color.border }}><Small c={color.green} size={12} lh={16}>Paused · nothing intense until you're cleared by a professional.</Small></View>
      ) : null}
      {state === 'kept' ? (
        <View style={{ paddingVertical: 10, paddingHorizontal: 14, borderTopWidth: 1, borderColor: color.border }}><Small c={color.text3} size={12} lh={16}>{card.appliedNote ?? 'Kept as planned — the note stays in my memory either way.'}</Small></View>
      ) : null}
    </View>
  );
}

function Cursor({ reduceMotion }: { reduceMotion: boolean }) {
  const [on, setOn] = useState(true);
  useEffect(() => { if (reduceMotion) return; const i = setInterval(() => setOn((v) => !v), 500); return () => clearInterval(i); }, [reduceMotion]);
  return <View style={{ width: 7, height: 13, backgroundColor: color.orange, marginLeft: 2, opacity: on ? 1 : 0.45, transform: [{ translateY: 2 }] }} />;
}
