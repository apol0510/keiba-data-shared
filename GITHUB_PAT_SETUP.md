# GitHub Personal Access Token (PAT) 設定手順

## 🎯 目的

GitHub Actionsからのgit pushで他のワークフローをトリガーするため、GITHUB_TOKENの代わりにPATを使用します。

---

## 📋 手順

### 1. GitHub PATの作成

1. **GitHub にログイン** → https://github.com
2. **右上のアイコン** → **Settings**
3. **左メニュー最下部** → **Developer settings**
4. **Personal access tokens** → **Tokens (classic)**
5. **Generate new token** → **Generate new token (classic)**

### 2. PAT設定

| 項目 | 設定値 |
|------|--------|
| **Note** | `keiba-data-shared-workflow-trigger` |
| **Expiration** | `No expiration`（無期限） |
| **Select scopes** | ✅ `repo`（全権限）<br>✅ `workflow`（ワークフロー実行） |

### 3. トークン生成

1. **Generate token** をクリック
2. **トークンをコピー**（`ghp_` で始まる文字列）
   - ⚠️ この画面でしかコピーできません！

---

## 🔐 Secrets設定（keiba-data-shared）

### 1. keiba-data-shared リポジトリに移動

https://github.com/apol0510/keiba-data-shared

### 2. Secrets設定

1. **Settings** タブ
2. **左メニュー** → **Secrets and variables** → **Actions**
3. **New repository secret**

| Name | Value |
|------|-------|
| `WORKFLOW_PAT` | （コピーしたトークン） |

4. **Add secret** をクリック

---

## ✅ 確認方法

```bash
# keiba-data-sharedリポジトリで
gh secret list

# 出力例:
# WORKFLOW_PAT  Updated 2026-02-13
```

---

## 🚀 次のステップ

Secretsが設定されたら、`merge-jra-predictions.yml` を以下のように修正します：

```yaml
- name: Commit merged files
  if: steps.merge-check.outputs.merged == 'true'
  run: |
    git config --global user.name "github-actions[bot]"
    git config --global user.email "github-actions[bot]@users.noreply.github.com"

    # WORKFLOW_PATを使用してgit pushの認証を設定
    git remote set-url origin https://x-access-token:${{ secrets.WORKFLOW_PAT }}@github.com/apol0510/keiba-data-shared.git

    git add jra/predictions/
    if git diff --cached --quiet; then
      echo "⏭️  No changes to commit (files already exist)"
    else
      DATES="${{ steps.merge-check.outputs.dates }}"
      git commit -m "🔄 JRA予想自動統合: ${DATES} [Auto-merged by GitHub Actions]"
      git push
      echo "✅ Pushed merged files for: ${DATES}"
    fi
```

---

## 📝 補足

- **WORKFLOW_PAT**: ワークフローをトリガーできるPAT
- **GITHUB_TOKEN**: デフォルトトークン（ワークフローはトリガーしない）

---

**作成日**: 2026-02-13
