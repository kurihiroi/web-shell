// 修正済み：@web-shell/firestore-generatorからのインポート
import {
  type EventSourcedRepository,
  type EventDocument as FirestoreEventDocument,
  createEventSourcedRepository,
} from '@web-shell/firestore-generator';
import type { Firestore } from 'firebase/firestore';
import type { z } from 'zod';
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

// 開発用インメモリストレージ（アプリケーション全体で共有）
const inMemoryStorage: Record<string, Array<unknown>> = {};

// 開発用のインメモリ実装を作成
const createInMemoryRepository = <T>(
  collection: string,
  schema: z.ZodType<T>
): EventSourcedRepository<T> => {
  // コレクションごとのストレージを初期化（存在しない場合）
  if (!inMemoryStorage[collection]) {
    inMemoryStorage[collection] = [];
  }

  // この特定のコレクションのデータへの参照
  const items = inMemoryStorage[collection] as Array<
    T & { id: string; clientTimestamp: Date; serverTimestamp: Date | null }
  >;

  return {
    create: async (data: T) => {
      console.log('[InMemory] Creating document in collection', collection, data);
      // 入力データのバリデーション
      schema.parse(data);

      const id = `dummy-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // メモリ内データを更新
      const newItem = {
        ...data,
        id,
        clientTimestamp: new Date(),
        serverTimestamp: null,
      } as T & { id: string; clientTimestamp: Date; serverTimestamp: Date | null };

      items.push(newItem);

      return id;
    },
    findById: async (id: string) => {
      console.log('[InMemory] Finding document by ID', id);
      return items.find((item) => item.id === id) || null;
    },
    findAll: async () => {
      console.log('[InMemory] Finding all documents');
      // データをクローンして返す（参照を避けるため）
      return [...items];
    },
    update: async (id: string, changes: Partial<T>) => {
      console.log('[InMemory] Updating document', id, changes);
      const index = items.findIndex((item) => item.id === id);
      if (index !== -1) {
        items[index] = { ...items[index], ...changes };
      } else {
        throw new Error(`Entity with ID ${id} not found`);
      }
    },
    delete: async (id: string) => {
      console.log('[InMemory] Deleting document', id);
      const index = items.findIndex((item) => item.id === id);
      if (index !== -1) {
        items.splice(index, 1);
      } else {
        throw new Error(`Entity with ID ${id} not found`);
      }
    },
    getHistory: async (id: string) => {
      console.log('[InMemory] Getting history for document', id);
      // インメモリ実装ではイベント履歴は保持していないので空配列を返す
      return [] as FirestoreEventDocument<unknown>[];
    },
  };
};

// シングルトンインスタンスを保持（複数回呼び出しでもインメモリキャッシュを共有するため）
let repositoryInstance: EventSourcedRepository<StrictCommand> | null = null;

// コマンド履歴のリポジトリを作成する関数
export const createCommandHistoryRepository = (db: Firestore | null) => {
  if (!db) {
    console.warn('Firestore is not initialized, creating in-memory repository');
    // キャッシュがあれば再利用し、なければ新しいレポジトリを作成
    if (!repositoryInstance) {
      // CommandSchema から作成するが、内部では StrictCommand として扱う
      repositoryInstance = createInMemoryRepository(
        COMMAND_HISTORY_COLLECTION,
        CommandSchema
      ) as unknown as EventSourcedRepository<StrictCommand>;
    }
    return repositoryInstance;
  }

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
