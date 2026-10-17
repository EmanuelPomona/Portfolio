// Owner: agent/backend. Types for ./mp4-boxes.mjs (test utility).
export declare function mp4Info(bytes: Uint8Array): {
  formats: string[];
  handlers: string[];
  sizes: [number, number][];
};
