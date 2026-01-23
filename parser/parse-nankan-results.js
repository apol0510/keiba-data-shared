/**
 * 南関競馬公式フォーマット結果パーサー
 * @module parse-nankan-results
 * @description 南関公式サイトからコピーした結果データを自動解析してJSON化
 */

/**
 * 南関競馬公式フォーマットをパース
 * @param {string} text - 南関公式サイトからコピーしたテキスト
 * @returns {object} 標準化JSONオブジェクト
 */
export function parseNankanResults(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('テキストが空です');
  }

  // 1. 日付・競馬場・レース番号抽出
  const raceInfo = extractRaceInfo(text);

  // 2. 着順データ抽出
  const results = extractResults(text);

  // 3. 払戻金抽出
  const payouts = extractPayouts(text);

  // 4. 標準化JSON生成
  return {
    date: raceInfo.date,
    venue: raceInfo.venue,
    venueCode: raceInfo.venueCode,
    races: [
      {
        raceNumber: raceInfo.raceNumber,
        raceName: raceInfo.raceName,
        distance: raceInfo.distance,
        surface: raceInfo.surface,
        track: raceInfo.track,
        horses: raceInfo.horses,
        startTime: raceInfo.startTime,
        results,
        payouts,
        enteredAt: new Date().toISOString(),
        enteredBy: 'staff-ui'
      }
    ],
    dataVersion: '1.0'
  };
}

/**
 * レース情報抽出
 */
function extractRaceInfo(text) {
  // 日付: 2026年1月23日
  const dateMatch = text.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (!dateMatch) throw new Error('日付が見つかりません');

  const year = dateMatch[1];
  const month = dateMatch[2].padStart(2, '0');
  const day = dateMatch[3].padStart(2, '0');
  const date = `${year}-${month}-${day}`;

  // 競馬場: 船橋競馬、大井競馬、川崎競馬、浦和競馬
  const venueMatch = text.match(/(船橋|大井|川崎|浦和)競馬/);
  if (!venueMatch) throw new Error('競馬場が見つかりません');

  const venue = venueMatch[1];
  const venueCodeMap = { '船橋': 'FU', '大井': 'OI', '川崎': 'KA', '浦和': 'UR' };
  const venueCode = venueCodeMap[venue];

  // レース番号: 第5日 → raceNumber: 5
  const raceNumberMatch = text.match(/第(\d+)日/);
  const raceNumber = raceNumberMatch ? parseInt(raceNumberMatch[1], 10) : 1;

  // レース名: ガーネット２２００
  const raceNameMatch = text.match(/日\s+(.+?)\s+Ｂ|日\s+(.+?)$/m);
  const raceName = raceNameMatch ? (raceNameMatch[1] || raceNameMatch[2] || '').trim() : '';

  // 距離: ダ2,200m
  const distanceMatch = text.match(/ダ|芝[\s\u3000]*(\d{1}),?(\d{3})m/);
  const distance = distanceMatch ? parseInt(distanceMatch[1] + distanceMatch[2], 10) : null;

  // 馬場: ダート or 芝
  const surface = text.includes('ダ') ? 'ダート' : '芝';

  // コース: （外）（内）
  const trackMatch = text.match(/（(外|内|右|左)）/);
  const track = trackMatch ? trackMatch[1] : null;

  // 頭数: （14頭）
  const horsesMatch = text.match(/（(\d+)頭）/);
  const horses = horsesMatch ? parseInt(horsesMatch[1], 10) : null;

  // 発走時刻: 発走時刻20:50
  const startTimeMatch = text.match(/発走時刻(\d{1,2}):(\d{2})/);
  const startTime = startTimeMatch ? `${startTimeMatch[1]}:${startTimeMatch[2]}` : null;

  return {
    date,
    venue,
    venueCode,
    raceNumber,
    raceName,
    distance,
    surface,
    track,
    horses,
    startTime
  };
}

/**
 * 着順データ抽出
 */
function extractResults(text) {
  const results = [];
  const lines = text.split('\n');

  for (let line of lines) {
    // 着順行パターン: "1    5    7    マキシマムパワー    牡4    55.0    500kg    -1    町田直希    林正人    2:28.0    -    39.3    -    1"
    const match = line.match(/^(\d+)\s+(\d+)\s+(\d+)\s+(.+?)\s+[牡牝セ]\d+\s+[\d.]+\s+\d+kg\s+[+-±]?\d*\s+(.+?)\s+(.+?)\s+([\d:.]+)\s+(.*?)\s+([\d.]+)\s+-\s+(\d+)\s*$/);

    if (match) {
      const rank = parseInt(match[1], 10);
      const bracket = parseInt(match[2], 10);
      const number = parseInt(match[3], 10);
      const name = match[4].trim();
      const jockey = match[5].trim();
      const trainer = match[6].trim();
      const time = match[7].trim();
      const margin = match[8].trim() || '-';
      const lastFurlong = match[9].trim();
      const popularity = parseInt(match[10], 10);

      results.push({
        rank,
        bracket,
        number,
        name,
        jockey,
        trainer,
        time,
        margin,
        lastFurlong,
        popularity
      });
    }
  }

  if (results.length === 0) {
    throw new Error('着順データが見つかりません');
  }

  return results;
}

/**
 * 払戻金抽出
 */
function extractPayouts(text) {
  const payouts = {};

  // 単勝: 7    290    1
  const tanshoMatch = text.match(/単勝[\s\S]*?(\d+)\s+(\d{1,3}(?:,\d{3})*)\s+(\d+)/);
  if (tanshoMatch) {
    payouts.tansho = {
      number: parseInt(tanshoMatch[1], 10),
      payout: parseInt(tanshoMatch[2].replace(/,/g, ''), 10),
      popularity: parseInt(tanshoMatch[3], 10)
    };
  }

  // 複勝: 7    170    1 / 9    1,080    11 / 11    390    7
  const fukushoMatches = [...text.matchAll(/複勝[\s\S]*?(\d+)\s+(\d{1,3}(?:,\d{3})*)\s+(\d+)/g)];
  if (fukushoMatches.length > 0) {
    payouts.fukusho = fukushoMatches.slice(0, 3).map(m => ({
      number: parseInt(m[1], 10),
      payout: parseInt(m[2].replace(/,/g, ''), 10),
      popularity: parseInt(m[3], 10)
    }));
  }

  // 馬単: 7-9    10,160    40
  const umatanMatch = text.match(/馬単[\s\S]*?([\d-]+)\s+(\d{1,3}(?:,\d{3})*)\s+(\d+)/);
  if (umatanMatch) {
    payouts.umatan = {
      combination: umatanMatch[1],
      payout: parseInt(umatanMatch[2].replace(/,/g, ''), 10),
      popularity: parseInt(umatanMatch[3], 10)
    };
  }

  // 馬複: 7-9    7,530    30
  const umarenMatch = text.match(/普通馬複[\s\S]*?([\d-]+)\s+(\d{1,3}(?:,\d{3})*)\s+(\d+)/);
  if (umarenMatch) {
    payouts.umaren = {
      combination: umarenMatch[1],
      payout: parseInt(umarenMatch[2].replace(/,/g, ''), 10),
      popularity: parseInt(umarenMatch[3], 10)
    };
  }

  // ワイド: 7-9    2,500    34 / 7-11    700    7 / 9-11    5,130    49
  const wideMatches = [...text.matchAll(/ワイド[\s\S]*?([\d-]+)\s+(\d{1,3}(?:,\d{3})*)\s+(\d+)/g)];
  if (wideMatches.length > 0) {
    payouts.wide = wideMatches.slice(0, 3).map(m => ({
      combination: m[1],
      payout: parseInt(m[2].replace(/,/g, ''), 10),
      popularity: parseInt(m[3], 10)
    }));
  }

  // 三連複: 7-9-11    18,040    72
  const sanrenpukuMatch = text.match(/三連複[\s\S]*?([\d-]+)\s+(\d{1,3}(?:,\d{3})*)\s+(\d+)/);
  if (sanrenpukuMatch) {
    payouts.sanrenpuku = {
      combination: sanrenpukuMatch[1],
      payout: parseInt(sanrenpukuMatch[2].replace(/,/g, ''), 10),
      popularity: parseInt(sanrenpukuMatch[3], 10)
    };
  }

  // 三連単: 7-9-11    72,850    278
  const sanrentanMatch = text.match(/三連単[\s\S]*?([\d-]+)\s+(\d{1,3}(?:,\d{3})*)\s+(\d+)/);
  if (sanrentanMatch) {
    payouts.sanrentan = {
      combination: sanrentanMatch[1],
      payout: parseInt(sanrentanMatch[2].replace(/,/g, ''), 10),
      popularity: parseInt(sanrentanMatch[3], 10)
    };
  }

  return payouts;
}

/**
 * 使用例
 */
/*
const text = `
2026年1月23日 第10回 船橋競馬 第5日 ダ2,200m（外） （14頭） 発走時刻20:50
ガーネット２２００ Ｂ２Ｂ３ 選抜馬
着    枠    馬番    馬名    性齢    負担    馬体重    増減    騎手    調教師    タイム    着差    上がり3F    コーナー通過順    人気
1    5    7    マキシマムパワー    牡4    55.0    500kg    -1    町田直希    林正人    2:28.0    -    39.3    -    1
...
単勝
組番    金額    人気
7    290    1
馬単
組番    金額    人気
7-9    10,160    40
三連複
組番    金額    人気
7-9-11    18,040    72
三連単
組番    金額    人気
7-9-11    72,850    278
`;

const result = parseNankanResults(text);
console.log(JSON.stringify(result, null, 2));
*/
