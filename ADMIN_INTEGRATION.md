# 管理画面連携ガイド

## 概要

このドキュメントは、`keiba-data-shared-admin`（管理画面）から`keiba-data-shared`（公開サイト）への自動ビルドトリガー実装ガイドです。

## 🎯 目的

管理画面でレース結果を保存した際に、公開サイト（Netlify）を自動的にビルド・デプロイして、即座にデータを反映させる。

## 📋 実装方法（推奨）

### 方法1: 管理画面から直接Netlifyビルドフックを呼び出す（推奨✅）

#### メリット
- ✅ 最も確実で高速
- ✅ GitHub Actions経由の不確実性を回避
- ✅ データ保存と同時にビルドトリガー

#### 実装手順

##### 1. 環境変数の設定

`keiba-data-shared-admin`プロジェクトの`.env`ファイルに以下を追加：

```env
# Netlify Build Hook URL（keiba-data-shared用）
NETLIFY_BUILD_HOOK_URL=https://api.netlify.com/build_hooks/6978c311851b9007c570c2af
```

##### 2. ビルドトリガー関数の実装

`src/utils/trigger-netlify-build.js`を作成：

```javascript
/**
 * Netlifyビルドをトリガーする
 * @returns {Promise<boolean>} 成功時true、失敗時false
 */
export async function triggerNetlifyBuild() {
  const buildHookUrl = import.meta.env.NETLIFY_BUILD_HOOK_URL;

  if (!buildHookUrl) {
    console.warn('⚠️ NETLIFY_BUILD_HOOK_URLが設定されていません');
    return false;
  }

  try {
    console.log('🚀 Netlifyビルドをトリガー中...');

    const response = await fetch(buildHookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (response.ok) {
      console.log('✅ Netlifyビルドを正常にトリガーしました');
      return true;
    } else {
      console.error('❌ Netlifyビルドのトリガーに失敗しました:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Netlifyビルドトリガー中にエラーが発生:', error);
    return false;
  }
}
```

##### 3. 既存の保存処理に統合

`src/pages/admin/results-manager.astro`（または該当のAPI）に追加：

```javascript
import { triggerNetlifyBuild } from '../../utils/trigger-netlify-build.js';

// レース結果保存後
async function saveResults(data) {
  try {
    // 1. GitHubにデータを保存（既存の処理）
    await saveToGitHub(data);

    // 2. Netlifyビルドをトリガー（新規追加）
    const buildTriggered = await triggerNetlifyBuild();

    if (buildTriggered) {
      return {
        success: true,
        message: '結果を保存し、サイトのビルドを開始しました。2-3分後に公開サイトに反映されます。'
      };
    } else {
      return {
        success: true,
        message: '結果を保存しました。サイトへの反映には少し時間がかかる場合があります。'
      };
    }
  } catch (error) {
    console.error('保存エラー:', error);
    return {
      success: false,
      message: '保存に失敗しました: ' + error.message
    };
  }
}
```

##### 4. UIフィードバック（オプション）

ユーザーに分かりやすいメッセージを表示：

```javascript
// 保存ボタンのクリックハンドラー
async function handleSave() {
  const saveButton = document.querySelector('#save-button');
  saveButton.disabled = true;
  saveButton.textContent = '保存中...';

  const result = await saveResults(raceData);

  if (result.success) {
    alert('✅ ' + result.message);
    saveButton.textContent = '保存完了';
  } else {
    alert('❌ ' + result.message);
    saveButton.textContent = '保存';
    saveButton.disabled = false;
  }
}
```

## 🔄 バックアップ：GitHub Actionsによる自動ビルド

管理画面からの直接呼び出しが失敗した場合のバックアップとして、GitHub Actionsも設定済みです。

### 動作条件

- `nankan/results/**/*.json`または`nankan/predictions/**/*.json`がmainブランチにpushされた時
- 自動的にNetlifyビルドフックを呼び出す

### 設定ファイル

`.github/workflows/trigger-netlify-build.yml`

## 🧪 テスト方法

### 1. ローカルテスト

```bash
# 管理画面プロジェクトで
npm run dev

# ブラウザで管理画面を開き、レース結果を保存
# コンソールログに「✅ Netlifyビルドを正常にトリガーしました」と表示されることを確認
```

### 2. 本番テスト

1. 管理画面でレース結果を保存
2. Netlifyダッシュボード（https://app.netlify.com/sites/keiba-data-shared/deploys）で新しいビルドが開始されたか確認
3. 2-3分後、公開サイト（https://keiba-data-shared.netlify.app/）で新しいレースが表示されるか確認

## 📊 期待される動作フロー

```
1. 管理画面でレース結果入力
   ↓
2. 「保存」ボタンをクリック
   ↓
3. GitHub APIでkeiba-data-sharedにJSONファイルを保存
   ↓
4. Netlifyビルドフックを即座に呼び出し ← 新規追加
   ↓
5. Netlifyが自動ビルド開始（2-3分）
   ↓
6. 公開サイトに最新データが反映
```

## ⚠️ 注意事項

### セキュリティ

- ビルドフックURLは秘密情報です
- `.env`ファイルは`.gitignore`に追加し、Gitにコミットしない
- Netlify管理画面の環境変数にも設定すること

### エラーハンドリング

- ビルドフックの呼び出しが失敗しても、データ保存は成功として扱う
- GitHub Actionsがバックアップとして動作する

### ビルド時間

- Netlifyのビルドには通常2-3分かかります
- ユーザーには「2-3分後に反映されます」と案内すること

## 🔗 関連リンク

- 公開サイト: https://keiba-data-shared.netlify.app/
- Netlifyダッシュボード: https://app.netlify.com/sites/keiba-data-shared
- GitHubリポジトリ: https://github.com/apol0510/keiba-data-shared

## 📅 更新履歴

- 2026-01-27: 初版作成（管理画面からの直接ビルドトリガー実装ガイド）
