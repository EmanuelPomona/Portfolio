// Owner: agent/backend. Test utility: what an MP4 contains, read from its boxes (ISO BMFF), without any
// video library. Used by the npm run video tests and the C-22 checks on the committed recordings.

const CONTAINERS = new Set(['moov', 'trak', 'mdia', 'minf', 'stbl']);

/**
 * Sample formats ('avc1' for H.264), track handler types ('vide', 'soun'), and track sizes in pixels.
 * @param {Uint8Array} bytes the whole file
 * @returns {{ formats: string[], handlers: string[], sizes: [number, number][] }}
 */
export function mp4Info(bytes) {
  const buf = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const info = { formats: [], handlers: [], sizes: [] };
  const walk = (start, end) => {
    for (let at = start; at + 8 <= end; ) {
      let size = buf.readUInt32BE(at);
      const type = buf.toString('latin1', at + 4, at + 8);
      if (size === 1) size = Number(buf.readBigUInt64BE(at + 8));
      if (size === 0) size = end - at;
      if (size < 8) break;
      if (CONTAINERS.has(type)) walk(at + 8, at + size);
      if (type === 'hdlr') info.handlers.push(buf.toString('latin1', at + 16, at + 20));
      if (type === 'stsd') info.formats.push(buf.toString('latin1', at + 20, at + 24));
      if (type === 'tkhd') {
        const tail = at + size; // width and height are the last two 16.16 fixed-point fields
        info.sizes.push([buf.readUInt32BE(tail - 8) / 65536, buf.readUInt32BE(tail - 4) / 65536]);
      }
      at += size;
    }
  };
  walk(0, buf.length);
  return info;
}
