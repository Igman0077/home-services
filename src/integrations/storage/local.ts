import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import type { StorageProvider, StoredObject } from "./types";

const ROOT = path.join(process.cwd(), ".data", "uploads");

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120) || "file";
}

export function createLocalStorageProvider(): StorageProvider {
  return {
    async put(userId, file): Promise<StoredObject> {
      const safeName = sanitizeFileName(file.fileName);
      const hash = createHash("sha256")
        .update(file.buffer)
        .digest("hex")
        .slice(0, 12);
      const storageKey = path.posix.join(
        "local",
        userId,
        `${randomUUID()}-${hash}-${safeName}`,
      );
      const abs = path.join(ROOT, ...storageKey.split("/"));
      await mkdir(path.dirname(abs), { recursive: true });
      await writeFile(abs, file.buffer);
      return {
        storageKey,
        sizeBytes: file.buffer.byteLength,
        mimeType: file.mimeType,
        fileName: safeName,
      };
    },
    async get(storageKey) {
      if (!storageKey.startsWith("local/")) return null;
      const abs = path.join(ROOT, ...storageKey.split("/"));
      try {
        return await readFile(abs);
      } catch {
        return null;
      }
    },
    async delete(storageKey) {
      if (!storageKey.startsWith("local/")) return;
      const abs = path.join(ROOT, ...storageKey.split("/"));
      try {
        await unlink(abs);
      } catch {
        // ignore missing
      }
    },
  };
}
