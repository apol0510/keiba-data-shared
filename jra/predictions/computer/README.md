# 中央競馬（JRA） コンピ指数データ

日刊コンピ指数のデータを格納するディレクトリです。

## ディレクトリ構造

```
computer/
└── YYYY/
    └── MM/
        └── YYYY-MM-DD.json
```

## データ形式

競馬ブックデータから騎手・調教師・斤量等の情報を自動補完します。

```json
{
  "date": "2026-02-15",
  "venue": "東京",
  "venueCode": "TO",
  "category": "jra",
  "dataSource": "nikkan-computer",
  "races": [
    {
      "raceNumber": 1,
      "raceName": "３歳未勝利",
      "distance": 1600,
      "surface": "芝",
      "track": "左",
      "startTime": "10:10",
      "horses": [
        {
          "number": 1,
          "name": "サンプルホース",
          "computerIndex": 95,
          "popularity": 1,
          "jockey": "C.ルメール",
          "trainer": "(美)藤沢和雄",
          "weight": 56.0,
          "ageGender": "牡3",
          "enrichedFrom": "keiba-book"
        }
      ]
    }
  ],
  "dataVersion": "1.0",
  "enrichedAt": "2026-02-15T12:00:00Z",
  "createdAt": "2026-02-15T11:30:00Z"
}
```

## データ入力

keiba-data-shared-admin の管理画面から入力してください。

https://keiba-data-shared-admin.netlify.app/admin/computer-manager
