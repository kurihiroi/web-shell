import {
  type DocumentReference,
  type Firestore,
  type QueryConstraint,
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  where,
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
// Import z as a value since we need schema.parse() runtime functionality
import { z } from 'zod';
import {
  createEntity,
  createEvent,
  deleteEntity,
  getEntityEvents,
  getLatestEntityState,
  updateEntity,
} from './events';
import { createEventCollectionFactory } from './generator';
import type { EventCollection, EventDocument, EventType, FirestoreDocument } from './types';

/**
 * イベントソースドリポジトリの基本インターフェイス
 * 個々の関数に分割して、ツリーシェイキングを可能にする
 */
export interface EventSourcedRepository<T> {
  create(data: T): Promise<string>;
  findById(id: string): Promise<FirestoreDocument<T> | null>;
  findAll(): Promise<FirestoreDocument<T>[]>;
  update(id: string, changes: Partial<T>): Promise<void>;
  delete(id: string): Promise<void>;
  getHistory(id: string): Promise<EventDocument<unknown>[]>;
}

/**
 * イベントソーシングリポジトリを作成する
 * @param db Firestoreインスタンス
 * @param collectionName コレクション名
 * @param schema Zodスキーマ
 * @returns イベントソーシングリポジトリインターフェイス
 */
export function createEventSourcedRepository<T>(
  db: Firestore,
  collectionName: string,
  schema: z.ZodType<T>
): EventSourcedRepository<T> {
  // Create event collections for each operation type
  const createEventsCollection = createEventCollectionFactory<T, 'create'>(collectionName, schema);

  // Create a schema for T & { changes: Partial<T> } without using .extend or .partial
  const schemaWithChanges = z.object({
    // We can't assume schema has a shape property, so make this more flexible
    changes: z.any(),
  });

  const updateEventsCollection = createEventCollectionFactory<
    T & { changes: Partial<T> },
    'update'
  >(collectionName, schemaWithChanges as unknown as z.ZodType<T & { changes: Partial<T> }>);

  const deleteEventsCollection = createEventCollectionFactory<{ id: string }, 'delete'>(
    collectionName,
    z.object({ id: z.string() })
  );

  // Generic events collection for querying all events
  const allEventsCollection = createEventCollectionFactory(collectionName, schema);

  /**
   * 新しいエンティティを作成する
   * @param data 作成するデータ
   * @returns 作成されたエンティティのID
   */
  async function createNewEntity(data: T): Promise<string> {
    try {
      // Validate data against schema
      schema.parse(data);

      // Generate a new entity ID
      const entityId = uuidv4();

      // Create the entity
      await createEntity(db, createEventsCollection, data, entityId);

      return entityId;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Validation error: ${JSON.stringify(error.errors)}`);
      }
      throw error;
    }
  }

  /**
   * IDによるエンティティの検索
   * @param id エンティティID
   * @returns エンティティオブジェクトまたはnull
   */
  async function findEntityById(id: string): Promise<FirestoreDocument<T> | null> {
    return getLatestEntityState(db, allEventsCollection, id);
  }

  /**
   * すべてのエンティティを取得
   * @returns エンティティオブジェクトの配列
   */
  async function findAllEntities(): Promise<FirestoreDocument<T>[]> {
    // Get all create events to get all entity IDs
    const createEventsQuery = query(createEventsCollection.ref(db));

    const createEvents = await getDocs(createEventsQuery);
    const entityIds = createEvents.docs.map((doc) => doc.data().entityId);

    // Get the latest state for each entity
    const results: FirestoreDocument<T>[] = [];

    for (const id of entityIds) {
      const entity = await findEntityById(id);
      if (entity) {
        results.push(entity);
      }
    }

    return results;
  }

  /**
   * エンティティを更新する
   * @param id エンティティID
   * @param changes 変更内容
   */
  async function updateEntityById(id: string, changes: Partial<T>): Promise<void> {
    // Get the current state
    const currentState = await findEntityById(id);

    if (!currentState) {
      throw new Error(`Entity with ID ${id} not found`);
    }

    // Create update event
    await updateEntity(db, updateEventsCollection, id, changes, currentState);
  }

  /**
   * エンティティを削除する
   * @param id エンティティID
   */
  async function deleteEntityById(id: string): Promise<void> {
    // Check if entity exists
    const currentState = await findEntityById(id);

    if (!currentState) {
      throw new Error(`Entity with ID ${id} not found`);
    }

    // Create delete event
    await deleteEntity(db, deleteEventsCollection, id);
  }

  /**
   * エンティティの履歴を取得する
   * @param id エンティティID
   * @returns イベントドキュメントの配列
   */
  async function getEntityHistory(id: string): Promise<EventDocument<unknown>[]> {
    return getEntityEvents(db, allEventsCollection, id);
  }

  // 公開するインターフェイスを返す
  return {
    create: createNewEntity,
    findById: findEntityById,
    findAll: findAllEntities,
    update: updateEntityById,
    delete: deleteEntityById,
    getHistory: getEntityHistory,
  };
}
