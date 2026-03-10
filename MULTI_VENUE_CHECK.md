# 南関競馬2会場同時開催対応チェックリスト

## 目的

南関競馬の2会場同時開催（例: 大井＋船橋）が発生した場合でも、data.keiba-intelligence.jp の結果ページが正しく動作することを確認する。

## 対象リポジトリ

- `keiba-data-shared`（結果表示サイト）
- `keiba-data-shared-admin`（結果データ保存）

---

## チェック項目

### 1. JSON保存形式

**確認内容**: 会場別JSONファイルが正しく保存されているか

**確認コマンド**:
```bash
ls -la nankan/results/2026/03/ | grep "2026-03-09"
```

**期待結果**:
```
2026-03-09-OOI.json   # 大井
2026-03-09-FUN.json   # 船橋
```

**NG例**:
- `2026-03-09.json` のみ存在（統合ファイル形式）
- 会場別ファイルが1つしかない（上書きされている）

---

### 2. ページ生成

#### 2-1. dist に静的ページが生成されているか

**確認コマンド**:
```bash
ls -la dist/nankan/results/2026/03/09/
```

**期待結果**:
```
index.html      # 日付親ページ
ooi/            # 大井会場ページ
funabashi/      # 船橋会場ページ
```

#### 2-2. 各会場のレースページが生成されているか

**確認コマンド**:
```bash
ls dist/nankan/results/2026/03/09/ooi/
ls dist/nankan/results/2026/03/09/funabashi/
```

**期待結果**:
```
index.html  # 会場親ページ
1/ 2/ 3/ 4/ 5/ 6/ 7/ 8/ 9/ 10/ 11/ 12/  # 各レースページ
```

---

### 3. 本番URL確認

**確認対象日付**: 2会場同時開催日（例: 2026-03-09）

**確認コマンド**:
```bash
# 日付親ページ
curl -sI "https://data.keiba-intelligence.jp/nankan/results/2026/03/09/" | head -1

# 会場親ページ
curl -sI "https://data.keiba-intelligence.jp/nankan/results/2026/03/09/ooi/" | head -1
curl -sI "https://data.keiba-intelligence.jp/nankan/results/2026/03/09/funabashi/" | head -1

# レース詳細ページ
curl -sI "https://data.keiba-intelligence.jp/nankan/results/2026/03/09/ooi/1/" | head -1
curl -sI "https://data.keiba-intelligence.jp/nankan/results/2026/03/09/funabashi/1/" | head -1
```

**期待結果**: すべて `HTTP/2 200`

**内容確認**:
```bash
# 日付親ページ（両会場表示）
curl -sL "https://data.keiba-intelligence.jp/nankan/results/2026/03/09/" | grep -o '船橋競馬 全[0-9]*レース'
curl -sL "https://data.keiba-intelligence.jp/nankan/results/2026/03/09/" | grep -o '大井競馬 全[0-9]*レース'

# 会場親ページ
curl -sL "https://data.keiba-intelligence.jp/nankan/results/2026/03/09/ooi/" | grep -o '<title>[^<]*'
# 期待: <title>2026年3月9日 大井競馬 全12レース結果

# レース詳細ページ
curl -sL "https://data.keiba-intelligence.jp/nankan/results/2026/03/09/ooi/1/" | grep -o '<title>[^<]*'
# 期待: <title>2026年03月09日 大井競馬 第1R
```

---

### 4. アーカイブページ確認（keiba-intelligence）

**確認URL**: https://keiba-intelligence.netlify.app/archive/2026/03

**確認コマンド**:
```bash
curl -sL "https://keiba-intelligence.netlify.app/archive/2026/03" | grep -o '<span class="race-number">[^<]*</span>' | head -20
```

**期待結果**:
```
<span class="race-number">大井1R</span>
<span class="race-number">大井2R</span>
<span class="race-number">船橋1R</span>
<span class="race-number">船橋2R</span>
```

**NG例**:
```
<span class="race-number">第1R</span>  # 会場名なし
```

---

## トラブルシューティング

### 問題1: 日付親ページが404

**原因**: `[day]/index.astro` が会場別JSON未対応

**確認**:
```bash
ls nankan/results/2026/03/ | grep "2026-03-09"
# 期待: -OOI.json, -FUN.json の両方存在

ls dist/nankan/results/2026/03/09/
# 期待: index.html, ooi/, funabashi/ が存在
```

**修正箇所**: `src/pages/nankan/results/[year]/[month]/[day]/index.astro`
- 会場別ファイル複数読み込み対応
- commit: 65ec044

### 問題2: 会場親ページが404

**原因**: `[venue]/index.astro` が会場別JSON未対応

**修正箇所**: `src/pages/nankan/results/[year]/[month]/[day]/[venue]/index.astro`
- 会場別ファイル優先、統合ファイルフォールバック
- commit: f713ac5

### 問題3: レース詳細ページが404

**原因**: `[race]/index.astro` が会場別JSON未対応

**修正箇所**: `src/pages/nankan/results/[year]/[month]/[day]/[venue]/[race]/index.astro`
- 会場別ファイル優先、統合ファイルフォールバック
- commit: 7f0f0cb

### 問題4: アーカイブで会場名が表示されない

**原因**: `race.venue` フィールド未使用

**修正箇所**: `keiba-intelligence/src/pages/archive/[year]/[month]/index.astro`
- `race.venue` を使用してレース番号に会場名追加
- commit: f949001

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

### keiba-data-shared-admin
- `5714cfc` - 会場別ファイル名生成対応（`${date}-${venueCode}.json`）

### keiba-data-shared
- `c08e7fa` - venueCode 3文字化（OI→OOI, FU→FUN）
- `7f0f0cb` - レース詳細ページ対応（会場別JSON優先）
- `f713ac5` - 会場親ページ対応（会場別JSON優先）
- `65ec044` - 日付親ページ対応（会場別JSON複数読み込み）
- `7f783fa` - ARCHITECTURE_RESULTS.md作成

### keiba-intelligence
- `f949001` - アーカイブページ会場名表示対応

---

## 関連ドキュメント

- `ARCHITECTURE_RESULTS.md` - 南関結果データ構造の詳細仕様

---

**最終更新**: 2026-03-10
**作成者**: Claude (クロちゃん)
