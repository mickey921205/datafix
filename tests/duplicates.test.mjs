import assert from "node:assert/strict";
import test from "node:test";
import { analyzeDuplicates, removeExactDuplicates, rowKey } from "../lib/duplicates.js";

test("rowKey preserves exact cell boundaries", () => {
  assert.notEqual(rowKey(["a,b", "c"]), rowKey(["a", "b,c"]));
  assert.equal(rowKey(["", "x"]), rowKey([null, "x"]));
});

test("analyzeDuplicates marks only repeated rows and groups them", () => {
  const rows = [
    ["1", "Alice"],
    ["2", "Bob"],
    ["1", "Alice"],
    ["1", "Alice"],
    ["3", "Ana"],
    ["2", "Bob"],
  ];

  const result = analyzeDuplicates(rows);
  assert.equal(result.duplicateCount, 3);
  assert.equal(result.uniqueCount, 3);
  assert.deepEqual([...result.duplicateIndexes], [2, 3, 5]);
  assert.equal(result.groupByIndex.get(0), result.groupByIndex.get(2));
  assert.equal(result.groupByIndex.get(2), result.groupByIndex.get(3));
  assert.equal(result.groupByIndex.get(1), result.groupByIndex.get(5));
  assert.notEqual(result.groupByIndex.get(0), result.groupByIndex.get(1));
});

test("removeExactDuplicates keeps the first row and preserves order", () => {
  const rows = [["A"], ["B"], ["A"], ["C"], ["B"]];
  assert.deepEqual(removeExactDuplicates(rows), [["A"], ["B"], ["C"]]);
});
