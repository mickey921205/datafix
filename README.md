# DataFix TW

DataFix TW 是一個 local-first 的台灣資料清理工具。使用者可以在瀏覽器中直接整理 CSV、TSV 與 JSON；檔案內容不會上傳到伺服器。

## 功能

- 自動辨識 UTF-8 與 Big5
- 民國日期轉換為 ISO 西元日期
- 全形英數字轉半形
- 移除數字千分位與欄位前後空白
- 統一 `N/A`、`NULL`、`—` 等缺失值
- 修正空白與重複欄名
- 自動推斷文字、數字、日期與 Email 欄位
- 原始／整理後資料切換與修改標記
- 匯出 UTF-8 CSV 或 JSON

## 隱私設計

所有解析、清理與匯出都在使用者的瀏覽器內完成。專案沒有檔案上傳 API，也不會儲存或傳送資料內容。

## 本機開發

需要 Node.js 22.13 或更新版本。

```bash
npm install
npm run dev
```

正式建置：

```bash
npm run build
```

## 專案方向

- Excel `.xlsx` 本機匯入與輸出
- 欄位規則編輯器
- 重複資料偵測與合併建議
- 可重複使用的資料清理設定檔
- CLI 與 npm library
- 更多台灣政府開放資料的真實測試案例

## 貢獻

歡迎提交真實的髒資料案例、格式問題、功能建議與 Pull Request。請勿在 Issue 中貼出包含個資、憑證或其他敏感資訊的原始資料。

## License

MIT
