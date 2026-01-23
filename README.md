# keiba-data-shared

**競馬データ共有リポジトリ**

南関競馬・中央競馬（JRA）の予想・結果データを一元管理し、全プロジェクトで共有するための標準化データリポジトリです。

---

## 📊 **プロジェクト概要**

| 項目 | 内容 |
|------|------|
| **目的** | 競馬データの一元管理・全プロジェクト共有 |
| **対応競馬** | 南関競馬（地方）、中央競馬（JRA）、その他地方競馬 |
| **データ種別** | 予想データ（predictions）、結果データ（results） |
| **利用プロジェクト** | keiba-intelligence, nankan-analytics, nankan-analytics-pro 等 |
| **更新方法** | 管理画面（results-manager）から自動Push |
| **公開設定** | Public（他開発者も利用可能） |

---

## 🏗️ **ディレクトリ構造**

```
keiba-data-shared/
├── README.md                      # このファイル
├── schema.json                    # 統一フォーマット定義
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

## 📝 **データフォーマット**

### **結果データ（results）**

**ファイル名**: `nankan/results/YYYY/MM/YYYY-MM-DD.json`

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

**ファイル名**: `nankan/predictions/YYYY/MM/YYYY-MM-DD.json`

```json
{
  "date": "2026-01-23",
  "venue": "大井",
  "venueCode": "OI",
  "races": [
    {
      "raceNumber": 1,
      "raceName": "３歳(六)ダ1,300m",
      "horses": [
        {
          "number": 5,
          "name": "マコスペシャル",
          "pt": 90.5,
          "role": "本命",
          "mark": "◎"
        },
        {
          "number": 3,
          "name": "クロチャンプ",
          "pt": 86.2,
          "role": "対抗",
          "mark": "○"
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

## 🚀 **使い方**

### **1. 結果データ取得（全プロジェクト共通）**

```javascript
// JavaScript（Astro/Node.js等）
const url = 'https://raw.githubusercontent.com/apol0510/keiba-data-shared/main/nankan/results/2026/01/2026-01-23.json';
const data = await fetch(url).then(r => r.json());

console.log(data.races[0].results[0]); // 1着馬データ
console.log(data.races[0].payouts.umatan); // 馬単配当
```

### **2. 予想データ取得**

```javascript
const url = 'https://raw.githubusercontent.com/apol0510/keiba-data-shared/main/nankan/predictions/2026/01/2026-01-23.json';
const predictions = await fetch(url).then(r => r.json());

console.log(predictions.races[0].horses); // 予想馬データ
```

### **3. 的中判定（結果と予想の照合）**

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

## 🔧 **データ更新方法**

### **結果データの追加**

1. **管理画面から入力**:
   - keiba-intelligence/astro-site/src/pages/admin/results-manager.astro
   - 南関公式サイトからコピペ
   - 自動パース → プレビュー確認
   - 「保存してGit Push」ボタンでリポジトリに自動追加

2. **手動追加**:
   ```bash
   cd /Users/apolon/Projects/keiba-data-shared
   # JSONファイルを作成
   git add .
   git commit -m "✨ 2026-01-23 船橋競馬結果追加"
   git push origin main
   ```

---

## 📋 **データバージョン履歴**

| バージョン | 日付 | 変更内容 |
|-----------|------|----------|
| 1.0 | 2026-01-23 | 初回リリース（南関競馬のみ） |

---

## 🎯 **将来の拡張予定**

- [ ] 中央競馬（JRA）データ追加
- [ ] その他地方競馬データ追加
- [ ] REST API化（Netlify Functions経由）
- [ ] GraphQL対応
- [ ] データ分析ツール追加

---

## 📄 **ライセンス**

MIT License

---

**作成者**: apol0510
**作成日**: 2026-01-23
**最終更新**: 2026-01-23
