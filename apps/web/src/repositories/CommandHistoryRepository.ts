import type { Firestore } from 'firebase/firestore';
import { z } from 'zod';
// 内部Firestoreユーティリティからのインポート
import {
  type EventSourcedRepository,
  type FirestoreDocument,
  createEventSourcedRepository,
} from '../utils/firestore';

// コマンド履歴のコレクション名
export const COMMAND_HISTORY_COLLECTION = 'command_history';

// コマンドスキーマの定義
export const CommandSchema = z.object({
  command: z.string().min(1, 'Command is required'),
  timestamp: z.date().optional(),
  userId: z.string().optional(),
  status: z.enum(['success', 'error', 'pending']),
  output: z.string().optional(),
  workingDirectory: z.string().optional(),
  environment: z.record(z.string()).optional(),
});

// コマンドの型定義
export type Command = z.infer<typeof CommandSchema>;

// コマンド履歴のドキュメントの型をエクスポート
export type CommandDocument = FirestoreDocument<Command>;

// シングルトンインスタンスを保持
let repositoryInstance: EventSourcedRepository<Command> | null = null;

// コマンド履歴のリポジトリを作成する関数
export const createCommandHistoryRepository = (db: Firestore) => {
  // 既存のインスタンスがあれば再利用
  if (!repositoryInstance) {
    // CommandSchemaから直接リポジトリを作成
    repositoryInstance = createEventSourcedRepository(
      db,
      COMMAND_HISTORY_COLLECTION,
      CommandSchema
    );
  }

  return repositoryInstance;
};
