// 修正済み：@web-shell/firestore-generatorからのインポート
import {
  type EventSourcedRepository,
  createEventSourcedRepository,
} from '@web-shell/firestore-generator';
import type { Firestore } from 'firebase/firestore';
import { COMMAND_HISTORY_COLLECTION, CommandSchema } from '../models/CommandHistory';

// Commandの型をより厳密に定義（statusはundefinedを許容しない）
type StrictCommand = {
  command: string;
  status: 'success' | 'error' | 'pending';
  timestamp?: Date;
  userId?: string;
  output?: string;
  workingDirectory?: string;
  environment?: Record<string, string>;
};

// シングルトンインスタンスを保持
let repositoryInstance: EventSourcedRepository<StrictCommand> | null = null;

// コマンド履歴のリポジトリを作成する関数
export const createCommandHistoryRepository = (db: Firestore) => {
  // 既存のインスタンスがあれば再利用
  if (!repositoryInstance) {
    // CommandSchema から作成するが、内部では StrictCommand として扱う
    repositoryInstance = createEventSourcedRepository(
      db,
      COMMAND_HISTORY_COLLECTION,
      CommandSchema
    ) as unknown as EventSourcedRepository<StrictCommand>;
  }

  return repositoryInstance;
};
