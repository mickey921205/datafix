import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

function sourceBetween(start, end) {
  const from = page.indexOf(start);
  const to = page.indexOf(end, from);
  assert.notEqual(from, -1, `missing source marker: ${start}`);
  assert.notEqual(to, -1, `missing source marker: ${end}`);
  return page.slice(from, to);
}

function executableFunction(start, end, name) {
  const source = sourceBetween(start, end)
    .replaceAll(": string[]", "")
    .replaceAll(": Row[]", "")
    .replaceAll(": Row", "")
    .replaceAll(": string", "")
    .replaceAll(": number", "")
    .replaceAll(": DateOrder", "")
    .replaceAll(": ArrayBuffer", "");
  return new Function(`${source}; return ${name};`)();
}

const detectDelimiter = executableFunction("function detectDelimiter", "function parseDelimited", "detectDelimiter");
const parseDelimited = executableFunction("function parseDelimited", "function normalizeDate", "parseDelimited");
const normalizeDate = executableFunction("function normalizeDate", "function normalizeNumber", "normalizeDate");
const normalizeNumber = executableFunction("function normalizeNumber", "function cleanCell", "normalizeNumber");
const decode = executableFunction("function decode", "function infer", "decode");

function buffer(...parts) {
  const values = parts.flatMap((part) => typeof part === "string" ? [...Buffer.from(part, "ascii")] : part);
  return Uint8Array.from(values).buffer;
}

test("Taiwan Big5 fixture survives decode, CSV parsing and ROC/date-number cleanup", () => {
  // Big5 bytes for 繁體中文，資料清理 embedded in an otherwise ASCII CSV row.
  const text = decode(buffer(
    "name,amount,date,note\r\nAlice,1.234,56,113/08/05,",
    [193, 99, 197, 233, 164, 164, 164, 229, 161, 65, 184, 234, 174, 198, 178, 77, 178, 122],
  ));
  assert.match(text.encoding, /^Big5(?: \(uncertain\))?$/);

  // Use a quoted European number because the comma is the CSV delimiter.
  const csv = text.text.replace("Alice,1.234,56", 'Alice,"1.234,56"');
  assert.equal(detectDelimiter(csv), ",");
  const rows = parseDelimited(csv, ",");
  assert.equal(rows[1][3], "繁體中文，資料清理");
  assert.equal(normalizeNumber(rows[1][1]), "1234.56");
  assert.equal(normalizeDate(rows[1][2], "auto"), "2024-08-05");
});

test("Japan Shift-JIS fixture survives decode and preserves quoted delimiters", () => {
  const text = decode(buffer(
    "name,note,amount\nTaro,\"",
    [147, 250, 150, 123, 140, 234, 131, 102, 129, 91, 131, 94],
    ", Tokyo\",1,23",
  ));
  assert.match(text.encoding, /^Shift-JIS(?: \(uncertain\))?$/);

  const csv = text.text.replace(",1,23", ',"1,23"');
  const rows = parseDelimited(csv, detectDelimiter(csv));
  assert.equal(rows[1][1], "日本語データ, Tokyo");
  assert.equal(normalizeNumber(rows[1][2]), "1.23");
});

test("Western European Windows-1252 fixture decodes punctuation and accounting values", () => {
  const text = decode(buffer(
    "name,note,amount\nAna,",
    [99, 97, 102, 233, 32, 114, 233, 115, 117, 109, 233, 32, 150, 32, 128],
    ',"(1,234.56)"',
  ));
  assert.match(text.encoding, /^Windows-1252(?: \(uncertain\))?$/);

  const rows = parseDelimited(text.text, detectDelimiter(text.text));
  assert.equal(rows[1][1], "café résumé – €");
  assert.equal(normalizeNumber(rows[1][2]), "-1234.56");
});

test("full-width and mixed missing-value examples remain deterministic", () => {
  assert.equal(" ＡＢＣ１２３ ".normalize("NFKC").trim(), "ABC123");
  for (const value of ["N/A", "NULL", "none", "undefined", "nil", "—"]) {
    assert.match(value, /^(n\/?a|null|none|undefined|nil|-|—|–)$/i);
  }
});
