# 南関結果データ構造（2026更新）

## JSON保存形式

### 従来
```
YYYY-MM-DD.json
```

### 現在
```
YYYY-MM-DD-OOI.json
YYYY-MM-DD-FUN.json
YYYY-MM-DD-KAW.json
YYYY-MM-DD-URA.json
```

つまり1日1ファイルではなく
**1開催場1ファイル**

### 例
```
2026-03-09-OOI.json
2026-03-09-FUN.json
```

---

## ページ構造

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

## JSON読み込みルール

すべてのページは

1. **会場別JSONを優先**
2. **存在しない場合のみ統合JSONを読む**

### 優先
```
YYYY-MM-DD-OOI.json
```

### フォールバック
```
YYYY-MM-DD.json
```

---

## 対応ページ

### race page
```
src/pages/nankan/results/[year]/[month]/[day]/[venue]/[race]/index.astro
```
- 会場別ファイル優先
- 統合ファイルへのフォールバック
- venueCodeMap: slug → venueCode変換
- 対応commit: 7f0f0cb

### venue page
```
src/pages/nankan/results/[year]/[month]/[day]/[venue]/index.astro
```
- 会場別ファイル優先
- 統合ファイルへのフォールバック
- venueCodeMap: slug → venueCode変換
- 対応commit: f713ac5

### day page
```
src/pages/nankan/results/[year]/[month]/[day]/index.astro
```
- 会場別ファイル複数読み込み対応
- 統合ファイルへのフォールバック
- 2会場同時開催日対応（船橋＋大井）
- 対応commit: 65ec044

---

## venue slug mapping

| slug | venueCode | 会場名 |
|------|-----------|--------|
| ooi | OOI | 大井 |
| funabashi | FUN | 船橋 |
| kawasaki | KAW | 川崎 |
| urawa | URA | 浦和 |

---

## 実装詳細

### venueCodeMap（共通）

```javascript
const venueCodeMap = {
  'ooi': 'OOI',
  'funabashi': 'FUN',
  'kawasaki': 'KAW',
  'urawa': 'URA'
};
```

### データ読み込みパターン（race/venue page）

```javascript
// 会場別ファイル優先
let filePath = join(process.cwd(), 'nankan', 'results', year, paddedMonth,
                   `${year}-${paddedMonth}-${paddedDay}-${venueCode}.json`);

try {
  const content = readFileSync(filePath, 'utf-8');
  const json = JSON.parse(content);
  allRaces = json.races || [];
  raceData = allRaces.find(r => r.raceNumber === raceNumber);
} catch (venueFileError) {
  // 会場別ファイルがなければ統合ファイルを試す
  filePath = join(process.cwd(), 'nankan', 'results', year, paddedMonth,
                 `${year}-${paddedMonth}-${paddedDay}.json`);
  const content = readFileSync(filePath, 'utf-8');
  const json = JSON.parse(content);
  allRaces = json.races || [];
  raceData = allRaces.find(r => r.raceNumber === raceNumber);
}
```

### データ読み込みパターン（day page）

```javascript
// 会場別ファイルが存在する場合、全会場を読み込み
const files = readdirSync(monthDir).filter(name => name.endsWith('.json'));
const venueFiles = files.filter(f =>
  f.match(new RegExp(`^${year}-${paddedMonth}-${paddedDay}-[A-Z]{2,3}\\.json$`))
);

if (venueFiles.length > 0) {
  // 会場別ファイルが存在する場合、全会場を読み込み
  for (const file of venueFiles) {
    try {
      const filePath = join(monthDir, file);
      const content = readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      allVenuesData.push({
        venue: data.venue,
        venueCode: data.venueCode,
        races: data.races || []
      });
    } catch (e) {
      console.error(`Error reading ${file}:`, e.message);
    }
  }
} else {
  // 統合ファイルを試す
  const filePath = join(monthDir, `${year}-${paddedMonth}-${paddedDay}.json`);
  const content = readFileSync(filePath, 'utf-8');
  const data = JSON.parse(content);
  allVenuesData = [{
    venue: data.venue,
    venueCode: data.venueCode,
    races: data.races || []
  }];
}
```

---

## getStaticPaths対応

### regex変更（race/venue/day page共通）

**旧:**
```javascript
const match = file.match(/^(\d{4})-(\d{2})-(\d{2})\.json$/);
```

**新:**
```javascript
const match = file.match(/^(\d{4})-(\d{2})-(\d{2})(-[A-Z]{2,3})?\.json$/);
```

### 重複排除（day page）

```javascript
const processedDates = new Set();

for (const file of files) {
  const match = file.match(/^(\d{4})-(\d{2})-(\d{2})(-[A-Z]{2,3})?\.json$/);
  if (match) {
    const [, fileYear, fileMonth, day] = match;
    const dateKey = `${fileYear}-${fileMonth}-${day}`;

    if (!processedDates.has(dateKey)) {
      paths.push({
        params: { year: fileYear, month: fileMonth, day }
      });
      processedDates.add(dateKey);
    }
  }
}
```

---

## 2会場同時開催日対応

### 例: 2026-03-09（船橋＋大井）

**保存ファイル:**
```
nankan/results/2026/03/2026-03-09-FUN.json  # 船橋12レース
nankan/results/2026/03/2026-03-09-OOI.json  # 大井12レース
```

**生成ページ:**
```
/nankan/results/2026/03/09/                  # 日付親ページ（両会場表示）
/nankan/results/2026/03/09/funabashi/        # 船橋会場ページ
/nankan/results/2026/03/09/ooi/              # 大井会場ページ
/nankan/results/2026/03/09/funabashi/1/      # 船橋1R
/nankan/results/2026/03/09/ooi/1/            # 大井1R
```

**日付親ページの内容:**
- 船橋競馬 全12レース
- 大井競馬 全12レース
- 各会場へのリンク

---

## 保存元（keiba-data-shared-admin）

### save-results.mjs

**会場コードマップ（3文字）:**
```javascript
const venueCodeMap = {
  '大井': 'OOI',
  '川崎': 'KAW',
  '船橋': 'FUN',
  '浦和': 'URA'
};
```

**ファイル名生成:**
```javascript
const fileName = `${date}-${venueCode}.json`;
// 例: 2026-03-09-OOI.json
```

**対応commit:** 5714cfc

---

## トラブルシューティング

### 404が発生する場合

1. **JSONファイル存在確認**
   ```bash
   ls nankan/results/2026/03/ | grep "2026-03-09"
   ```
   期待: `-OOI.json`, `-FUN.json` の両方存在

2. **ビルドログ確認**
   ```bash
   npm run build 2>&1 | grep "Generated paths for 2026-03-09"
   ```

3. **dist確認**
   ```bash
   ls dist/nankan/results/2026/03/09/
   ```
   期待: `index.html`, `ooi/`, `funabashi/`

4. **データ読み込みロジック確認**
   ```bash
   grep -A30 "venueCodeMap" src/pages/nankan/results/[year]/[month]/[day]/[venue]/[race]/index.astro
   ```

---

## チェックリスト

詳細は `MULTI_VENUE_CHECK.md` を参照

---

**最終更新日:** 2026-03-10
**作成者:** Claude (クロちゃん)
