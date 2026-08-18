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
    .replaceAll(": DateOrder", "");
  return new Function(`${source}; return ${name};`)();
}

const normalizeDate = executableFunction("function normalizeDate", "function normalizeNumber", "normalizeDate");
const normalizeNumber = executableFunction("function normalizeNumber", "function cleanCell", "normalizeNumber");

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

test("legacy encoding detection exposes low confidence instead of claiming certainty", () => {
  const source = sourceBetween("function decode", "function infer");
  assert.match(source, /confidenceGap/);
  assert.match(source, /\(uncertain\)/);
  assert.match(source, /shift_jis/);
  assert.match(source, /big5/);
  assert.match(source, /windows-1252/);
});

test("project links point directly to the DataFix repository", () => {
  assert.match(page, /https:\/\/github\.com\/mickey921205\/datafix/);
});
