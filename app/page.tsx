"use client";

import { ChangeEvent, DragEvent, useMemo, useRef, useState } from "react";

type Row = string[];
type Locale = "en" | "zh";
type DateOrder = "auto" | "dmy" | "mdy";
type Settings = { trim: boolean; width: boolean; dates: boolean; numbers: boolean; missing: boolean; dateOrder: DateOrder };
type ChangeKey = "width" | "spaces" | "missing" | "dates" | "numbers" | "headers";
type Dataset = {
  fileName: string; encoding: string; delimiter: string;
  originalHeaders: string[]; headers: string[]; originalRows: Row[]; rows: Row[];
  changes: Partial<Record<ChangeKey, number>>;
};

const messages = {
  en: {
    privacy: "Your data never leaves this browser", github: "Creator on GitHub ↗",
    eyebrow: "LOCAL-FIRST · WORLD-READY DATA CLEANER",
    title1: "Clean messy data.", title2: "Right in your browser.",
    intro: "Fix CSV, TSV and JSON files from any region—without uploading sensitive data. Handle mixed encodings, dates, decimal styles, whitespace and missing values in seconds.",
    rules: "Cleaning rules", on: "rules on",
    trim: "Trim whitespace", trimHint: "Remove spaces around cell values",
    width: "Normalize character width", widthHint: "Full-width Ａ１２３ → A123",
    dates: "Standardize dates", datesHint: "Regional dates → ISO 2024-08-05",
    numbers: "Normalize numbers", numbersHint: "1.234,50 or 1,234.50 → 1234.50",
    missing: "Unify missing values", missingHint: "N/A, NULL, none and dashes → empty",
    dateOrder: "Ambiguous date order", auto: "Auto — keep ambiguous", dmy: "Day / month / year", mdy: "Month / day / year",
    privateTitle: "Private by design", privateText: "Files are processed locally on your device. Nothing is uploaded or stored.",
    drop: "Drop a data file here", dropHint: "CSV, TSV, JSON or TXT · up to 10 MB / 50,000 rows",
    choose: "Choose a file", demo: "Try global demo data →", replace: "Replace file",
    rows: "rows", columns: "columns", encoding: "Encoding", format: "Format", changes: "Cells fixed", status: "Status",
    ready: "Ready", detected: "Detected", local: "Local only", noChanges: "No changes were needed.",
    cleaned: "Cleaned", original: "Original", showing: "Showing first", empty: "empty",
    downloadTitle: "Ready to use", downloadHint: "Export clean UTF-8 files that open correctly across modern tools.",
    json: "Download JSON", csv: "Download UTF-8 CSV ↓",
    lowerEyebrow: "ONE TOOL · MANY REGIONS", lowerTitle: "Built for the files people actually exchange.",
    f1: "Regional formats, one clean output", p1: "Convert European and US number styles, international dates, full-width characters and legacy encodings into portable data.",
    f2: "Review every transformation", p2: "Compare original and cleaned values, see exactly what changed, and choose only the rules you trust.",
    f3: "Private, fast and open-source ready", p3: "Everything runs in your browser. No account, no upload queue, and no sensitive spreadsheet sent to a server.",
    footer: "Clean data without giving it away.",
    errors: { rows: "The file needs a header row and at least one data row.", limit: "This version supports up to 50,000 data rows.", size: "Please choose a file smaller than 10 MB.", json: "JSON must contain an object or an array of objects.", generic: "This file could not be read." },
    change: { width: "character width", spaces: "whitespace", missing: "missing values", dates: "dates", numbers: "numbers", headers: "headers" },
  },
  zh: {
    privacy: "資料不會離開你的瀏覽器", github: "作者 GitHub ↗",
    eyebrow: "本機處理 · 全球格式資料清理工具",
    title1: "混亂資料，", title2: "在瀏覽器整理好。",
    intro: "不用上傳敏感資料，就能清理各地的 CSV、TSV 與 JSON。一次處理多種編碼、日期、數字格式、空白與缺失值。",
    rules: "清理規則", on: "項已開啟",
    trim: "移除多餘空白", trimHint: "清除儲存格前後空白",
    width: "統一字元寬度", widthHint: "全形 Ａ１２３ → A123",
    dates: "標準化日期", datesHint: "各地日期 → ISO 2024-08-05",
    numbers: "標準化數字", numbersHint: "1.234,50 或 1,234.50 → 1234.50",
    missing: "統一缺失值", missingHint: "N/A、NULL、none、破折號 → 空值",
    dateOrder: "模糊日期順序", auto: "自動—保留無法判斷者", dmy: "日／月／年", mdy: "月／日／年",
    privateTitle: "隱私優先", privateText: "檔案只在你的裝置本機處理，不會上傳或儲存。",
    drop: "把資料檔拖到這裡", dropHint: "CSV、TSV、JSON、TXT · 最大 10 MB／50,000 列",
    choose: "選擇檔案", demo: "試用全球範例資料 →", replace: "更換檔案",
    rows: "列", columns: "欄", encoding: "文字編碼", format: "資料格式", changes: "已修正", status: "資料狀態",
    ready: "可以使用", detected: "自動偵測", local: "僅本機處理", noChanges: "資料不需要修改。",
    cleaned: "清理後", original: "原始資料", showing: "顯示前", empty: "空值",
    downloadTitle: "清理完成", downloadHint: "匯出 UTF-8 格式，可在現代試算表與資料工具正確開啟。",
    json: "下載 JSON", csv: "下載 UTF-8 CSV ↓",
    lowerEyebrow: "一個工具 · 處理全球資料", lowerTitle: "專為人們真正交換的資料檔打造。",
    f1: "各地格式，統一輸出", p1: "處理歐美數字格式、國際日期、全形字元與傳統編碼，輸出可攜的標準資料。",
    f2: "每次修改都看得見", p2: "比較原始與清理後內容、確認修改數量，並自行選擇可信任的規則。",
    f3: "隱私、快速、適合開源", p3: "所有工作都在瀏覽器完成，不必註冊、不必排隊，也不用把敏感試算表交給伺服器。",
    footer: "整理資料，不必交出資料。",
    errors: { rows: "檔案至少需要一列標題與一列資料。", limit: "目前版本最多支援 50,000 列資料。", size: "請選擇小於 10 MB 的檔案。", json: "JSON 必須是物件或物件陣列。", generic: "無法讀取這個檔案。" },
    change: { width: "字元寬度", spaces: "多餘空白", missing: "缺失值", dates: "日期", numbers: "數字", headers: "欄位名稱" },
  },
} as const;

const defaults: Settings = { trim: true, width: true, dates: true, numbers: true, missing: true, dateOrder: "auto" };
const delimiterNames: Record<string, string> = { ",": "Comma CSV", "\t": "Tab TSV", ";": "Semicolon", "|": "Pipe", json: "JSON" };
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
  const match = value.replace(/^民國/, "").replace(/[年月.]/g, "/").replace(/日$/, "").match(/^(\d{1,4})[\/-](\d{1,2})[\/-](\d{1,4})$/);
  if (!match) return value;
  const [a, b, c] = match.slice(1).map(Number); let year: number, month: number, day: number;
  if (match[1].length >= 3 || a > 31) { year = a < 300 ? a + 1911 : a; month = b; day = c; }
  else {
    year = c < 300 ? c + 1911 : c;
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
  else if (comma >= 0) { const parts = raw.split(","); raw = parts.length > 2 || parts.at(-1)?.length === 3 ? parts.join("") : `${parts[0]}.${parts[1]}`; }
  else if (dot >= 0) { const parts = raw.split("."); if (parts.length > 2 || parts[1]?.length === 3) raw = parts.join(""); }
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
      const text = new TextDecoder(name).decode(buffer);
      const score = (text.match(/�/g) ?? []).length * 30 + (text.match(/[\u0000-\u0008\u000E-\u001F]/g) ?? []).length * 20 + (name === "windows-1252" ? (text.match(/[À-ÿ]/g) ?? []).length * 4 : 0);
      return { text, encoding: label, score };
    }).sort((a, b) => a.score - b.score);
    return candidates[0];
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
  const [view, setView] = useState<"clean" | "original">("clean"); const [dragging, setDragging] = useState(false); const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const types = useMemo(() => dataset ? dataset.headers.map((_, i) => infer(dataset.rows.map((row) => row[i] ?? ""))) : [], [dataset]);
  const total = dataset ? Object.values(dataset.changes).reduce((sum, count) => sum + (count ?? 0), 0) : 0;

  function refresh(next: Settings) { setSettings(next); if (rawRows) setDataset(buildDataset(rawRows, source.fileName, source.encoding, source.delimiter, next)); }
  function loadRows(rows: Row[], fileName: string, encoding: string, delimiter: string) {
    if (rows.length < 2) throw new Error(t.errors.rows); if (rows.length > 50001) throw new Error(t.errors.limit);
    setRawRows(rows); setSource({ fileName, encoding, delimiter }); setDataset(buildDataset(rows, fileName, encoding, delimiter, settings)); setView("clean"); setError("");
  }
  async function processFile(file: File) {
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error(t.errors.size);
      const decoded = decode(await file.arrayBuffer()); const text = decoded.text.replace(/^\uFEFF/, "");
      if (file.name.toLowerCase().endsWith(".json")) {
        const parsed = JSON.parse(text) as unknown; const records = Array.isArray(parsed) ? parsed : [parsed];
        if (!records.every((r) => r && typeof r === "object" && !Array.isArray(r))) throw new Error(t.errors.json);
        const headers = Array.from(new Set(records.flatMap((r) => Object.keys(r as Record<string, unknown>))));
        loadRows([headers, ...records.map((r) => headers.map((h) => { const v = (r as Record<string, unknown>)[h]; return v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v); }))], file.name, decoded.encoding, "json");
      } else { const delimiter = detectDelimiter(text); loadRows(parseDelimited(text, delimiter), file.name, decoded.encoding, delimiter); }
    } catch (e) { setError(e instanceof Error ? e.message : t.errors.generic); }
  }
  function fileChanged(event: ChangeEvent<HTMLInputElement>) { const file = event.target.files?.[0]; if (file) void processFile(file); event.target.value = ""; }
  function dropped(event: DragEvent<HTMLDivElement>) { event.preventDefault(); setDragging(false); const file = event.dataTransfer.files?.[0]; if (file) void processFile(file); }
  function csv() {
    if (!dataset) return; const body = [dataset.headers, ...dataset.rows].map((row) => row.map(escapeCsv).join(",")).join("\r\n");
    download(`\uFEFF${body}`, "text/csv;charset=utf-8", `${dataset.fileName.replace(/\.[^.]+$/, "")}_clean.csv`);
  }
  function json() {
    if (!dataset) return; const rows = dataset.rows.map((row) => Object.fromEntries(dataset.headers.map((h, i) => [h, row[i] ?? ""])));
    download(JSON.stringify(rows, null, 2), "application/json", `${dataset.fileName.replace(/\.[^.]+$/, "")}_clean.json`);
  }
  const headers = dataset ? (view === "clean" ? dataset.headers : dataset.originalHeaders) : [];
  const rows = dataset ? (view === "clean" ? dataset.rows : dataset.originalRows) : [];

  return <main>
    <header className="site-header">
      <a className="brand" href="#top"><span className="brand-mark">DF</span><span>Data<b>Fix</b></span></a>
      <div className="privacy-pill"><span>●</span>{t.privacy}</div>
      <nav className="header-actions"><div className="language-switch"><button className={locale === "en" ? "active" : ""} onClick={() => setLocale("en")}>EN</button><button className={locale === "zh" ? "active" : ""} onClick={() => setLocale("zh")}>繁中</button></div><a className="github-link" href="https://github.com/mickey921205" target="_blank" rel="noreferrer">{t.github}</a></nav>
    </header>
    <section className="hero" id="top"><div><p className="eyebrow">{t.eyebrow}</p><h1>{t.title1}<br /><em>{t.title2}</em></h1><p className="hero-copy">{t.intro}</p><div className="format-list"><span>CSV</span><span>TSV</span><span>JSON</span><span>UTF-8</span><span>BIG5</span><span>SHIFT-JIS</span><span>WIN-1252</span></div></div><div className="hero-aside" aria-hidden="true"><span>1.234,50</span><strong>→</strong><span>1234.50</span><span>31/12/24</span><strong>→</strong><span>2024-12-31</span><div className="mini-grid"><i /><i /><i /><i /><i /><i /></div></div></section>
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
          <input ref={fileInput} type="file" accept=".csv,.tsv,.json,.txt" onChange={fileChanged} /><div className="drop-icon">+</div><h2>{t.drop}</h2><p>{t.dropHint}</p><div className="drop-actions"><button className="primary-button" onClick={() => fileInput.current?.click()}>{t.choose}</button><button className="text-button" onClick={() => loadRows(parseDelimited(demo, ","), "global_messy_data.csv", "UTF-8", ",")}>{t.demo}</button></div>{error && <p className="error-message" role="alert">{error}</p>}
        </div> :
        <div className="results">
          <div className="results-topbar"><div className="file-title"><span className="file-icon">▦</span><div><strong>{dataset.fileName}</strong><small>{dataset.rows.length.toLocaleString()} {t.rows} · {dataset.headers.length} {t.columns}</small></div></div><button className="replace-button" onClick={() => fileInput.current?.click()}>{t.replace}</button><input ref={fileInput} className="hidden-input" type="file" accept=".csv,.tsv,.json,.txt" onChange={fileChanged} /></div>
          <div className="summary-grid"><article><small>{t.encoding}</small><strong>{dataset.encoding}</strong><span className="status-dot">{t.detected}</span></article><article><small>{t.format}</small><strong>{delimiterNames[dataset.delimiter] ?? "Delimited"}</strong><span>{t.detected}</span></article><article><small>{t.changes}</small><strong>{total.toLocaleString()} <i>cells</i></strong><span>{t.local}</span></article><article><small>{t.status}</small><strong className="ready">{t.ready}</strong><span>✓</span></article></div>
          <div className="change-strip">{Object.entries(dataset.changes).length ? Object.entries(dataset.changes).map(([name, count]) => <span key={name}><b>{count}</b> {t.change[name as ChangeKey]}</span>) : <span>{t.noChanges}</span>}</div>
          <div className="table-toolbar"><div><button className={view === "clean" ? "active" : ""} onClick={() => setView("clean")}>{t.cleaned}</button><button className={view === "original" ? "active" : ""} onClick={() => setView("original")}>{t.original}</button></div><small>{t.showing} {Math.min(rows.length, 20)}</small></div>
          <div className="table-wrap"><table><thead><tr><th>#</th>{headers.map((h, i) => <th key={`${h}-${i}`}><span>{h || "(unnamed)"}</span><small>{types[i]}</small></th>)}</tr></thead><tbody>{rows.slice(0, 20).map((row, ri) => <tr key={ri}><td>{ri + 1}</td>{headers.map((_, ci) => { const value = row[ci] ?? ""; const changed = dataset.originalRows[ri]?.[ci] !== dataset.rows[ri]?.[ci]; return <td key={ci} className={view === "clean" && changed ? "changed" : ""}>{value || <span className="empty">{t.empty}</span>}</td>; })}</tr>)}</tbody></table></div>
          <div className="download-bar"><div><strong>{t.downloadTitle}</strong><p>{t.downloadHint}</p></div><button className="secondary-button" onClick={json}>{t.json}</button><button className="primary-button" onClick={csv}>{t.csv}</button></div>
        </div>}
      </div>
    </section>
    <section className="explain-section"><p className="eyebrow">{t.lowerEyebrow}</p><h2>{t.lowerTitle}</h2><div className="feature-grid"><article><span>01</span><h3>{t.f1}</h3><p>{t.p1}</p></article><article><span>02</span><h3>{t.f2}</h3><p>{t.p2}</p></article><article><span>03</span><h3>{t.f3}</h3><p>{t.p3}</p></article></div></section>
    <footer><span>DataFix</span><p>{t.footer}</p><a href="https://github.com/mickey921205" target="_blank" rel="noreferrer">{t.github}</a></footer>
  </main>;
}
