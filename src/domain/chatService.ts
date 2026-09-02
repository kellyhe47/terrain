// Nora chat orchestration (R43–R47, R54, R54a). Persists messages and cards; routes patches and safety actions.
import { dayOf, DOW_LONG, dow } from './dates';
import { newId, type Repo } from '../db/repo';
import type { MemoryService } from './memory';
import type { ContextAssembler } from './contextAssembler';
import type { PlanService } from './planService';
import type { CalendarService } from './calendar';
import type { ChatCard, ChatMessage } from './types';
import type { ChatReply } from './chatSchema';

export const NORA_INTRO = "Hey — I'm Nora, your coach. I build your week, adapt it from what you log and tell me, and explain your readiness in plain language. Tell me how training's been feeling, or ask me anything about the plan.";

export class ChatService {
  constructor(private repo: Repo, private memory: MemoryService, private assembler: ContextAssembler, private plans: PlanService, private calendar: CalendarService) {}

  history(): ChatMessage[] { return this.repo.listChat(); }

  /** Send a message. The user turn is persisted before the model call so a failure leaves it in the thread with Retry. */
  async send(text: string, asOf: string, onToken?: (c: string) => void): Promise<ChatMessage> {
    const user: ChatMessage = { id: newId('msg'), role: 'user', text, card: null, createdAt: asOf };
    this.repo.saveChat(user);
    return this.reply(text, asOf, onToken);
  }
  /** Produce Nora's reply for the latest user message (also used by Retry). */
  async reply(text: string, asOf: string, onToken?: (c: string) => void): Promise<ChatMessage> {
    const r: ChatReply = await this.assembler.chat(text, asOf, onToken);
    let card: ChatCard | null = null;
    if (r.safety.flagged) {
      const target = r.safety.action ? this.repo.getActivity(r.safety.action.activity_id) : null;
      const label = target ? `Pause ${DOW_LONG[dow(target.date)]}'s ${target.type === 'sprint' ? 'sprint' : target.name.toLowerCase()} session until you've been seen?` : 'Pause your next intense session until you\'ve been seen?';
      card = { kind: 'safety', state: 'proposed', title: 'Safety check', items: [label], targetActivityId: target?.id };
    } else if (r.target_proposal) {
      card = { kind: 'target', state: 'proposed', title: 'Proposed target change', items: [r.target_proposal.reason], target: { key: r.target_proposal.key, value: r.target_proposal.value } };
    } else if (r.plan_patch) {
      card = { kind: 'patch', state: 'proposed', title: 'Proposed plan change', items: r.plan_patch.items, ops: r.plan_patch.ops };
    }
    for (const w of r.memory_writes) this.memory.add(w.type, w.text, asOf, w.tags);
    const msg: ChatMessage = { id: newId('msg'), role: 'nora', text: r.reply, card, createdAt: asOf };
    this.repo.saveChat(msg);
    return msg;
  }
  private updateCard(msgId: string, patch: Partial<ChatCard>): ChatMessage | null {
    const m = this.history().find((x) => x.id === msgId); if (!m || !m.card) return null;
    const next = { ...m, card: { ...m.card, ...patch } }; this.repo.saveChat(next); return next;
  }
  /** R43a: Apply routes the ops through the same rails as generation before touching the calendar. */
  applyPatch(msgId: string, asOf: string): { ok: true; toast: string } | { ok: false; violations: string[] } {
    const m = this.history().find((x) => x.id === msgId); if (!m?.card?.ops) return { ok: false, violations: ['no patch on this message'] };
    const res = this.plans.applyPatch(m.card.ops, asOf);
    if (!res.ok) return res;
    const days = [...new Set(res.touched.map((d) => DOW_LONG[dow(d)].slice(0, 3)))];
    this.updateCard(msgId, { state: 'applied', title: 'Plan change · applied', appliedNote: `Applied · ${days.join(' and ')} updated.` });
    return { ok: true, toast: 'Patch validated · calendar updated' };
  }
  /** R11a: the accepted value persists as the user's own target. */
  applyTarget(msgId: string): { ok: boolean; toast: string } {
    const m = this.history().find((x) => x.id === msgId); if (!m?.card?.target) return { ok: false, toast: 'No target on this message' };
    this.repo.setTarget(m.card.target.key, m.card.target.value);
    this.updateCard(msgId, { state: 'applied', title: 'Target · updated', appliedNote: 'Applied · it\'s your target now — adjust it any time in Settings.' });
    return { ok: true, toast: 'Target updated · used by readiness' };
  }
  declinePatch(msgId: string) { this.updateCard(msgId, { state: 'declined', title: 'Plan change · not applied' }); }
  reconsiderPatch(msgId: string) { this.updateCard(msgId, { state: 'proposed', title: 'Proposed plan change' }); }
  /** R54: pause is a user action; the context entry was written at reply time regardless. */
  pauseSession(msgId: string) { const m = this.history().find((x) => x.id === msgId); if (m?.card?.targetActivityId) this.calendar.setPaused(m.card.targetActivityId, true); this.updateCard(msgId, { state: 'paused', title: 'Safety · session paused' }); }
  keepSession(msgId: string) { this.updateCard(msgId, { state: 'kept', title: 'Safety check' }); }
  /** R54a: un-pause is the user's — reinstates the session and writes a second dated context entry. Nora never asserts clearance. */
  resumeSession(activityId: string, asOf: string) {
    const a = this.repo.getActivity(activityId); if (!a) return;
    this.calendar.setPaused(activityId, false);
    this.memory.add('context', `User reports having been seen — ${a.name} on ${DOW_LONG[dow(a.date)]} resumed at their request`, asOf);
    for (const m of this.history()) if (m.card?.kind === 'safety' && m.card.targetActivityId === activityId && m.card.state === 'paused') this.updateCard(m.id, { state: 'kept', title: 'Safety · resumed by you', appliedNote: 'Resumed — you told me you\'ve been seen. The notes stay in my memory.' });
    void dayOf;
  }
}
