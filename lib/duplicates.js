export function rowKey(row) {
  return JSON.stringify(row.map((value) => value ?? ""));
}

export function analyzeDuplicates(rows) {
  const firstIndexByKey = new Map();
  const duplicateIndexes = new Set();
  const groupByIndex = new Map();
  let nextGroup = 1;

  rows.forEach((row, index) => {
    const key = rowKey(row);
    const first = firstIndexByKey.get(key);
    if (first === undefined) {
      firstIndexByKey.set(key, index);
      return;
    }

    duplicateIndexes.add(index);
    let group = groupByIndex.get(first);
    if (group === undefined) {
      group = nextGroup++;
      groupByIndex.set(first, group);
    }
    groupByIndex.set(index, group);
  });

  return {
    duplicateIndexes,
    groupByIndex,
    duplicateCount: duplicateIndexes.size,
    uniqueCount: rows.length - duplicateIndexes.size,
  };
}

export function removeExactDuplicates(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    const key = rowKey(row);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
