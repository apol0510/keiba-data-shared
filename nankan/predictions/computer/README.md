# 南関競馬 コンピ指数データ

コンピ指数のデータを格納するディレクトリです。

## ディレクトリ構造

```
computer/
└── YYYY/
    └── MM/
        ├── YYYY-MM-DD-OOI.json  (大井)
        ├── YYYY-MM-DD-KAW.json  (川崎)
        ├── YYYY-MM-DD-FUN.json  (船橋)
        └── YYYY-MM-DD-URA.json  (浦和)
```

**複数会場対応**: 同日に複数会場がある場合、3文字の会場コード付きで保存されます。

## データ形式

```json
{
  "date": "2026-02-15",
  "venue": "大井",
  "venueCode": "OI",
  "category": "nankan",
  "dataSource": "computer-index",
  "races": [
    {
      "raceNumber": 1,
      "raceName": "Ｃ３",
      "distance": 1200,
      "surface": "ダート",
      "track": "右",
      "startTime": "10:55",
      "horses": [
        {
          "number": 3,
          "name": "ローゼンナイツ",
          "computerIndex": 88,
          "popularity": 1,
          "jockey": "町田直希",
          "trainer": "(大)林正人",
          "weight": 55.0,
          "ageGender": "牡4",
          "enrichedFrom": "predictions"
        }
      ]
    }
  ],
  "dataVersion": "1.0",
  "enrichedAt": "2026-02-15T12:00:00Z",
  "createdAt": "2026-02-15T11:30:00Z"
}
```

## フィールド説明

### 馬データ
- `computerIndex`: コンピ指数
- `popularity`: 人気順位
- `jockey`: 騎手名（予想データから自動補完）
- `trainer`: 調教師名（予想データから自動補完）
- `weight`: 斤量（予想データから自動補完）
- `ageGender`: 馬齢・性別（予想データから自動補完）
- `enrichedFrom`: 補完元データソース

## データ入力

keiba-data-shared-admin の管理画面から入力してください。

https://keiba-data-shared-admin.netlify.app/admin/computer-manager
