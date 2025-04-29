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
import {
  type EventCollection,
  type EventDocument,
  type EventType,
  type FirestoreCollection,
  type FirestoreDocument,
  FirestoreDocumentInput,
  type FirestoreGenerator,
} from './types';
import { createConverter, createEventConverter } from './utils';

export function createFirestoreGenerator(): FirestoreGenerator {
  return {
    createCollection<T>(collectionName: string, schema: z.ZodType<T>): FirestoreCollection<T> {
      const converter = createConverter<T>(schema);

      return {
        collectionName,
        schema,
        converter,

        ref(db: Firestore): CollectionReference<FirestoreDocument<T>> {
          return collection(db, collectionName).withConverter(converter);
        },

        doc(db: Firestore, id: string): DocumentReference<FirestoreDocument<T>> {
          return doc(this.ref(db), id);
        },

        query(db: Firestore, ...constraints: QueryConstraint[]): Query<FirestoreDocument<T>> {
          return query(this.ref(db), ...constraints);
        },
      };
    },
  };
}

export function createEventCollectionFactory<T, E extends EventType = EventType>(
  baseCollectionName: string,
  schema: z.ZodType<T>
): EventCollection<T, E> {
  const eventCollectionName = `${baseCollectionName}_events`;
  const converter = createEventConverter<T, E>(schema);

  return {
    collectionName: eventCollectionName,
    schema,
    converter,

    ref(db: Firestore): CollectionReference<EventDocument<T, E>> {
      return collection(db, eventCollectionName).withConverter(converter);
    },

    doc(db: Firestore, id: string): DocumentReference<EventDocument<T, E>> {
      return doc(this.ref(db), id);
    },

    query(db: Firestore, ...constraints: QueryConstraint[]): Query<EventDocument<T, E>> {
      return query(this.ref(db), ...constraints);
    },
  };
}

// Create a singleton instance
export const firestoreGenerator = createFirestoreGenerator();
