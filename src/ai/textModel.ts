// Text model seam. The ONLY caller of `complete` is the context assembler (PRD R63) — enforced by privacy_boundary.test.ts.
export type Surface = 'chat' | 'plan' | 'explanation' | 'nutrition_gaps' | 'injury_tags';
export interface TextRequest {
  surface: Surface; system: string; user: string;
  jsonSchema?: { name: string; schema: Record<string, unknown> };
  /** Structured payload the fake reads; the real client renders it into `user`. */
  payload?: Record<string, unknown>;
}
export interface TextResponse { text: string; json?: unknown; }
export interface TextModel {
  readonly name: string;
  complete(req: TextRequest, onToken?: (chunk: string) => void): Promise<TextResponse>;
}
export class ModelUnavailableError extends Error { constructor(msg = 'model unavailable') { super(msg); this.name = 'ModelUnavailableError'; } }
