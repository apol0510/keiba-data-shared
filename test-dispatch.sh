#!/bin/bash

# GitHub Personal Access Tokenを環境変数から取得
TOKEN="${GITHUB_TOKEN}"

if [ -z "$TOKEN" ]; then
  echo "Error: GITHUB_TOKEN not set"
  exit 1
fi

# repository_dispatch APIを直接呼び出し
curl -X POST \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Authorization: token $TOKEN" \
  https://api.github.com/repos/apol0510/keiba-intelligence/dispatches \
  -d '{"event_type":"prediction-updated","client_payload":{"dates":["2026-01-30"],"source":"manual-test","trigger":"manual"}}'

echo ""
echo "Dispatch sent. Check https://github.com/apol0510/keiba-intelligence/actions"
