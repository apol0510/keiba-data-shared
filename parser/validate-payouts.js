/**
 * 配当データバリデーションモジュール
 * @module validate-payouts
 * @description payout/popularity が null のエントリを除外（再発防止）
 */

/**
 * 配当データのバリデーション
 * payout === null または popularity === null のエントリを除外
 * @param {object} payouts - 払戻金オブジェクト
 * @param {object} options - オプション設定
 * @param {boolean} options.verbose - 詳細ログ出力（デフォルト: true）
 * @returns {object} バリデーション済み払戻金オブジェクト
 */
export function validatePayouts(payouts, options = { verbose: true }) {
  if (!payouts || typeof payouts !== 'object') {
    return {};
  }

  const validated = {};
  let totalRemoved = 0;

  for (const [key, value] of Object.entries(payouts)) {
    if (Array.isArray(value)) {
      // 配列型（fukusho, wide, tansho[] など）
      const filteredArray = value.filter(entry => {
        const isValid = isValidPayoutEntry(entry);
        if (!isValid) {
          totalRemoved++;
          if (options.verbose) {
            console.warn(`[配当バリデーション] ${key}から不正エントリを除外:`, entry);
          }
        }
        return isValid;
      });

      if (filteredArray.length > 0) {
        validated[key] = filteredArray;
      }
    } else if (value && typeof value === 'object') {
      // オブジェクト型（umatan, sanrentan など）
      const isValid = isValidPayoutEntry(value);
      if (isValid) {
        validated[key] = value;
      } else {
        totalRemoved++;
        if (options.verbose) {
          console.warn(`[配当バリデーション] ${key}から不正エントリを除外:`, value);
        }
      }
    }
  }

  if (totalRemoved > 0 && options.verbose) {
    console.warn(`[配当バリデーション] 合計 ${totalRemoved} 件の不正エントリを除外しました`);
  }

  return validated;
}

/**
 * 配当エントリの妥当性チェック
 * @param {object} entry - 配当エントリ
 * @returns {boolean} 妥当性（true: 有効, false: 無効）
 */
function isValidPayoutEntry(entry) {
  if (!entry || typeof entry !== 'object') {
    return false;
  }

  // payout が null または undefined
  if (entry.payout === null || entry.payout === undefined) {
    return false;
  }

  // popularity が null または undefined
  if (entry.popularity === null || entry.popularity === undefined) {
    return false;
  }

  // combination が不正（数字とハイフン以外を含む）
  if (entry.combination && typeof entry.combination === 'string') {
    // 正規表現: 数字とハイフン以外が含まれている場合は不正
    if (!/^[\d-]+$/.test(entry.combination)) {
      return false;
    }
  }

  // number が不正（数字以外）
  if (entry.number && typeof entry.number === 'string') {
    if (!/^\d+$/.test(entry.number)) {
      return false;
    }
  }

  return true;
}

/**
 * レースデータ全体の配当をバリデーション
 * @param {object} raceData - レースデータオブジェクト
 * @param {object} options - オプション設定
 * @returns {object} バリデーション済みレースデータ
 */
export function validateRacePayouts(raceData, options = { verbose: true }) {
  if (!raceData || !raceData.races) {
    return raceData;
  }

  const validatedRaces = raceData.races.map(race => {
    if (race.payouts) {
      return {
        ...race,
        payouts: validatePayouts(race.payouts, options)
      };
    }
    return race;
  });

  return {
    ...raceData,
    races: validatedRaces
  };
}
