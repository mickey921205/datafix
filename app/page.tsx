"use client";

import { ChangeEvent, DragEvent, useMemo, useRef, useState } from "react";
import { readXlsx, writeXlsx } from "../lib/xlsx.js";
import { analyzeDuplicates, removeExactDuplicates } from "../lib/duplicates.js";

type Row = string[];
type Locale = "en" | "zhHant" | "zhHans";
type DateOrder = "auto" | "dmy" | "mdy";
type Settings = { trim: boolean; width: boolean; dates: boolean; numbers: boolean; missing: boolean; dateOrder: DateOrder };
type ChangeKey = "width" | "spaces" | "missing" | "dates" | "numbers" | "headers";
type Dataset = {
  fileName: string; encoding: string; delimiter: string;
  originalHeaders: string[]; headers: string[]; originalRows: Row[]; rows: Row[];
  changes: Partial<Record<ChangeKey, number>>;
};

type XlsxSheet = { name: string; rows: Row[] };

const messages = {
  en: {
    privacy: "Your data never leaves this browser", github: "Creator on GitHub ↗",
    eyebrow: "LOCAL-FIRST · CROSS-FORMAT DATA CLEANER",
    title1: "Messy data", title2: "cleaned in one click.",
    intro: "Clean XLSX, CSV, TSV and JSON files from different regions without uploading sensitive data. Handle multiple encodings, date formats, number formats, whitespace and missing values in one pass.",
    rules: "Cleaning rules", on: "rules on",
    trim: "Trim whitespace", trimHint: "Remove spaces around cell values",
    width: "Normalize character width", widthHint: "Full-width Ａ１２３ → A123",
    dates: "Standardize dates", datesHint: "Regional dates → ISO 2024-08-05",
    numbers: "Normalize numbers", numbersHint: "1.234,50 or 1,234.50 → 1234.50",
    missing: "Unify missing values", missingHint: "N/A, NULL, none and dashes → empty",
    dateOrder: "Ambiguous date order", auto: "Auto — keep ambiguous", dmy: "Day / month / year", mdy: "Month / day / year",
    privateTitle: "Private by design", privateText: "Files are processed locally on your device. Nothing is uploaded or stored.",
    drop: "Drop a data file here", dropHint: "XLSX, CSV, TSV, JSON or TXT · up to 10 MB / 50,000 rows",
    choose: "Choose a file", demo: "Try global demo data →", replace: "Replace file",
    rows: "rows", columns: "columns", encoding: "Encoding", format: "Format", changes: "Cells fixed", status: "Status",
    ready: "Ready", detected: "Detected", local: "Local only", noChanges: "No changes were needed.",
    cleaned: "Cleaned", original: "Original", showing: "Showing first", empty: "empty",
    downloadTitle: "Ready to use", downloadHint: "Export clean UTF-8 files or a clean XLSX workbook.",
    json: "Download JSON", csv: "Download UTF-8 CSV ↓", xlsx: "Download XLSX", sheet: "Worksheet",
    duplicates: "Exact duplicates", duplicatesFound: "duplicate rows found", duplicateMode: "Duplicate handling", keepAll: "Keep all rows", keepFirst: "Keep first only", duplicateBadge: "duplicate",
    lowerEyebrow: "ONE TOOL · MANY REGIONS", lowerTitle: "Built for the files people actually exchange.",
    f1: "Regional formats, one clean output", p1: "Convert European and US number styles, international dates, full-width characters and legacy encodings into portable data.",
    f2: "Review every transformation", p2: "Compare original and cleaned values, see exactly what changed, and choose only the rules you trust.",
    f3: "Private, fast and open-source ready", p3: "Everything runs in your browser. No account, no upload queue, and no sensitive spreadsheet sent to a server.",
    footer: "Clean data without giving it away.",
    errors: { rows: "The file needs a header row and at least one data row.", limit: "This version supports up to 50,000 data rows.", size: "Please choose a file smaller than 10 MB.", json: "JSON must contain an object or an array of objects.", generic: "This file could not be read." },
    change: { width: "character width", spaces: "whitespace", missing: "missing values", dates: "dates", numbers: "numbers", headers: "headers" },
  },
  zhHant: {
    privacy: "資料不會離開你的瀏覽器", github: "作者 GitHub ↗",
    eyebrow: "本機處理 · 跨格式資料清理工具",
    title1: "雜亂資料", title2: "一鍵整理好。",
    intro: "不用上傳敏感資料，也能清理各地的 XLSX、CSV、TSV 與 JSON。一次處理多種編碼、日期、數字格式、空白與缺失值。",
    rules: "清理規則", on: "項已開啟",
    trim: "移除多餘空白", trimHint: "清除儲存格前後空白",
    width: "統一字元寬度", widthHint: "全形 Ａ１２３ → A123",
    dates: "標準化日期", datesHint: "各地日期 → ISO 2024-08-05",
    numbers: "標準化數字", numbersHint: "1.234,50 或 1,234.50 → 1234.50",
    missing: "統一缺失值", missingHint: "N/A、NULL、none、破折號 → 空值",
    dateOrder: "模糊日期順序", auto: "自動—保留無法判斷者", dmy: "日／月／年", mdy: "月／日／年",
    privateTitle: "隱私優先", privateText: "檔案只在你的裝置本機處理，不會上傳或儲存。",
    drop: "把資料檔拖到這裡", dropHint: "XLSX、CSV、TSV、JSON、TXT · 最大 10 MB／50,000 列",
    choose: "選擇檔案", demo: "試用全球範例資料 →", replace: "更換檔案",
    rows: "列", columns: "欄", encoding: "文字編碼", format: "資料格式", changes: "已修正", status: "資料狀態",
    ready: "可以使用", detected: "自動偵測", local: "僅本機處理", noChanges: "資料不需要修改。",
    cleaned: "清理後", original: "原始資料", showing: "顯示前", empty: "空值",
    downloadTitle: "清理完成", downloadHint: "可匯出 UTF-8 格式或乾淨的 XLSX 活頁簿。",
    json: "下載 JSON", csv: "下載 UTF-8 CSV ↓", xlsx: "下載 XLSX", sheet: "工作表",
    duplicates: "完全重複資料", duplicatesFound: "列重複資料", duplicateMode: "重複資料處理", keepAll: "保留全部", keepFirst: "只保留第一筆", duplicateBadge: "重複",
    lowerEyebrow: "一個工具 · 處理各地資料", lowerTitle: "專為日常真正會遇到的資料檔打造。",
    f1: "各地格式，統一輸出", p1: "處理歐美數字格式、國際日期、全形字元與傳統編碼，輸出可攜的標準資料。",
    f2: "每次修改都看得見", p2: "比較原始與清理後內容、確認修改數量，並自行選擇可信任的規則。",
    f3: "隱私、快速、開源", p3: "所有工作都在瀏覽器完成，不必註冊、不必排隊，也不用把敏感試算表交給伺服器。",
    footer: "整理資料，不必交出資料。",
    errors: { rows: "檔案至少需要一列標題與一列資料。", limit: "目前版本最多支援 50,000 列資料。", size: "請選擇小於 10 MB 的檔案。", json: "JSON 必須是物件或物件陣列。", generic: "無法讀取這個檔案。" },
    change: { width: "字元寬度", spaces: "多餘空白", missing: "缺失值", dates: "日期", numbers: "數字", headers: "欄位名稱" },
  },
  zhHans: {
    privacy: "数据不会离开你的浏览器", github: "作者 GitHub ↗",
    eyebrow: "本地处理 · 跨格式数据清理工具",
    title1: "杂乱数据", title2: "一键整理好。",
    intro: "无需上传敏感数据，也能清理各地的 XLSX、CSV、TSV 与 JSON。一次处理多种编码、日期、数字格式、空白与缺失值。",
    rules: "清理规则", on: "项已开启",
    trim: "移除多余空白", trimHint: "清除单元格前后空白",
    width: "统一字符宽度", widthHint: "全角 Ａ１２３ → A123",
    dates: "标准化日期", datesHint: "各地日期 → ISO 2024-08-05",
    numbers: "标准化数字", numbersHint: "1.234,50 或 1,234.50 → 1234.50",
    missing: "统一缺失值", missingHint: "N/A、NULL、none、破折号 → 空值",
    dateOrder: "模糊日期顺序", auto: "自动—保留无法判断者", dmy: "日／月／年", mdy: "月／日／年",
    privateTitle: "隐私优先", privateText: "文件只在你的设备本地处理，不会上传或存储。",
    drop: "把数据文件拖到这里", dropHint: "XLSX、CSV、TSV、JSON、TXT · 最大 10 MB／50,000 行",
    choose: "选择文件", demo: "试用全球示例数据 →", replace: "更换文件",
    rows: "行", columns: "列", encoding: "文本编码", format: "数据格式", changes: "已修正", status: "数据状态",
    ready: "可以使用", detected: "自动检测", local: "仅本地处理", noChanges: "数据不需要修改。",
    cleaned: "清理后", original: "原始数据", showing: "显示前", empty: "空值",
    downloadTitle: "清理完成", downloadHint: "可导出 UTF-8 格式或干净的 XLSX 工作簿。",
    json: "下载 JSON", csv: "下载 UTF-8 CSV ↓", xlsx: "下载 XLSX", sheet: "工作表",
    duplicates: "完全重复数据", duplicatesFound: "行重复数据", duplicateMode: "重复数据处理", keepAll: "保留全部", keepFirst: "只保留第一条", duplicateBadge: "重复",
    lowerEyebrow: "一个工具 · 处理各地数据", lowerTitle: "专为日常真正会遇到的数据文件打造。",
    f1: "各地格式，统一输出", p1: "处理欧美数字格式、国际日期、全角字符与传统编码，输出可移植的标准数据。",
    f2: "每次修改都看得见", p2: "比较原始与清理后的内容、确认修改数量，并自行选择可信任的规则。",
    f3: "隐私、快速、开源", p3: "所有工作都在浏览器完成，无需注册、无需排队，也不用把敏感表格交给服务器。",
    footer: "整理数据，不必交出数据。",
    errors: { rows: "文件至少需要一行标题和一行数据。", limit: "当前版本最多支持 50,000 行数据。", size: "请选择小于 10 MB 的文件。", json: "JSON 必须是对象或对象数组。", generic: "无法读取这个文件。" },
    change: { width: "字符宽度", spaces: "多余空白", missing: "缺失值", dates: "日期", numbers: "数字", headers: "字段名称" },
  },
} as const;

const defaults: Settings = { trim: true, width: true, dates: true, numbers: true, missing: true, dateOrder: "auto" };
const delimiterNames: Record<string, string> = { ",": "Comma CSV", "\t": "Tab TSV", ";": "Semicolon", "|": "Pipe", json: "JSON", xlsx: "Excel XLSX" };
const demo = `name,city,date,amount,email,status
 "Alice" ,London,31/12/2024,"1,234.50",alice@example.com, active
Bob,Berlin,31.12.2024,"1.234,50",bob@example.de,N/A
山田,Tokyo,2024/12/31,"１２３４５０",yamada@example.jp,active
小明,Taipei,113/08/05,"1,280,500",ming@example.tw,NULL
Ana,São Paulo,31-12-2024,"1 234,50",ana@example.br,active`;

function uniqueHeaders(values: string[]) {
  const counts = new Map<string, number>();
  return values.map((value, index) => {
    const clean = value.normalize("NFKC").trim() || `column_${index + 1}`;
    const count = (counts.get(clean) ?? 0) + 1;
    counts.set(clean, count);
    return count === 1 ? clean : `${clean}_${count}`;
  });
}

function detectDelimiter(text: string) {
  const sample = text.split(/\r?\n/).slice(0, 8).join("\n");
  return [",", "\t", ";", "|"].map((delimiter) => {
    let score = 0, quoted = false;
    for (const char of sample) { if (char === '"') quoted = !quoted; else if (!quoted && char === delimiter) score++; }
    return { delimiter, score };
  }).sort((a, b) => b.score - a.score)[0].delimiter;
}

function parseDelimited(text: string, delimiter: string): Row[] {
  const rows: Row[] = []; let row: Row = []; let field = ""; let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { field += '"'; i++; } else quoted = !quoted;
    } else if (char === delimiter && !quoted) { row.push(field); field = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field); if (row.some(Boolean)) rows.push(row); row = []; field = "";
    } else field += char;
  }
  row.push(field); if (row.some(Boolean)) rows.push(row);
  return rows;
}

function normalizeDate(value: string, order: DateOrder) {
  const explicitRoc = /^民國/.test(value);
  const normalized = value.replace(/^民國/, "").replace(/[年月.]/g, "/").replace(/日$/, "");
  const match = normalized.match(/^(\d{1,4})[\/-](\d{1,2})[\/-](\d{1,4})$/);
  if (!match) return value;

  const [a, b, c] = match.slice(1).map(Number);
  let year: number, month: number, day: number;

  if (explicitRoc) { year = a + 1911; month = b; day = c; }
  else if (match[1].length === 4 || a >= 300) { year = a; month = b; day = c; }
  else if (match[1].length === 3 && a >= 1 && a <= 299) { year = a + 1911; month = b; day = c; }
  else {
    if (match[3].length === 4) year = c;
    else if (match[3].length === 2) year = c <= 49 ? 2000 + c : 1900 + c;
    else return value;
    if (a > 12) { day = a; month = b; }
    else if (b > 12) { month = a; day = b; }
    else if (order === "dmy") { day = a; month = b; }
    else if (order === "mdy") { month = a; day = b; }
    else return value;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
    ? `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}` : value;
}

function normalizeNumber(value: string) {
  let raw = value.replace(/[\u00A0\u202F ]/g, "").replace(/[’']/g, "");
  const parenthesized = /^\(.+\)$/.test(raw); if (parenthesized) raw = raw.slice(1, -1);
  if (!/^[-+]?\d[\d.,]*$/.test(raw)) return value;
  const comma = raw.lastIndexOf(","), dot = raw.lastIndexOf(".");
  if (comma >= 0 && dot >= 0) raw = comma > dot ? raw.replaceAll(".", "").replace(",", ".") : raw.replaceAll(",", "");
  else {
    const separator = comma >= 0 ? "," : dot >= 0 ? "." : null;
    if (separator) {
      const parts = raw.split(separator);
      if (parts.length > 2) { if (!parts.slice(1).every((part) => part.length === 3)) return value; raw = parts.join(""); }
      else if (parts[1]?.length === 3) return value;
      else if (parts[1]?.length === 1 || parts[1]?.length === 2) raw = `${parts[0]}.${parts[1]}`;
    }
  }
  return /^[-+]?\d+(\.\d+)?$/.test(raw) ? (parenthesized ? `-${raw}` : raw) : value;
}

function cleanCell(input: string, settings: Settings) {
  let value = input; const flags: ChangeKey[] = [];
  const apply = (next: string, flag: ChangeKey) => { if (next !== value) flags.push(flag); value = next; };
  if (settings.width) apply(value.normalize("NFKC"), "width");
  if (settings.trim) apply(value.trim(), "spaces");
  if (settings.missing && /^(n\/?a|null|none|undefined|nil|-|—|–)$/i.test(value)) apply("", "missing");
  if (settings.dates && value) apply(normalizeDate(value, settings.dateOrder), "dates");
  if (settings.numbers && value) apply(normalizeNumber(value), "numbers");
  return { value, flags };
}

function buildDataset(rows: Row[], fileName: string, encoding: string, delimiter: string, settings: Settings): Dataset {
  const width = Math.max(...rows.map((row) => row.length), 1);
  const originalHeaders = Array.from({ length: width }, (_, i) => rows[0]?.[i] ?? "");
  const headers = uniqueHeaders(originalHeaders);
  const originalRows = rows.slice(1).map((row) => Array.from({ length: width }, (_, i) => row[i] ?? ""));
  const changes: Partial<Record<ChangeKey, number>> = {};
  const cleaned = originalRows.map((row) => row.map((cell) => {
    const result = cleanCell(cell, settings);
    result.flags.forEach((flag) => { changes[flag] = (changes[flag] ?? 0) + 1; });
    return result.value;
  }));
  originalHeaders.forEach((header, i) => { if (header !== headers[i]) changes.headers = (changes.headers ?? 0) + 1; });
  return { fileName, encoding, delimiter, originalHeaders, headers, originalRows, rows: cleaned, changes };
}

function decode(buffer: ArrayBuffer) {
  try { return { text: new TextDecoder("utf-8", { fatal: true }).decode(buffer), encoding: "UTF-8" }; }
  catch {
    const candidates = [["Big5", "big5"], ["Shift-JIS", "shift_jis"], ["Windows-1252", "windows-1252"]].map(([label, name]) => {
      let text = new TextDecoder(name).decode(buffer);
      if (name === "windows-1252") {
        text = text.replace(/[\u0080-\u009F]/g, (char) => {
          switch (char.charCodeAt(0)) {
            case 0x80: return "€"; case 0x82: return "‚"; case 0x83: return "ƒ"; case 0x84: return "„";
            case 0x85: return "…"; case 0x86: return "†"; case 0x87: return "‡"; case 0x88: return "ˆ";
            case 0x89: return "‰"; case 0x8a: return "Š"; case 0x8b: return "‹"; case 0x8c: return "Œ";
            case 0x8e: return "Ž"; case 0x91: return "‘"; case 0x92: return "’"; case 0x93: return "“";
            case 0x94: return "”"; case 0x95: return "•"; case 0x96: return "–"; case 0x97: return "—";
            case 0x98: return "˜"; case 0x99: return "™"; case 0x9a: return "š"; case 0x9b: return "›";
            case 0x9c: return "œ"; case 0x9e: return "ž"; case 0x9f: return "Ÿ"; default: return char;
          }
        });
      }
      const replacements = (text.match(/�/g) ?? []).length;
      const controls = (text.match(/[\u0000-\u0008\u000E-\u001F]/g) ?? []).length;
      const kana = (text.match(/[\u3040-\u30ff\uff66-\uff9f]/g) ?? []).length;
      const han = (text.match(/[\u3400-\u9fff]/g) ?? []).length;
      const latin = (text.match(/[A-Za-zÀ-ÿ]/g) ?? []).length;
      let score = replacements * 100 + controls * 30;
      if (name === "shift_jis") score -= kana * 4 + han;
      else if (name === "big5") score -= han * 2; else score -= latin;
      if (name === "windows-1252" && (kana || han)) score += (kana + han) * 8;
      return { text, encoding: label, score };
    }).sort((a, b) => a.score - b.score);
    const best = candidates[0], second = candidates[1];
    const confidenceGap = second.score - best.score;
    return { text: best.text, encoding: confidenceGap >= 8 ? best.encoding : `${best.encoding} (uncertain)` };
  }
}

function infer(values: string[]) {
  const present = values.filter(Boolean);
  if (!present.length) return "empty";
  if (present.every((v) => /^[-+]?\d+(\.\d+)?$/.test(v))) return "number";
  if (present.every((v) => /^\d{4}-\d{2}-\d{2}$/.test(v))) return "date";
  if (present.every((v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))) return "email";
  return "text";
}

function download(content: string, type: string, name: string) {
  const url = URL.createObjectURL(new Blob([content], { type })); const a = document.createElement("a");
  a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
}
function escapeCsv(value: string) { return /[",\n\r]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value; }

function Toggle({ label, hint, checked, action }: { label: string; hint: string; checked: boolean; action: () => void }) {
  return <button className="setting-row" type="button" role="switch" aria-checked={checked} onClick={action}><span><strong>{label}</strong><small>{hint}</small></span><span className={`toggle ${checked ? "on" : ""}`}><i /></span></button>;
}

export default function Home() {
  const [locale, setLocale] = useState<Locale>("en"); const t = messages[locale];
  const [settings, setSettings] = useState(defaults);
  const [dataset, setDataset] = useState<Dataset | null>(null); const [rawRows, setRawRows] = useState<Row[] | null>(null);
  const [source, setSource] = useState({ fileName: "", encoding: "", delimiter: "," });
  const [xlsxSheets, setXlsxSheets] = useState<XlsxSheet[]>([]); const [activeSheet, setActiveSheet] = useState("");
  const [view, setView] = useState<"clean" | "original">("clean"); const [duplicateMode, setDuplicateMode] = useState<"keep" | "first">("keep"); const [dragging, setDragging] = useState(false); const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const types = useMemo(() => dataset ? dataset.headers.map((_, i) => infer(dataset.rows.map((row) => row[i] ?? ""))) : [], [dataset]);
  const total = dataset ? Object.values(dataset.changes).reduce((sum, count) => sum + (count ?? 0), 0) : 0;
  const duplicateInfo = useMemo(() => analyzeDuplicates(dataset?.rows ?? []), [dataset]);
  const exportRows = useMemo(() => dataset ? (duplicateMode === "first" ? removeExactDuplicates(dataset.rows) : dataset.rows) : [], [dataset, duplicateMode]);

  function refresh(next: Settings) { setSettings(next); if (rawRows) setDataset(buildDataset(rawRows, source.fileName, source.encoding, source.delimiter, next)); }
  function loadRows(rows: Row[], fileName: string, encoding: string, delimiter: string) {
    if (rows.length < 2) throw new Error(t.errors.rows); if (rows.length > 50001) throw new Error(t.errors.limit);
    setRawRows(rows); setSource({ fileName, encoding, delimiter }); setDataset(buildDataset(rows, fileName, encoding, delimiter, settings)); setView("clean"); setDuplicateMode("keep"); setError("");
  }
  async function processFile(file: File) {
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error(t.errors.size);
      const lowerName = file.name.toLowerCase();
      if (lowerName.endsWith(".xlsx")) {
        const workbook = await readXlsx(await file.arrayBuffer()) as { sheets: XlsxSheet[] };
        setXlsxSheets(workbook.sheets); setActiveSheet(workbook.sheets[0].name);
        loadRows(workbook.sheets[0].rows, file.name, "XLSX", "xlsx"); return;
      }
      setXlsxSheets([]); setActiveSheet("");
      const decoded = decode(await file.arrayBuffer()); const text = decoded.text.replace(/^\uFEFF/, "");
      if (lowerName.endsWith(".json")) {
        const parsed = JSON.parse(text) as unknown; const records = Array.isArray(parsed) ? parsed : [parsed];
        if (!records.every((r) => r && typeof r === "object" && !Array.isArray(r))) throw new Error(t.errors.json);
        const headers = Array.from(new Set(records.flatMap((r) => Object.keys(r as Record<string, unknown>))));
        loadRows([headers, ...records.map((r) => headers.map((h) => { const v = (r as Record<string, unknown>)[h]; return v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v); }))], file.name, decoded.encoding, "json");
      } else { const delimiter = detectDelimiter(text); loadRows(parseDelimited(text, delimiter), file.name, decoded.encoding, delimiter); }
    } catch (e) { setError(e instanceof Error ? e.message : t.errors.generic); }
  }
  function switchSheet(name: string) {
    const sheet = xlsxSheets.find((item) => item.name === name); if (!sheet) return;
    setActiveSheet(name); loadRows(sheet.rows, source.fileName || dataset?.fileName || "workbook.xlsx", "XLSX", "xlsx");
  }
  function fileChanged(event: ChangeEvent<HTMLInputElement>) { const file = event.target.files?.[0]; if (file) void processFile(file); event.target.value = ""; }
  function dropped(event: DragEvent<HTMLDivElement>) { event.preventDefault(); setDragging(false); const file = event.dataTransfer.files?.[0]; if (file) void processFile(file); }
  function csv() {
    if (!dataset) return; const body = [dataset.headers, ...exportRows].map((row) => row.map(escapeCsv).join(",")).join("\r\n");
    download(`\uFEFF${body}`, "text/csv;charset=utf-8", `${dataset.fileName.replace(/\.[^.]+$/, "")}_clean.csv`);
  }
  function json() {
    if (!dataset) return; const rows = exportRows.map((row) => Object.fromEntries(dataset.headers.map((h, i) => [h, row[i] ?? ""])));
    download(JSON.stringify(rows, null, 2), "application/json", `${dataset.fileName.replace(/\.[^.]+$/, "")}_clean.json`);
  }
  function xlsx() {
    if (!dataset) return; const blob = writeXlsx([dataset.headers, ...exportRows], activeSheet || "Cleaned");
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${dataset.fileName.replace(/\.[^.]+$/, "")}_clean.xlsx`; a.click(); URL.revokeObjectURL(url);
  }
  const headers = dataset ? (view === "clean" ? dataset.headers : dataset.originalHeaders) : [];
  const rows = dataset ? (view === "clean" ? dataset.rows : dataset.originalRows) : [];

  return <main>
    <header className="site-header">
      <a className="brand" href="#top"><span className="brand-mark">DF</span><span>Data<b>Fix</b></span></a>
      <div className="privacy-pill"><span>●</span>{t.privacy}</div>
      <nav className="header-actions">
        <div className="language-switch" aria-label="Language">
          <button className={locale === "en" ? "active" : ""} onClick={() => setLocale("en")}>EN</button>
          <button className={locale === "zhHant" ? "active" : ""} onClick={() => setLocale("zhHant")}>繁中</button>
          <button className={locale === "zhHans" ? "active" : ""} onClick={() => setLocale("zhHans")}>简中</button>
        </div>
        <a className="github-link" href="https://github.com/mickey921205/datafix" target="_blank" rel="noreferrer">{t.github}</a>
      </nav>
    </header>
    <section className="hero" id="top">
      <div><p className="eyebrow">{t.eyebrow}</p><h1><span>{t.title1}</span><em>{t.title2}</em></h1><p className="hero-copy">{t.intro}</p><div className="format-list"><span>XLSX</span><span>CSV</span><span>TSV</span><span>JSON</span><span>UTF-8</span><span>BIG5</span><span>SHIFT-JIS</span><span>WIN-1252</span></div></div>
      <div className="hero-aside" aria-hidden="true"><span>1.234,50</span><strong>→</strong><span>1234.50</span><span>31/12/24</span><strong>→</strong><span>2024-12-31</span><div className="mini-grid"><i /><i /><i /><i /><i /><i /></div></div>
    </section>
    <section className="workspace">
      <aside className="settings-panel"><div className="panel-heading"><p>{t.rules}</p><span>{Object.values(settings).filter((v) => v === true).length} {t.on}</span></div>
        <Toggle label={t.trim} hint={t.trimHint} checked={settings.trim} action={() => refresh({ ...settings, trim: !settings.trim })} />
        <Toggle label={t.width} hint={t.widthHint} checked={settings.width} action={() => refresh({ ...settings, width: !settings.width })} />
        <Toggle label={t.dates} hint={t.datesHint} checked={settings.dates} action={() => refresh({ ...settings, dates: !settings.dates })} />
        {settings.dates && <label className="select-row"><span>{t.dateOrder}</span><select value={settings.dateOrder} onChange={(e) => refresh({ ...settings, dateOrder: e.target.value as DateOrder })}><option value="auto">{t.auto}</option><option value="dmy">{t.dmy}</option><option value="mdy">{t.mdy}</option></select></label>}
        <Toggle label={t.numbers} hint={t.numbersHint} checked={settings.numbers} action={() => refresh({ ...settings, numbers: !settings.numbers })} />
        <Toggle label={t.missing} hint={t.missingHint} checked={settings.missing} action={() => refresh({ ...settings, missing: !settings.missing })} />
        <div className="safe-note"><b>◉ {t.privateTitle}</b><p>{t.privateText}</p></div>
      </aside>
      <div className="main-panel">{!dataset ?
        <div className={`dropzone ${dragging ? "dragging" : ""}`} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={dropped}>
          <input ref={fileInput} type="file" accept=".xlsx,.csv,.tsv,.json,.txt" onChange={fileChanged} /><div className="drop-icon">+</div><h2>{t.drop}</h2><p>{t.dropHint}</p><div className="drop-actions"><button className="primary-button" onClick={() => fileInput.current?.click()}>{t.choose}</button><button className="text-button" onClick={() => loadRows(parseDelimited(demo, ","), "global_messy_data.csv", "UTF-8", ",")}>{t.demo}</button></div>{error && <p className="error-message" role="alert">{error}</p>}
        </div> :
        <div className="results">
          <div className="results-topbar"><div className="file-title"><span className="file-icon">▦</span><div><strong>{dataset.fileName}</strong><small>{dataset.rows.length.toLocaleString()} {t.rows} · {dataset.headers.length} {t.columns}</small></div></div><button className="replace-button" onClick={() => fileInput.current?.click()}>{t.replace}</button><input ref={fileInput} className="hidden-input" type="file" accept=".xlsx,.csv,.tsv,.json,.txt" onChange={fileChanged} /></div>
          {xlsxSheets.length > 1 && <label className="sheet-picker"><span>{t.sheet}</span><select value={activeSheet} onChange={(e) => switchSheet(e.target.value)}>{xlsxSheets.map((sheet) => <option key={sheet.name} value={sheet.name}>{sheet.name}</option>)}</select></label>}
          <div className="summary-grid"><article><small>{t.encoding}</small><strong>{dataset.encoding}</strong><span className="status-dot">{t.detected}</span></article><article><small>{t.format}</small><strong>{delimiterNames[dataset.delimiter] ?? "Delimited"}</strong><span>{t.detected}</span></article><article><small>{t.changes}</small><strong>{total.toLocaleString()} <i>cells</i></strong><span>{t.local}</span></article><article><small>{t.status}</small><strong className="ready">{t.ready}</strong><span>✓</span></article></div>
          <div className="change-strip">{Object.entries(dataset.changes).length ? Object.entries(dataset.changes).map(([name, count]) => <span key={name}><b>{count}</b> {t.change[name as ChangeKey]}</span>) : <span>{t.noChanges}</span>}</div>
          <div className={`duplicate-panel ${duplicateInfo.duplicateCount ? "has-duplicates" : ""}`}><div><strong>{t.duplicates}</strong><span><b>{duplicateInfo.duplicateCount.toLocaleString()}</b> {t.duplicatesFound}</span></div><label><span>{t.duplicateMode}</span><select value={duplicateMode} onChange={(e) => setDuplicateMode(e.target.value as "keep" | "first")}><option value="keep">{t.keepAll}</option><option value="first">{t.keepFirst}</option></select></label></div>
          <div className="table-toolbar"><div><button className={view === "clean" ? "active" : ""} onClick={() => setView("clean")}>{t.cleaned}</button><button className={view === "original" ? "active" : ""} onClick={() => setView("original")}>{t.original}</button></div><small>{t.showing} {Math.min(rows.length, 20)}</small></div>
          <div className="table-wrap"><table><thead><tr><th>#</th>{headers.map((h, i) => <th key={`${h}-${i}`}><span>{h || "(unnamed)"}</span><small>{types[i]}</small></th>)}</tr></thead><tbody>{rows.slice(0, 20).map((row, ri) => <tr key={ri} className={view === "clean" && duplicateInfo.duplicateIndexes.has(ri) ? "duplicate-row" : ""}><td>{ri + 1}{view === "clean" && duplicateInfo.duplicateIndexes.has(ri) && <small className="duplicate-badge">{t.duplicateBadge}</small>}</td>{headers.map((_, ci) => { const value = row[ci] ?? ""; const changed = dataset.originalRows[ri]?.[ci] !== dataset.rows[ri]?.[ci]; return <td key={ci} className={view === "clean" && changed ? "changed" : ""}>{value || <span className="empty">{t.empty}</span>}</td>; })}</tr>)}</tbody></table></div>
          <div className="download-bar"><div><strong>{t.downloadTitle}</strong><p>{t.downloadHint}</p></div><button className="secondary-button" onClick={json}>{t.json}</button>{source.delimiter === "xlsx" && <button className="secondary-button" onClick={xlsx}>{t.xlsx}</button>}<button className="primary-button" onClick={csv}>{t.csv}</button></div>
        </div>}
      </div>
    </section>
    <section className="explain-section"><p className="eyebrow">{t.lowerEyebrow}</p><h2>{t.lowerTitle}</h2><div className="feature-grid"><article><span>01</span><h3>{t.f1}</h3><p>{t.p1}</p></article><article><span>02</span><h3>{t.f2}</h3><p>{t.p2}</p></article><article><span>03</span><h3>{t.f3}</h3><p>{t.p3}</p></article></div></section>
    <footer><span>DataFix</span><p>{t.footer}</p><a href="https://github.com/mickey921205/datafix" target="_blank" rel="noreferrer">{t.github}</a></footer>
  </main>;
}
