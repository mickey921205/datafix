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
    .replaceAll(": string", "")
    .replaceAll(": number", "")
    .replaceAll(": DateOrder", "")
    .replaceAll(": ArrayBuffer", "");
  return new Function(`${source}; return ${name};`)();
}

const normalizeDate = executableFunction("function normalizeDate", "function normalizeNumber", "normalizeDate");
const normalizeNumber = executableFunction("function normalizeNumber", "function cleanCell", "normalizeNumber");
const decode = executableFunction("function decode", "function infer", "decode");

function bytes(values) {
  return Uint8Array.from(values).buffer;
}

test("normalizes two-digit Gregorian years without confusing them with ROC years", () => {
  assert.equal(normalizeDate("31/12/24", "auto"), "2024-12-31");
  assert.equal(normalizeDate("12/31/24", "auto"), "2024-12-31");
  assert.equal(normalizeDate("01/02/24", "auto"), "01/02/24");
  assert.equal(normalizeDate("01/02/24", "dmy"), "2024-02-01");
  assert.equal(normalizeDate("01/02/24", "mdy"), "2024-01-02");
});

test("keeps explicit and year-first ROC date support", () => {
  assert.equal(normalizeDate("113/08/05", "auto"), "2024-08-05");
  assert.equal(normalizeDate("民國113/08/05", "auto"), "2024-08-05");
  assert.equal(normalizeDate("2024/12/31", "auto"), "2024-12-31");
  assert.equal(normalizeDate("2024/02/30", "auto"), "2024/02/30");
});

test("preserves ambiguous single-separator three-digit numbers", () => {
  assert.equal(normalizeNumber("1,234"), "1,234");
  assert.equal(normalizeNumber("1.234"), "1.234");
  assert.equal(normalizeNumber("(1,234)"), "(1,234)");
});

test("normalizes unambiguous US, European and grouped numeric formats", () => {
  assert.equal(normalizeNumber("1,234.56"), "1234.56");
  assert.equal(normalizeNumber("1.234,56"), "1234.56");
  assert.equal(normalizeNumber("1,234,567"), "1234567");
  assert.equal(normalizeNumber("1.234.567"), "1234567");
  assert.equal(normalizeNumber("1,23"), "1.23");
  assert.equal(normalizeNumber("(1,234.56)"), "-1234.56");
});

test("detects representative Big5 bytes as Traditional Chinese", () => {
  const result = decode(bytes([193,99,197,233,164,164,164,229,161,65,184,234,174,198,178,77,178,122]));
  assert.equal(result.text, "繁體中文，資料清理");
  assert.match(result.encoding, /^Big5(?: \(uncertain\))?$/);
});

test("detects representative Shift-JIS bytes as Japanese", () => {
  const result = decode(bytes([147,250,150,123,140,234,131,102,129,91,131,94]));
  assert.equal(result.text, "日本語データ");
  assert.match(result.encoding, /^Shift-JIS(?: \(uncertain\))?$/);
});

test("detects representative Windows-1252 bytes as Western European text", () => {
  const result = decode(bytes([99,97,102,233,32,114,233,115,117,109,233,32,150,32,128]));
  assert.equal(result.text, "café résumé – €");
  assert.match(result.encoding, /^Windows-1252(?: \(uncertain\))?$/);
});

test("project links point directly to the DataFix repository", () => {
  assert.match(page, /https:\/\/github\.com\/mickey921205\/datafix/);
});
