# DataFix launch copy

This file keeps launch messaging close to the project so it can evolve with the product.

## V2EX — 分享创造

### Suggested title

[开源] 做了一个完全在浏览器本地处理的 CSV / TSV / JSON 数据清理工具 DataFix

### Draft

最近整理不同来源的数据时，经常遇到一些很烦的小问题：Big5 / Shift-JIS 编码、`1,234.56` 和 `1.234,56` 混在一起、日期格式不统一、全形字符、NULL / N/A、重复栏位名等等。

所以我做了一个小工具 DataFix，目标就是把这些脏数据在浏览器里直接整理掉。

比较在意的一点是隐私：文件不会上传到服务器，解析、清理、预览和导出都在浏览器本地完成。

目前支持：

- CSV / TSV / JSON
- UTF-8、Big5、Shift-JIS、Windows-1252
- 欧美数字格式
- 国际日期格式与民国年
- 全形转半形
- 空白与常见缺失值统一
- 空白 / 重复栏位名修复
- 清理前后对比
- UTF-8 CSV / JSON 导出

在线 Demo：
https://datafix-tw.mickey921205.workers.dev

GitHub：
https://github.com/mickey921205/datafix

现在还是早期版本，我比较想收集真实的脏数据 edge cases。为了隐私，issue 里请不要贴真实敏感资料，可以用几行合成数据重现就好。

如果你平常有碰过特别奇怪的 CSV、地区格式或编码问题，也欢迎告诉我，我会把能重现的案例补进测试。

### Posting note

V2EX's 分享创造 node currently describes itself as a place to publish your own latest work. Keep the post focused on what was built, the technical/problem-solving angle, and requests for feedback rather than overt promotion or repeated reposting.

## LINUX DO — 开源推广

Current 2026 open-source promotion examples require the forum's Open Source Promotion template, a fully open-source project, a project-side acknowledgement/link to LINUX DO, and disclosure of AI-generated or AI-polished promotional content. The README includes a permanent LINUX DO acknowledgement link.

If this draft is used, disclose that it was AI-assisted and follow the forum's current template/screenshot requirements at posting time.

### Factual outline to rewrite in your own voice

- Why DataFix was made: regional CSV/data-cleaning problems are annoying and easy to get subtly wrong.
- Privacy design: source files stay client-side; there is no normal file-upload API.
- What currently works: CSV/TSV/JSON; UTF-8/Big5/Shift-JIS/Windows-1252; dates; ROC dates; US/EU numeric formats; full-width normalization; missing values; header repair; export.
- Reliability work before launch: CI, behavioral date/number tests, real legacy-encoding byte fixtures, and fixes discovered by those tests.
- Demo: https://datafix-tw.mickey921205.workers.dev
- Source: https://github.com/mickey921205/datafix
- Ask: synthetic dirty-data edge cases, reproducible bugs, implementation ideas.
- Never ask users to upload confidential real-world datasets publicly.

## X — English

Built DataFix: a privacy-first CSV / TSV / JSON cleaner that runs entirely in your browser.

It handles the annoying cross-region stuff: Big5 / Shift-JIS, US vs EU number formats, dates, full-width characters, missing values and broken headers — without uploading the source file.

Demo: https://datafix-tw.mickey921205.workers.dev
Source: https://github.com/mickey921205/datafix

Looking for weird synthetic data edge cases to break it.

## Short X variant

Messy CSV from different regions is surprisingly easy to corrupt silently.

I built DataFix to clean encodings, dates, decimal styles, full-width text and missing values locally in the browser — no file upload.

https://datafix-tw.mickey921205.workers.dev
