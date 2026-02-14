#!/usr/bin/env node

/**
 * merge-jra-results.js
 *
 * 複数会場のJRA結果データを1つのファイルに統合
 *
 * 使い方:
 *   node scripts/merge-jra-results.js 2026-02-14
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

function mergeJraResults(date) {
  const [year, month] = date.split('-');
  const dirPath = join(projectRoot, 'jra', 'results', year, month);

  if (!existsSync(dirPath)) {
    console.error(`❌ ディレクトリが見つかりません: ${dirPath}`);
    process.exit(1);
  }

  // 指定日付の全会場ファイルを取得（会場コード付きファイルのみ）
  const files = readdirSync(dirPath)
    .filter(f => f.startsWith(date) && f.match(/-[A-Z]{3}\.json$/))
    .sort();

  if (files.length === 0) {
    console.error(`❌ ${date}の結果データが見つかりません`);
    process.exit(1);
  }

  console.log(`📋 ${date}の結果データ: ${files.length}会場`);

  const allRaces = [];
  let totalRaces = 0;

  for (const file of files) {
    const filePath = join(dirPath, file);
    const data = JSON.parse(readFileSync(filePath, 'utf-8'));

    const venueCode = file.replace(`${date}-`, '').replace('.json', '');
    const venueName = data.venue || venueCode;

    console.log(`   - ${venueName}: ${data.races.length}レース`);

    // 各レースに会場情報を追加
    for (const race of data.races) {
      allRaces.push({
        ...race,
        venue: venueName
      });
    }

    totalRaces += data.races.length;
  }

  // レース番号でソート
  allRaces.sort((a, b) => {
    const venueOrder = ['京都', '小倉', '東京', 'KYO', 'KOK', 'TOK'];
    const venueA = venueOrder.indexOf(a.venue);
    const venueB = venueOrder.indexOf(b.venue);

    if (venueA !== venueB) {
      return venueA - venueB;
    }

    return (a.raceNumber || 0) - (b.raceNumber || 0);
  });

  // 統合データ作成
  const merged = {
    date: date,
    venue: 'JRA統合',
    totalRaces: totalRaces,
    races: allRaces
  };

  // 保存先: jra/results/YYYY/MM/YYYY-MM-DD.json
  const outputPath = join(dirPath, `${date}.json`);
  writeFileSync(outputPath, JSON.stringify(merged, null, 2), 'utf-8');

  console.log(`\n✅ 統合完了: ${outputPath}`);
  console.log(`   総レース数: ${merged.totalRaces}`);

  return outputPath;
}

// メイン処理
const date = process.argv[2];
if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
  console.error('使い方: node scripts/merge-jra-results.js YYYY-MM-DD');
  process.exit(1);
}

mergeJraResults(date);
