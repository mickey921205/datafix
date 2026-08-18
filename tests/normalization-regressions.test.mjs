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

test("date normalization uses Gregorian pivot for two-digit trailing years", () => {
  const source = sourceBetween("function normalizeDate", "function normalizeNumber");
  assert.match(source, /c <= 49 \? 2000 \+ c : 1900 \+ c/);
  assert.match(source, /explicitRoc/);
  assert.match(source, /match\[1\]\.length === 3/);
  assert.doesNotMatch(source, /year = c < 300 \? c \+ 1911 : c/);
});

test("ambiguous single-separator three-digit numbers are preserved", () => {
  const source = sourceBetween("function normalizeNumber", "function cleanCell");
  assert.match(source, /parts\[1\]\?\.length === 3/);
  assert.match(source, /return value/);
  assert.match(source, /parts\.slice\(1\)\.every\(\(part\) => part\.length === 3\)/);
});

test("legacy encoding detection exposes low confidence", () => {
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
