# @web-shell/firestore-generator パッケージ修正プラン

## 現状の問題点

- CommandHistoryRepository.tsでは一時的なインメモリ実装が使用されている
- @web-shell/firestore-generator パッケージが正しく構築されていない
- イベントソーシングパターンが一部実装されているが、完全には使用されていない

## 修正チェックリスト

### 1. @web-shell/firestore-generator パッケージの改善

- [ ] パッケージのビルド設定を修正
  - [ ] package.jsonの"echo 'Build skipped - prototype package'"を実際のビルドコマンドに置き換え
  - [ ] TypeScriptの設定を確認・修正
  - [ ] 必要な依存関係を確認（Firebase SDK, Zod）

- [ ] イベントソーシング実装の完成
  - [ ] createEventSourcedRepositoryの完全実装
  - [ ] イベントの型定義を改善
  - [ ] タイムスタンプの自動追跡機能を確認

- [ ] Firestoreとの連携強化
  - [ ] Firestoreルールに合わせたセキュリティ対応
  - [ ] バッチ処理とトランザクション対応
  - [ ] エラー処理の改善

- [ ] React連携の最適化
  - [ ] useEventSourcedEntityフックの改善
  - [ ] useEntityHistoryフックの改善
  - [ ] useEventSourcedCollectionフックの改善

### 2. CommandHistoryRepository.tsの修正

- [ ] インメモリ実装から実際のFirestore実装への移行
  - [ ] インメモリ用のコードをFirestore実装で置き換え
  - [ ] 開発環境でのエミュレーターサポート追加

- [ ] 型安全性の向上
  - [ ] Zodスキーマの適用
  - [ ] TypeScriptの型定義改善

- [ ] パフォーマンス最適化
  - [ ] クエリの効率化
  - [ ] リアルタイム更新の最適化

### 3. テストと検証

- [ ] ユニットテストの作成
  - [ ] @web-shell/firestore-generator用のテスト
  - [ ] CommandHistoryRepository用のテスト

- [ ] 統合テストの作成
  - [ ] Firestoreエミュレーターを使ったテスト
  - [ ] エンドツーエンドテスト

### 4. ドキュメント

- [ ] パッケージの使用方法のドキュメント作成
- [ ] コードの注釈・コメントの追加
- [ ] イベントソーシングパターンの説明

### 5. セキュリティ

- [ ] Firestoreセキュリティルールの更新
- [ ] 認証との連携確認
- [ ] アクセス制御の実装

## 実装スケジュール

1. @web-shell/firestore-generator パッケージの修正・完成（3日）
2. CommandHistoryRepository.tsの修正とFirestore実装への移行（2日）
3. テスト作成と実行（2日）
4. ドキュメント作成（1日）
5. セキュリティ確認と実装（2日）

合計予定期間：10日間