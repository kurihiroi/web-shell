// 修正済み：@web-shell/firestore-generatorからのインポート
import {
  type EventSourcedRepository,
  createEventSourcedRepository,
} from '@web-shell/firestore-generator';
import type { Firestore } from 'firebase/firestore';
import { COMMAND_HISTORY_COLLECTION, type Command, CommandSchema } from '../models/CommandHistory';

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
