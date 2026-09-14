import zlib from 'node:zlib';

export interface ZipEntry {
  name: string;
  method: number;
  compSize: number;
  uncompSize: number;
  localOffset: number;
}

interface CentralEntry extends ZipEntry {
  nameLen: number;
  extraLen: number;
  commentLen: number;
}

function readU16(b: Buffer, o: number): number {
  return b.readUInt16LE(o);
}

function readU32(b: Buffer, o: number): number {
  return b.readUInt32LE(o);
}

// Minimal ZIP central-directory reader. Supports stored (0) and deflated (8)
// entries, which covers DOCX (Office Open XML is a zip container).
export function extractZipEntries(buf: Buffer): CentralEntry[] {
  if (buf.length < 22) return [];
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf[i] === 0x50 && buf[i + 1] === 0x4b && buf[i + 2] === 0x05 && buf[i + 3] === 0x06) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) return [];
  const count = readU16(buf, eocd + 10);
  const cdOff = readU32(buf, eocd + 16);
  const entries: CentralEntry[] = [];
  let o = cdOff;
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(o) !== 0x02014b50) break;
    const method = readU16(buf, o + 10);
    const compSize = readU32(buf, o + 20);
    const uncompSize = readU32(buf, o + 24);
    const nameLen = readU16(buf, o + 28);
    const extraLen = readU16(buf, o + 30);
    const commentLen = readU16(buf, o + 32);
    const localOffset = readU32(buf, o + 42);
    const name = buf.slice(o + 46, o + 46 + nameLen).toString('utf8');
    entries.push({ name, method, compSize, uncompSize, localOffset, nameLen, extraLen, commentLen });
    o += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

export function readZipEntry(buf: Buffer, entry: Omit<ZipEntry, 'name'>): Buffer {
  const o = entry.localOffset;
  if (buf.readUInt32LE(o) !== 0x04034b50) return Buffer.alloc(0);
  const nameLen = readU16(buf, o + 26);
  const extraLen = readU16(buf, o + 28);
  const dataStart = o + 30 + nameLen + extraLen;
  const data = buf.slice(dataStart, dataStart + entry.compSize);
  if (entry.method === 0) return data;
  if (entry.method === 8) return zlib.inflateRawSync(data);
  return Buffer.alloc(0);
}

export function zipEntryText(buf: Buffer, entry: Omit<ZipEntry, 'name'>): string {
  return readZipEntry(buf, entry).toString('utf8');
}