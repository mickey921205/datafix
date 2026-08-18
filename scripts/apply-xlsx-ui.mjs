import fs from "node:fs";

const path = "app/page.tsx";
let s = fs.readFileSync(path, "utf8");
const replace = (from, to) => {
  if (!s.includes(from)) throw new Error(`Patch target not found: ${from.slice(0, 100)}`);
  s = s.replace(from, to);
};

replace('import { ChangeEvent, DragEvent, useMemo, useRef, useState } from "react";\n', 'import { ChangeEvent, DragEvent, useMemo, useRef, useState } from "react";\nimport { readXlsx, writeXlsx } from "../lib/xlsx.js";\n');

replace('intro: "Clean CSV, TSV and JSON files from different regions without uploading sensitive data. Handle multiple encodings, date formats, number formats, whitespace and missing values in one pass.",', 'intro: "Clean XLSX, CSV, TSV and JSON files from different regions without uploading sensitive data. Handle multiple encodings, date formats, number formats, whitespace and missing values in one pass.",');
replace('drop: "Drop a data file here", dropHint: "CSV, TSV, JSON or TXT · up to 10 MB / 50,000 rows",', 'drop: "Drop a data file here", dropHint: "XLSX, CSV, TSV, JSON or TXT · up to 10 MB / 50,000 rows",');
replace('json: "Download JSON", csv: "Download UTF-8 CSV ↓",', 'json: "Download JSON", csv: "Download UTF-8 CSV ↓", xlsx: "Download XLSX", sheet: "Worksheet",');

replace('intro: "不用上傳敏感資料，也能清理各地的 CSV、TSV 與 JSON。一次處理多種編碼、日期、數字格式、空白與缺失值。",', 'intro: "不用上傳敏感資料，也能清理各地的 XLSX、CSV、TSV 與 JSON。一次處理多種編碼、日期、數字格式、空白與缺失值。",');
replace('drop: "把資料檔拖到這裡", dropHint: "CSV、TSV、JSON、TXT · 最大 10 MB／50,000 列",', 'drop: "把資料檔拖到這裡", dropHint: "XLSX、CSV、TSV、JSON、TXT · 最大 10 MB／50,000 列",');
replace('json: "下載 JSON", csv: "下載 UTF-8 CSV ↓",', 'json: "下載 JSON", csv: "下載 UTF-8 CSV ↓", xlsx: "下載 XLSX", sheet: "工作表",');

replace('intro: "无需上传敏感数据，也能清理各地的 CSV、TSV 与 JSON。一次处理多种编码、日期、数字格式、空白与缺失值。",', 'intro: "无需上传敏感数据，也能清理各地的 XLSX、CSV、TSV 与 JSON。一次处理多种编码、日期、数字格式、空白与缺失值。",');
replace('drop: "把数据文件拖到这里", dropHint: "CSV、TSV、JSON、TXT · 最大 10 MB／50,000 行",', 'drop: "把数据文件拖到这里", dropHint: "XLSX、CSV、TSV、JSON、TXT · 最大 10 MB／50,000 行",');
replace('json: "下载 JSON", csv: "下载 UTF-8 CSV ↓",', 'json: "下载 JSON", csv: "下载 UTF-8 CSV ↓", xlsx: "下载 XLSX", sheet: "工作表",');

replace('const delimiterNames: Record<string, string> = { ",": "Comma CSV", "\\t": "Tab TSV", ";": "Semicolon", "|": "Pipe", json: "JSON" };', 'const delimiterNames: Record<string, string> = { ",": "Comma CSV", "\\t": "Tab TSV", ";": "Semicolon", "|": "Pipe", json: "JSON", xlsx: "Excel XLSX" };');

replace('  const [dataset, setDataset] = useState<Dataset | null>(null); const [rawRows, setRawRows] = useState<Row[] | null>(null);\n  const [source, setSource] = useState({ fileName: "", encoding: "", delimiter: "," });', '  const [dataset, setDataset] = useState<Dataset | null>(null); const [rawRows, setRawRows] = useState<Row[] | null>(null);\n  const [source, setSource] = useState({ fileName: "", encoding: "", delimiter: "," });\n  const [xlsxSheets, setXlsxSheets] = useState<{ name: string; rows: Row[] }[]>([]); const [activeSheet, setActiveSheet] = useState("");');

replace('      const decoded = decode(await file.arrayBuffer()); const text = decoded.text.replace(/^\\uFEFF/, "");\n      if (file.name.toLowerCase().endsWith(".json")) {', '      const lowerName = file.name.toLowerCase();\n      if (lowerName.endsWith(".xlsx")) {\n        const workbook = await readXlsx(await file.arrayBuffer()) as { sheets: { name: string; rows: Row[] }[] };\n        setXlsxSheets(workbook.sheets); setActiveSheet(workbook.sheets[0].name);\n        loadRows(workbook.sheets[0].rows, file.name, "XLSX", "xlsx"); return;\n      }\n      setXlsxSheets([]); setActiveSheet("");\n      const decoded = decode(await file.arrayBuffer()); const text = decoded.text.replace(/^\\uFEFF/, "");\n      if (lowerName.endsWith(".json")) {');

replace('  function fileChanged(event: ChangeEvent<HTMLInputElement>) { const file = event.target.files?.[0]; if (file) void processFile(file); event.target.value = ""; }', '  function switchSheet(name: string) {\n    const sheet = xlsxSheets.find((item) => item.name === name); if (!sheet) return;\n    setActiveSheet(name); loadRows(sheet.rows, source.fileName || dataset?.fileName || "workbook.xlsx", "XLSX", "xlsx");\n  }\n  function fileChanged(event: ChangeEvent<HTMLInputElement>) { const file = event.target.files?.[0]; if (file) void processFile(file); event.target.value = ""; }');

replace('  function json() {\n    if (!dataset) return; const rows = dataset.rows.map((row) => Object.fromEntries(dataset.headers.map((h, i) => [h, row[i] ?? ""])));\n    download(JSON.stringify(rows, null, 2), "application/json", `${dataset.fileName.replace(/\\.[^.]+$/, "")}_clean.json`);\n  }', '  function json() {\n    if (!dataset) return; const rows = dataset.rows.map((row) => Object.fromEntries(dataset.headers.map((h, i) => [h, row[i] ?? ""])));\n    download(JSON.stringify(rows, null, 2), "application/json", `${dataset.fileName.replace(/\\.[^.]+$/, "")}_clean.json`);\n  }\n  function xlsx() {\n    if (!dataset) return; const blob = writeXlsx([dataset.headers, ...dataset.rows], activeSheet || "Cleaned");\n    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${dataset.fileName.replace(/\\.[^.]+$/, "")}_clean.xlsx`; a.click(); URL.revokeObjectURL(url);\n  }');

replace('<div className="hero-copy">', '<div className="hero-copy">');
replace('<div className="format-list"><span>CSV</span>', '<div className="format-list"><span>XLSX</span><span>CSV</span>');

s = s.replaceAll('accept=".csv,.tsv,.json,.txt"', 'accept=".xlsx,.csv,.tsv,.json,.txt"');

replace('<div className="results-topbar"><div className="file-title">', '<div className="results-topbar"><div className="file-title">');
replace('</div>\n          <div className="summary-grid"><article><small>{t.encoding}</small>', '</div>\n          {xlsxSheets.length > 1 && <label className="sheet-picker"><span>{t.sheet}</span><select value={activeSheet} onChange={(e) => switchSheet(e.target.value)}>{xlsxSheets.map((sheet) => <option key={sheet.name} value={sheet.name}>{sheet.name}</option>)}</select></label>}\n          <div className="summary-grid"><article><small>{t.encoding}</small>');

replace('<button className="secondary-button" onClick={json}>{t.json}</button><button className="primary-button" onClick={csv}>{t.csv}</button>', '<button className="secondary-button" onClick={json}>{t.json}</button>{source.delimiter === "xlsx" && <button className="secondary-button" onClick={xlsx}>{t.xlsx}</button>}<button className="primary-button" onClick={csv}>{t.csv}</button>');

fs.writeFileSync(path, s);
console.log("XLSX UI integration applied");
