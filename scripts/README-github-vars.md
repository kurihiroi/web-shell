# GitHub Variables設定手順

このプロジェクトでは、Firebase設定を安全にCI/CD環境で使用するために、GitHubのEnvironment Variables機能を使用しています。

## 設定する変数

GitHubリポジトリに以下の変数を設定してください：

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `FIREBASE_API_KEY` | Firebase APIキー | AIzaSyABC123... |
| `FIREBASE_AUTH_DOMAIN` | 認証ドメイン | your-project-id.firebaseapp.com |
| `FIREBASE_PROJECT_ID` | Firebaseプロジェクトの識別子 | your-project-id |
| `FIREBASE_STORAGE_BUCKET` | Storageバケット | your-project-id.appspot.com |
| `FIREBASE_MESSAGING_SENDER_ID` | メッセージ送信者ID | 123456789 |
| `FIREBASE_APP_ID` | アプリID | 1:123456789:web:abcdef |

## 設定方法

1. GitHubリポジトリページへ移動
2. リポジトリの「Settings」タブをクリック
3. 左側のサイドバーから「Environments」→「New environment」を選択
   - 環境名を「Production」と入力
4. または、「Settings」→「Secrets and variables」→「Variables」タブを選択（リポジトリ全体に適用）
5. 「New variable」をクリックして上記の変数を追加
6. 各変数に対して、Firebase Consoleで取得した値を入力

## 変数の取得方法

1. [Firebase Console](https://console.firebase.google.com/)にアクセス
2. プロジェクトを選択
3. プロジェクト設定（⚙）→「全般」タブをクリック
4. 「マイアプリ」セクションでウェブアプリの設定を確認
   - まだウェブアプリがなければ「アプリを追加」→「ウェブ」でアプリを登録
5. 「Firebase SDK snippet」→「構成」を選択して表示される値をコピー

## 注意点

- 環境ごとに異なる設定が必要な場合は、複数の環境（Development、Staging、Productionなど）を作成できます
- CIのプルリクエスト時には、テスト/ビルド用のデフォルト値が使用されます（設定されていない場合）
- Firebase設定はクライアントサイドで使用されるため厳密には機密情報ではありませんが、慎重に扱うことをお勧めします