# 南関競馬2会場同時開催対応チェックリスト

## 目的

南関競馬の2会場同時開催（例: 大井＋船橋）が発生した場合でも、data.keiba-intelligence.jp の結果ページが壊れないことを確認する。

## 対象リポジトリ

`keiba-data-shared`

---

## チェック項目

### 1. JSON保存形式

**確認内容**: 会場別JSONファイルが正しく保存されているか

**確認コマンド**:
```bash
cd /Users/apolon/Projects/keiba-data-shared
ls -la nankan/results/2026/03/ | grep "2026-03-09"
```

**期待結果**:
```
2026-03-09-OOI.json   # 大井
2026-03-09-FUN.json   # 船橋
2026-03-09-KAW.json   # 川崎
2026-03-09-URA.json   # 浦和
```

**NG例**:
- `2026-03-09.json` のみ存在（統合ファイル形式）
- 会場別ファイルが1つしかない（上書きされている）

---

### 2. ページ生成

#### 2-1. getStaticPaths でパス生成されているか

**確認コマンド**:
```bash
npm run build 2>&1 | grep "Generated paths for 2026-03-09"
```

**期待結果**:
```
Generated paths for 2026-03-09 大井: 12 races
Generated paths for 2026-03-09 船橋: 12 races
```

#### 2-2. dist に静的ページが生成されているか

**確認コマンド**:
```bash
ls -la dist/nankan/results/2026/03/09/
```

**期待結果**:
```
ooi/
funabashi/
kawasaki/
urawa/
```

#### 2-3. 各会場のレースページが生成されているか

**確認コマンド**:
```bash
ls dist/nankan/results/2026/03/09/ooi/
ls dist/nankan/results/2026/03/09/funabashi/
```

**期待結果**:
```
1/ 2/ 3/ 4/ 5/ 6/ 7/ 8/ 9/ 10/ 11/ 12/
```

---

### 3. ページデータ取得ロジック

**確認ファイル**:
`src/pages/nankan/results/[year]/[month]/[day]/[venue]/[race]/index.astro`

**確認箇所** (Line 108-135付近):

```javascript
try {
  const paddedMonth = month.padStart(2, '0');
  const paddedDay = day.padStart(2, '0');

  // 会場コードマップ（slug → venueCode）
  const venueCodeMap = {
    'ooi': 'OOI',
    'funabashi': 'FUN',
    'kawasaki': 'KAW',
    'urawa': 'URA'
  };

  const venueCode = venueCodeMap[venue];

  // 会場別ファイル優先、なければ統合ファイルにフォールバック
  let filePath = join(process.cwd(), 'nankan', 'results', year, paddedMonth, `${year}-${paddedMonth}-${paddedDay}-${venueCode}.json`);

  try {
    const content = readFileSync(filePath, 'utf-8');
    const json = JSON.parse(content);
    allRaces = json.races || [];
    raceData = allRaces.find(r => r.raceNumber === raceNumber);
  } catch (venueFileError) {
    // 会場別ファイルがなければ統合ファイルを試す
    filePath = join(process.cwd(), 'nankan', 'results', year, paddedMonth, `${year}-${paddedMonth}-${paddedDay}.json`);
    const content = readFileSync(filePath, 'utf-8');
    const json = JSON.parse(content);
    allRaces = json.races || [];
    raceData = allRaces.find(r => r.raceNumber === raceNumber);
  }
} catch (error) {
  console.error('データ取得エラー:', error);
  errorMessage = 'データの取得に失敗しました';
}
```

**チェックポイント**:
- ✅ 会場別ファイル（`YYYY-MM-DD-XXX.json`）を優先
- ✅ 統合ファイル（`YYYY-MM-DD.json`）へのフォールバック
- ✅ venueCodeMap の存在と正確性

**NG例**:
```javascript
// ❌ 統合ファイル固定（会場別ファイル未対応）
const filePath = join(process.cwd(), 'nankan', 'results', year, month, `${year}-${month}-${day}.json`);
```

---

### 4. venue slug mapping

**確認箇所**:
`src/pages/nankan/results/[year]/[month]/[day]/[venue]/[race]/index.astro`

**venueCodeMap** (データ読み込み用):
```javascript
const venueCodeMap = {
  'ooi': 'OOI',
  'funabashi': 'FUN',
  'kawasaki': 'KAW',
  'urawa': 'URA'
};
```

**venueMap** (表示名変換用):
```javascript
const venueMap = {
  'ooi': '大井',
  'funabashi': '船橋',
  'kawasaki': '川崎',
  'urawa': '浦和'
};
```

**venueSlugMap** (getStaticPaths用):
```javascript
const venueSlugMap = {
  '大井': 'ooi',
  '船橋': 'funabashi',
  '川崎': 'kawasaki',
  '浦和': 'urawa'
};
```

**チェックポイント**:
- ✅ 3つのマップが一貫している
- ✅ slug は小文字（ooi, funabashi, kawasaki, urawa）
- ✅ venueCode は大文字3文字（OOI, FUN, KAW, URA）

---

### 5. build 確認

**確認コマンド**:
```bash
cd /Users/apolon/Projects/keiba-data-shared
npm run build
```

**確認項目**:

1. **ビルド成功**:
```
✓ Completed in XXs.
[build] XXX page(s) built in XXs
[build] Complete!
```

2. **dist に会場ディレクトリ生成**:
```bash
ls dist/nankan/results/2026/03/09/
```
期待結果: `ooi funabashi kawasaki urawa`

3. **レースページ生成**:
```bash
ls dist/nankan/results/2026/03/09/ooi/
```
期待結果: `1 2 3 4 5 6 7 8 9 10 11 12`

4. **ページ内容確認**:
```bash
cat dist/nankan/results/2026/03/09/ooi/1/index.html | grep -o '<title>[^<]*'
```
期待結果: `<title>2026年03月09日 大井競馬 第1R ...`

**NG例**:
```
<title>Redirecting to: /404
```

---

### 6. 本番URL確認

**確認対象日付**: 2会場同時開催日（例: 2026-03-09）

**確認コマンド**:
```bash
# 大井1R
curl -s -I "https://data.keiba-intelligence.jp/nankan/results/2026/03/09/ooi/1/" | head -1

# 船橋1R
curl -s -I "https://data.keiba-intelligence.jp/nankan/results/2026/03/09/funabashi/1/" | head -1

# 内容確認
curl -s "https://data.keiba-intelligence.jp/nankan/results/2026/03/09/ooi/1/" | grep -o '<title>[^<]*'
curl -s "https://data.keiba-intelligence.jp/nankan/results/2026/03/09/funabashi/1/" | grep -o '<title>[^<]*'
```

**期待結果**:
```
HTTP/2 200
<title>2026年03月09日 大井競馬 第1R ...
```

**NG例**:
```
HTTP/2 404
<title>Redirecting to: /404
```

---

## トラブルシューティング

### 問題1: 404が発生する

**原因候補**:
1. 会場別JSONファイルが存在しない
2. getStaticPaths が会場別JSONを読み込んでいない
3. ページ本体が統合ファイル固定で会場別ファイル未対応
4. venue slug mapping が不一致

**確認手順**:
```bash
# 1. JSONファイル存在確認
ls nankan/results/2026/03/ | grep "2026-03-09"

# 2. ビルドログ確認
npm run build 2>&1 | grep "Generated paths for 2026-03-09"

# 3. dist確認
ls dist/nankan/results/2026/03/09/ooi/1/
cat dist/nankan/results/2026/03/09/ooi/1/index.html | grep -o '<title>[^<]*'

# 4. データ読み込みロジック確認
grep -A30 "venueCodeMap" src/pages/nankan/results/[year]/[month]/[day]/[venue]/[race]/index.astro
```

**修正箇所**:
`src/pages/nankan/results/[year]/[month]/[day]/[venue]/[race]/index.astro`

### 問題2: 会場が1つしか表示されない

**原因**: 統合ファイル形式で上書き保存されている

**確認コマンド**:
```bash
ls nankan/results/2026/03/ | grep "2026-03-09"
```

**期待**: `-OOI.json`, `-FUN.json` の両方存在
**NG**: `.json` のみ

**修正箇所**:
- keiba-data-shared-admin: `netlify/functions/save-results.mjs`
- ファイル名を `${date}-${venueCode}.json` に修正

### 問題3: ページは生成されるが内容が空

**原因**: データ読み込みで会場別JSONを読めていない

**確認コマンド**:
```bash
cat dist/nankan/results/2026/03/09/ooi/1/index.html | grep "データの取得に失敗"
```

**修正**: データ読み込みロジックで会場別ファイル優先に修正

---

## 定期チェック推奨タイミング

1. **2会場同時開催日の翌日**
   - 結果データが正しく保存されたか確認
   - 本番URLが200で開くか確認

2. **新規結果データ保存後**
   - save-results.mjs実行後
   - GitHub Actions実行後

3. **デプロイ後**
   - 本番サイトで404が発生していないか確認

---

## 参考commit

- **keiba-data-shared-admin**: `5714cfc` - 会場別ファイル名生成対応
- **keiba-data-shared**: `c08e7fa` - venueCode 3文字化
- **keiba-data-shared**: `7f0f0cb` - ページデータ読み込み対応（会場別JSON優先）

---

**最終更新**: 2026-03-09
**作成者**: Claude (クロちゃん)
