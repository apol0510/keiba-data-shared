# 地方競馬 コンピ指数データ

日刊コンピ指数のデータを格納するディレクトリです。

## 対応競馬場

- 門別
- 盛岡
- 水沢
- 金沢
- 笠松
- 名古屋
- 園田
- 姫路
- 高知
- 佐賀
- その他地方競馬場

## ディレクトリ構造

```
computer/
└── YYYY/
    └── MM/
        └── YYYY-MM-DD.json
```

## データ形式

地方競馬は競馬ブックデータがないため、補完なしで保存されます。

```json
{
  "date": "2026-02-15",
  "venue": "園田",
  "venueCode": "SO",
  "category": "local",
  "dataSource": "nikkan-computer",
  "races": [
    {
      "raceNumber": 1,
      "distance": 1400,
      "surface": "ダート",
      "horses": [
        {
          "number": 1,
          "name": "サンプルホース",
          "computerIndex": 85,
          "popularity": 2
        }
      ]
    }
  ],
  "dataVersion": "1.0",
  "createdAt": "2026-02-15T11:30:00Z"
}
```

## 注意事項

地方競馬は競馬ブックデータによる自動補完は行われません。
コンピ指数と人気のみが保存されます。

## データ入力

keiba-data-shared-admin の管理画面から入力してください。

https://keiba-data-shared-admin.netlify.app/admin/computer-manager
