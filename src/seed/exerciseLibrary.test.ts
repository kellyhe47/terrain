// Seed-data invariants (PRD R22). These are the properties the rails, the players and the Form video screen
// assume; a bad row here fails silently at runtime, so it fails loudly here instead.
import { describe, it, expect } from 'vitest';
import {
  EXERCISES, CONTRAINDICATION_TAGS, MUSCLE_GROUPS, EQUIPMENT_ITEMS, exerciseLibrary, embedUrl, watchUrl,
} from './exerciseLibrary';

const tagVocab = new Set<string>(CONTRAINDICATION_TAGS);
const muscleVocab = new Set<string>(MUSCLE_GROUPS);
const gearVocab = new Set<string>(EQUIPMENT_ITEMS);

describe('exercise library', () => {
  it('ships at least 50 exercises', () => {
    expect(EXERCISES.length).toBeGreaterThanOrEqual(50);
  });

  it('has unique ids', () => {
    const ids = EXERCISES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('covers every session phase and both upper and lower work', () => {
    for (const phase of ['warmup', 'main', 'cooldown'] as const) {
      expect(EXERCISES.filter((e) => e.phases.includes(phase)).length).toBeGreaterThan(3);
    }
    const upper = EXERCISES.filter((e) => e.muscles.primary.some((m) => ['chest', 'lats', 'upper_back', 'front_delts', 'side_delts', 'rear_delts', 'biceps', 'triceps'].includes(m)));
    const lower = EXERCISES.filter((e) => e.muscles.primary.some((m) => ['quads', 'hamstrings', 'glutes', 'calves'].includes(m)));
    expect(upper.length).toBeGreaterThanOrEqual(10);
    expect(lower.length).toBeGreaterThanOrEqual(10);
  });

  it('keeps the tag vocabularies separate and valid', () => {
    for (const e of EXERCISES) {
      for (const t of e.tags) expect(tagVocab.has(t), `${e.id}: unknown contraindication tag "${t}"`).toBe(true);
      for (const m of [...e.muscles.primary, ...e.muscles.secondary]) expect(muscleVocab.has(m), `${e.id}: unknown muscle "${m}"`).toBe(true);
      for (const q of e.equipment) expect(gearVocab.has(q), `${e.id}: unknown equipment "${q}"`).toBe(true);
      // A muscle or a piece of gear leaking into `tags` would silently contraindicate healthy exercises.
      for (const t of e.tags) expect(muscleVocab.has(t) || gearVocab.has(t)).toBe(false);
    }
  });

  it('gives every exercise a primary mover, equipment, a cue and form points', () => {
    for (const e of EXERCISES) {
      expect(e.muscles.primary.length, `${e.id} has no primary mover`).toBeGreaterThan(0);
      expect(e.equipment.length, `${e.id} has no equipment`).toBeGreaterThan(0);
      expect(e.venues.length, `${e.id} has no venue`).toBeGreaterThan(0);
      expect(e.cue.trim().length, `${e.id} has no cue`).toBeGreaterThan(0);
      expect(e.form.length, `${e.id} has too few form points`).toBeGreaterThanOrEqual(2);
      // Primary and secondary movers must not overlap.
      expect(e.muscles.primary.filter((m) => (e.muscles.secondary as string[]).includes(m))).toEqual([]);
    }
  });

  it('builds watch, embed and thumbnail URLs from a well-formed video id', () => {
    for (const e of EXERCISES) {
      expect(e.videoId, `${e.id} has a malformed video id`).toMatch(/^[A-Za-z0-9_-]{11}$/);
      expect(e.videoUrl).toBe(watchUrl(e.videoId));
      expect(e.videoEmbedUrl).toBe(embedUrl(e.videoId));
      expect(e.videoEmbedUrl).toContain('playsinline=1'); // inline playback, not a fullscreen takeover
      expect(e.thumbnailUrl).toContain(e.videoId);
    }
  });

  it('exposes the vocabularies through the injected seam', () => {
    expect(exerciseLibrary.all()).toHaveLength(EXERCISES.length);
    expect(exerciseLibrary.muscleVocabulary()).toEqual(MUSCLE_GROUPS);
    expect(exerciseLibrary.equipmentVocabulary()).toEqual(EQUIPMENT_ITEMS);
    expect(exerciseLibrary.get(EXERCISES[0].id)?.name).toBe(EXERCISES[0].name);
  });
});
