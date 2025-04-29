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
  return {
    create: async (data: T) => {
      console.log('Creating document in collection', collection, data);
      return 'dummy-id';
    },
    findById: async (id: string) => {
      console.log('Finding document by ID', id);
      return null;
    },
    findAll: async () => {
      console.log('Finding all documents');
      return [];
    },
    update: async (id: string, changes: Partial<T>) => {
      console.log('Updating document', id, changes);
    },
    delete: async (id: string) => {
      console.log('Deleting document', id);
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
