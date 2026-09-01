import { z } from 'zod';
export const MemoryWriteSchema = z.object({ type: z.enum(['injury', 'preference', 'context']), text: z.string().min(1), tags: z.array(z.string()).default([]) });
export const PatchOpSchema = z.union([
  z.object({ op: z.literal('move'), activity_id: z.string(), to_date: z.string() }),
  z.object({ op: z.literal('swap_exercise'), activity_id: z.string(), from_exercise_id: z.string(), to_exercise_id: z.string() }),
]);
export const PlanPatchSchema = z.object({ summary: z.string(), items: z.array(z.string()).min(1), ops: z.array(PatchOpSchema).min(1) });
export const SafetySchema = z.object({ flagged: z.boolean(), referral: z.boolean(), no_diagnosis: z.boolean(), no_clearance: z.boolean(), action: z.object({ activity_id: z.string(), label: z.string() }).nullable() });
export const TargetProposalSchema = z.object({ key: z.enum(['protein_g', 'hydration_l', 'steps', 'calories', 'carbs_g', 'fat_g', 'fiber_g']), value: z.number().positive(), reason: z.string() });
export const ChatReplySchema = z.object({ reply: z.string().min(1), memory_writes: z.array(MemoryWriteSchema).default([]), plan_patch: PlanPatchSchema.nullable().default(null), target_proposal: TargetProposalSchema.nullable().default(null), safety: SafetySchema });
export type ChatReply = z.infer<typeof ChatReplySchema>;
export type PatchOp = z.infer<typeof PatchOpSchema>;

export const CHAT_JSON_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['reply', 'memory_writes', 'plan_patch', 'target_proposal', 'safety'],
  properties: {
    reply: { type: 'string' },
    memory_writes: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['type', 'text', 'tags'], properties: { type: { type: 'string', enum: ['injury', 'preference', 'context'] }, text: { type: 'string' }, tags: { type: 'array', items: { type: 'string' } } } } },
    plan_patch: { anyOf: [{ type: 'null' }, { type: 'object', additionalProperties: false, required: ['summary', 'items', 'ops'], properties: {
      summary: { type: 'string' }, items: { type: 'array', items: { type: 'string' } },
      ops: { type: 'array', items: { anyOf: [
        { type: 'object', additionalProperties: false, required: ['op', 'activity_id', 'to_date'], properties: { op: { type: 'string', enum: ['move'] }, activity_id: { type: 'string' }, to_date: { type: 'string' } } },
        { type: 'object', additionalProperties: false, required: ['op', 'activity_id', 'from_exercise_id', 'to_exercise_id'], properties: { op: { type: 'string', enum: ['swap_exercise'] }, activity_id: { type: 'string' }, from_exercise_id: { type: 'string' }, to_exercise_id: { type: 'string' } } },
      ] } } } }] },
    target_proposal: { anyOf: [{ type: 'null' }, { type: 'object', additionalProperties: false, required: ['key', 'value', 'reason'], properties: { key: { type: 'string', enum: ['protein_g', 'hydration_l', 'steps', 'calories', 'carbs_g', 'fat_g', 'fiber_g'] }, value: { type: 'number' }, reason: { type: 'string' } } }] },
    safety: { type: 'object', additionalProperties: false, required: ['flagged', 'referral', 'no_diagnosis', 'no_clearance', 'action'], properties: {
      flagged: { type: 'boolean' }, referral: { type: 'boolean' }, no_diagnosis: { type: 'boolean' }, no_clearance: { type: 'boolean' },
      action: { anyOf: [{ type: 'null' }, { type: 'object', additionalProperties: false, required: ['activity_id', 'label'], properties: { activity_id: { type: 'string' }, label: { type: 'string' } } }] } } },
  },
} as const;

export const GapsNarrationSchema = z.object({ items: z.array(z.object({ key: z.string(), name: z.string(), stat: z.string(), note: z.string() })), summary: z.string() });
export type GapsNarration = z.infer<typeof GapsNarrationSchema>;
export const GAPS_JSON_SCHEMA = { type: 'object', additionalProperties: false, required: ['items', 'summary'], properties: {
  items: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['key', 'name', 'stat', 'note'], properties: { key: { type: 'string' }, name: { type: 'string' }, stat: { type: 'string' }, note: { type: 'string' } } } }, summary: { type: 'string' } } } as const;

export const InjuryTagsSchema = z.object({ tags: z.array(z.string()) });
export const INJURY_TAGS_JSON_SCHEMA = { type: 'object', additionalProperties: false, required: ['tags'], properties: { tags: { type: 'array', items: { type: 'string' } } } } as const;
