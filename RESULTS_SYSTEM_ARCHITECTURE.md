# 南関競馬結果システム アーキテクチャ

このドキュメントは data.keiba-intelligence.jp の結果ページ構造を定義する。

## 対象リポジトリ

`keiba-data-shared`

---

## 1. データ構造

結果データは **開催場単位のJSON** で保存される。

### 保存場所

```
nankan/results/YYYY/MM/
```

### 例

```
2026-03-09-OOI.json
2026-03-09-FUN.json
```

### JSON形式

```json
{
  "venue": "大井",
  "venueCode": "OOI",
  "date": "2026-03-09",
  "races": [...]
}
```

---

## 2. JSON命名ルール

### 現在の正式仕様

```
YYYY-MM-DD-OOI.json
YYYY-MM-DD-FUN.json
YYYY-MM-DD-KAW.json
YYYY-MM-DD-URA.json
```

### 旧形式（互換）

```
YYYY-MM-DD.json
```

---

## 3. JSON読み込みルール

**すべてのページは以下の順で読み込む。**

### ① 会場別JSON

```
YYYY-MM-DD-OOI.json
```

### ② 存在しない場合

```
YYYY-MM-DD.json
```

---

## 4. venue mapping

### URL slug と venueCode

```
ooi       → OOI
funabashi → FUN
kawasaki  → KAW
urawa     → URA
```

---

## 5. ページ階層

結果ページは **3階層構造**

### day
```
/nankan/results/YYYY/MM/DD/
```

### venue
```
/nankan/results/YYYY/MM/DD/ooi/
```

### race
```
/nankan/results/YYYY/MM/DD/ooi/1/
```

---

## 6. Astroページ構造

```
src/pages/nankan/results
```

### 主要ページ

```
index.astro
[year]/index.astro
[year]/[month]/index.astro
[year]/[month]/[day]/index.astro
[year]/[month]/[day]/[venue]/index.astro
[year]/[month]/[day]/[venue]/[race]/index.astro
```

---

## 7. breadcrumb構造

```
results
  ↓
year
  ↓
month
  ↓
day
  ↓
venue
  ↓
race
```

### 例

```
/nankan/results/2026/03/09/ooi/1/
```

### breadcrumb

```
2026
  → 03
    → 03/09
      → 大井
        → 第1R
```

---

## 8. dist生成例

### build後

```
dist/nankan/results/
```

### 例

```
dist/nankan/results/2026/03/09/index.html
dist/nankan/results/2026/03/09/ooi/index.html
dist/nankan/results/2026/03/09/ooi/1/index.html
```

---

## 9. 2会場開催

### 例

```
2026-03-09
  大井
  船橋
```

### dayページでは

```
船橋競馬 全12レース
大井競馬 全12レース
```

両方表示される。

---

## 10. 重要ルール

**以下を破らないこと。**

1. **会場別JSONを優先**
2. **統合JSONはフォールバックのみ**
3. **day / venue / race の3階層を維持**
4. **venue mappingを変更しない**

---

## 11. よくある破壊パターン

### Claudeが壊しやすい箇所

**getStaticPaths**

特に

```javascript
YYYY-MM-DD.json
```

のみを読んでしまうコード。

必ず

```javascript
YYYY-MM-DD-XXX.json
```

も対象にする。

---

## 12. 動作確認

### build

```bash
npm run build
```

### 確認

```
/nankan/results/2026/03/09/
/nankan/results/2026/03/09/ooi/
/nankan/results/2026/03/09/ooi/1/
```

HTTP 200であること。

---

## 13. 対象サイト

```
data.keiba-intelligence.jp
```

---

## Claude運用ルール

### 結果ページを修正する場合

**必ず以下を確認**

- `MULTI_VENUE_CHECK.md`
- `RESULTS_SYSTEM_ARCHITECTURE.md`

---

**最終更新**: 2026-03-10
**作成者**: Claude (クロちゃん)
