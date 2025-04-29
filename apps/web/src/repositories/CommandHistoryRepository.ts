import type { Firestore } from 'firebase/firestore';
import type { z } from 'zod';
import { COMMAND_HISTORY_COLLECTION, CommandSchema } from '../models/CommandHistory';

// TODO: @web-shell/firestore-generator パッケージの修正が必要
// import { createEventSourcedRepository } from '@web-shell/firestore-generator';

// 型定義
type EventDocument<T> = {
  id: string;
  entityId: string;
  data: T;
  serverTimestamp: Date | null;
  clientTimestamp: Date;
};

type EventSourcedRepository<T> = {
  create: (data: T) => Promise<string>;
  findById: (
    id: string
  ) => Promise<(T & { id: string; clientTimestamp: Date; serverTimestamp: Date | null }) | null>;
  findAll: () => Promise<
    Array<T & { id: string; clientTimestamp: Date; serverTimestamp: Date | null }>
  >;
  update: (id: string, changes: Partial<T>) => Promise<void>;
  delete: (id: string) => Promise<void>;
  getHistory: (id: string) => Promise<EventDocument<unknown>[]>;
};

// 一時的に仮実装
const createEventSourcedRepository = <T>(
  _db: Firestore,
  collection: string,
  _schema: z.ZodType<T>
): EventSourcedRepository<T> => {
  // インメモリモードでの仮実装

  // インメモリキャッシュ（開発用）
  const items: Array<T & { id: string; clientTimestamp: Date; serverTimestamp: Date | null }> = [];

  return {
    create: async (data: T) => {
      console.log('Creating document in collection', collection, data);
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
      console.log('Finding document by ID', id);
      return items.find((item) => item.id === id) || null;
    },
    findAll: async () => {
      console.log('Finding all documents');
      // データをクローンして返す（参照を避けるため）
      return [...items];
    },
    update: async (id: string, changes: Partial<T>) => {
      console.log('Updating document', id, changes);
      const index = items.findIndex((item) => item.id === id);
      if (index !== -1) {
        items[index] = { ...items[index], ...changes };
      }
    },
    delete: async (id: string) => {
      console.log('Deleting document', id);
      const index = items.findIndex((item) => item.id === id);
      if (index !== -1) {
        items.splice(index, 1);
      }
    },
    getHistory: async (id: string) => {
      console.log('Getting history for document', id);
      return [];
    },
  };
};

// コマンド履歴のリポジトリを作成する関数
export const createCommandHistoryRepository = (db: Firestore | null) => {
  if (!db) {
    console.warn('Firestore is not initialized, creating dummy repository');
    return {
      create: async () => 'dummy-id',
      findById: async () => null,
      findAll: async () => [],
      update: async () => {},
      delete: async () => {},
      getHistory: async () => [],
    };
  }
  return createEventSourcedRepository(db, COMMAND_HISTORY_COLLECTION, CommandSchema);
};
