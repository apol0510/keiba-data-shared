import rss from '@astrojs/rss';

/**
 * RSS Feed生成（レース毎）
 *
 * dlvr.it連携用RSS：南関競馬・JRA結果を1レース毎に配信
 * URL: https://data.keiba-intelligence.jp/rss.xml
 */
export async function GET(context) {
  // 最新の結果データを取得（直近7日分、レース毎）
  const items = [];

  try {
    // 南関競馬の最新結果（レース毎）
    const nankanResults = await fetchRecentResults('nankan');
    console.log('[RSS] 南関結果取得:', nankanResults.length, '件');
    items.push(...nankanResults);

    // JRA競馬の最新結果（レース毎）
    const jraResults = await fetchRecentResults('jra');
    console.log('[RSS] JRA結果取得:', jraResults.length, '件');
    items.push(...jraResults);

    console.log('[RSS] 合計アイテム数:', items.length);

    // 日付・レース番号順でソート（新しい順、同日内は12R→1R）
    items.sort((a, b) => {
      const dateCompare = new Date(b.pubDate) - new Date(a.pubDate);
      if (dateCompare !== 0) return dateCompare;
      // 同日の場合はレース番号順（降順: 12R→1R）
      return (b._raceNumber || 0) - (a._raceNumber || 0);
    });

    // 最大100件に制限（1日12R×7日=84件程度）
    const recentItems = items.slice(0, 100);

    console.log('[RSS] 制限後アイテム数:', recentItems.length);

    // 各アイテムの検証
    recentItems.forEach((item, index) => {
      console.log(`[RSS] Item ${index}:`, {
        title: item.title ? `"${item.title.substring(0, 30)}..."` : 'EMPTY',
        description: item.description ? `"${item.description.substring(0, 30)}..."` : 'EMPTY',
        link: item.link,
        pubDate: item.pubDate
      });
    });

    // itemsが空の場合、プレースホルダーアイテムを追加
    if (recentItems.length === 0) {
      console.log('[RSS] アイテムが空のためプレースホルダーを追加');
      recentItems.push({
        title: '競馬データ共有 - 最新結果を準備中',
        link: 'https://data.keiba-intelligence.jp/',
        description: '最新の競馬結果データを準備中です。しばらくお待ちください。',
        pubDate: new Date(),
      });
    }

    return rss({
      title: '競馬データ共有 - 南関・JRA結果速報（レース毎）',
      description: '南関競馬・JRA競馬の結果データを1レース毎にリアルタイム配信',
      site: context.site || 'https://data.keiba-intelligence.jp',
      items: recentItems,
      customData: `<language>ja</language>`,
    });
  } catch (error) {
    console.error('RSS生成エラー:', error);
    // エラー時は空のフィードを返す
    return rss({
      title: '競馬データ共有 - 南関・JRA結果速報（レース毎）',
      description: '南関競馬・JRA競馬の結果データを1レース毎にリアルタイム配信',
      site: context.site || 'https://data.keiba-intelligence.jp',
      items: [],
      customData: `<language>ja</language>`,
    });
  }
}

/**
 * 最新結果データを取得（直近7日分、レース毎）
 */
async function fetchRecentResults(category) {
  const items = [];
  const today = new Date();
  const venueEmoji = {
    '大井': '🏇',
    '川崎': '🐴',
    '船橋': '🎠',
    '浦和': '🏆',
    '東京': '🌸',
    '中山': '🌊',
    '京都': '🏯',
    '阪神': '🏯',
    '中京': '🏯',
    '新潟': '🌾',
    '福島': '🍑',
    '小倉': '🏯',
    '札幌': '❄️',
    '函館': '🦑'
  };

  // 直近7日分をチェック
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    try {
      // GitHub raw URLから結果データを取得
      if (category === 'nankan') {
        // 南関は1ファイルにまとまっている
        const url = `https://raw.githubusercontent.com/apol0510/keiba-data-shared/main/nankan/results/${year}/${month}/${dateStr}.json`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          const venue = data.venue || '南関';
          const venueSlug = getVenueSlug(data.venueCode || 'OI');

          // 各レースごとにRSSアイテムを生成
          for (const race of (data.races || [])) {
            const raceNumber = race.raceNumber;
            const raceName = race.raceName || '';
            const winner = race.results?.[0];
            const sanrentan = race.payouts?.sanrentan?.[0];

            // タイトル生成
            let title = `${venueEmoji[venue] || '📊'} ${dateStr.replace(/-/g, '/')} ${venue}競馬 第${raceNumber}R`;
            if (raceName && raceName.length >= 2 && raceName.length <= 40 && !raceName.includes('賞金')) {
              title += ` ${raceName}`;
            }

            // 説明文生成（必ず何か入れる）
            let description = `${venue}競馬 第${raceNumber}R の結果を公開しました。`;
            if (winner && winner.name) {
              description = `1着 ${winner.number}番${winner.name}（${winner.jockey || '騎手不明'}）`;
              if (sanrentan && sanrentan.combination && sanrentan.payout) {
                description += `\n三連単 ${sanrentan.combination} ${sanrentan.payout.toLocaleString()}円`;
              }
              description += `\n\n詳細・払戻金はこちら`;
            }

            // レース終了時刻を推定（発走時刻 + 5分）
            let pubDate = new Date(dateStr + 'T21:00:00+09:00'); // デフォルト
            if (race.startTime) {
              const [hour, minute] = race.startTime.split(':').map(Number);
              pubDate = new Date(dateStr);
              pubDate.setHours(hour, minute + 5, 0, 0); // 発走5分後
            }

            // title と description が必須（空文字を避ける）
            if (title && title.trim().length > 0 && description && description.trim().length > 0) {
              const item = {
                title: title.trim(),
                link: `https://data.keiba-intelligence.jp/nankan/results/${year}/${month}/${day}/${venueSlug}/${raceNumber}/`,
                description: description.trim(),
                pubDate: pubDate,
                categories: ['南関競馬', venue + '競馬', '競馬結果', `第${raceNumber}R`],
              };
              // ソート用のメタデータを別途保持
              item._raceNumber = raceNumber;
              items.push(item);
            }
          }
        }
      } else if (category === 'jra') {
        // JRAは競馬場ごとにファイルが分かれている
        const venues = [
          { name: '東京', code: 'TOK' },
          { name: '中山', code: 'NAK' },
          { name: '京都', code: 'KYO' },
          { name: '阪神', code: 'HAN' },
          { name: '中京', code: 'CHU' },
          { name: '新潟', code: 'NII' },
          { name: '福島', code: 'FKS' },
          { name: '小倉', code: 'KOK' },
          { name: '札幌', code: 'SAP' },
          { name: '函館', code: 'HKD' }
        ];

        for (const { name, code } of venues) {
          const url = `https://raw.githubusercontent.com/apol0510/keiba-data-shared/main/jra/results/${year}/${month}/${dateStr}-${code}.json`;
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            const venueSlug = code.toLowerCase();

            // 各レースごとにRSSアイテムを生成
            for (const race of (data.races || [])) {
              const raceNumber = race.raceNumber;
              const raceName = race.raceName || '';
              const winner = race.results?.[0];
              const sanrentan = race.payouts?.sanrentan?.[0];

              // タイトル生成
              let title = `${venueEmoji[name] || '🏇'} ${dateStr.replace(/-/g, '/')} ${name}競馬 第${raceNumber}R`;
              if (raceName && raceName.length >= 2 && raceName.length <= 40 && !raceName.includes('賞金')) {
                title += ` ${raceName}`;
              }

              // 説明文生成（必ず何か入れる）
              let description = `${name}競馬 第${raceNumber}R の結果を公開しました。`;
              if (winner && winner.name) {
                description = `1着 ${winner.number}番${winner.name}（${winner.jockey || '騎手不明'}）`;
                if (sanrentan && sanrentan.combination && sanrentan.payout) {
                  description += `\n三連単 ${sanrentan.combination} ${sanrentan.payout.toLocaleString()}円`;
                }
                description += `\n\n詳細・払戻金はこちら`;
              }

              // レース終了時刻を推定（発走時刻 + 5分）
              let pubDate = new Date(dateStr + 'T16:00:00+09:00'); // デフォルト
              if (race.startTime) {
                const [hour, minute] = race.startTime.split(':').map(Number);
                pubDate = new Date(dateStr);
                pubDate.setHours(hour, minute + 5, 0, 0); // 発走5分後
              }

              // title と description が必須（空文字を避ける）
              if (title && title.trim().length > 0 && description && description.trim().length > 0) {
                const item = {
                  title: title.trim(),
                  link: `https://data.keiba-intelligence.jp/jra/results/${year}/${month}/${day}/${venueSlug}/${raceNumber}/`,
                  description: description.trim(),
                  pubDate: pubDate,
                  categories: ['JRA', name + '競馬', '競馬結果', `第${raceNumber}R`],
                };
                // ソート用のメタデータを別途保持
                item._raceNumber = raceNumber;
                items.push(item);
              }
            }
          }
        }
      }
    } catch (error) {
      // ファイルが見つからない場合はスキップ
      console.warn(`データ取得失敗: ${category} ${dateStr}`, error.message);
    }
  }

  return items;
}

/**
 * venueCodeからvenueSlugを取得
 */
function getVenueSlug(venueCode) {
  const venueSlugMap = {
    'OI': 'ooi',
    'OOI': 'ooi',
    'KA': 'kawasaki',
    'KAW': 'kawasaki',
    'FU': 'funabashi',
    'FUN': 'funabashi',
    'UR': 'urawa',
    'URA': 'urawa',
    'TOK': 'tokyo',
    'NAK': 'nakayama',
    'KYO': 'kyoto',
    'HAN': 'hanshin',
    'CHU': 'chukyo',
    'NII': 'niigata',
    'FKS': 'fukushima',
    'KOK': 'kokura',
    'SAP': 'sapporo',
    'HKD': 'hakodate'
  };
  return venueSlugMap[venueCode] || venueCode.toLowerCase();
}
