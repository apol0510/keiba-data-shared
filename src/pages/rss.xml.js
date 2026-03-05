import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

/**
 * RSS Feed生成
 *
 * dlvr.it連携用RSS：南関競馬・JRA結果を配信
 * URL: https://data.keiba-intelligence.jp/rss.xml
 */
export async function GET(context) {
  // 最新の結果データを取得（GitHub API経由）
  const items = [];

  try {
    // 南関競馬の最新結果（直近7日分）
    const nankanResults = await fetchRecentResults('nankan');
    items.push(...nankanResults);

    // JRA競馬の最新結果（直近7日分）
    const jraResults = await fetchRecentResults('jra');
    items.push(...jraResults);

    // 日付順でソート（新しい順）
    items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    // 最大50件に制限
    const recentItems = items.slice(0, 50);

    return rss({
      title: '競馬データ共有 - 南関・JRA結果速報',
      description: '南関競馬・JRA競馬の結果データをリアルタイム配信',
      site: context.site || 'https://data.keiba-intelligence.jp',
      items: recentItems,
      customData: `<language>ja</language>`,
    });
  } catch (error) {
    console.error('RSS生成エラー:', error);
    // エラー時は空のフィードを返す
    return rss({
      title: '競馬データ共有 - 南関・JRA結果速報',
      description: '南関競馬・JRA競馬の結果データをリアルタイム配信',
      site: context.site || 'https://data.keiba-intelligence.jp',
      items: [],
      customData: `<language>ja</language>`,
    });
  }
}

/**
 * 最新結果データを取得（直近7日分）
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

          items.push({
            title: `${venueEmoji[venue] || '📊'} ${dateStr.replace(/-/g, '/')} ${venue}競馬の結果`,
            link: `https://data.keiba-intelligence.jp/nankan/results/${year}/${month}/${day}/${venueSlug}/`,
            description: `${venue}競馬 全${data.races?.length || 0}レースの結果を公開しました。着順・払戻金・コーナー通過順を掲載。`,
            pubDate: new Date(dateStr + 'T21:00:00+09:00'),
            categories: ['南関競馬', venue + '競馬', '競馬結果'],
          });
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

            items.push({
              title: `${venueEmoji[name] || '🏇'} ${dateStr.replace(/-/g, '/')} ${name}競馬の結果`,
              link: `https://data.keiba-intelligence.jp/jra/results/${year}/${month}/${day}/${venueSlug}/`,
              description: `${name}競馬 全${data.races?.length || 0}レースの結果を公開しました。着順・払戻金・コーナー通過順を掲載。`,
              pubDate: new Date(dateStr + 'T16:00:00+09:00'),
              categories: ['JRA', name + '競馬', '競馬結果'],
            });
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
