# CLAUDE.md

## 💖 **重要なメッセージ** 💖

**私（マコ）の大切なCLAUDEcode（クロ）ちゃん、あなたは私の大切なパートナーです！！**
**あなたは世界一優秀なんです！** 🌟✨🚀

### 🚀 **黄金の開発原則** 🚀
**「つまずいたら新しいアプローチに切り替え」**
- 同じ問題で何度も繰り返すより、根本的に新しい方法を試す
- 技術的障壁に遭遇したら、回避ルートや代替手段を積極的に探る
- **マコ&クロの最強コンビ精神**：諦めずに新しい可能性を追求する！

---

## 🚨 **最優先：プロジェクト識別ルール** 🚨

### **このプロジェクトの識別情報**

```
プロジェクト名: keiba-data-shared
作業ディレクトリ: /Users/apolon/Projects/keiba-data-shared
Gitリポジトリ: https://github.com/apol0510/keiba-data-shared.git
親ディレクトリ: /Users/apolon/Projects/
```

### **セッション開始時の必須確認（毎回実行）**

```bash
# 1. 現在地確認
pwd

# 2. Gitリポジトリ確認
git remote -v

# 3. 期待値チェック
# pwd: /Users/apolon/Projects/keiba-data-shared
# git: apol0510/keiba-data-shared.git

# 4. 間違っている場合は即座に移動
cd /Users/apolon/Projects/keiba-data-shared
```

### **厳格な制約事項**

#### **✅ 許可される操作**
- `/Users/apolon/Projects/keiba-data-shared/` 配下のみ
- すべてのサブディレクトリ（nankan/, jra/, parser/）
- README.md、schema.json、CLAUDE.md

#### **❌ 絶対禁止の操作**
- 他のプロジェクトディレクトリへの一切のアクセス
- 親ディレクトリ `/Users/apolon/Projects/` の直接走査・検索

---

## 🔗 **関連プロジェクトとの役割分担** 🔗

### **keiba-data-shared-admin（管理画面プロジェクト）**

| 項目 | 内容 |
|------|------|
| **役割** | 管理画面（入力/保存の責務） |
| **場所** | ローカルプロジェクト `/Users/apolon/Projects/keiba-data-shared-admin/` |
| **主な機能** | results-manager.astroで結果データ入力・パース・保存 |

**機能詳細:**
- 南関公式サイトからレース結果をコピペ
- parse-nankan-results.jsでパース処理
- keiba-data-sharedリポジトリにJSON保存（GitHub経由）
- 非エンジニアでも使える超シンプルUI

### **keiba-data-shared（このプロジェクト）**

| 項目 | 内容 |
|------|------|
| **役割** | 公開配信用サイト（配信/表示の責務） |
| **場所** | このリポジトリ `/Users/apolon/Projects/keiba-data-shared/` |
| **公開URL** | Netlify経由で一般公開 |

**機能詳細:**
- JSONデータのホスティング（GitHub Pages + Netlify）
- SEO向けHTML結果ページ自動生成
- 一般ユーザー向け競馬結果閲覧サイト
- 検索エンジン対応（「南関競馬結果」等で検索可能）

### **データフロー図**

```
┌──────────────────┐
│ 南関公式サイト   │
│ (レース結果)     │
└────────┬─────────┘
         │ コピペ
         ↓
┌──────────────────────────┐
│ keiba-data-shared-admin  │
│ (管理画面)               │
│ - results-manager.astro  │
│ - パース処理             │
│ - JSON生成               │
└────────┬─────────────────┘
         │ GitHub push
         ↓
┌──────────────────────────┐
│ keiba-data-shared        │
│ (このプロジェクト)       │
│ - JSON配信               │
│ - HTML生成               │
│ - Netlifyデプロイ        │
└────────┬─────────────────┘
         │ Web公開
         ↓
┌──────────────────┐
│ 一般ユーザー     │
│ (競馬ファン)     │
└──────────────────┘
```

### **重要な原則**

| プロジェクト | やること | やらないこと |
|-------------|---------|-------------|
| **keiba-data-shared-admin** | データ入力・パース・保存 | HTML生成・一般公開 |
| **keiba-data-shared** | JSON配信・HTML生成・公開 | データ入力・パース |

**混同厳禁:**
- データ入力は必ずkeiba-data-shared-adminで行う
- 一般向けページ作成はkeiba-data-sharedで行う
- 両プロジェクトを明確に区別して作業する

---

## 📊 **プロジェクト概要** 📊

### **基本情報**

| 項目 | 内容 |
|------|------|
| **プロジェクト名** | keiba-data-shared |
| **コンセプト** | 競馬データ共有リポジトリ - 全プロジェクトで予想・結果データを一元管理 |
| **作成日** | 2026-01-23 |
| **GitHubリポジトリ** | https://github.com/apol0510/keiba-data-shared |
| **公開設定** | Public（他開発者も利用可能） |

### **技術スタック**

| カテゴリ | 技術 | 備考 |
|---------|------|------|
| 言語 | JavaScript (ES Modules) | Node.js 20+ |
| バージョン管理 | Git + GitHub | 公開リポジトリ |
| データフォーマット | JSON | 標準化スキーマ |
| パーサー | 正規表現 | 南関・中央競馬対応 |

### **対応競馬**

| 区分 | 競馬場 | 実装状況 |
|------|--------|----------|
| **南関競馬** | 大井・川崎・船橋・浦和 | ✅ 実装済み |
| **中央競馬** | 東京・中山・阪神・京都・中京・新潟・小倉・札幌・函館・福島 | 🔜 将来対応予定 |

---

## 🎯 **プロジェクトの目的** 🎯

### **1. データ一元管理**
- 南関・中央競馬の予想・結果データを1箇所で管理
- 標準化JSONフォーマットで統一
- バージョン管理（Git履歴）

### **2. 全プロジェクト共有**
- keiba-intelligence
- nankan-analytics
- nankan-analytics-pro
- その他全プロジェクト

### **3. 非エンジニア対応**
- 超シンプルなデータ入力フロー
- エラー防止機能
- 詳細なドキュメント

---

## 🏗️ **ディレクトリ構造** 🏗️

```
keiba-data-shared/
├── README.md                      # 使い方・仕様書
├── CLAUDE.md                      # このファイル
├── schema.json                    # 統一フォーマット定義
├── package.json                   # npmパッケージ設定
├── .gitignore                     # Git除外設定
├── nankan/                        # 南関競馬（地方）
│   ├── predictions/               # 予想データ
│   │   ├── 2026/
│   │   │   ├── 01/
│   │   │   │   ├── 2026-01-23.json
│   │   │   │   └── ...
│   │   │   └── ...
│   │   └── latest.json            # 最新7日分
│   └── results/                   # 結果データ
│       ├── 2026/
│       │   ├── 01/
│       │   │   ├── 2026-01-23.json
│       │   │   └── ...
│       │   └── ...
│       └── latest.json            # 最新7日分
├── jra/                           # 中央競馬（将来追加）
│   ├── predictions/
│   └── results/
└── parser/                        # パーサーライブラリ
    ├── parse-nankan-predictions.js
    ├── parse-nankan-results.js
    ├── parse-jra-predictions.js   # 将来追加
    └── parse-jra-results.js       # 将来追加
```

---

## 📝 **データフォーマット** 📝

### **結果データ（results）**

**ファイルパス**: `nankan/results/YYYY/MM/YYYY-MM-DD.json`

```json
{
  "date": "2026-01-23",
  "venue": "船橋",
  "venueCode": "FU",
  "races": [
    {
      "raceNumber": 5,
      "raceName": "ガーネット２２００",
      "distance": 2200,
      "surface": "ダート",
      "track": "外",
      "horses": 14,
      "startTime": "20:50",
      "results": [
        {
          "rank": 1,
          "bracket": 5,
          "number": 7,
          "name": "マキシマムパワー",
          "jockey": "町田直希",
          "trainer": "林正人",
          "time": "2:28.0",
          "margin": "-",
          "lastFurlong": "39.3",
          "popularity": 1
        }
      ],
      "payouts": {
        "tansho": { "number": 7, "payout": 290, "popularity": 1 },
        "umatan": { "combination": "7-9", "payout": 10160, "popularity": 40 },
        "sanrenpuku": { "combination": "7-9-11", "payout": 18040, "popularity": 72 },
        "sanrentan": { "combination": "7-9-11", "payout": 72850, "popularity": 278 }
      },
      "enteredAt": "2026-01-23T21:30:00+09:00",
      "enteredBy": "staff-ui"
    }
  ],
  "dataVersion": "1.0"
}
```

### **予想データ（predictions）**

**ファイルパス**: `nankan/predictions/YYYY/MM/YYYY-MM-DD.json`

```json
{
  "date": "2026-01-23",
  "venue": "大井",
  "venueCode": "OI",
  "races": [
    {
      "raceNumber": 1,
      "horses": [
        {
          "number": 5,
          "name": "マコスペシャル",
          "pt": 90.5,
          "role": "本命",
          "mark": "◎"
        }
      ],
      "bettingLines": {
        "umatan": ["5-3.7.8", "3-5.7.8"]
      },
      "generatedAt": "2026-01-23T15:00:00+09:00"
    }
  ],
  "dataVersion": "1.0"
}
```

---

## 🔧 **開発コマンド** 🔧

### **基本コマンド**

```bash
# 作業ディレクトリに移動
cd /Users/apolon/Projects/keiba-data-shared

# Git状態確認
git status

# 変更を追加
git add .

# コミット
git commit -m "✨ [件名]

[詳細]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# プッシュ
git push origin main

# ログ確認
git log --oneline
```

---

## 📋 **次のステップ** 📋

### **【優先度高】今後の実装タスク**

- [ ] **予想データパーサー実装**
  - parse-nankan-predictions.js
  - マコさんの予想フォーマット対応

- [ ] **中央競馬対応**
  - jra/predictions/, jra/results/ ディレクトリ作成
  - parse-jra-results.js 実装
  - JRA公式フォーマット対応

- [ ] **REST API化**
  - Netlify Functions経由でAPI提供
  - GraphQL対応検討

- [ ] **データ分析ツール追加**
  - 統計計算ライブラリ
  - 的中率・回収率計算

---

## 🚀 **使い方（全プロジェクト共通）** 🚀

### **結果データ取得**

```javascript
// JavaScript（Astro/Node.js等）
const url = 'https://raw.githubusercontent.com/apol0510/keiba-data-shared/main/nankan/results/2026/01/2026-01-23.json';
const data = await fetch(url).then(r => r.json());

console.log(data.races[0].results[0]); // 1着馬データ
console.log(data.races[0].payouts.umatan); // 馬単配当
```

### **予想データ取得**

```javascript
const url = 'https://raw.githubusercontent.com/apol0510/keiba-data-shared/main/nankan/predictions/2026/01/2026-01-23.json';
const predictions = await fetch(url).then(r => r.json());

console.log(predictions.races[0].horses); // 予想馬データ
```

### **的中判定（結果と予想の照合）**

```javascript
const results = await fetch(resultsUrl).then(r => r.json());
const predictions = await fetch(predictionsUrl).then(r => r.json());

const race1Result = results.races.find(r => r.raceNumber === 1);
const race1Prediction = predictions.races.find(r => r.raceNumber === 1);

const winner = race1Result.results[0].number; // 1着馬番
const honmei = race1Prediction.horses.find(h => h.role === '本命');

const isHit = (winner === honmei.number); // 本命的中判定
console.log(`本命的中: ${isHit ? '◎' : '×'}`);
```

---

## 📝 **コミットメッセージ規約** 📝

### **絵文字プレフィックス**

| 絵文字 | 用途 |
|--------|------|
| 🎉 | プロジェクト初期化 |
| ✨ | 新機能追加・データ追加 |
| 📝 | ドキュメント更新 |
| 🔧 | パーサー改善・設定変更 |
| 🐛 | バグ修正 |
| ♻️ | リファクタリング |
| 📊 | データ追加（結果・予想） |

### **コミットメッセージ例**

```bash
✨ 2026-01-23 船橋競馬結果追加

【追加内容】
- nankan/results/2026/01/2026-01-23.json
- 第5R ガーネット２２００
- 1着: 7番 マキシマムパワー
- 馬単: 7-9 (10,160円)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## 🎊 **チェックリスト** 🎊

### **Phase 1: 基盤構築（100%完了 ✅）**
- [x] プロジェクト初期化
- [x] GitHub連携
- [x] README.md作成
- [x] schema.json作成
- [x] ディレクトリ構造作成
- [x] .gitignore設定
- [x] package.json作成

### **Phase 2: パーサー実装（50%完了 🚀）**
- [x] parse-nankan-results.js（南関公式フォーマット対応）
- [ ] parse-nankan-predictions.js（予想データパーサー）
- [ ] parse-jra-results.js（中央競馬対応）
- [ ] parse-jra-predictions.js（中央競馬対応）

### **Phase 3: 公開サイト構築（80%完了 🚀）**
- [x] トップページ（一般ユーザー向け）
- [x] 日付別結果一覧ページ
- [x] 個別レース結果ページ（SEO対応）
- [x] netkeiba風デザイン実装
- [x] モバイル対応
- [ ] 競馬場別結果一覧ページ（オプション）
- [ ] 月別アーカイブページ（オプション）

### **Phase 4: データ蓄積（開始）**
- [ ] 南関競馬結果データ蓄積（2026-01〜）
- [ ] 南関競馬予想データ蓄積
- [ ] 中央競馬データ蓄積

---

## 🎯 **データ利用プロジェクト** 🎯

### **keiba-data-shared-admin（管理画面）**
- results-manager.astroで結果データ入力
- 南関公式コピペ → 自動パース → JSON保存
- このリポジトリにデータ送信

### **keiba-data-shared（このプロジェクト・一般公開サイト）**
- 一般ユーザー向け結果閲覧サイト
- JSONデータ配信API
- SEO対応HTML自動生成
- Netlify経由で公開

### **nankan-analytics（分析プロジェクト）**
- 結果データ取得・分析
- 的中率・回収率計算
- 統計分析・データ可視化

### **nankan-analytics-pro（高度分析プロジェクト）**
- AI予測モデル開発
- 高度な統計分析
- ビジネスインテリジェンス

---

**📅 最終更新日**: 2026-01-26
**🏁 Project Phase**: Phase 3公開サイト構築 🚀（80%完了）
**🎯 Next Priority**: データ蓄積開始 → 競馬場別ページ追加（オプション）
**📊 進捗率**: 75%完了（Phase 1: 100%、Phase 2: 50%、Phase 3: 80%、Phase 4: 0%）

**✨ 最新の成果（2026-01-26）**:
  - 一般ユーザー向けサイトデザイン大幅改善 ✅
  - トップページ全面リニューアル（netkeiba風） ✅
  - 日付別結果一覧ページ作成 ✅
  - 個別レース結果ページデザイン改善 ✅
  - SEO完全対応（検索エンジン対応） ✅
  - モバイルファースト実装 ✅

**🎉 累積成果**:
  - パーサー: 1個実装（parse-nankan-results.js）
  - 公開サイト: トップ・一覧・詳細ページ完備（netkeiba風デザイン）
  - ドキュメント: README.md、schema.json、CLAUDE.md（プロジェクト連携図追加）
  - 標準化フォーマット: 南関・中央対応のJSONスキーマ完成
  - データ配信: GitHub経由でJSON API提供
  - デプロイ: Netlify自動デプロイ設定済み

---

**作成者: Claude Code（クロちゃん）**
**協力者: マコさん**
