import {
  type DocumentData,
  type DocumentSnapshot,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
  Timestamp,
  serverTimestamp as firestoreServerTimestamp,
} from 'firebase/firestore';
import { z } from 'zod';
import type {
  EventDocument,
  EventDocumentInput,
  EventType,
  FirestoreDocument,
  FirestoreDocumentInput,
} from './types';

export function timestampToDate(timestamp: Timestamp): Date {
  return timestamp.toDate();
}

export function dateToTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}

export const serverTimestamp = firestoreServerTimestamp;

export function createConverter<T>(
  schema: z.ZodType<T>
): FirestoreDataConverter<FirestoreDocument<T>> {
  return {
    toFirestore(modelObject: FirestoreDocumentInput<T>): DocumentData {
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
    },

    fromFirestore(
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
        const fullDocSchema = schema.extend({
          id: z.string(),
          serverTimestamp: z.date().nullable(),
          clientTimestamp: z.date(),
        });

        // Validate the document matches our schema
        return fullDocSchema.parse(cleanedData);
      } catch (error) {
        console.error('Document validation error:', error);
        throw new Error(
          `Document validation failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    },
  };
}

export function createEventConverter<T, E extends EventType = EventType>(
  schema: z.ZodType<T>
): FirestoreDataConverter<EventDocument<T, E>> {
  return {
    toFirestore(modelObject: EventDocumentInput<T, E>): DocumentData {
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
    },

    fromFirestore(
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
        const eventSchema = z.object({
          id: z.string(),
          entityId: z.string(),
          type: z.string() as z.ZodType<E>,
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
    },
  };
}

export function convertDocumentSnapshot<T>(
  snapshot: DocumentSnapshot<DocumentData>,
  converter: FirestoreDataConverter<FirestoreDocument<T> | EventDocument<T>>
): FirestoreDocument<T> | EventDocument<T> | null {
  if (!snapshot.exists()) {
    return null;
  }

  return converter.fromFirestore(snapshot as QueryDocumentSnapshot<DocumentData>);
}
