import { createLocalStorageProvider } from "./local";
import type { StorageProvider } from "./types";

let cached: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (!cached) {
    cached = createLocalStorageProvider();
  }
  return cached;
}

export type { StorageProvider, StoredObject } from "./types";
