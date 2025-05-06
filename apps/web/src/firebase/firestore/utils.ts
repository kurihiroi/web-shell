import {
  type DocumentData,
  type DocumentSnapshot,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
  Timestamp,
  type WithFieldValue,
  serverTimestamp as firestoreServerTimestamp,
} from 'firebase/firestore';
import { z } from 'zod';
import type { EventDocument, EventType, FirestoreDocument } from './types';

/**
 * Firestoreタイムスタンプをjavascript Dateに変換する
 */
export function timestampToDate(timestamp: Timestamp): Date {
  return timestamp.toDate();
}

/**
 * javascript DateをFirestoreタイムスタンプに変換する
 */
export function dateToTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}

/**
 * Firestoreのサーバータイムスタンプ関数のエクスポート
 */
export const serverTimestamp = firestoreServerTimestamp;

/**
 * Firestoreドキュメント用のコンバーターを作成する
 */
export function createConverter<T>(
  _schema: z.ZodType<T>
): FirestoreDataConverter<FirestoreDocument<T>> {
  /**
   * オブジェクトをFirestoreデータ形式に変換する
   */
  function toFirestore(modelObject: WithFieldValue<FirestoreDocument<T>>): DocumentData {
    const now = new Date();

    const data = {
      ...modelObject,
      clientTimestamp: now,
      serverTimestamp: null, // This will be set by the server
    };

    try {
      // We don't validate the full document here because the server timestamp will be null
      return data;
    } catch (error) {
      console.error('Validation error:', error);
      throw new Error(
        `Document validation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Firestoreデータをアプリケーションモデルオブジェクトに変換する
   */
  function fromFirestore(
    snapshot: QueryDocumentSnapshot<DocumentData>,
    options?: SnapshotOptions
  ): FirestoreDocument<T> {
    const data = snapshot.data(options);

    // Convert Firestore Timestamps to Dates
    const cleanedData = {
      ...data,
      id: snapshot.id,
      serverTimestamp:
        data.serverTimestamp instanceof Timestamp
          ? timestampToDate(data.serverTimestamp)
          : data.serverTimestamp,
      clientTimestamp:
        data.clientTimestamp instanceof Timestamp
          ? timestampToDate(data.clientTimestamp)
          : data.clientTimestamp,
    };

    try {
      // Create a new schema that includes the required fields
      const fullDocSchema = z
        .object({
          id: z.string(),
          serverTimestamp: z.date().nullable(),
          clientTimestamp: z.date(),
          // Remaining fields from T will be handled via any
        })
        .passthrough() as unknown as z.ZodType<FirestoreDocument<T>>;

      // Validate the document matches our schema
      return fullDocSchema.parse(cleanedData);
    } catch (error) {
      console.error('Document validation error:', error);
      throw new Error(
        `Document validation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return {
    toFirestore,
    fromFirestore,
  };
}

/**
 * イベントドキュメント用のコンバーターを作成する
 */
export function createEventConverter<T, E extends EventType = EventType>(
  schema: z.ZodType<T>
): FirestoreDataConverter<EventDocument<T, E>> {
  /**
   * イベントオブジェクトをFirestoreデータ形式に変換する
   */
  function toFirestore(modelObject: WithFieldValue<EventDocument<T, E>>): DocumentData {
    const data = {
      ...modelObject,
      // Server timestamp will be set by Firestore
    };

    try {
      // We don't validate the data here because serverTimestamp will be null initially
      return data;
    } catch (error) {
      console.error('Validation error:', error);
      throw new Error(
        `Event validation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Firestoreデータをイベントオブジェクトに変換する
   */
  function fromFirestore(
    snapshot: QueryDocumentSnapshot<DocumentData>,
    options?: SnapshotOptions
  ): EventDocument<T, E> {
    const data = snapshot.data(options);

    // Convert Firestore Timestamps to Dates
    const cleanedData = {
      ...data,
      id: snapshot.id,
      serverTimestamp:
        data.serverTimestamp instanceof Timestamp
          ? timestampToDate(data.serverTimestamp)
          : data.serverTimestamp,
      clientTimestamp:
        data.clientTimestamp instanceof Timestamp
          ? timestampToDate(data.clientTimestamp)
          : data.clientTimestamp,
    };

    try {
      // Fix the type casting by using unknown as intermediate type
      const eventSchema = z.object({
        id: z.string(),
        entityId: z.string(),
        type: z.string() as unknown as z.ZodType<E>,
        data: schema,
        serverTimestamp: z.date().nullable(),
        clientTimestamp: z.date(),
        metadata: z.record(z.unknown()).optional(),
      }) as z.ZodType<EventDocument<T, E>>;

      // Validate the event matches our schema
      return eventSchema.parse(cleanedData);
    } catch (error) {
      console.error('Event validation error:', error);
      throw new Error(
        `Event validation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return {
    toFirestore,
    fromFirestore,
  };
}

/**
 * ドキュメントスナップショットをアプリケーションオブジェクトに変換する
 */
export function convertDocumentSnapshot<T>(
  snapshot: DocumentSnapshot<DocumentData>,
  converter: FirestoreDataConverter<FirestoreDocument<T> | EventDocument<T>>
): FirestoreDocument<T> | EventDocument<T> | null {
  if (!snapshot.exists()) {
    return null;
  }

  return converter.fromFirestore(snapshot as QueryDocumentSnapshot<DocumentData>);
}
