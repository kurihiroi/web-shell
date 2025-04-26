#!/bin/bash

# Firebase設定を環境変数に設定するスクリプト
# 使用法: ./scripts/setup-firebase-env.sh <プロジェクトID>

set -e

# 色の設定
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ID=$1
ENV_FILE="apps/web/.env.local"

# Firebaseがインストールされているか確認
if ! command -v firebase &> /dev/null; then
  echo -e "${RED}Firebaseコマンドラインツールがインストールされていません。${NC}"
  echo "インストールするには: npm install -g firebase-tools"
  exit 1
fi

# ログイン状態を確認
LOGIN_STATUS=$(firebase login:list 2>&1)
if echo "$LOGIN_STATUS" | grep -q "No users signed in"; then
  echo -e "${YELLOW}Firebaseにログインしていません。ログインしてください...${NC}"
  firebase login
fi

# プロジェクトIDが指定されているか確認
if [ -z "$PROJECT_ID" ]; then
  echo -e "${YELLOW}プロジェクトIDが指定されていません。${NC}"
  echo "使用法: ./scripts/setup-firebase-env.sh <プロジェクトID>"
  
  echo -e "${BLUE}利用可能なプロジェクト:${NC}"
  firebase projects:list
  
  echo -e "${YELLOW}上記リストからプロジェクトIDを選択して再実行してください。${NC}"
  exit 1
fi

echo -e "${BLUE}プロジェクト ${PROJECT_ID} からFirebase設定を取得しています...${NC}"

# プロジェクトが存在するか確認
if ! firebase projects:list | grep -q "$PROJECT_ID"; then
  echo -e "${RED}プロジェクト '$PROJECT_ID' が見つかりません。${NC}"
  echo "利用可能なプロジェクト:"
  firebase projects:list
  exit 1
fi

# インフォメーションURL
FIREBASE_CONSOLE_URL="https://console.firebase.google.com/project/$PROJECT_ID/settings/general/"
FIREBASE_AUTH_URL="https://console.firebase.google.com/project/$PROJECT_ID/authentication/providers"

echo -e "${YELLOW}注意: このスクリプトはFirebase Web SDK設定を取得するためにFirebaseコンソールからの情報が必要です。${NC}"
echo -e "${BLUE}以下のURLをブラウザで開いてください: ${NC}"
echo "$FIREBASE_CONSOLE_URL"
echo -e "${YELLOW}「アプリを追加」→「ウェブ」を選択し、アプリを登録後、表示されるFirebase設定からの情報を入力してください。${NC}"

# ユーザー入力を取得
read -p "APIキー: " API_KEY
read -p "アプリID: " APP_ID
read -p "認証ドメイン (例: project-id.firebaseapp.com): " AUTH_DOMAIN
read -p "ストレージバケット (例: project-id.appspot.com): " STORAGE_BUCKET
read -p "メッセージ送信者ID: " MESSAGING_SENDER_ID

# 入力が空かどうかをチェック
if [ -z "$API_KEY" ] || [ -z "$APP_ID" ] || [ -z "$AUTH_DOMAIN" ] || [ -z "$STORAGE_BUCKET" ] || [ -z "$MESSAGING_SENDER_ID" ]; then
  echo -e "${RED}すべてのフィールドを入力してください。${NC}"
  exit 1
fi

# .env.local ファイルを作成
mkdir -p "$(dirname "$ENV_FILE")"

cat > "$ENV_FILE" << EOL
# Firebase設定
# スクリプト実行日時: $(date)
# プロジェクトID: $PROJECT_ID

VITE_FIREBASE_API_KEY=$API_KEY
VITE_FIREBASE_AUTH_DOMAIN=$AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID=$PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=$STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID=$MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID=$APP_ID
EOL

echo -e "${GREEN}Firebase設定が $ENV_FILE に保存されました！${NC}"

# 認証プロバイダの設定確認
echo -e "${YELLOW}Googleプロバイダを有効にするために、以下のURLをブラウザで開き設定してください:${NC}"
echo "$FIREBASE_AUTH_URL"
echo -e "${BLUE}1. 「新しいプロバイダを追加」→「Google」を選択${NC}"
echo -e "${BLUE}2. 「プロバイダを有効にする」をオンにする${NC}"
echo -e "${BLUE}3. プロジェクトのサポートメールを設定する${NC}"
echo -e "${BLUE}4. 「保存」をクリックする${NC}"

echo -e "${GREEN}設定が完了しました！${NC}"
echo -e "${BLUE}アプリケーションを起動するには:${NC} pnpm dev"