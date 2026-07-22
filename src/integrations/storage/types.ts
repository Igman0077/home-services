export type StoredObject = {
  storageKey: string;
  sizeBytes: number;
  mimeType: string;
  fileName: string;
};

export type StorageProvider = {
  put(
    userId: string,
    file: {
      buffer: Buffer;
      fileName: string;
      mimeType: string;
    },
  ): Promise<StoredObject>;
  get(storageKey: string): Promise<Buffer | null>;
  delete(storageKey: string): Promise<void>;
};
