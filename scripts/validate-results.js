#!/usr/bin/env node
/**
 * 結果データJSONファイルのバリデーター
 *
 * 【目的】
 * - データフォーマットの一貫性を保証
 * - 管理画面から保存されたデータの検証
 * - CI/CDでの自動チェック
 *
 * 【使い方】
 * node scripts/validate-results.js
 * または
 * npm run validate
 */

import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

// 必須フィールド定義
const REQUIRED_TOP_LEVEL_FIELDS = ['date', 'venue', 'races'];
const REQUIRED_VENUE_CODES = ['OI', 'KA', 'FU', 'UR'];
const VALID_VENUES = ['大井', '川崎', '船橋', '浦和'];

// 禁止フィールド（古いフォーマット）
const FORBIDDEN_FIELDS = ['raceDate', 'track', 'totalRaces', 'lastUpdated'];

let totalFiles = 0;
let validFiles = 0;
let invalidFiles = 0;
const errors = [];

/**
 * 単一JSONファイルをバリデート
 */
function validateFile(filePath, fileName) {
  totalFiles++;

  try {
    const content = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);

    const fileErrors = [];

    // 1. 必須フィールドチェック
    for (const field of REQUIRED_TOP_LEVEL_FIELDS) {
      if (!data[field]) {
        fileErrors.push(`❌ 必須フィールド "${field}" が存在しません`);
      }
    }

    // 2. 禁止フィールドチェック
    for (const field of FORBIDDEN_FIELDS) {
      if (data[field] !== undefined) {
        fileErrors.push(`⚠️  禁止フィールド "${field}" が存在します（削除してください）`);
      }
    }

    // 3. フィールド型チェック
    if (data.date && typeof data.date !== 'string') {
      fileErrors.push('❌ "date" は文字列である必要があります');
    }

    if (data.venue && !VALID_VENUES.includes(data.venue)) {
      fileErrors.push(`❌ "venue" は ${VALID_VENUES.join(', ')} のいずれかである必要があります`);
    }

    if (data.venueCode && !REQUIRED_VENUE_CODES.includes(data.venueCode)) {
      fileErrors.push(`⚠️  "venueCode" は ${REQUIRED_VENUE_CODES.join(', ')} のいずれかが推奨されます`);
    }

    if (!Array.isArray(data.races)) {
      fileErrors.push('❌ "races" は配列である必要があります');
    }

    // 4. 日付フォーマットチェック
    if (data.date && !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
      fileErrors.push('❌ "date" は YYYY-MM-DD 形式である必要があります');
    }

    // 5. ファイル名と日付の一致チェック
    const expectedDate = fileName.replace('.json', '');
    if (data.date && data.date !== expectedDate) {
      fileErrors.push(`⚠️  日付 "${data.date}" がファイル名 "${fileName}" と一致しません`);
    }

    // エラーがあれば記録
    if (fileErrors.length > 0) {
      invalidFiles++;
      errors.push({
        file: filePath,
        errors: fileErrors
      });
    } else {
      validFiles++;
      console.log(`✅ ${filePath}`);
    }

  } catch (error) {
    invalidFiles++;
    errors.push({
      file: filePath,
      errors: [`❌ ファイルの読み込みまたはJSON解析に失敗: ${error.message}`]
    });
  }
}

/**
 * ディレクトリを再帰的にスキャン
 */
function scanDirectory(baseDir) {
  console.log(`\n📂 スキャン開始: ${baseDir}\n`);

  const years = readdirSync(baseDir).filter(name => /^\d{4}$/.test(name));

  for (const year of years) {
    const yearDir = join(baseDir, year);
    const months = readdirSync(yearDir).filter(name => /^\d{2}$/.test(name));

    for (const month of months) {
      const monthDir = join(yearDir, month);
      const files = readdirSync(monthDir)
        .filter(name => /^\d{4}-\d{2}-\d{2}\.json$/.test(name));

      for (const file of files) {
        const filePath = join(monthDir, file);
        validateFile(filePath, file);
      }
    }
  }
}

// メイン実行
console.log('🔍 南関競馬結果データ バリデーター\n');
console.log('=' .repeat(60));

const resultsDir = join(process.cwd(), 'nankan', 'results');

try {
  scanDirectory(resultsDir);

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 バリデーション結果:');
  console.log(`  - 総ファイル数: ${totalFiles}`);
  console.log(`  - ✅ 正常: ${validFiles}`);
  console.log(`  - ❌ エラー: ${invalidFiles}`);

  if (errors.length > 0) {
    console.log('\n❌ エラー詳細:\n');
    for (const error of errors) {
      console.log(`📄 ${error.file}`);
      for (const msg of error.errors) {
        console.log(`   ${msg}`);
      }
      console.log('');
    }

    console.log('💡 修正方法:');
    console.log('  1. 必須フィールド: date, venue, races を追加');
    console.log('  2. 禁止フィールド: raceDate, track, totalRaces, lastUpdated を削除');
    console.log('  3. venueCode を追加（OI, KA, FU, UR のいずれか）');
    console.log('');

    process.exit(1);
  } else {
    console.log('\n🎉 全てのファイルが正常です！');
    process.exit(0);
  }

} catch (error) {
  console.error('❌ バリデーション中にエラーが発生しました:', error);
  process.exit(1);
}
