# 管理画面トラブルシューティングガイド

**対象**: keiba-data-shared-admin（管理画面）でデータ保存時の問題解決

**最終更新**: 2026-02-03

---

## 🚨 問題: 上書き保存してもkeiba-data-sharedに保存されない

### 症状

- ✅ 新規保存は成功する
- ❌ 既存ファイルの上書き保存が失敗する
- または
- ❌ 保存ボタンを押しても反応がない

---

## 🔍 診断手順（管理画面で実行）

### 1. ブラウザの開発者ツールでエラー確認

```
1. Chrome/Edgeの場合: F12キー
2. Consoleタブを開く
3. 保存ボタンをクリック
4. エラーメッセージを確認
```

**よくあるエラー:**

#### A. GitHub API認証エラー

```
Error: Bad credentials
Error: 401 Unauthorized
```

**原因**: GitHub Personal Access Tokenの期限切れ

**解決方法**:
1. GitHub設定でトークンを再生成
2. `.env`ファイルの`GITHUB_TOKEN`を更新
3. 管理画面を再起動

---

#### B. ファイルSHA取得エラー

```
Error: Not Found
Error: 404
```

**原因**: 既存ファイルのSHA（バージョン識別子）取得失敗

**解決方法**: 管理画面のコードで、上書き時に以下を確認：

```javascript
// ❌ 間違った実装
const updateFile = async (path, content) => {
  // SHAを取得せずに直接更新
  await octokit.repos.createOrUpdateFileContents({
    owner: 'apol0510',
    repo: 'keiba-data-shared',
    path: path,
    message: 'Update',
    content: content,
    // sha: undefined ← これが原因！
  });
};

// ✅ 正しい実装
const updateFile = async (path, content) => {
  // 1. 既存ファイルのSHAを取得
  let sha = null;
  try {
    const { data } = await octokit.repos.getContent({
      owner: 'apol0510',
      repo: 'keiba-data-shared',
      path: path,
    });
    sha = data.sha;
  } catch (error) {
    if (error.status !== 404) throw error;
    // 404 = 新規ファイル（SHA不要）
  }

  // 2. SHAを含めて更新
  await octokit.repos.createOrUpdateFileContents({
    owner: 'apol0510',
    repo: 'keiba-data-shared',
    path: path,
    message: 'Update results',
    content: content,
    sha: sha, // ← 必須！
  });
};
```

---

#### C. Base64エンコードエラー

```
Error: Invalid content encoding
```

**原因**: GitHub APIはBase64エンコードされたcontentを要求

**解決方法**:

```javascript
// ❌ 間違った実装
const content = JSON.stringify(data);

// ✅ 正しい実装
const content = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
// または Node.js環境の場合
const content = Buffer.from(JSON.stringify(data)).toString('base64');
```

---

#### D. ブランチ指定エラー

```
Error: Reference does not exist
```

**原因**: 間違ったブランチ名を指定

**解決方法**:

```javascript
await octokit.repos.createOrUpdateFileContents({
  owner: 'apol0510',
  repo: 'keiba-data-shared',
  path: path,
  message: 'Update',
  content: content,
  sha: sha,
  branch: 'main', // ← 'master'ではなく'main'
});
```

---

## 🧪 テスト用スクリプト

管理画面で以下のスクリプトを実行して、GitHub API接続をテスト：

```javascript
// テスト1: 認証確認
async function testAuth() {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
      }
    });

    if (response.ok) {
      const user = await response.json();
      console.log('✅ 認証成功:', user.login);
      return true;
    } else {
      console.error('❌ 認証失敗:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ ネットワークエラー:', error);
    return false;
  }
}

// テスト2: ファイル取得確認
async function testGetFile(filePath) {
  try {
    const url = `https://api.github.com/repos/apol0510/keiba-data-shared/contents/${filePath}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ ファイル取得成功');
      console.log('SHA:', data.sha);
      return data.sha;
    } else if (response.status === 404) {
      console.log('⚠️  ファイル未存在（新規作成）');
      return null;
    } else {
      console.error('❌ ファイル取得失敗:', response.status);
      return null;
    }
  } catch (error) {
    console.error('❌ エラー:', error);
    return null;
  }
}

// テスト3: ファイル更新確認
async function testUpdateFile(filePath, content, sha) {
  try {
    const url = `https://api.github.com/repos/apol0510/keiba-data-shared/contents/${filePath}`;

    const body = {
      message: 'テスト更新',
      content: btoa(unescape(encodeURIComponent(content))),
      branch: 'main'
    };

    if (sha) {
      body.sha = sha; // 既存ファイルの場合は必須
    }

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    if (response.ok) {
      console.log('✅ ファイル更新成功');
      return true;
    } else {
      const error = await response.json();
      console.error('❌ ファイル更新失敗:', response.status, error.message);
      return false;
    }
  } catch (error) {
    console.error('❌ エラー:', error);
    return false;
  }
}

// 実行例
async function runTests() {
  console.log('🧪 GitHub API接続テスト開始\n');

  // 1. 認証テスト
  console.log('1️⃣ 認証テスト');
  const authOk = await testAuth();
  if (!authOk) return;
  console.log('');

  // 2. ファイル取得テスト
  console.log('2️⃣ ファイル取得テスト');
  const testFilePath = 'nankan/results/2026/02/2026-02-03.json';
  const sha = await testGetFile(testFilePath);
  console.log('');

  // 3. ファイル更新テスト（実際には実行しない）
  console.log('3️⃣ ファイル更新テスト（スキップ）');
  console.log('⚠️  実際の更新は慎重に行ってください');

  console.log('\n✅ テスト完了');
}

// テスト実行
runTests();
```

---

## 🔧 環境変数チェックリスト

管理画面（keiba-data-shared-admin）の`.env`ファイルを確認：

```env
# 必須
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# オプション（Netlify自動ビルド用）
NETLIFY_BUILD_HOOK_URL=https://api.netlify.com/build_hooks/6978c311851b9007c570c2af
```

### GitHub Tokenの権限確認

トークンに以下の権限（scope）が必要：

- ✅ `repo` (フルアクセス)
  - `repo:status`
  - `repo_deployment`
  - `public_repo`
  - `repo:invite`
  - `security_events`

**確認方法**:
1. https://github.com/settings/tokens にアクセス
2. 使用中のトークンをクリック
3. Scopesセクションで権限を確認

---

## 📊 デバッグ用ログ出力

管理画面のコードに以下のログを追加：

```javascript
async function saveToGitHub(data, filePath) {
  console.log('🚀 GitHub保存開始');
  console.log('  - ファイルパス:', filePath);
  console.log('  - データサイズ:', JSON.stringify(data).length, 'バイト');

  try {
    // 1. 既存ファイルSHA取得
    console.log('📥 既存ファイルSHA取得中...');
    const sha = await getFileSha(filePath);
    console.log('  - SHA:', sha || '新規ファイル');

    // 2. ファイル更新
    console.log('📤 GitHubへアップロード中...');
    const result = await updateFile(filePath, data, sha);
    console.log('✅ 保存成功');
    console.log('  - Commit SHA:', result.commit.sha);
    console.log('  - Commit URL:', result.commit.html_url);

    return result;

  } catch (error) {
    console.error('❌ 保存失敗');
    console.error('  - エラー:', error.message);
    console.error('  - ステータス:', error.status);
    console.error('  - 詳細:', error);
    throw error;
  }
}
```

---

## 🆘 それでも解決しない場合

### 手動デバッグ手順

1. **GitHub Web UIで直接編集してみる**
   - https://github.com/apol0510/keiba-data-shared にアクセス
   - 該当ファイルを開く
   - 編集ボタン（鉛筆アイコン）をクリック
   - 保存できるか確認

2. **curlコマンドでAPIテスト**

```bash
# 認証テスト
curl -H "Authorization: token YOUR_GITHUB_TOKEN" \
     https://api.github.com/user

# ファイル取得テスト
curl -H "Authorization: token YOUR_GITHUB_TOKEN" \
     https://api.github.com/repos/apol0510/keiba-data-shared/contents/nankan/results/2026/02/2026-02-03.json
```

3. **管理画面のブラウザキャッシュクリア**
   - Ctrl+Shift+Delete（Windows）
   - Cmd+Shift+Delete（Mac）
   - キャッシュをクリア
   - ページをリロード

---

## 📝 よくある質問

### Q1: 新規保存は成功するのに、上書きだけ失敗する

**A**: SHAの取得が失敗している可能性が高いです。上記「B. ファイルSHA取得エラー」を確認してください。

### Q2: エラーメッセージが表示されない

**A**: try-catchでエラーが握りつぶされている可能性があります。コンソールログを追加してください。

### Q3: 保存ボタンを押しても何も起きない

**A**: JavaScriptエラーが発生している可能性があります。ブラウザの開発者ツールでConsoleを確認してください。

---

## 🔗 関連ドキュメント

- [DATA_FORMAT.md](./DATA_FORMAT.md) - データフォーマット仕様
- [ADMIN_INTEGRATION.md](./ADMIN_INTEGRATION.md) - 管理画面連携ガイド
- [GitHub REST API ドキュメント](https://docs.github.com/en/rest)

---

## 📞 サポート

問題が解決しない場合は、以下の情報を添えてご連絡ください：

1. ブラウザのコンソールログ（スクリーンショット）
2. 保存しようとしているファイルパス
3. エラーメッセージ（あれば）
4. GitHub Token権限のスクリーンショット

---

**🚀 マコ&クロの最強コンビで必ず解決します！**
