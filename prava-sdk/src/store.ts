import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { SessionRecord } from "./types.js";

export interface SessionStore {
  get(sessionId: string): SessionRecord | undefined;
  set(record: SessionRecord): void;
  listByClient(clientId: string): SessionRecord[];
}

export class MemorySessionStore implements SessionStore {
  private readonly map = new Map<string, SessionRecord>();

  get(sessionId: string): SessionRecord | undefined {
    return this.map.get(sessionId);
  }

  set(record: SessionRecord): void {
    this.map.set(record.sessionId, record);
  }

  listByClient(clientId: string): SessionRecord[] {
    return [...this.map.values()].filter((r) => r.clientId === clientId);
  }
}

export class FileSessionStore implements SessionStore {
  constructor(private readonly dir: string) {
    mkdirSync(dir, { recursive: true });
  }

  private pathFor(sessionId: string): string {
    const safe = sessionId.replace(/[^a-zA-Z0-9._-]/g, "_");
    return join(this.dir, `${safe}.json`);
  }

  get(sessionId: string): SessionRecord | undefined {
    const p = this.pathFor(sessionId);
    if (!existsSync(p)) return undefined;
    try {
      return JSON.parse(readFileSync(p, "utf8")) as SessionRecord;
    } catch {
      return undefined;
    }
  }

  set(record: SessionRecord): void {
    writeFileSync(this.pathFor(record.sessionId), JSON.stringify(record), "utf8");
  }

  listByClient(clientId: string): SessionRecord[] {
    const out: SessionRecord[] = [];
    for (const name of readdirSync(this.dir)) {
      if (!name.endsWith(".json")) continue;
      try {
        const rec = JSON.parse(
          readFileSync(join(this.dir, name), "utf8"),
        ) as SessionRecord;
        if (rec.clientId === clientId) out.push(rec);
      } catch {
        // skip corrupt
      }
    }
    return out;
  }
}
