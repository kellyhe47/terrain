// Coach memory service (PRD R44–R46). Typed, dated entries; injuries carry contraindication tags (R61).
import { dayOf, type ISODate } from './dates';
import type { MemoryEntry, MemoryType } from './types';
import { newId, type Repo } from '../db/repo';

export class MemoryService {
  constructor(private repo: Repo) {}
  list(): MemoryEntry[] { return this.repo.listMemory(); }
  add(type: MemoryType, text: string, asOf: string, tags: string[] = [], date?: ISODate): MemoryEntry {
    const e: MemoryEntry = { id: newId('mem'), type, text, date: date ?? dayOf(asOf), tags: type === 'injury' ? tags : [], resolved: false, createdAt: asOf };
    this.repo.saveMemory(e); return e;
  }
  /** R46: only injury entries resolve; they grey out and stop contraindicating. */
  resolve(id: string): boolean { const e = this.list().find((m) => m.id === id); if (!e || e.type !== 'injury') return false; this.repo.saveMemory({ ...e, resolved: true }); return true; }
  /** R46: deletion removes the entry from the next assembled payload immediately. */
  delete(id: string): void { this.repo.deleteMemory(id); }
  activeContraindicatedTags(): string[] { return [...new Set(this.list().filter((m) => m.type === 'injury' && !m.resolved).flatMap((m) => m.tags))]; }
  active(): MemoryEntry[] { return this.list(); }
}
