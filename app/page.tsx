"use client";

import { ChangeEvent, DragEvent, useMemo, useRef, useState } from "react";

type Row = string[];
type Settings = {
  trim: boolean;
  normalizeWidth: boolean;
  rocDate: boolean;
  thousands: boolean;
  missing: boolean;
};
type Dataset = {
  fileName: string;
  encoding: string;
  delimiter: string;
  originalHeaders: string[];
  headers: string[];
  originalRows: Row[];
  rows: Row[];
  changes: Record<string, number>;
};

const defaultSettings: Settings = {
  trim: true,
  normalizeWidth: true,
  rocDate: true,
  thousands: true,
  missing: true,
};

const delimiterLabel: Record<string, string> = {
  ",": "逗號 CSV",
  "\t": "Tab TSV",
  ";": "分號",
  "|": "直線",
  json: "JSON",
};

const demoText = `姓名,交易日期,成交金額,電子郵件,備註
  王小明  ,113/08/05,"1,280,500",ming@example.com, Ａ級客戶 
陳美華,民國112年12月31日," 92,400 ",N/A,　待確認
林志強,111-3-9,"3,050",lin@example.com,NULL
王小明,2024-08-08,"1,280,500",ming@example.com, 重複資料 `;

function normalizeHeader(value: string, index: number) {
  const cleaned = value.normalize("NFKC").trim() || `未命名欄位_${index + 1}`;
  return cleaned;
}

function uniqueHeaders(headers: string[]) {
  const counts = new Map<string, number>();
  return headers.map((header) => {
    const count = (counts.get(header) ?? 0) + 1;
    counts.set(header, count);
    return count === 1 ? header : `${header}_${count}`;
  });
}

function detectDelimiter(text: string) {
  const sample = text.split(/\r?\n/).slice(0, 8).join("\n");
  const candidates = [",", "\t", ";", "|"];
  let best = ",";
  let bestScore = -1;
  for (const candidate of candidates) {
    let score = 0;
    let quoted = false;
    for (let i = 0; i < sample.length; i++) {
      if (sample[i] === '"') quoted = !quoted;
      if (!quoted && sample[i] === candidate) score++;
    }
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  return best;
}

function parseDelimited(text: string, delimiter: string): Row[] {
  const rows: Row[] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') {
        field += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (char === delimiter && !quoted) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  row.push(field);
  if (row.some((cell) => cell.length > 0)) rows.push(row);
  return rows;
}

function cleanCell(input: string, settings: Settings) {
  let value = input;
  const flags: string[] = [];

  if (settings.normalizeWidth) {
    const next = value.normalize("NFKC");
    if (next !== value) flags.push("全形字元");
    value = next;
  }
  if (settings.trim) {
    const next = value.trim();
    if (next !== value) flags.push("多餘空白");
    value = next;
  }
  if (settings.missing && /^(n\/?a|null|none|undefined|-|—)$/i.test(value)) {
    value = "";
    flags.push("缺失值");
  }
  if (settings.rocDate && value) {
    const normalizedDate = value.replace(/^民國/, "").replace(/[年月]/g, "/").replace(/日$/, "");
    const match = normalizedDate.match(/^(\d{2,3})[/.\-](\d{1,2})[/.\-](\d{1,2})$/);
    if (match) {
      const year = Number(match[1]);
      if (year > 0 && year < 300) {
        value = `${year + 1911}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
        flags.push("民國日期");
      }
    }
  }
  if (settings.thousands && /^[-+]?\d{1,3}(,\d{3})+(\.\d+)?$/.test(value)) {
    value = value.replaceAll(",", "");
    flags.push("千分位");
  }
  return { value, flags };
}

function inferType(values: string[]) {
  const present = values.filter(Boolean);
  if (!present.length) return "空值";
  if (present.every((value) => /^[-+]?\d+(\.\d+)?$/.test(value))) return "數字";
  if (present.every((value) => /^\d{4}-\d{2}-\d{2}$/.test(value))) return "日期";
  if (present.every((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))) return "Email";
  return "文字";
}

function buildDataset(
  rows: Row[],
  fileName: string,
  encoding: string,
  delimiter: string,
  settings: Settings,
): Dataset {
  const width = Math.max(...rows.map((row) => row.length), 1);
  const originalHeaders = Array.from({ length: width }, (_, index) => rows[0]?.[index] ?? "");
  const headers = uniqueHeaders(originalHeaders.map(normalizeHeader));
  const originalRows = rows.slice(1).map((row) =>
    Array.from({ length: width }, (_, index) => row[index] ?? ""),
  );
  const changes: Record<string, number> = {};
  const cleanedRows = originalRows.map((row) =>
    row.map((cell) => {
      const cleaned = cleanCell(cell, settings);
      cleaned.flags.forEach((flag) => (changes[flag] = (changes[flag] ?? 0) + 1));
      return cleaned.value;
    }),
  );
  originalHeaders.forEach((header, index) => {
    if (header !== headers[index]) changes["欄位名稱"] = (changes["欄位名稱"] ?? 0) + 1;
  });
  return {
    fileName,
    encoding,
    delimiter,
    originalHeaders,
    headers,
    originalRows,
    rows: cleanedRows,
    changes,
  };
}

function escapeCsv(value: string) {
  return /[",\n\r]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

function downloadFile(content: string, type: string, fileName: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button className="setting-row" type="button" role="switch" aria-checked={checked} onClick={onChange}>
      <span>
        <strong>{label}</strong>
        <small>{hint}</small>
      </span>
      <span className={`toggle ${checked ? "on" : ""}`} aria-hidden="true"><i /></span>
    </button>
  );
}

export default function Home() {
  const [settings, setSettings] = useState(defaultSettings);
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [rawRows, setRawRows] = useState<Row[] | null>(null);
  const [source, setSource] = useState({ fileName: "", encoding: "", delimiter: "," });
  const [view, setView] = useState<"clean" | "original">("clean");
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const types = useMemo(() => {
    if (!dataset) return [];
    return dataset.headers.map((_, index) => inferType(dataset.rows.map((row) => row[index] ?? "")));
  }, [dataset]);

  const totalChanges = dataset
    ? Object.values(dataset.changes).reduce((sum, value) => sum + value, 0)
    : 0;

  function refresh(nextSettings: Settings) {
    setSettings(nextSettings);
    if (rawRows) {
      setDataset(buildDataset(rawRows, source.fileName, source.encoding, source.delimiter, nextSettings));
    }
  }

  function loadRows(rows: Row[], fileName: string, encoding: string, delimiter: string) {
    if (rows.length < 2) throw new Error("檔案至少需要一列欄位名稱和一列資料。 ");
    if (rows.length > 50001) throw new Error("第一版最多處理 50,000 筆資料。 ");
    setRawRows(rows);
    setSource({ fileName, encoding, delimiter });
    setDataset(buildDataset(rows, fileName, encoding, delimiter, settings));
    setView("clean");
    setError("");
  }

  async function processFile(file: File) {
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error("檔案請控制在 10 MB 以內。 ");
      const buffer = await file.arrayBuffer();
      let text = "";
      let encoding = "UTF-8";
      try {
        text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
      } catch {
        text = new TextDecoder("big5").decode(buffer);
        encoding = "Big5";
      }
      text = text.replace(/^\uFEFF/, "");
      if (file.name.toLowerCase().endsWith(".json")) {
        const parsed = JSON.parse(text) as unknown;
        const records = Array.isArray(parsed) ? parsed : [parsed];
        if (!records.every((record) => record && typeof record === "object" && !Array.isArray(record))) {
          throw new Error("JSON 頂層必須是物件或物件陣列。 ");
        }
        const headers = Array.from(new Set(records.flatMap((record) => Object.keys(record as Record<string, unknown>))));
        const rows: Row[] = [headers, ...records.map((record) => headers.map((header) => {
          const value = (record as Record<string, unknown>)[header];
          return value == null ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
        }))];
        loadRows(rows, file.name, encoding, "json");
      } else {
        const delimiter = detectDelimiter(text);
        loadRows(parseDelimited(text, delimiter), file.name, encoding, delimiter);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "無法讀取這個檔案。 ");
    }
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void processFile(file);
    event.target.value = "";
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void processFile(file);
  }

  function loadDemo() {
    loadRows(parseDelimited(demoText, ","), "台灣客戶資料_範例.csv", "UTF-8", ",");
  }

  function downloadCsv() {
    if (!dataset) return;
    const content = [dataset.headers, ...dataset.rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\r\n");
    const base = dataset.fileName.replace(/\.[^.]+$/, "");
    downloadFile(`\uFEFF${content}`, "text/csv;charset=utf-8", `${base}_clean.csv`);
  }

  function downloadJson() {
    if (!dataset) return;
    const records = dataset.rows.map((row) =>
      Object.fromEntries(dataset.headers.map((header, index) => [header, row[index] ?? ""])),
    );
    const base = dataset.fileName.replace(/\.[^.]+$/, "");
    downloadFile(JSON.stringify(records, null, 2), "application/json", `${base}_clean.json`);
  }

  const shownHeaders = dataset ? (view === "clean" ? dataset.headers : dataset.originalHeaders) : [];
  const shownRows = dataset ? (view === "clean" ? dataset.rows : dataset.originalRows) : [];

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="DataFix TW 首頁">
          <span className="brand-mark">DF</span>
          <span>DataFix <b>TW</b></span>
        </a>
        <div className="privacy-pill"><span>●</span> 資料只在你的瀏覽器處理</div>
        <a className="github-link" href="https://github.com/mickey921205" target="_blank" rel="noreferrer">作者 GitHub ↗</a>
      </header>

      <section className="hero" id="top">
        <div>
          <p className="eyebrow">LOCAL-FIRST DATA CLEANER</p>
          <h1>台灣資料，<br /><em>整理好了。</em></h1>
          <p className="hero-copy">修好 Big5 亂碼、民國日期、千分位與全形字元。<br />不用上傳，不用登入，整理完直接下載。</p>
          <div className="format-list">
            <span>CSV</span><span>TSV</span><span>JSON</span><span>BIG5</span><span>UTF-8</span>
          </div>
        </div>
        <div className="hero-aside" aria-hidden="true">
          <span>113/08/05</span>
          <strong>→</strong>
          <span>2024-08-05</span>
          <div className="mini-grid"><i /><i /><i /><i /><i /><i /></div>
        </div>
      </section>

      <section className="workspace">
        <aside className="settings-panel">
          <div className="panel-heading">
            <p>清理規則</p><span>{Object.values(settings).filter(Boolean).length} 項開啟</span>
          </div>
          <Toggle label="移除多餘空白" hint="欄位前後空白與全形空格" checked={settings.trim} onChange={() => refresh({ ...settings, trim: !settings.trim })} />
          <Toggle label="統一全形字元" hint="ＡＢＣ、１２３ 轉為半形" checked={settings.normalizeWidth} onChange={() => refresh({ ...settings, normalizeWidth: !settings.normalizeWidth })} />
          <Toggle label="民國日期轉西元" hint="113/08/05 → 2024-08-05" checked={settings.rocDate} onChange={() => refresh({ ...settings, rocDate: !settings.rocDate })} />
          <Toggle label="移除數字千分位" hint="1,280,500 → 1280500" checked={settings.thousands} onChange={() => refresh({ ...settings, thousands: !settings.thousands })} />
          <Toggle label="統一缺失值" hint="N/A、NULL、— 轉為空值" checked={settings.missing} onChange={() => refresh({ ...settings, missing: !settings.missing })} />
          <div className="safe-note"><b>隱私優先</b><p>檔案內容不會離開這台裝置，也不會儲存在任何伺服器。</p></div>
        </aside>

        <div className="main-panel">
          {!dataset ? (
            <div
              className={`dropzone ${dragging ? "dragging" : ""}`}
              onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              <input ref={fileInput} type="file" accept=".csv,.tsv,.json,.txt,text/csv,text/tab-separated-values,application/json" onChange={onFileChange} />
              <div className="drop-icon">↓</div>
              <h2>把資料檔拖到這裡</h2>
              <p>支援 CSV、TSV、JSON，單檔最大 10 MB</p>
              <div className="drop-actions">
                <button className="primary-button" type="button" onClick={() => fileInput.current?.click()}>選擇檔案</button>
                <button className="text-button" type="button" onClick={loadDemo}>或先試試範例資料 →</button>
              </div>
              {error && <p className="error-message" role="alert">{error}</p>}
            </div>
          ) : (
            <div className="results">
              <div className="results-topbar">
                <div className="file-title">
                  <span className="file-icon">▦</span>
                  <div><strong>{dataset.fileName}</strong><small>{dataset.rows.length.toLocaleString()} 列 × {dataset.headers.length} 欄</small></div>
                </div>
                <button className="replace-button" type="button" onClick={() => fileInput.current?.click()}>更換檔案</button>
                <input ref={fileInput} className="hidden-input" type="file" accept=".csv,.tsv,.json,.txt" onChange={onFileChange} />
              </div>

              <div className="summary-grid">
                <article><small>偵測編碼</small><strong>{dataset.encoding}</strong><span className="status-dot">自動</span></article>
                <article><small>資料格式</small><strong>{delimiterLabel[dataset.delimiter] ?? "文字資料"}</strong><span>已辨識</span></article>
                <article><small>已修正</small><strong>{totalChanges.toLocaleString()} <i>格</i></strong><span>依目前規則</span></article>
                <article><small>資料狀態</small><strong className="ready">可以下載</strong><span>✓ 完成</span></article>
              </div>

              <div className="change-strip">
                {Object.entries(dataset.changes).length ? Object.entries(dataset.changes).map(([name, count]) => (
                  <span key={name}><b>{count}</b> {name}</span>
                )) : <span>沒有發現需要修正的內容</span>}
              </div>

              <div className="table-toolbar">
                <div><button className={view === "clean" ? "active" : ""} onClick={() => setView("clean")}>整理後</button><button className={view === "original" ? "active" : ""} onClick={() => setView("original")}>原始資料</button></div>
                <small>顯示前 {Math.min(shownRows.length, 20)} 列</small>
              </div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>#</th>{shownHeaders.map((header, index) => <th key={`${header}-${index}`}><span>{header || "(空白欄位)"}</span><small>{types[index]}</small></th>)}</tr></thead>
                  <tbody>{shownRows.slice(0, 20).map((row, rowIndex) => (
                    <tr key={rowIndex}><td>{rowIndex + 1}</td>{shownHeaders.map((_, columnIndex) => {
                      const value = row[columnIndex] ?? "";
                      const changed = dataset.originalRows[rowIndex]?.[columnIndex] !== dataset.rows[rowIndex]?.[columnIndex];
                      return <td key={columnIndex} className={view === "clean" && changed ? "changed" : ""}>{value || <span className="empty">空值</span>}</td>;
                    })}</tr>
                  ))}</tbody>
                </table>
              </div>

              <div className="download-bar">
                <div><strong>整理完成</strong><p>輸出採 UTF-8，Excel 可直接開啟。</p></div>
                <button className="secondary-button" type="button" onClick={downloadJson}>下載 JSON</button>
                <button className="primary-button" type="button" onClick={downloadCsv}>下載乾淨 CSV ↓</button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="explain-section">
        <p className="eyebrow">BUILT FOR REAL-WORLD TAIWAN DATA</p>
        <h2>不是魔法，是把麻煩事做好。</h2>
        <div className="feature-grid">
          <article><span>01</span><h3>辨識台灣常見格式</h3><p>Big5、民國日期、全形字元與 Excel 常見輸出，不再逐欄修正。</p></article>
          <article><span>02</span><h3>每一筆修改都看得見</h3><p>切換原始與整理後資料，所有變更格都有清楚標記。</p></article>
          <article><span>03</span><h3>資料留在你的電腦</h3><p>完全在瀏覽器內完成，不上傳、不追蹤檔案內容，也不需要帳號。</p></article>
        </div>
      </section>

      <footer><span>DataFix TW</span><p>開源、免費，為台灣的資料工作者打造。</p><a href="https://github.com/mickey921205" target="_blank" rel="noreferrer">作者 GitHub ↗</a></footer>
    </main>
  );
}
