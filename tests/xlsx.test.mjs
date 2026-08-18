import assert from "node:assert/strict";
import test from "node:test";
import { readXlsx, unzipEntries, writeXlsx } from "../lib/xlsx.js";

test("XLSX export can be read back locally without data loss", async () => {
  const rows = [
    ["name", "date", "amount", "note"],
    ["小明", "2026-08-18", "1234.50", "A & B <test>"],
    ["山田", "31/12/24", "1.234,50", " leading and trailing "],
    ["Ana", "", "", "café €"],
  ];

  const blob = writeXlsx(rows, "資料 & Data");
  assert.equal(blob.type, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

  const workbook = await readXlsx(await blob.arrayBuffer());
  assert.equal(workbook.sheets.length, 1);
  assert.equal(workbook.sheets[0].name, "資料 & Data");
  const denseRows = workbook.sheets[0].rows.map((row) => Array.from({ length: rows[0].length }, (_, index) => row[index] ?? ""));
  assert.deepEqual(denseRows, rows);
});

test("XLSX export contains the minimal workbook parts Excel expects", async () => {
  const blob = writeXlsx([["id", "value"], ["1", "hello"]], "Cleaned");
  const entries = await unzipEntries(await blob.arrayBuffer());
  for (const path of [
    "[Content_Types].xml",
    "_rels/.rels",
    "xl/workbook.xml",
    "xl/_rels/workbook.xml.rels",
    "xl/styles.xml",
    "xl/worksheets/sheet1.xml",
  ]) assert.equal(entries.has(path), true, `missing ${path}`);
});

test("XLSX export sanitizes invalid worksheet-name characters", async () => {
  const blob = writeXlsx([["a"], ["b"]], "bad/name:*?[]");
  const workbook = await readXlsx(await blob.arrayBuffer());
  assert.equal(workbook.sheets[0].name.includes("/"), false);
  assert.equal(workbook.sheets[0].name.length <= 31, true);
});
