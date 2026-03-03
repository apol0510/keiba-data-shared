#!/usr/bin/env node

/**
 * 的中率・回収率計算スクリプト
 *
 * keiba-intelligenceの予想データとkeiba-data-sharedの結果データを照合して、
 * 的中率・回収率を計算し、stats/nankan-stats.jsonに保存する
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// パス設定
const PREDICTIONS_DIR = '/Users/apolon/Projects/keiba-intelligence/astro-site/.netlify/v1/functions/ssr/src/data/predictions';
const RESULTS_DIR = path.join(__dirname, '../nankan/results');
const OUTPUT_PATH = path.join(__dirname, '../stats/nankan-stats.json');

/**
 * 予想データを取得
 */
function loadPredictions() {
  const predictions = [];

  // 2026-01-23-funabashi.json 形式のファイルを読み込み
  const files = fs.readdirSync(PREDICTIONS_DIR).filter(f => f.endsWith('.json') && !f.includes('jra'));

  for (const file of files) {
    try {
      const filePath = path.join(PREDICTIONS_DIR, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      if (data.predictions && Array.isArray(data.predictions)) {
        predictions.push(...data.predictions);
      }
    } catch (error) {
      console.warn(`⚠️  予想データ読み込みエラー: ${file}`, error.message);
    }
  }

  console.log(`✅ 予想データ読み込み完了: ${predictions.length}レース`);
  return predictions;
}

/**
 * 結果データを取得
 */
function loadResults() {
  const results = [];

  // nankan/results/2026/01/2026-01-23.json 形式のファイルを読み込み
  const yearsDir = RESULTS_DIR;

  if (!fs.existsSync(yearsDir)) {
    console.warn(`⚠️  結果ディレクトリが存在しません: ${yearsDir}`);
    return results;
  }

  const years = fs.readdirSync(yearsDir).filter(d => d.match(/^\d{4}$/));

  for (const year of years) {
    const yearPath = path.join(yearsDir, year);
    const months = fs.readdirSync(yearPath).filter(d => d.match(/^\d{2}$/));

    for (const month of months) {
      const monthPath = path.join(yearPath, month);
      const files = fs.readdirSync(monthPath).filter(f => f.endsWith('.json'));

      for (const file of files) {
        try {
          const filePath = path.join(monthPath, file);
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

          if (data.races && Array.isArray(data.races)) {
            for (const race of data.races) {
              results.push({
                date: data.date,
                venue: data.venue,
                venueCode: data.venueCode,
                ...race
              });
            }
          }
        } catch (error) {
          console.warn(`⚠️  結果データ読み込みエラー: ${file}`, error.message);
        }
      }
    }
  }

  console.log(`✅ 結果データ読み込み完了: ${results.length}レース`);
  return results;
}

/**
 * 予想と結果を照合
 */
function matchPredictionsWithResults(predictions, results) {
  const matched = [];

  for (const prediction of predictions) {
    const { date, venue, raceNumber } = prediction.raceInfo;

    const result = results.find(r =>
      r.date === date &&
      r.venue === venue &&
      r.raceNumber === raceNumber
    );

    if (result) {
      matched.push({ prediction, result });
    }
  }

  console.log(`✅ 照合完了: ${matched.length}レース（予想${predictions.length}、結果${results.length}）`);
  return matched;
}

/**
 * 本命的中判定
 */
function checkHonmeiHit(prediction, result) {
  const honmei = prediction.horses.find(h => h.role === '本命');
  if (!honmei) return { win: false, inMoney: false };

  const winner = result.results.find(r => r.rank === 1);
  const inMoney = result.results.filter(r => r.rank <= 3);

  return {
    win: winner?.number === honmei.horseNumber,
    inMoney: inMoney.some(r => r.number === honmei.horseNumber),
    honmeiNumber: honmei.horseNumber,
    winnerNumber: winner?.number
  };
}

/**
 * 馬単的中判定
 * keiba-intelligenceのimportResults.jsと同じロジック
 * - パターン1: 軸が1着、相手が2着
 * - パターン2: 相手が1着、軸が2着（ボックス的扱い）
 */
function checkUmatanHit(prediction, result) {
  const first = result.results.find(r => r.rank === 1);
  const second = result.results.find(r => r.rank === 2);

  if (!first || !second) return false;

  // 予想の馬単フォーマット: "4-1.11.2.5.7.9(抑え10.8.6)"
  const umatanLines = prediction.bettingLines?.umatan || [];

  for (const line of umatanLines) {
    const match = line.match(/^(\d+)-(.+)$/);
    if (!match) continue;

    const axis = parseInt(match[1]);
    const aitePart = match[2];

    // 本線相手馬を抽出
    const mainPart = aitePart.replace(/\(.+?\)/g, ''); // (抑え...)を削除
    const mainAite = mainPart.split('.').map(n => parseInt(n.trim())).filter(n => !isNaN(n));

    // 抑え馬を抽出
    let osaeAite = [];
    const osaeMatch = aitePart.match(/\(抑え([0-9.]+)\)/);
    if (osaeMatch) {
      osaeAite = osaeMatch[1].split('.').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
    }

    // 全相手馬（本線+抑え）
    const allAite = [...mainAite, ...osaeAite];

    // パターン1: 軸が1着、相手が2着
    if (axis === first.number && allAite.includes(second.number)) {
      return true;
    }

    // パターン2: 相手が1着、軸が2着（ボックス的扱い）
    if (allAite.includes(first.number) && axis === second.number) {
      return true;
    }
  }

  return false;
}

/**
 * 三連複的中判定
 */
function checkSanrenpukuHit(prediction, result) {
  const top3 = result.results.filter(r => r.rank <= 3).map(r => r.number).sort((a, b) => a - b);
  if (top3.length !== 3) return false;

  // 本命・対抗・単穴の組み合わせ
  const honmei = prediction.horses.find(h => h.role === '本命');
  const taikou = prediction.horses.find(h => h.role === '対抗');
  const tanaana = prediction.horses.filter(h => h.role === '単穴');

  if (!honmei || !taikou || tanaana.length === 0) return false;

  // 本命-対抗-単穴のいずれかの組み合わせ
  for (const tana of tanaana) {
    const combo = [honmei.horseNumber, taikou.horseNumber, tana.horseNumber].sort((a, b) => a - b);
    if (JSON.stringify(combo) === JSON.stringify(top3)) {
      return true;
    }
  }

  return false;
}

/**
 * 払戻金取得
 */
function getPayout(result, ticketType, numbers) {
  const payouts = result.payouts?.[ticketType];
  if (!payouts || !Array.isArray(payouts)) return 0;

  // 単勝
  if (ticketType === 'tansho') {
    const match = payouts.find(p => parseInt(p.number) === numbers[0]);
    return match ? match.payout : 0;
  }

  // 馬単
  if (ticketType === 'umatan') {
    const combo = `${numbers[0]}-${numbers[1]}`;
    const match = payouts.find(p => p.combination === combo);
    return match ? match.payout : 0;
  }

  // 三連複
  if (ticketType === 'sanrenpuku') {
    const combo = numbers.sort((a, b) => a - b).join('-');
    const match = payouts.find(p => p.combination === combo);
    return match ? match.payout : 0;
  }

  return 0;
}

/**
 * 統計計算
 */
function calculateStats(matchedData) {
  const stats = {
    generatedAt: new Date().toISOString(),
    totalRaces: matchedData.length,

    // 本命成績
    honmei: {
      totalRaces: 0,
      win: 0,
      inMoney: 0,
      winRate: 0,
      inMoneyRate: 0
    },

    // 券種別成績
    tickets: {
      tansho: { hit: 0, total: 0, rate: 0, totalReturn: 0 },
      umatan: { hit: 0, total: 0, rate: 0, totalReturn: 0 },
      sanrenpuku: { hit: 0, total: 0, rate: 0, totalReturn: 0 }
    },

    // 回収率
    recovery: {
      totalBet: 0,
      totalReturn: 0,
      recoveryRate: 0
    },

    // 競馬場別
    venues: {}
  };

  for (const { prediction, result } of matchedData) {
    const venue = result.venue;

    // 競馬場別初期化
    if (!stats.venues[venue]) {
      stats.venues[venue] = {
        totalRaces: 0,
        honmeiWin: 0,
        winRate: 0,
        umatanHit: 0,
        umatanRate: 0,
        totalReturn: 0,
        totalBet: 0,
        recoveryRate: 0
      };
    }

    stats.venues[venue].totalRaces++;

    // 本命的中判定
    const honmeiResult = checkHonmeiHit(prediction, result);
    if (honmeiResult.honmeiNumber) {
      stats.honmei.totalRaces++;

      if (honmeiResult.win) {
        stats.honmei.win++;
        stats.venues[venue].honmeiWin++;
        stats.tickets.tansho.hit++;

        // 単勝払戻
        const tanshoReturn = getPayout(result, 'tansho', [honmeiResult.honmeiNumber]);
        stats.tickets.tansho.totalReturn += tanshoReturn;
      }

      if (honmeiResult.inMoney) {
        stats.honmei.inMoney++;
      }

      stats.tickets.tansho.total++;
      stats.recovery.totalBet += 100; // 単勝100円
    }

    // 馬単的中判定
    const umatanHit = checkUmatanHit(prediction, result);

    if (umatanHit) {
      stats.tickets.umatan.hit++;
      stats.venues[venue].umatanHit++;

      const first = result.results.find(r => r.rank === 1);
      const second = result.results.find(r => r.rank === 2);
      const umatanReturn = getPayout(result, 'umatan', [first.number, second.number]);
      stats.tickets.umatan.totalReturn += umatanReturn;
    }
    stats.tickets.umatan.total++;
    // keiba-intelligenceと同じロジック: 固定8点/レース
    stats.recovery.totalBet += 800; // 8点 × 100円

    // 三連複的中判定
    const sanrenpukuHit = checkSanrenpukuHit(prediction, result);
    if (sanrenpukuHit) {
      stats.tickets.sanrenpuku.hit++;

      const top3 = result.results.filter(r => r.rank <= 3).map(r => r.number);
      const sanrenpukuReturn = getPayout(result, 'sanrenpuku', top3);
      stats.tickets.sanrenpuku.totalReturn += sanrenpukuReturn;
    }
    stats.tickets.sanrenpuku.total++;
    stats.recovery.totalBet += 100; // 三連複100円
  }

  // 本命勝率計算
  if (stats.honmei.totalRaces > 0) {
    stats.honmei.winRate = Math.round(stats.honmei.win / stats.honmei.totalRaces * 1000) / 10;
    stats.honmei.inMoneyRate = Math.round(stats.honmei.inMoney / stats.honmei.totalRaces * 1000) / 10;
  }

  // 券種別的中率
  for (const [ticketType, data] of Object.entries(stats.tickets)) {
    if (data.total > 0) {
      data.rate = Math.round(data.hit / data.total * 1000) / 10;
    }
  }

  // 回収率計算
  stats.recovery.totalReturn =
    stats.tickets.tansho.totalReturn +
    stats.tickets.umatan.totalReturn +
    stats.tickets.sanrenpuku.totalReturn;

  if (stats.recovery.totalBet > 0) {
    stats.recovery.recoveryRate = Math.round(stats.recovery.totalReturn / stats.recovery.totalBet * 1000) / 10;
  }

  // 競馬場別勝率・回収率（馬単のみ）
  for (const [venue, data] of Object.entries(stats.venues)) {
    if (data.totalRaces > 0) {
      data.winRate = Math.round(data.honmeiWin / data.totalRaces * 1000) / 10;
      data.umatanRate = Math.round(data.umatanHit / data.totalRaces * 1000) / 10;
    }

    // 該当競馬場の馬単投資額・払戻を再計算
    data.totalBet = 0;
    data.totalReturn = 0;
  }

  // 競馬場別の投資額・払戻を再集計
  for (const { prediction, result } of matchedData) {
    const venue = result.venue;
    const umatanHit = checkUmatanHit(prediction, result);

    // keiba-intelligenceと同じロジック: 固定8点/レース
    stats.venues[venue].totalBet += 800;

    if (umatanHit) {
      const first = result.results.find(r => r.rank === 1);
      const second = result.results.find(r => r.rank === 2);
      const umatanReturn = getPayout(result, 'umatan', [first.number, second.number]);
      stats.venues[venue].totalReturn += umatanReturn;
    }
  }

  // 競馬場別回収率を計算
  for (const [venue, data] of Object.entries(stats.venues)) {
    if (data.totalBet > 0) {
      data.recoveryRate = Math.round(data.totalReturn / data.totalBet * 1000) / 10;
    }
  }

  return stats;
}

/**
 * 月別統計を計算
 */
function calculateMonthlyStats(matchedData) {
  const monthlyStats = {};

  for (const { prediction, result } of matchedData) {
    const date = result.date || prediction.raceInfo.date;
    const yearMonth = date.substring(0, 7); // "2026-01"

    if (!monthlyStats[yearMonth]) {
      monthlyStats[yearMonth] = {
        yearMonth,
        totalRaces: 0,
        umatanHit: 0,
        umatanRate: 0,
        totalBet: 0,
        totalReturn: 0,
        recoveryRate: 0
      };
    }

    const month = monthlyStats[yearMonth];
    month.totalRaces++;
    month.totalBet += 800; // 8点/レース

    const umatanHit = checkUmatanHit(prediction, result);
    if (umatanHit) {
      month.umatanHit++;

      const first = result.results.find(r => r.rank === 1);
      const second = result.results.find(r => r.rank === 2);
      const umatanReturn = getPayout(result, 'umatan', [first.number, second.number]);
      month.totalReturn += umatanReturn;
    }
  }

  // 月別の的中率・回収率を計算
  for (const month of Object.values(monthlyStats)) {
    if (month.totalRaces > 0) {
      month.umatanRate = Math.round(month.umatanHit / month.totalRaces * 1000) / 10;
    }
    if (month.totalBet > 0) {
      month.recoveryRate = Math.round(month.totalReturn / month.totalBet * 1000) / 10;
    }
  }

  // 日付順にソート
  return Object.values(monthlyStats).sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
}

/**
 * メイン処理
 */
function main() {
  console.log('📊 的中率・回収率計算開始...\n');

  // 1. データ読み込み
  const predictions = loadPredictions();
  const results = loadResults();

  // 2. 照合
  const matchedData = matchPredictionsWithResults(predictions, results);

  if (matchedData.length === 0) {
    console.error('❌ 照合可能なデータがありません');
    return;
  }

  // 3. 統計計算
  const stats = calculateStats(matchedData);

  // 4. 月別統計計算
  const monthlyStats = calculateMonthlyStats(matchedData);
  stats.monthly = monthlyStats;

  // 5. 保存
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(stats, null, 2), 'utf8');

  console.log(`\n✅ 統計データ保存完了: ${OUTPUT_PATH}`);
  console.log('\n📈 統計サマリー:');
  console.log(`  総レース数: ${stats.totalRaces}R`);
  console.log(`  本命的中率: ${stats.honmei.winRate}%`);
  console.log(`  本命複勝率: ${stats.honmei.inMoneyRate}%`);
  console.log(`  馬単的中率: ${stats.tickets.umatan.rate}%`);
  console.log(`  三連複的中率: ${stats.tickets.sanrenpuku.rate}%`);
  console.log(`  回収率: ${stats.recovery.recoveryRate}%`);
  console.log('\n🏇 競馬場別成績:');
  for (const [venue, data] of Object.entries(stats.venues)) {
    console.log(`  ${venue}: 勝率${data.winRate}% / 回収率${data.recoveryRate}%`);
  }
}

main();
