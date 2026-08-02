import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { TokenRecord } from "./types.js";

function safeClientFile(clientId: string): string {
  const safe = clientId.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 128);
  return `${safe}.json`;
}

export class FileTokenStore {
  constructor(private readonly dir: string) {
    mkdirSync(dir, { recursive: true });
  }

  private pathFor(clientId: string): string {
    return join(this.dir, safeClientFile(clientId));
  }

  get(clientId: string): TokenRecord | null {
    const p = this.pathFor(clientId);
    if (!existsSync(p)) return null;
    try {
      const raw = JSON.parse(readFileSync(p, "utf8")) as TokenRecord;
      if (!raw?.accessToken) return null;
      return raw;
    } catch {
      return null;
    }
  }

  set(clientId: string, record: TokenRecord): void {
    writeFileSync(this.pathFor(clientId), JSON.stringify(record, null, 2), {
      mode: 0o600,
    });
  }

  clear(clientId: string): void {
    const p = this.pathFor(clientId);
    if (existsSync(p)) {
      writeFileSync(p, "", { mode: 0o600 });
    }
  }
}

/** In-memory store for unit tests. */
export class MemoryTokenStore {
  private readonly map = new Map<string, TokenRecord>();

  get(clientId: string): TokenRecord | null {
    return this.map.get(clientId) ?? null;
  }

  set(clientId: string, record: TokenRecord): void {
    this.map.set(clientId, record);
  }

  clear(clientId: string): void {
    this.map.delete(clientId);
  }
}

export type TokenStore = {
  get(clientId: string): TokenRecord | null;
  set(clientId: string, record: TokenRecord): void;
  clear(clientId: string): void;
};
