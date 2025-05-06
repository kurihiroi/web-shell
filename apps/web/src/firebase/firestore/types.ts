import type {
  CollectionReference,
  DocumentReference,
  Firestore,
  FirestoreDataConverter,
  Query,
  QueryConstraint,
  WithFieldValue,
} from 'firebase/firestore';
import type { z } from 'zod';

// 基本的なFirestoreドキュメント型
export type FirestoreDocument<T> = T & {
  id: string;
  serverTimestamp: Date | null;
  clientTimestamp: Date;
};

// 入力用のドキュメント型
export type FirestoreDocumentInput<T> = Omit<
  WithFieldValue<T>,
  'id' | 'serverTimestamp' | 'clientTimestamp'
>;

// コレクションインターフェース
export interface FirestoreCollection<T> {
  collectionName: string;
  schema: z.ZodType<T>;
  converter: FirestoreDataConverter<FirestoreDocument<T>>;
  ref: (db: Firestore) => CollectionReference<FirestoreDocument<T>>;
  doc: (db: Firestore, id: string) => DocumentReference<FirestoreDocument<T>>;
  query: (db: Firestore, ...constraints: QueryConstraint[]) => Query<FirestoreDocument<T>>;
}

// イベントソーシング関連の型
export type EventType = 'create' | 'update' | 'delete' | string;

export type EventDocument<T, E extends EventType = EventType> = {
  id: string;
  entityId: string;
  type: E;
  data: T;
  serverTimestamp: Date | null;
  clientTimestamp: Date;
  metadata?: Record<string, unknown>;
};

export type EventDocumentInput<T, E extends EventType = EventType> = Omit<
  WithFieldValue<EventDocument<T, E>>,
  'id' | 'serverTimestamp'
>;

export interface EventCollection<T, E extends EventType = EventType> {
  collectionName: string;
  schema: z.ZodType<T>;
  converter: FirestoreDataConverter<EventDocument<T, E>>;
  ref: (db: Firestore) => CollectionReference<EventDocument<T, E>>;
  doc: (db: Firestore, id: string) => DocumentReference<EventDocument<T, E>>;
  query: (db: Firestore, ...constraints: QueryConstraint[]) => Query<EventDocument<T, E>>;
}
