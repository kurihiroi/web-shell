import {
  type DocumentData,
  type DocumentSnapshot,
  type FirestoreDataConverter,
  type PartialWithFieldValue,
  type QueryDocumentSnapshot,
  type SetOptions,
  type SnapshotOptions,
  Timestamp,
  type WithFieldValue,
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
    toFirestore: (modelObject: WithFieldValue<FirestoreDocument<T>>): DocumentData => {
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
      /* biome-ignore lint/suspicious/noExplicitAny: timestamp conversion needs to handle any type */
      const convertTimestamps = (obj: any): any => {
        if (obj === null || obj === undefined) {
          return obj;
        }

        if (obj instanceof Timestamp) {
          return timestampToDate(obj);
        }

        if (typeof obj === 'object') {
          /* biome-ignore lint/suspicious/noExplicitAny: generic container for diverse types */
          const result: any = Array.isArray(obj) ? [] : {};

          for (const key in obj) {
            result[key] = convertTimestamps(obj[key]);
          }

          return result;
        }

        return obj;
      };

      // Process all data to convert timestamps
      const processedData = convertTimestamps(data) as DocumentData;

      const cleanedData = {
        ...processedData,
        id: snapshot.id,
      };

      try {
        // Create a new schema that includes the required fields
        // without assuming schema has a shape property
        const fullDocSchema = z
          .object({
            id: z.string(),
            serverTimestamp: z.date().nullable(),
            clientTimestamp: z.date(),
            // Remaining fields from T will be handled via any
            // since we can't reliably extract them from an arbitrary ZodType
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
    },
  };
}

export function createEventConverter<T, E extends EventType = EventType>(
  schema: z.ZodType<T>
): FirestoreDataConverter<EventDocument<T, E>> {
  return {
    toFirestore: (modelObject: WithFieldValue<EventDocument<T, E>>): DocumentData => {
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

      // Convert Firestore Timestamps to Dates and handle potential nested timestamps in data
      /* biome-ignore lint/suspicious/noExplicitAny: timestamp conversion needs to handle any type */
      const convertTimestamps = (obj: any): any => {
        if (obj === null || obj === undefined) {
          return obj;
        }

        if (obj instanceof Timestamp) {
          return timestampToDate(obj);
        }

        if (typeof obj === 'object') {
          /* biome-ignore lint/suspicious/noExplicitAny: generic container for diverse types */
          const result: any = Array.isArray(obj) ? [] : {};

          for (const key in obj) {
            result[key] = convertTimestamps(obj[key]);
          }

          return result;
        }

        return obj;
      };

      // Apply timestamp conversion to entire data object
      const processedData = convertTimestamps(data) as DocumentData;

      // First convert top-level timestamps
      const cleanedData = {
        ...processedData,
        id: snapshot.id,
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
