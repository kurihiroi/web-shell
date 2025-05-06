import {
  type Firestore,
  type QueryConstraint,
  Timestamp,
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
// Import z as a value since we need schema.parse() runtime functionality
import { z } from 'zod';
import type { EventCollection, EventDocument, EventType, FirestoreDocument } from './types';
import { serverTimestamp } from './utils';

// Base event types for CRUD operations
export type CreateEvent<T> = EventDocument<T, 'create'>;
export type UpdateEvent<T> = EventDocument<T & { changes: Partial<T> }, 'update'>;
export type DeleteEvent<T> = EventDocument<{ id: string }, 'delete'>;

/**
 * イベントドキュメントを作成する
 * @param db Firestoreインスタンス
 * @param eventCollection イベントコレクション
 * @param entityId エンティティID
 * @param type イベントタイプ
 * @param data イベントデータ
 * @param metadata 追加メタデータ（オプション）
 * @returns 作成されたイベントドキュメントのID
 */
export async function createEvent<T, E extends EventType>(
  db: Firestore,
  eventCollection: EventCollection<T, E>,
  entityId: string,
  type: E,
  data: T,
  metadata?: Record<string, unknown>
): Promise<string> {
  const eventDoc = {
    id: '', // Will be set by Firestore
    entityId,
    type,
    data,
    clientTimestamp: new Date(),
    serverTimestamp: serverTimestamp(),
    metadata: metadata || {},
  };

  const docRef = await addDoc(eventCollection.ref(db), eventDoc);
  return docRef.id;
}

/**
 * エンティティのすべてのイベントを取得する
 * @param db Firestoreインスタンス
 * @param eventCollection イベントコレクション
 * @param entityId エンティティID
 * @returns エンティティのイベント配列
 */
export async function getEntityEvents<T, E extends EventType>(
  db: Firestore,
  eventCollection: EventCollection<T, E>,
  entityId: string
): Promise<EventDocument<T, E>[]> {
  const q = query(
    eventCollection.ref(db),
    where('entityId', '==', entityId),
    orderBy('clientTimestamp')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data());
}

/**
 * エンティティの最新状態をイベントから再構築して取得する
 * @param db Firestoreインスタンス
 * @param eventCollection イベントコレクション
 * @param entityId エンティティID
 * @returns 最新のエンティティ状態または存在しない場合はnull
 */
export async function getLatestEntityState<T>(
  db: Firestore,
  eventCollection: EventCollection<T>,
  entityId: string
): Promise<FirestoreDocument<T> | null> {
  const events = await getEntityEvents(db, eventCollection, entityId);

  if (events.length === 0) {
    return null;
  }

  // Find the initial create event
  const createEvent = events.find((event) => event.type === 'create');
  if (!createEvent) {
    return null;
  }

  // Start with the create event data
  let currentState: Record<string, unknown> = {
    ...createEvent.data,
    id: entityId,
    clientTimestamp: createEvent.clientTimestamp,
    serverTimestamp: createEvent.serverTimestamp,
  };

  // Apply all update events in order
  const updateEvents = events
    .filter((event) => event.type === 'update')
    .sort((a, b) => a.clientTimestamp.getTime() - b.clientTimestamp.getTime());

  for (const event of updateEvents) {
    const updateEvent = event as UpdateEvent<T>;
    currentState = {
      ...currentState,
      ...updateEvent.data.changes,
      clientTimestamp: updateEvent.clientTimestamp,
      serverTimestamp: updateEvent.serverTimestamp,
    };
  }

  // Check if entity was deleted
  const wasDeleted = events.some((event) => event.type === 'delete');
  if (wasDeleted) {
    return null;
  }

  return currentState as FirestoreDocument<T>;
}

/**
 * 新しいエンティティを作成する
 * @param db Firestoreインスタンス
 * @param eventCollection イベントコレクション
 * @param data エンティティデータ
 * @param entityId エンティティID（指定しない場合は自動生成）
 * @returns 作成されたエンティティのID
 */
export async function createEntity<T>(
  db: Firestore,
  eventCollection: EventCollection<T, 'create'>,
  data: T,
  entityId: string = uuidv4()
): Promise<string> {
  await createEvent(db, eventCollection, entityId, 'create', data);
  return entityId;
}

/**
 * 既存のエンティティを更新する
 * @param db Firestoreインスタンス
 * @param eventCollection イベントコレクション
 * @param entityId エンティティID
 * @param changes 変更内容
 * @param currentData 現在のエンティティデータ
 */
export async function updateEntity<T>(
  db: Firestore,
  eventCollection: EventCollection<T & { changes: Partial<T> }, 'update'>,
  entityId: string,
  changes: Partial<T>,
  currentData: T
): Promise<void> {
  await createEvent(db, eventCollection, entityId, 'update', { ...currentData, changes });
}

/**
 * エンティティを削除する
 * @param db Firestoreインスタンス
 * @param eventCollection イベントコレクション
 * @param entityId 削除するエンティティのID
 */
export async function deleteEntity<T>(
  db: Firestore,
  eventCollection: EventCollection<{ id: string }, 'delete'>,
  entityId: string
): Promise<void> {
  await createEvent(db, eventCollection, entityId, 'delete', { id: entityId });
}
