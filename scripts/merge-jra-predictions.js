#!/usr/bin/env node

/**
 * merge-jra-predictions.js
 *
 * 複数会場のJRA予想データを1つのファイルに統合
 *
 * 使い方:
 *   node scripts/merge-jra-predictions.js 2026-02-08
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

function mergeJraPredictions(date) {
  const [year, month] = date.split('-');
  const dirPath = join(projectRoot, 'jra', 'predictions', year, month);

  if (!existsSync(dirPath)) {
    console.error(`❌ ディレクトリが見つかりません: ${dirPath}`);
    process.exit(1);
  }

  // 指定日付の会場別ファイルのみを取得（統合ファイルを除外）
  const files = readdirSync(dirPath)
    .filter(f => {
      // YYYY-MM-DD-{VENUE}.json のパターンにマッチ
      const pattern = new RegExp(`^${date}-[A-Z]{3}\\.json$`);
      return pattern.test(f);
    })
    .sort();

  if (files.length === 0) {
    console.error(`❌ ${date}の会場別予想データが見つかりません`);
    process.exit(1);
  }

  console.log(`📋 ${date}の予想データ: ${files.length}会場`);

  const venues = [];
  let lastUpdated = null;

  for (const file of files) {
    const filePath = join(dirPath, file);
    const data = JSON.parse(readFileSync(filePath, 'utf-8'));

    const venueName = data.track || file.replace(`${date}-`, '').replace('.json', '');

    console.log(`   - ${venueName}: ${data.totalRaces || data.races.length}レース`);

    venues.push({
      venue: venueName,
      totalRaces: data.totalRaces || data.races.length,
      races: data.races
    });

    // 最新の更新日時を保持
    if (!lastUpdated || new Date(data.lastUpdated) > new Date(lastUpdated)) {
      lastUpdated = data.lastUpdated;
    }
  }

  // 統合データ作成
  const merged = {
    date: date,
    lastUpdated: lastUpdated || new Date().toISOString(),
    totalVenues: venues.length,
    totalRaces: venues.reduce((sum, v) => sum + v.totalRaces, 0),
    venues: venues
  };

  // 保存先: jra/predictions/YYYY/MM/YYYY-MM-DD.json
  const outputPath = join(dirPath, `${date}.json`);
  writeFileSync(outputPath, JSON.stringify(merged, null, 2), 'utf-8');

  console.log(`\n✅ 統合完了: ${outputPath}`);
  console.log(`   会場数: ${merged.totalVenues}`);
  console.log(`   総レース数: ${merged.totalRaces}`);

  return outputPath;
}

// メイン処理
const date = process.argv[2];
if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
  console.error('使い方: node scripts/merge-jra-predictions.js YYYY-MM-DD');
  process.exit(1);
}

mergeJraPredictions(date);
