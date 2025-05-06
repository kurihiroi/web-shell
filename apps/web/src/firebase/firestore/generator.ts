import {
  type CollectionReference,
  type DocumentReference,
  type Firestore,
  type Query,
  type QueryConstraint,
  collection,
  doc,
  query,
} from 'firebase/firestore';
import type { z } from 'zod';
import type {
  EventCollection,
  EventDocument,
  EventType,
  FirestoreCollection,
  FirestoreDocument,
} from './types';
import { createConverter, createEventConverter } from './utils';

/**
 * 新しいFirestoreコレクションを作成する
 */
export function createCollection<T>(
  collectionName: string,
  schema: z.ZodType<T>
): FirestoreCollection<T> {
  const converter = createConverter<T>(schema);

  // コレクションの参照を取得する関数
  function getCollectionRef(db: Firestore): CollectionReference<FirestoreDocument<T>> {
    return collection(db, collectionName).withConverter(converter);
  }

  // ドキュメントの参照を取得する関数
  function getDocumentRef(db: Firestore, id: string): DocumentReference<FirestoreDocument<T>> {
    return doc(getCollectionRef(db), id);
  }

  // クエリを構築する関数
  function buildQuery(
    db: Firestore,
    ...constraints: QueryConstraint[]
  ): Query<FirestoreDocument<T>> {
    return query(getCollectionRef(db), ...constraints);
  }

  return {
    collectionName,
    schema,
    converter,
    ref: getCollectionRef,
    doc: getDocumentRef,
    query: buildQuery,
  };
}

/**
 * イベントコレクションファクトリーを作成する
 */
export function createEventCollectionFactory<T, E extends EventType = EventType>(
  baseCollectionName: string,
  schema: z.ZodType<T>
): EventCollection<T, E> {
  const eventCollectionName = `${baseCollectionName}_events`;
  const converter = createEventConverter<T, E>(schema);

  // イベントコレクションの参照を取得する関数
  function getEventCollectionRef(db: Firestore): CollectionReference<EventDocument<T, E>> {
    return collection(db, eventCollectionName).withConverter(converter);
  }

  // イベントドキュメントの参照を取得する関数
  function getEventDocumentRef(db: Firestore, id: string): DocumentReference<EventDocument<T, E>> {
    return doc(getEventCollectionRef(db), id);
  }

  // イベントクエリを構築する関数
  function buildEventQuery(
    db: Firestore,
    ...constraints: QueryConstraint[]
  ): Query<EventDocument<T, E>> {
    return query(getEventCollectionRef(db), ...constraints);
  }

  return {
    collectionName: eventCollectionName,
    schema,
    converter,
    ref: getEventCollectionRef,
    doc: getEventDocumentRef,
    query: buildEventQuery,
  };
}
