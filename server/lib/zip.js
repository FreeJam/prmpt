/**
 * ZIP-архиватор без внешних зависимостей (deflate через node:zlib).
 * Поддерживает UTF-8 имена и вложенные папки — достаточно для экспорта проекта.
 */
import { deflateRawSync } from 'node:zlib';
import { Buffer } from 'node:buffer';

/* CRC-32 (IEEE 802.3) — считается вручную: zlib.crc32 есть только с Node 20.15+ */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function dosDateTime(d = new Date()) {
  const time = ((d.getHours() & 0x1f) << 11) | ((d.getMinutes() & 0x3f) << 5) | ((d.getSeconds() / 2) & 0x1f);
  const date = (((d.getFullYear() - 1980) & 0x7f) << 9) | (((d.getMonth() + 1) & 0x0f) << 5) | (d.getDate() & 0x1f);
  return { time, date };
}

/**
 * @param {Record<string,string|Buffer>} files  путь внутри архива → содержимое
 * @param {object} [opts]
 * @param {string} [opts.comment]  комментарий архива
 * @param {boolean} [opts.store]   true — без сжатия (быстрее для мелких текстов)
 * @returns {Buffer}
 */
export function createZip(files, opts = {}) {
  const { time, date } = dosDateTime();
  const entries = [];
  const localParts = [];
  let offset = 0;

  for (const [rawPath, rawContent] of Object.entries(files)) {
    const name = String(rawPath).replace(/\\/g, '/').replace(/^\/+/, '');
    if (!name || name.includes('..')) continue; // защита от выхода из архива
    const content = Buffer.isBuffer(rawContent) ? rawContent : Buffer.from(String(rawContent ?? ''), 'utf8');
    const crc = crc32(content);
    const deflated = opts.store ? content : deflateRawSync(content, { level: 9 });
    const useDeflate = !opts.store && deflated.length < content.length;
    const body = useDeflate ? deflated : content;
    const method = useDeflate ? 8 : 0;
    const nameBuf = Buffer.from(name, 'utf8');

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);           // version needed
    local.writeUInt16LE(0x0800, 6);       // flags: UTF-8
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(content.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);           // extra length

    localParts.push(local, nameBuf, body);
    entries.push({ nameBuf, crc, method, csize: body.length, usize: content.length, offset, time, date });
    offset += local.length + nameBuf.length + body.length;
  }

  const centralParts = [];
  let centralSize = 0;
  for (const e of entries) {
    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(0x031e, 4);          // version made by: UNIX, 3.0
    cd.writeUInt16LE(20, 6);              // version needed
    cd.writeUInt16LE(0x0800, 8);          // flags: UTF-8
    cd.writeUInt16LE(e.method, 10);
    cd.writeUInt16LE(e.time, 12);
    cd.writeUInt16LE(e.date, 14);
    cd.writeUInt32LE(e.crc, 16);
    cd.writeUInt32LE(e.csize, 20);
    cd.writeUInt32LE(e.usize, 24);
    cd.writeUInt16LE(e.nameBuf.length, 28);
    cd.writeUInt16LE(0, 30);              // extra
    cd.writeUInt16LE(0, 32);              // comment
    cd.writeUInt16LE(0, 34);              // disk start
    cd.writeUInt16LE(0, 36);              // internal attrs
    cd.writeUInt32LE((0o100644 << 16) >>> 0, 38); // external attrs: -rw-r--r--
    cd.writeUInt32LE(e.offset, 42);
    centralParts.push(cd, e.nameBuf);
    centralSize += cd.length + e.nameBuf.length;
  }

  const commentBuf = Buffer.from(opts.comment ?? '', 'utf8');
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralSize, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(commentBuf.length, 20);

  return Buffer.concat([...localParts, ...centralParts, eocd, commentBuf]);
}

export const __crc32 = crc32;
