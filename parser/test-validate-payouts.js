#!/usr/bin/env node
/**
 * validate-payouts.js のテストスクリプト
 */

import { validatePayouts } from './validate-payouts.js';

console.log('🧪 配当バリデーションテスト開始\n');

// テストケース1: 正常な配当データ
console.log('テスト1: 正常な配当データ');
const validPayouts = {
  tansho: { number: 7, payout: 290, popularity: 1 },
  umatan: { combination: '7-9', payout: 10160, popularity: 40 },
  wide: [
    { combination: '6-7', payout: 310, popularity: 4 },
    { combination: '6-9', payout: 450, popularity: 5 }
  ]
};
const result1 = validatePayouts(validPayouts);
console.log('入力:', JSON.stringify(validPayouts, null, 2));
console.log('出力:', JSON.stringify(result1, null, 2));
console.log('✅ テスト1完了\n');

// テストケース2: null を含む配当データ
console.log('テスト2: null を含む配当データ');
const invalidPayouts = {
  tansho: { number: 7, payout: 290, popularity: 1 },
  wide: [
    { combination: '6-7', payout: 310, popularity: 4 },
    { combination: '9R', payout: 2026, popularity: null },  // 不正
    { combination: '6-9', payout: 450, popularity: 5 }
  ],
  sanrenpuku: [
    { combination: '6-7-9', payout: 2200, popularity: 10 },
    { combination: '船橋競馬', payout: null, popularity: null }  // 不正
  ]
};
const result2 = validatePayouts(invalidPayouts);
console.log('入力:', JSON.stringify(invalidPayouts, null, 2));
console.log('出力:', JSON.stringify(result2, null, 2));
console.log('✅ テスト2完了\n');

// テストケース3: 全て不正な配当データ
console.log('テスト3: 全て不正な配当データ');
const allInvalidPayouts = {
  tansho: { number: 'ABC', payout: null, popularity: null },
  wide: [
    { combination: 'invalid', payout: null, popularity: null }
  ]
};
const result3 = validatePayouts(allInvalidPayouts);
console.log('入力:', JSON.stringify(allInvalidPayouts, null, 2));
console.log('出力:', JSON.stringify(result3, null, 2));
console.log('✅ テスト3完了\n');

console.log('🎉 全テスト完了');
