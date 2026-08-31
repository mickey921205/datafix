import fs from "node:fs";

const path = "app/page.tsx";
let s = fs.readFileSync(path, "utf8");
const replace = (from, to) => {
  if (!s.includes(from)) throw new Error(`Patch target not found: ${from.slice(0, 120)}`);
  s = s.replace(from, to);
};

replace('import { readXlsx, writeXlsx } from "../lib/xlsx.js";\n', 'import { readXlsx, writeXlsx } from "../lib/xlsx.js";\nimport { analyzeDuplicates, removeExactDuplicates } from "../lib/duplicates.js";\n');

replace('    json: "Download JSON", csv: "Download UTF-8 CSV ↓", xlsx: "Download XLSX", sheet: "Worksheet",', '    json: "Download JSON", csv: "Download UTF-8 CSV ↓", xlsx: "Download XLSX", sheet: "Worksheet",\n    duplicates: "Exact duplicates", duplicatesFound: "duplicate rows found", duplicateMode: "Duplicate handling", keepAll: "Keep all rows", keepFirst: "Keep first only", duplicateBadge: "duplicate",');
replace('    json: "下載 JSON", csv: "下載 UTF-8 CSV ↓", xlsx: "下載 XLSX", sheet: "工作表",', '    json: "下載 JSON", csv: "下載 UTF-8 CSV ↓", xlsx: "下載 XLSX", sheet: "工作表",\n    duplicates: "完全重複資料", duplicatesFound: "列重複資料", duplicateMode: "重複資料處理", keepAll: "保留全部", keepFirst: "只保留第一筆", duplicateBadge: "重複",');
replace('    json: "下载 JSON", csv: "下载 UTF-8 CSV ↓", xlsx: "下载 XLSX", sheet: "工作表",', '    json: "下载 JSON", csv: "下载 UTF-8 CSV ↓", xlsx: "下载 XLSX", sheet: "工作表",\n    duplicates: "完全重复数据", duplicatesFound: "行重复数据", duplicateMode: "重复数据处理", keepAll: "保留全部", keepFirst: "只保留第一条", duplicateBadge: "重复",');

replace('  const [view, setView] = useState<"clean" | "original">("clean"); const [dragging, setDragging] = useState(false); const [error, setError] = useState("");', '  const [view, setView] = useState<"clean" | "original">("clean"); const [duplicateMode, setDuplicateMode] = useState<"keep" | "first">("keep"); const [dragging, setDragging] = useState(false); const [error, setError] = useState("");');

replace('  const total = dataset ? Object.values(dataset.changes).reduce((sum, count) => sum + (count ?? 0), 0) : 0;\n', '  const total = dataset ? Object.values(dataset.changes).reduce((sum, count) => sum + (count ?? 0), 0) : 0;\n  const duplicateInfo = useMemo(() => analyzeDuplicates(dataset?.rows ?? []), [dataset]);\n  const exportRows = useMemo(() => dataset ? (duplicateMode === "first" ? removeExactDuplicates(dataset.rows) : dataset.rows) : [], [dataset, duplicateMode]);\n');

replace('    setRawRows(rows); setSource({ fileName, encoding, delimiter }); setDataset(buildDataset(rows, fileName, encoding, delimiter, settings)); setView("clean"); setError("");', '    setRawRows(rows); setSource({ fileName, encoding, delimiter }); setDataset(buildDataset(rows, fileName, encoding, delimiter, settings)); setView("clean"); setDuplicateMode("keep"); setError("");');

replace('    if (!dataset) return; const body = [dataset.headers, ...dataset.rows].map((row) => row.map(escapeCsv).join(",")).join("\\r\\n");', '    if (!dataset) return; const body = [dataset.headers, ...exportRows].map((row) => row.map(escapeCsv).join(",")).join("\\r\\n");');
replace('    if (!dataset) return; const rows = dataset.rows.map((row) => Object.fromEntries(dataset.headers.map((h, i) => [h, row[i] ?? ""])));', '    if (!dataset) return; const rows = exportRows.map((row) => Object.fromEntries(dataset.headers.map((h, i) => [h, row[i] ?? ""])));');
replace('    if (!dataset) return; const blob = writeXlsx([dataset.headers, ...dataset.rows], activeSheet || "Cleaned");', '    if (!dataset) return; const blob = writeXlsx([dataset.headers, ...exportRows], activeSheet || "Cleaned");');

replace('          <div className="change-strip">{Object.entries(dataset.changes).length ? Object.entries(dataset.changes).map(([name, count]) => <span key={name}><b>{count}</b> {t.change[name as ChangeKey]}</span>) : <span>{t.noChanges}</span>}</div>\n', '          <div className="change-strip">{Object.entries(dataset.changes).length ? Object.entries(dataset.changes).map(([name, count]) => <span key={name}><b>{count}</b> {t.change[name as ChangeKey]}</span>) : <span>{t.noChanges}</span>}</div>\n          <div className={`duplicate-panel ${duplicateInfo.duplicateCount ? "has-duplicates" : ""}`}><div><strong>{t.duplicates}</strong><span><b>{duplicateInfo.duplicateCount.toLocaleString()}</b> {t.duplicatesFound}</span></div><label><span>{t.duplicateMode}</span><select value={duplicateMode} onChange={(e) => setDuplicateMode(e.target.value as "keep" | "first")}><option value="keep">{t.keepAll}</option><option value="first">{t.keepFirst}</option></select></label></div>\n');

replace('<div className="table-wrap"><table><thead><tr><th>#</th>{headers.map((h, i) => <th key={`${h}-${i}`}><span>{h || "(unnamed)"}</span><small>{types[i]}</small></th>)}</tr></thead><tbody>{rows.slice(0, 20).map((row, ri) => <tr key={ri}><td>{ri + 1}</td>', '<div className="table-wrap"><table><thead><tr><th>#</th>{headers.map((h, i) => <th key={`${h}-${i}`}><span>{h || "(unnamed)"}</span><small>{types[i]}</small></th>)}</tr></thead><tbody>{rows.slice(0, 20).map((row, ri) => <tr key={ri} className={view === "clean" && duplicateInfo.duplicateIndexes.has(ri) ? "duplicate-row" : ""}><td>{ri + 1}{view === "clean" && duplicateInfo.duplicateIndexes.has(ri) && <small className="duplicate-badge">{t.duplicateBadge}</small>}</td>');

fs.writeFileSync(path, s);
console.log("Duplicate detection UI integration applied");
