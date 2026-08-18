const textDecoder = new TextDecoder("utf-8");
const textEncoder = new TextEncoder();

function u16(view, offset) { return view.getUint16(offset, true); }
function u32(view, offset) { return view.getUint32(offset, true); }

function decodeXml(value) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number.parseInt(dec, 10)))
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&amp;/g, "&");
}

function escapeXml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function normalizeZipPath(base, target) {
  if (target.startsWith("/")) return target.slice(1);
  const parts = base.split("/"); parts.pop();
  for (const part of target.split("/")) {
    if (part === "..") parts.pop(); else if (part !== ".") parts.push(part);
  }
  return parts.join("/");
}

async function inflateRaw(bytes) {
  if (typeof DecompressionStream === "undefined") throw new Error("This browser does not support local XLSX decompression.");
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function unzipEntries(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (u32(view, i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("Invalid XLSX archive.");
  const count = u16(view, eocd + 10); const centralOffset = u32(view, eocd + 16);
  const entries = new Map(); let cursor = centralOffset;
  for (let i = 0; i < count; i++) {
    if (u32(view, cursor) !== 0x02014b50) throw new Error("Invalid XLSX central directory.");
    const method = u16(view, cursor + 10); const compressedSize = u32(view, cursor + 20);
    const nameLength = u16(view, cursor + 28); const extraLength = u16(view, cursor + 30); const commentLength = u16(view, cursor + 32);
    const localOffset = u32(view, cursor + 42); const name = textDecoder.decode(bytes.subarray(cursor + 46, cursor + 46 + nameLength));
    if (u32(view, localOffset) !== 0x04034b50) throw new Error("Invalid XLSX local entry.");
    const localNameLength = u16(view, localOffset + 26); const localExtraLength = u16(view, localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = bytes.subarray(dataStart, dataStart + compressedSize);
    let data;
    if (method === 0) data = compressed;
    else if (method === 8) data = await inflateRaw(compressed);
    else throw new Error(`Unsupported XLSX compression method: ${method}`);
    entries.set(name, data);
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

function columnIndex(ref) {
  const letters = (ref.match(/[A-Z]+/i)?.[0] ?? "A").toUpperCase();
  let n = 0; for (const char of letters) n = n * 26 + char.charCodeAt(0) - 64;
  return n - 1;
}

function parseSharedStrings(xml) {
  const values = [];
  for (const match of xml.matchAll(/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g)) {
    const text = Array.from(match[1].matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g), (m) => decodeXml(m[1])).join("");
    values.push(text);
  }
  return values;
}

function cellValue(xml, type, sharedStrings) {
  if (type === "inlineStr") {
    return Array.from(xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g), (m) => decodeXml(m[1])).join("");
  }
  const value = xml.match(/<v(?:\s[^>]*)?>([\s\S]*?)<\/v>/)?.[1] ?? "";
  if (type === "s") return sharedStrings[Number(value)] ?? "";
  if (type === "b") return value === "1" ? "TRUE" : "FALSE";
  return decodeXml(value);
}

function parseSheet(xml, sharedStrings) {
  const rows = [];
  for (const rowMatch of xml.matchAll(/<row(?:\s[^>]*)?>([\s\S]*?)<\/row>/g)) {
    const row = [];
    for (const cellMatch of rowMatch[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>|<c\b([^>]*)\/>/g)) {
      const attrs = cellMatch[1] ?? cellMatch[3] ?? ""; const inner = cellMatch[2] ?? "";
      const ref = attrs.match(/\br="([^"]+)"/)?.[1] ?? `A${rows.length + 1}`;
      const type = attrs.match(/\bt="([^"]+)"/)?.[1] ?? "n";
      row[columnIndex(ref)] = cellValue(inner, type, sharedStrings);
    }
    while (row.length && row[row.length - 1] === undefined) row.pop();
    rows.push(row.map((value) => value ?? ""));
  }
  return rows;
}

export async function readXlsx(buffer) {
  const entries = await unzipEntries(buffer);
  const read = (path) => { const bytes = entries.get(path); return bytes ? textDecoder.decode(bytes) : ""; };
  const workbookPath = "xl/workbook.xml"; const workbookXml = read(workbookPath);
  if (!workbookXml) throw new Error("XLSX workbook metadata is missing.");
  const relsXml = read("xl/_rels/workbook.xml.rels");
  const relations = new Map(Array.from(relsXml.matchAll(/<Relationship\b([^>]*)\/?\s*>/g), (match) => {
    const attrs = match[1]; return [attrs.match(/\bId="([^"]+)"/)?.[1], attrs.match(/\bTarget="([^"]+)"/)?.[1]];
  }).filter(([id, target]) => id && target));
  const sharedStrings = parseSharedStrings(read("xl/sharedStrings.xml"));
  const sheets = [];
  for (const match of workbookXml.matchAll(/<sheet\b([^>]*)\/?\s*>/g)) {
    const attrs = match[1]; const name = decodeXml(attrs.match(/\bname="([^"]+)"/)?.[1] ?? "Sheet");
    const relId = attrs.match(/(?:r:)?id="([^"]+)"/)?.[1]; const target = relId ? relations.get(relId) : null;
    if (!target) continue;
    const path = normalizeZipPath(workbookPath, target); const xml = read(path);
    if (xml) sheets.push({ name, rows: parseSheet(xml, sharedStrings) });
  }
  if (!sheets.length) throw new Error("No readable worksheets were found in this XLSX file.");
  return { sheets };
}

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1; table[n] = c >>> 0; }
  return table;
})();

function crc32(bytes) {
  let crc = 0xffffffff; for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8); return (crc ^ 0xffffffff) >>> 0;
}

function concat(chunks) {
  const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0); const out = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) { out.set(chunk, offset); offset += chunk.length; } return out;
}

function makeZip(files) {
  const localChunks = []; const centralChunks = []; let offset = 0;
  for (const [name, content] of files) {
    const nameBytes = textEncoder.encode(name); const data = typeof content === "string" ? textEncoder.encode(content) : content; const crc = crc32(data);
    const local = new Uint8Array(30 + nameBytes.length); const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true); lv.setUint16(4, 20, true); lv.setUint16(6, 0x0800, true); lv.setUint16(8, 0, true);
    lv.setUint32(14, crc, true); lv.setUint32(18, data.length, true); lv.setUint32(22, data.length, true); lv.setUint16(26, nameBytes.length, true); local.set(nameBytes, 30);
    const central = new Uint8Array(46 + nameBytes.length); const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true); cv.setUint16(8, 0x0800, true); cv.setUint16(10, 0, true);
    cv.setUint32(16, crc, true); cv.setUint32(20, data.length, true); cv.setUint32(24, data.length, true); cv.setUint16(28, nameBytes.length, true); cv.setUint32(42, offset, true); central.set(nameBytes, 46);
    localChunks.push(local, data); centralChunks.push(central); offset += local.length + data.length;
  }
  const central = concat(centralChunks); const end = new Uint8Array(22); const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true); ev.setUint16(8, files.length, true); ev.setUint16(10, files.length, true); ev.setUint32(12, central.length, true); ev.setUint32(16, offset, true);
  return concat([...localChunks, central, end]);
}

function cellRef(column, row) {
  let n = column + 1, letters = ""; while (n) { n--; letters = String.fromCharCode(65 + (n % 26)) + letters; n = Math.floor(n / 26); } return `${letters}${row}`;
}

function sheetXml(rows) {
  const body = rows.map((row, ri) => `<row r="${ri + 1}">${row.map((value, ci) => {
    if (value === "" || value == null) return "";
    return `<c r="${cellRef(ci, ri + 1)}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
  }).join("")}</row>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${body}</sheetData></worksheet>`;
}

export function writeXlsx(rows, sheetName = "Cleaned") {
  const safeName = String(sheetName || "Cleaned").replace(/[\\/*?:[\]]/g, " ").slice(0, 31) || "Cleaned";
  const files = [
    ["[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`],
    ["_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
    ["xl/workbook.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${escapeXml(safeName)}" sheetId="1" r:id="rId1"/></sheets></workbook>`],
    ["xl/_rels/workbook.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`],
    ["xl/styles.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="1"><fill><patternFill patternType="none"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs></styleSheet>`],
    ["xl/worksheets/sheet1.xml", sheetXml(rows)],
  ];
  return new Blob([makeZip(files)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}
